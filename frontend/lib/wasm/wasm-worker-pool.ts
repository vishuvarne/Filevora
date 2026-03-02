/**
 * Worker Pool
 * 
 * Manages a pool of generic WASM workers with dynamic sizing and idle termination.
 * Workers are reused across tools - no tool-specific workers.
 */

import { GenericWorker } from './generic-worker';
import type { PoolConfig } from './runtime-types';

/**
 * Pooled worker wrapper with metadata.
 */
interface PooledWorker {
    /** The worker instance */
    worker: GenericWorker;
    /** Whether worker is currently executing a task */
    busy: boolean;
    /** Last activity timestamp */
    lastUsed: number;
    /** Modules currently loaded in this worker */
    loadedModules: Set<string>;
}

/**
 * Worker Pool
 * 
 * Manages lifecycle of generic WASM workers.
 * - Dynamic pool sizing based on demand (up to maxWorkers)
 * - Idle worker termination to save memory
 * - Module-aware worker selection (prefer workers with module already loaded)
 */
export class WasmWorkerPool {
    private workers: PooledWorker[] = [];
    private config: Required<PoolConfig>;
    private idleTimer: number | null = null;
    private workerUrl: string;

    /**
     * Create a new worker pool.
     */
    constructor(config: PoolConfig = {}, workerUrl: string = '/workers/wasm-runtime.worker.js') {
        this.config = {
            maxWorkers: config.maxWorkers ?? (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4) ?? 4,
            idleTimeoutMs: config.idleTimeoutMs ?? 120_000,
            warmupModules: config.warmupModules ?? [],
        };
        this.workerUrl = workerUrl;

        // Start idle check interval
        this.startIdleCheck();
    }

    /**
     * Acquire a worker from the pool.
     * Prefers workers with the requested module already loaded.
     * 
     * @param moduleName Optional module name to prefer workers that have it loaded
     */
    async acquire(moduleName?: string): Promise<GenericWorker> {
        // 1. Try to find available worker with module already loaded
        let pooled = this.workers.find(w =>
            !w.busy && moduleName && w.loadedModules.has(moduleName)
        );

        // 2. Otherwise find any available worker
        if (!pooled) {
            pooled = this.workers.find(w => !w.busy);
        }

        // 3. Spawn new worker if under limit
        if (!pooled && this.workers.length < this.config.maxWorkers) {
            pooled = this.createWorker();
            this.workers.push(pooled);
        }

        // 4. Wait for one to become available
        if (!pooled) {
            await this.waitForAvailable();
            return this.acquire(moduleName);
        }

        // Mark as busy
        pooled.busy = true;
        pooled.lastUsed = Date.now();

        return pooled.worker;
    }

    /**
     * Release a worker back to the pool.
     */
    release(worker: GenericWorker): void {
        const pooled = this.workers.find(w => w.worker === worker);
        if (pooled) {
            pooled.busy = false;
            pooled.lastUsed = Date.now();

            // Update loaded modules list
            pooled.loadedModules = new Set(worker.getLoadedModules());
        }
    }

    /**
     * Get current pool statistics.
     */
    getStats(): {
        totalWorkers: number;
        busyWorkers: number;
        idleWorkers: number;
        maxWorkers: number;
    } {
        const busyWorkers = this.workers.filter(w => w.busy).length;
        return {
            totalWorkers: this.workers.length,
            busyWorkers,
            idleWorkers: this.workers.length - busyWorkers,
            maxWorkers: this.config.maxWorkers,
        };
    }

    /**
     * Terminate all idle workers.
     */
    terminateIdle(): number {
        let terminated = 0;

        this.workers = this.workers.filter(pooled => {
            if (!pooled.busy) {
                pooled.worker.terminate();
                terminated++;
                return false;
            }
            return true;
        });

        return terminated;
    }

    /**
     * Terminate all workers.
     */
    terminateAll(): void {
        if (this.idleTimer !== null) {
            clearInterval(this.idleTimer);
            this.idleTimer = null;
        }

        for (const pooled of this.workers) {
            pooled.worker.terminate();
        }
        this.workers = [];
    }

    /**
     * Create a new pooled worker.
     */
    private createWorker(): PooledWorker {
        return {
            worker: new GenericWorker(this.workerUrl),
            busy: false,
            lastUsed: Date.now(),
            loadedModules: new Set(),
        };
    }

    /**
     * Wait for a worker to become available.
     */
    private waitForAvailable(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * Start periodic idle worker termination.
     */
    private startIdleCheck(): void {
        if (typeof window === 'undefined') return;

        this.idleTimer = window.setInterval(() => {
            const now = Date.now();

            this.workers = this.workers.filter(pooled => {
                const idleTime = now - pooled.lastUsed;
                const isIdle = idleTime > this.config.idleTimeoutMs;

                if (isIdle && !pooled.busy) {
                    pooled.worker.terminate();
                    return false; // Remove from pool
                }
                return true;
            });
        }, 10_000); // Check every 10 seconds
    }

    /**
     * Get configuration.
     */
    getConfig(): Readonly<Required<PoolConfig>> {
        return { ...this.config };
    }
}
