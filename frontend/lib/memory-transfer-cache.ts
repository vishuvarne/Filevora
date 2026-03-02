/**
 * A fast, in-memory cache for passing files between pages in the SPA.
 * This avoids the serialization overhead of IndexedDB for the primary user flow,
 * providing true O(1) instant transfer for large files.
 */

const cache = new Map<string, { file?: File, deferred?: { url: string, filename: string, type: string }, metadata: any, timestamp: number }>();

// Cleanup old items every minute
if (typeof window !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        cache.forEach((value, key) => {
            if (now - value.timestamp > 60000) { // 1 minute TTL for memory cache
                cache.delete(key);
            }
        });
    }, 60000);
}

export const MemoryTransferCache = {
    // Overload for regular file
    store(key: string, file: File, metadata: any = {}) {
        cache.set(key, { file, metadata, timestamp: Date.now() });
    },

    // Overload for deferred URL (Large file optimization)
    storeDeferred(key: string, data: { url: string, filename: string, type: string }, metadata: any = {}) {
        cache.set(key, { deferred: data, metadata, timestamp: Date.now() });
    },

    consume(key: string) {
        const item = cache.get(key);
        if (item) {
            // cache.delete(key); // DO NOT delete immediately. 
            // We rely on the component clearing the URL parameter to prevent re-reading.
            // Keeping it here allows handling React Strict Mode (double mount) or checks without data loss.
            // The 60s TTL will clean it up.
            return item;
        }
        return null;
    },

    // Read without consuming (for sync hydration check)
    peek(key: string) {
        return cache.get(key) || null;
    },

    // Check if item exists without consuming
    has(key: string) {
        return cache.has(key);
    }
};
