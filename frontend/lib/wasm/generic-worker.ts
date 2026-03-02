/**
 * Generic Worker Controller
 * 
 * Main thread controller for generic WASM workers.
 * One worker type that loads ANY module dynamically - prevents architectural rot.
 */

import type { WorkerRequest, WorkerResponse } from './runtime-types';

/**
 * Pending promise handler
 */
interface PendingHandler {
    resolve: (value: any) => void;
    reject: (reason: Error) => void;
    onProgress?: (percent: number, message?: string) => void;
}

/**
 * Generic Worker Controller
 * 
 * Controls a single generic WASM worker instance.
 * The worker can load any WASM module dynamically.
 */
export class GenericWorker {
    private worker: Worker;
    private pending = new Map<string, PendingHandler>();
    private idCounter = 0;
    private loadedModules = new Set<string>();
    private terminated = false;

    /**
     * Create a new generic worker.
     * @param workerUrl URL to the worker script (default: /workers/wasm-runtime.worker.js)
     */
    constructor(workerUrl: string = '/workers/wasm-runtime.worker.js') {
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
    }

    /**
     * Load a WASM module into the worker.
     * @param moduleName Unique name for the module
     * @param wasmBytes Compiled WASM bytes
     */
    async loadModule(moduleName: string, wasmBytes: ArrayBuffer): Promise<void> {
        if (this.terminated) {
            throw new Error('Worker has been terminated');
        }

        await this.send<void>('LOAD_MODULE', { moduleName, wasmBytes }, [wasmBytes]);
        this.loadedModules.add(moduleName);
    }

    /**
     * Run a function in a loaded WASM module.
     * @param moduleName Name of the loaded module
     * @param functionName Exported function name
     * @param args Arguments to pass
     * @param onProgress Optional progress callback
     */
    async run<T>(
        moduleName: string,
        functionName: string,
        args: any[],
        onProgress?: (percent: number, message?: string) => void
    ): Promise<T> {
        if (this.terminated) {
            throw new Error('Worker has been terminated');
        }

        if (!this.loadedModules.has(moduleName)) {
            throw new Error(`Module ${moduleName} not loaded in this worker`);
        }

        // Extract transferables from args
        const transferables: Transferable[] = [];
        for (const arg of args) {
            if (arg instanceof ArrayBuffer) {
                transferables.push(arg);
            } else if (ArrayBuffer.isView(arg)) {
                transferables.push(arg.buffer);
            }
        }

        return this.send<T>('RUN', { moduleName, functionName, args }, transferables, onProgress);
    }

    /**
     * Unload a module from the worker.
     */
    async unloadModule(moduleName: string): Promise<void> {
        if (this.terminated) return;

        await this.send<void>('UNLOAD_MODULE', { moduleName });
        this.loadedModules.delete(moduleName);
    }

    /**
     * Check worker health.
     */
    async healthCheck(): Promise<{ memory: { usedJSHeapSize: number; totalJSHeapSize: number } | null }> {
        if (this.terminated) {
            throw new Error('Worker has been terminated');
        }

        return this.send<{ memory: { usedJSHeapSize: number; totalJSHeapSize: number } | null }>('HEALTH_CHECK', {});
    }

    /**
     * Get list of loaded modules.
     */
    getLoadedModules(): string[] {
        return Array.from(this.loadedModules);
    }

    /**
     * Check if a module is loaded.
     */
    hasModule(moduleName: string): boolean {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Check if worker is terminated.
     */
    isTerminated(): boolean {
        return this.terminated;
    }

    /**
     * Terminate the worker.
     */
    terminate(): void {
        if (this.terminated) return;

        this.terminated = true;
        this.worker.terminate();

        // Reject all pending requests
        Array.from(this.pending.entries()).forEach(([id, handler]) => {
            handler.reject(new Error('Worker terminated'));
        });
        this.pending.clear();
        this.loadedModules.clear();
    }

    /**
     * Send a message to the worker and wait for response.
     */
    private send<T>(
        type: string,
        payload: any,
        transferables: Transferable[] = [],
        onProgress?: (percent: number, message?: string) => void
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const id = String(++this.idCounter);

            this.pending.set(id, { resolve, reject, onProgress });

            const request: WorkerRequest = {
                id,
                type: type as any,
                payload
            };

            this.worker.postMessage(request, transferables);
        });
    }

    /**
     * Handle messages from worker.
     */
    private handleMessage(e: MessageEvent<WorkerResponse>): void {
        const { id, type, result, error, progress, message } = e.data;

        // Handle progress updates (don't resolve)
        if (type === 'PROGRESS') {
            const handler = this.pending.get(id);
            if (handler?.onProgress && progress !== undefined) {
                handler.onProgress(progress, message);
            }
            return;
        }

        // Get pending handler
        const handler = this.pending.get(id);
        if (!handler) return;

        this.pending.delete(id);

        // Handle response
        if (type === 'ERROR') {
            handler.reject(new Error(error || 'Unknown worker error'));
        } else {
            handler.resolve(result);
        }
    }

    /**
     * Handle worker errors.
     */
    private handleError(e: ErrorEvent): void {
        console.error('[GenericWorker] Worker error:', e.message);

        // Reject all pending with the error
        Array.from(this.pending.entries()).forEach(([id, handler]) => {
            handler.reject(new Error(`Worker error: ${e.message}`));
        });
        this.pending.clear();
    }
}
