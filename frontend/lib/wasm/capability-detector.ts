/**
 * Browser Capability Detector
 * 
 * Detects browser capabilities ONCE, caches in localStorage.
 * Core component of the unified WASM runtime.
 */

import type { BrowserCapabilities, RuntimeTier, CachedCapabilities } from './runtime-types';

/** Runtime version for cache invalidation */
const RUNTIME_VERSION = '1.0.0';

/** Cache key in localStorage */
const CACHE_KEY = 'convertlocally_wasm_capabilities';

/** Cache TTL: 7 days */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Select execution tier based on browser capabilities.
 * Only two tiers: 'fast' (threads) or 'safe' (single-thread).
 */
function selectTier(): RuntimeTier {
    // Check for thread support:
    // 1. SharedArrayBuffer must exist
    // 2. Atomics must exist
    // 3. Must be cross-origin isolated (COOP/COEP headers)
    const hasThreads =
        typeof SharedArrayBuffer !== 'undefined' &&
        typeof Atomics !== 'undefined' &&
        (typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false);

    return hasThreads ? 'fast' : 'safe';
}

/**
 * Detect SIMD support by validating a minimal SIMD module.
 * Optimized: Uses validate() instead of instantiate() for zero-overhead.
 */
function detectSIMD(): boolean {
    try {
        // Minimal WASM module that uses SIMD
        return WebAssembly.validate(new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, 0x03,
            0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00,
            0x41, 0x00, 0xfd, 0x0f, 0x0b
        ]));
    } catch {
        return false;
    }
}

/**
 * Detect WebGPU support.
 * Optimized: Fast presence check, defer requestAdapter until needed.
 */
async function detectWebGPU(): Promise<boolean> {
    try {
        if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;

        // Check for "slow GPU" flag in session storage
        try {
            if (sessionStorage.getItem('convertlocally_gpu_slow') === 'true') {
                return false;
            }
        } catch { }

        // Basic presence is enough for "availability" 
        // requestAdapter() is called only when a WebGPU tool starts
        return !!(navigator as any).gpu;
    } catch {
        return false;
    }
}

/** Singleton promise to ensure we only probe once per session */
let detectionPromise: Promise<BrowserCapabilities> | null = null;

/**
 * Probe all browser capabilities.
 */
async function probeCapabilities(): Promise<BrowserCapabilities> {
    const tier = selectTier();
    const wasmSIMD = detectSIMD(); // Synchronous now
    const webgpu = await detectWebGPU();

    return {
        tier,
        wasm: typeof WebAssembly !== 'undefined',
        wasmThreads: tier === 'fast',
        wasmSIMD,
        crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
        hardwareConcurrency: navigator?.hardwareConcurrency ?? 4,
        deviceMemoryGB: (navigator as any)?.deviceMemory ?? null,
        webgpu,
    };
}

/**
 * Load cached capabilities from localStorage.
 */
function loadCachedCapabilities(): BrowserCapabilities | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const parsed: CachedCapabilities = JSON.parse(cached);

        // Validate cache freshness and version
        const now = Date.now();
        if (now - parsed.timestamp > CACHE_TTL_MS || parsed.version !== RUNTIME_VERSION) {
            return null;
        }

        return parsed.capabilities;
    } catch {
        return null;
    }
}

/**
 * Save capabilities to localStorage cache.
 */
function saveCapabilitiesToCache(capabilities: BrowserCapabilities): void {
    try {
        const cached: CachedCapabilities = {
            capabilities,
            timestamp: Date.now(),
            version: RUNTIME_VERSION
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch { }
}

/**
 * Detect browser capabilities.
 * Uses cached value if available, otherwise probes and caches.
 * Optimized: Uses a singleton promise to prevent redundant parallel probes.
 */
export function detectCapabilities(): Promise<BrowserCapabilities> {
    if (detectionPromise) return detectionPromise;

    detectionPromise = (async () => {
        // Try cache first
        const cached = loadCachedCapabilities();
        if (cached) {
            return cached;
        }

        // Probe capabilities
        const capabilities = await probeCapabilities();

        // Cache for future
        saveCapabilitiesToCache(capabilities);

        return capabilities;
    })();

    return detectionPromise;
}

/**
 * Force re-detection of capabilities (ignores cache).
 * Useful after browser updates or for debugging.
 */
export async function forceDetectCapabilities(): Promise<BrowserCapabilities> {
    const capabilities = await probeCapabilities();
    saveCapabilitiesToCache(capabilities);
    return capabilities;
}

/**
 * Clear capability cache.
 */
export function clearCapabilityCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch {
        // Ignore errors
    }
}

/**
 * Get current tier without full detection.
 * Fast synchronous check for quick decisions.
 */
export function getCurrentTier(): RuntimeTier {
    return selectTier();
}

/**
 * Check if threads are available (synchronous).
 */
export function hasThreadSupport(): boolean {
    return selectTier() === 'fast';
}

/**
 * Check if running in cross-origin isolated context.
 */
export function isCrossOriginIsolated(): boolean {
    return typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false;
}
