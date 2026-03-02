/**
 * Unified WASM Runtime - Public Exports
 * 
 * This is the main entry point for the WASM runtime.
 * Import from here for all WASM-related functionality.
 * 
 * @example
 * ```typescript
 * import { wasmRuntime } from '@/lib/wasm';
 * 
 * const runtime = await wasmRuntime.acquire({ module: 'pdf-core' });
 * try {
 *   const result = await runtime.run('convertToDocx', [pdfBytes]);
 * } finally {
 *   runtime.release();
 * }
 * ```
 */

// Main runtime API
export { wasmRuntime, WasmRuntime, RuntimeHandle } from './runtime';

// Capability detection
export {
    detectCapabilities,
    forceDetectCapabilities,
    clearCapabilityCache,
    getCurrentTier,
    hasThreadSupport,
    isCrossOriginIsolated
} from './capability-detector';

// Types
export type {
    RuntimeTier,
    BrowserCapabilities,
    TierCapabilities,
    ModuleRegistryEntry,
    WorkerMessageType,
    WorkerRequest,
    WorkerResponse,
    AcquireOptions,
    CachedCapabilities,
    MemoryPressureLevel,
    MemoryConfig,
    PoolConfig,
    ModuleCacheConfig,
} from './runtime-types';

// Low-level components (for advanced use cases)
export { ModuleCache } from './module-cache';
export { WasmWorkerPool } from './wasm-worker-pool';
export { MemoryPressureHandler } from './memory-pressure';
export { GenericWorker } from './generic-worker';

// Runtime status utilities
export {
    getRuntimeStatus,
    getQuickTier,
    isOptimalMode,
    getRuntimeStats,
    type RuntimeStatus
} from './runtime-status';

