/**
 * Unified WASM Runtime
 * 
 * The main public API for the WASM runtime.
 * Tiny API: acquire() → run() → release()
 * 
 * If this API grows, you're doing too much.
 */

import { detectCapabilities, getCurrentTier } from './capability-detector';
import { ModuleCache } from './module-cache';
import { WasmWorkerPool } from './wasm-worker-pool';
import { MemoryPressureHandler } from './memory-pressure';
import { GenericWorker } from './generic-worker';
import type {
    BrowserCapabilities,
    RuntimeTier,
    AcquireOptions,
    ModuleRegistryEntry
} from './runtime-types';

/**
 * Module registry - maps module names to URLs.
 * Add new modules here as needed.
 */
const MODULE_REGISTRY: Record<string, ModuleRegistryEntry> = {
    'pdf-core': {
        url: '/wasm/pdf-core.wasm',
        estimatedSize: 2 * 1024 * 1024, // 2MB
    },
    'image-photon': {
        url: '/wasm/image-photon/converter_image_bg.wasm',
        // simdUrl: '/wasm/image-photon/converter_image_bg.wasm', // Enable if compiled with SIMD
        estimatedSize: 1.5 * 1024 * 1024, // 1.5MB
    },
    'docx-converter': {
        url: '/wasm/converter_bg.wasm',
        estimatedSize: 3 * 1024 * 1024, // 3MB
    },
    'ebook-processor': {
        url: '/wasm/ebook/converter_ebook_bg.wasm',
        estimatedSize: 2 * 1024 * 1024, // 2MB
    },
    // Add more modules as needed
};

/**
 * Runtime Handle
 * 
 * Returned by acquire() - user interacts with this.
 * Provides run() and release() methods.
 */
export class RuntimeHandle {
    private worker: GenericWorker;
    private moduleName: string;
    private releaseCallback: () => void;
    private released = false;

    constructor(
        worker: GenericWorker,
        moduleName: string,
        releaseCallback: () => void
    ) {
        this.worker = worker;
        this.moduleName = moduleName;
        this.releaseCallback = releaseCallback;
    }

    /**
     * Run a function in the WASM module.
     * @param functionName Exported function name
     * @param args Arguments to pass
     * @param onProgress Optional progress callback
     */
    async run<T>(
        functionName: string,
        args: any[] = [],
        onProgress?: (percent: number, message?: string) => void
    ): Promise<T> {
        if (this.released) {
            throw new Error('Runtime handle has been released');
        }

        return this.worker.run<T>(this.moduleName, functionName, args, onProgress);
    }

    /**
     * Release the runtime handle.
     * Always call this when done, preferably in a finally block.
     */
    release(): void {
        if (this.released) return;

        this.released = true;
        this.releaseCallback();
    }

    /**
     * Check if handle has been released.
     */
    isReleased(): boolean {
        return this.released;
    }

    /**
     * Get the module name.
     */
    getModuleName(): string {
        return this.moduleName;
    }
}

/**
 * WASM Runtime
 * 
 * Main entry point for all WASM operations.
 * Manages capabilities, modules, workers, and memory.
 */
class WasmRuntime {
    private capabilities: BrowserCapabilities | null = null;
    private moduleCache = new ModuleCache(128); // 128MB cache
    private pool = new WasmWorkerPool();
    private memoryHandler = new MemoryPressureHandler();
    private initialized = false;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the runtime.
     * Called automatically on first acquire().
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        // Prevent multiple simultaneous initializations
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.doInit();
        await this.initPromise;
    }

    private async doInit(): Promise<void> {
        // Detect capabilities
        this.capabilities = await detectCapabilities();

        // Wire up memory pressure handlers
        this.memoryHandler.setHandlers({
            onWarning: () => {
                console.warn('[WASM Runtime] Memory pressure warning');
            },
            onCritical: () => {
                console.warn('[WASM Runtime] Memory pressure critical - clearing cache');
                this.moduleCache.clear();
                this.pool.terminateIdle();
            }
        });

        // Start memory monitoring
        this.memoryHandler.startMonitoring(5000);

        this.initialized = true;
    }

    /**
     * Acquire a runtime handle for a module.
     * 
     * @example
     * ```typescript
     * const runtime = await wasmRuntime.acquire({ module: 'pdf-core' });
     * try {
     *   const result = await runtime.run('convertToDocx', [pdfBytes]);
     * } finally {
     *   runtime.release();
     * }
     * ```
     */
    async acquire(options: AcquireOptions): Promise<RuntimeHandle> {
        await this.init();

        const { module, priority = 'normal' } = options;

        // Check memory before proceeding
        if (!this.memoryHandler.canAllocate(50)) {
            throw new Error('Insufficient memory for WASM operation');
        }

        // Get module URL
        const entry = MODULE_REGISTRY[module];
        if (!entry) {
            throw new Error(`Unknown module: ${module}. Available: ${Object.keys(MODULE_REGISTRY).join(', ')}`);
        }

        // Select URL based on SIMD support
        const moduleUrl = this.capabilities?.wasmSIMD && entry.simdUrl
            ? entry.simdUrl
            : entry.url;

        // Acquire worker from pool (prefer one with module loaded)
        const worker = await this.pool.acquire(module);

        try {
            // Load module into worker if not already loaded
            if (!worker.hasModule(module)) {
                // Fetch WASM bytes
                const response = await fetch(moduleUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch module ${module}: ${response.status}`);
                }
                const wasmBytes = await response.arrayBuffer();

                // Load into worker
                await worker.loadModule(module, wasmBytes);
            }

            // Return handle
            return new RuntimeHandle(worker, module, () => {
                this.pool.release(worker);
            });
        } catch (error) {
            // Release worker on error
            this.pool.release(worker);
            throw error;
        }
    }

    /**
     * Get current execution tier.
     */
    getTier(): RuntimeTier {
        return this.capabilities?.tier ?? getCurrentTier();
    }

    /**
     * Get browser capabilities.
     */
    async getCapabilities(): Promise<BrowserCapabilities> {
        await this.init();
        return this.capabilities!;
    }

    /**
     * Get runtime statistics.
     */
    getStats(): {
        tier: RuntimeTier;
        capabilities: BrowserCapabilities | null;
        pool: ReturnType<WasmWorkerPool['getStats']>;
        cache: ReturnType<ModuleCache['getStats']>;
        memory: ReturnType<MemoryPressureHandler['getMemoryUsage']>;
    } {
        return {
            tier: this.getTier(),
            capabilities: this.capabilities,
            pool: this.pool.getStats(),
            cache: this.moduleCache.getStats(),
            memory: this.memoryHandler.getMemoryUsage(),
        };
    }

    /**
     * Register a custom module.
     */
    registerModule(name: string, entry: ModuleRegistryEntry): void {
        MODULE_REGISTRY[name] = entry;
    }

    /**
     * Shutdown the runtime.
     * Terminates all workers and clears caches.
     */
    shutdown(): void {
        this.memoryHandler.dispose();
        this.pool.terminateAll();
        this.moduleCache.clear();
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Check if runtime is initialized.
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Singleton instance
export const wasmRuntime = new WasmRuntime();

// Also export the class for testing
export { WasmRuntime };
