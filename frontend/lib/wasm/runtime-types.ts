/**
 * WASM Runtime Type Definitions
 * 
 * Core types for the unified WASM runtime.
 * Only two execution tiers: "fast" (threads) and "safe" (single-thread).
 */

/**
 * Execution tier - only two options, no complexity explosion.
 * 
 * - fast: WASM + SharedArrayBuffer + Threads (modern browsers with COOP/COEP)
 * - safe: WASM single-thread (Safari fallback, legacy browsers)
 */
export type RuntimeTier = 'fast' | 'safe';

/**
 * Browser capability detection result.
 */
export interface BrowserCapabilities {
    /** Selected execution tier */
    tier: RuntimeTier;
    /** Basic WASM support */
    wasm: boolean;
    /** WASM with threads (SharedArrayBuffer + Atomics) */
    wasmThreads: boolean;
    /** WASM SIMD support */
    wasmSIMD: boolean;
    /** Cross-origin isolated (COOP/COEP headers present) */
    crossOriginIsolated: boolean;
    /** Number of logical CPU cores */
    hardwareConcurrency: number;
    /** Device memory in GB (null if not available) */
    deviceMemoryGB: number | null;
    /** WebGPU support (reserved for future, designed but not implemented) */
    webgpu?: boolean;
}

/**
 * Tier capability details
 */
export interface TierCapabilities {
    tier: RuntimeTier;
    hasSharedArrayBuffer: boolean;
    hasAtomics: boolean;
    hardwareConcurrency: number;
    deviceMemoryGB: number | null;
}

/**
 * Module registry entry - maps module names to URLs
 */
export interface ModuleRegistryEntry {
    /** URL to the WASM file */
    url: string;
    /** Optional SIMD-optimized variant URL */
    simdUrl?: string;
    /** Estimated size in bytes (for memory planning) */
    estimatedSize?: number;
}

/**
 * Worker message types for generic worker communication
 */
export type WorkerMessageType =
    | 'LOAD_MODULE'
    | 'RUN'
    | 'UNLOAD_MODULE'
    | 'HEALTH_CHECK'
    | 'MODULE_LOADED'
    | 'RESULT'
    | 'ERROR'
    | 'HEALTH_OK'
    | 'PROGRESS'
    | 'MODULE_UNLOADED';

/**
 * Message sent to worker
 */
export interface WorkerRequest {
    id: string;
    type: WorkerMessageType;
    payload?: {
        moduleName?: string;
        wasmBytes?: ArrayBuffer;
        functionName?: string;
        args?: any[];
    };
}

/**
 * Message received from worker
 */
export interface WorkerResponse {
    id: string;
    type: WorkerMessageType;
    result?: any;
    error?: string;
    moduleName?: string;
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
    };
    progress?: number;
    message?: string;
}

/**
 * Runtime handle options
 */
export interface AcquireOptions {
    /** Module name to load */
    module: string;
    /** Priority for task scheduling */
    priority?: 'high' | 'normal' | 'low';
    /** Optional tool ID for CBEE constraint lookup */
    toolId?: string;
}

/**
 * Cached capability data with timestamp
 */
export interface CachedCapabilities {
    capabilities: BrowserCapabilities;
    timestamp: number;
    version: string;
}

/**
 * Memory pressure levels
 */
export type MemoryPressureLevel = 'ok' | 'warning' | 'critical';

/**
 * Memory configuration
 */
export interface MemoryConfig {
    /** Maximum total WASM memory in MB */
    maxTotalMemoryMB: number;
    /** Warning threshold (percentage) */
    warningThresholdPercent: number;
    /** Critical threshold (percentage) */
    criticalThresholdPercent: number;
}

/**
 * Worker pool configuration
 */
export interface PoolConfig {
    /** Maximum number of workers (default: hardwareConcurrency) */
    maxWorkers?: number;
    /** Idle timeout in ms before worker termination (default: 120000) */
    idleTimeoutMs?: number;
    /** Modules to preload on pool initialization */
    warmupModules?: string[];
}

/**
 * Module cache configuration
 */
export interface ModuleCacheConfig {
    /** Maximum cache size in MB */
    maxSizeMB: number;
}
