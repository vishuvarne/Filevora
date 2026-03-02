/**
 * WASM Module Cache
 * 
 * LRU cache for compiled WASM modules.
 * Compile once, reuse everywhere. Evict least-recently-used under memory pressure.
 */

import type { ModuleCacheConfig } from './runtime-types';

/**
 * Cached module entry
 */
interface CachedModule {
    /** Compiled WebAssembly module */
    module: WebAssembly.Module;
    /** Size in bytes */
    size: number;
    /** Last access timestamp */
    lastUsed: number;
    /** Usage count */
    useCount: number;
}

/**
 * LRU cache for WASM modules
 */
export class ModuleCache {
    private cache = new Map<string, CachedModule>();
    private totalSize = 0;
    private readonly maxSize: number;

    /**
     * Create a new module cache.
     * @param maxSizeMB Maximum cache size in megabytes (default: 128MB)
     */
    constructor(maxSizeMB: number = 128) {
        this.maxSize = maxSizeMB * 1024 * 1024;
    }

    /**
     * Load and cache a WASM module.
     * Returns cached module if available, otherwise fetches and compiles.
     */
    async load(name: string, url: string): Promise<WebAssembly.Module> {
        // Return cached if available
        const cached = this.cache.get(name);
        if (cached) {
            cached.lastUsed = Date.now();
            cached.useCount++;
            return cached.module;
        }

        // Fetch and compile new module
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch WASM module: ${url} (${response.status})`);
        }

        const bytes = await response.arrayBuffer();
        const module = await WebAssembly.compile(bytes);

        // Evict if over limit
        while (this.totalSize + bytes.byteLength > this.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        // Store in cache
        this.cache.set(name, {
            module,
            size: bytes.byteLength,
            lastUsed: Date.now(),
            useCount: 1
        });
        this.totalSize += bytes.byteLength;

        return module;
    }

    /**
     * Load a module from raw bytes (pre-fetched).
     */
    async loadFromBytes(name: string, bytes: ArrayBuffer): Promise<WebAssembly.Module> {
        // Return cached if available
        const cached = this.cache.get(name);
        if (cached) {
            cached.lastUsed = Date.now();
            cached.useCount++;
            return cached.module;
        }

        // Compile module
        const module = await WebAssembly.compile(bytes);

        // Evict if over limit
        while (this.totalSize + bytes.byteLength > this.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        // Store in cache
        this.cache.set(name, {
            module,
            size: bytes.byteLength,
            lastUsed: Date.now(),
            useCount: 1
        });
        this.totalSize += bytes.byteLength;

        return module;
    }

    /**
     * Check if a module is cached.
     */
    has(name: string): boolean {
        return this.cache.has(name);
    }

    /**
     * Get a cached module without fetching.
     */
    get(name: string): WebAssembly.Module | undefined {
        const cached = this.cache.get(name);
        if (cached) {
            cached.lastUsed = Date.now();
            cached.useCount++;
            return cached.module;
        }
        return undefined;
    }

    /**
     * Evict the least recently used module.
     */
    private evictLRU(): void {
        const entries = Array.from(this.cache.entries());
        if (entries.length === 0) return;

        // Find oldest entry
        const oldest = entries.reduce((prev, curr) =>
            curr[1].lastUsed < prev[1].lastUsed ? curr : prev
        );

        this.totalSize -= oldest[1].size;
        this.cache.delete(oldest[0]);
    }

    /**
     * Manually unload a specific module.
     */
    unload(name: string): boolean {
        const cached = this.cache.get(name);
        if (cached) {
            this.totalSize -= cached.size;
            this.cache.delete(name);
            return true;
        }
        return false;
    }

    /**
     * Clear all cached modules.
     */
    clear(): void {
        this.cache.clear();
        this.totalSize = 0;
    }

    /**
     * Get current cache statistics.
     */
    getStats(): {
        moduleCount: number;
        totalSizeBytes: number;
        maxSizeBytes: number;
        utilizationPercent: number;
        modules: Array<{ name: string; size: number; useCount: number; lastUsed: number }>;
    } {
        const modules = Array.from(this.cache.entries()).map(([name, entry]) => ({
            name,
            size: entry.size,
            useCount: entry.useCount,
            lastUsed: entry.lastUsed
        }));

        return {
            moduleCount: this.cache.size,
            totalSizeBytes: this.totalSize,
            maxSizeBytes: this.maxSize,
            utilizationPercent: (this.totalSize / this.maxSize) * 100,
            modules
        };
    }

    /**
     * Get total size of cached modules in bytes.
     */
    getTotalSize(): number {
        return this.totalSize;
    }

    /**
     * Get remaining space in bytes.
     */
    getRemainingSpace(): number {
        return this.maxSize - this.totalSize;
    }
}
