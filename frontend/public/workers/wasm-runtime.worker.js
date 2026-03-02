/**
 * Generic WASM Runtime Worker
 * 
 * A single worker type that loads ANY WASM module dynamically.
 * NOT tool-specific — reusable across all tools.
 * This prevents architectural rot and keeps the codebase clean.
 */

/* eslint-disable no-restricted-globals */

// Module storage
const loadedModules = new Map();

// Memory instances for modules
const moduleMemories = new Map();

/**
 * Handle incoming messages from main thread.
 */
self.onmessage = async (e) => {
    const { id, type, payload } = e.data;

    try {
        switch (type) {
            case 'LOAD_MODULE':
                await handleLoadModule(id, payload);
                break;

            case 'RUN':
                await handleRun(id, payload);
                break;

            case 'UNLOAD_MODULE':
                handleUnloadModule(id, payload);
                break;

            case 'HEALTH_CHECK':
                handleHealthCheck(id);
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            id,
            type: 'ERROR',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Load a WASM module.
 */
async function handleLoadModule(id, { moduleName, wasmBytes }) {
    // Check if already loaded
    if (loadedModules.has(moduleName)) {
        self.postMessage({ id, type: 'MODULE_LOADED', moduleName });
        return;
    }

    // Create shared memory for this module
    const memory = new WebAssembly.Memory({
        initial: 256,      // 16MB initial
        maximum: 4096,     // 256MB maximum
        shared: typeof SharedArrayBuffer !== 'undefined'
    });

    // Compile and instantiate
    const module = await WebAssembly.compile(wasmBytes);
    const imports = getImports(moduleName, memory);
    const instance = await WebAssembly.instantiate(module, imports);

    // Store module and memory
    loadedModules.set(moduleName, { module, instance });
    moduleMemories.set(moduleName, memory);

    self.postMessage({ id, type: 'MODULE_LOADED', moduleName });
}

/**
 * Run a function in a loaded module.
 */
async function handleRun(id, { moduleName, functionName, args }) {
    const loaded = loadedModules.get(moduleName);
    if (!loaded) {
        throw new Error(`Module ${moduleName} not loaded`);
    }

    const fn = loaded.instance.exports[functionName];
    if (typeof fn !== 'function') {
        throw new Error(`Function ${functionName} not found in ${moduleName}`);
    }

    // Detect memory allocator
    const malloc = loaded.instance.exports.__wbindgen_malloc || loaded.instance.exports.malloc;
    const free = loaded.instance.exports.__wbindgen_free || loaded.instance.exports.free;

    // Keep track of allocated memory to free later
    const cleanupList = [];

    try {
        // Process args for WASM compatibility
        const processedArgs = args.flatMap(arg => {
            if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
                if (!malloc) {
                    throw new Error(`Module ${moduleName} does not export malloc/free, cannot pass binary data`);
                }

                const buffer = arg instanceof ArrayBuffer ? new Uint8Array(arg) : arg;
                const len = buffer.length;
                const ptr = malloc(len);

                // Copy data to WASM memory
                const memory = moduleMemories.get(moduleName);
                if (!memory) throw new Error('Memory not found');

                const view = new Uint8Array(memory.buffer);
                view.set(buffer, ptr);

                // Check if we should free this. 
                // Rust functions taking &[u8] borrow, so we CAN (and MUST) free after call.
                // Rust functions taking Vec<u8> take ownership, so we MUST NOT free (Rust will).
                // We assume &[u8] (borrow) by default for "process" style functions.
                // If the function takes ownership, we'd need metadata or a flag.
                // For now, we assume implicit borrow for safety and manually free.
                cleanupList.push({ ptr, len });

                // WASM-bindgen expects (ptr, len) for slices
                return [ptr, len];
            }
            return [arg];
        });

        // Execute function
        const result = await fn(...processedArgs);

        // Send result back with transferables if applicable
        const transferables = getTransferables(result);
        self.postMessage({ id, type: 'RESULT', result }, transferables);

    } finally {
        // Cleanup allocated memory
        if (free) {
            for (const { ptr, len } of cleanupList) {
                free(ptr, len);
            }
        }
    }
}

/**
 * Unload a module.
 */
function handleUnloadModule(id, { moduleName }) {
    loadedModules.delete(moduleName);
    moduleMemories.delete(moduleName);

    self.postMessage({ id, type: 'MODULE_UNLOADED', moduleName });
}

/**
 * Health check - report memory usage.
 */
function handleHealthCheck(id) {
    let memory = null;

    if (performance.memory) {
        memory = {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
        };
    }

    self.postMessage({
        id,
        type: 'HEALTH_OK',
        result: { memory }
    });
}

/**
 * Get WASM imports for a module.
 * Provides standard WASI-like environment.
 */
function getImports(moduleName, memory) {
    return {
        env: {
            memory,
            abort: (msg, file, line, column) => {
                throw new Error(`WASM abort: ${msg} at ${file}:${line}:${column}`);
            },
            // Console logging
            console_log: (ptr, len) => {
                // Read string from memory if needed
                console.log('[WASM]', ptr, len);
            }
        },
        wasi_snapshot_preview1: {
            // Minimal WASI stubs for compatibility
            fd_write: (fd, iovs, iovs_len, nwritten) => {
                // Stub - real implementation would write to virtual FS
                return 0;
            },
            fd_read: (fd, iovs, iovs_len, nread) => 0,
            fd_close: (fd) => 0,
            fd_seek: (fd, offset, whence, newoffset) => 0,
            fd_fdstat_get: (fd, stat) => 0,
            fd_prestat_get: (fd, buf) => 8, // EBADF
            fd_prestat_dir_name: (fd, path, path_len) => 8,
            path_open: () => 0,
            proc_exit: (code) => {
                throw new Error(`WASM proc_exit called with code ${code}`);
            },
            environ_sizes_get: (count, size) => 0,
            environ_get: (environ, buf) => 0,
            args_sizes_get: (argc, argv_buf_size) => 0,
            args_get: (argv, argv_buf) => 0,
            clock_time_get: (id, precision, time) => {
                // Return current time in nanoseconds
                const now = BigInt(Date.now()) * BigInt(1_000_000);
                const view = new DataView(memory.buffer);
                view.setBigUint64(time, now, true);
                return 0;
            },
            random_get: (buf, len) => {
                // Fill buffer with random bytes
                const view = new Uint8Array(memory.buffer, buf, len);
                crypto.getRandomValues(view);
                return 0;
            }
        }
    };
}

/**
 * Extract transferable objects from a result.
 */
function getTransferables(result) {
    if (result instanceof ArrayBuffer) {
        return [result];
    }
    if (ArrayBuffer.isView(result)) {
        return [result.buffer];
    }
    if (result && typeof result === 'object') {
        // Check for transferable properties
        const transferables = [];
        for (const key of Object.keys(result)) {
            const value = result[key];
            if (value instanceof ArrayBuffer) {
                transferables.push(value);
            } else if (ArrayBuffer.isView(value)) {
                transferables.push(value.buffer);
            }
        }
        return transferables;
    }
    return [];
}

/**
 * Send progress update to main thread.
 */
function reportProgress(id, percent, message) {
    self.postMessage({
        id,
        type: 'PROGRESS',
        progress: percent,
        message
    });
}

// Export for use in module scope
self.reportProgress = reportProgress;
