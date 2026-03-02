export interface ToolState {
    files: File[];
    status: "idle" | "uploading" | "converting" | "processing" | "success" | "error";
    result: any;
    retentionTimestamp?: number | null;
}

// Session Storage Keys
const STORAGE_PREFIX = "tool_state_v1_";

const MAX_CACHE_SIZE = 5;
const cacheOrder: string[] = []; // End is most recent
const toolStateCache: Record<string, ToolState> = {};

export function saveToolState(toolId: string, state: ToolState) {
    // 1. Update RAM Cache
    const idx = cacheOrder.indexOf(toolId);
    if (idx !== -1) cacheOrder.splice(idx, 1);
    cacheOrder.push(toolId);

    toolStateCache[toolId] = state;

    // Enforce Max Size (RAM)
    while (cacheOrder.length > MAX_CACHE_SIZE) {
        const toRemove = cacheOrder.shift();
        if (toRemove) {
            delete toolStateCache[toRemove];
        }
    }

    // 2. Persist Metadata to Session Storage
    // We CANNOT store Files or Blobs in Session Storage.
    // We store: status, result (metadata only), retentionTimestamp.
    // Result often contains 'download_url'. If it is a blob URL, it is useless after reload,
    // but useful if we just navigated away and back without reload.
    // If it's a remote URL, it's fine.
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const serializableState = {
                status: state.status,
                retentionTimestamp: state.retentionTimestamp,
                result: state.result ? {
                    ...state.result,
                    // We keep the blob URL for now. If we reload, we'll try to recover it.
                } : null,
                // We imply files are missing
                hasFiles: state.files.length > 0
            };

            const key = `${STORAGE_PREFIX}${toolId}`;
            const value = JSON.stringify(serializableState);

            try {
                window.sessionStorage.setItem(key, value);
            } catch (e: any) {
                if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.warn("SessionStorage Quota Exceeded. Attempting cleanup...");

                    // Strategy 1: Remove all other tool states
                    try {
                        Object.keys(window.sessionStorage).forEach(k => {
                            if (k.startsWith(STORAGE_PREFIX) && k !== key) {
                                window.sessionStorage.removeItem(k);
                            }
                        });
                        // Retry
                        window.sessionStorage.setItem(key, value);
                        console.log("Recovered from QuotaExceeded via cleanup.");
                        return;
                    } catch (retryErr) {
                        // Strategy 2: Nuclear Option (Clear unrelated session data if needed)
                        // For now, we just fail gracefully to RAM-only
                        console.error("Critical: SessionStorage full even after cleanup.", retryErr);
                    }
                } else {
                    throw e;
                }
            }
        }
    } catch (e) {
        // Fallback: RAM cache is already set, so the app works until reload.
        console.warn("Failed to persist tool state to session storage", e);
    }
}

export function loadToolState(toolId: string): ToolState | null {
    // 1. Try RAM first (Fastest & Most Complete)
    if (toolStateCache[toolId]) {
        return toolStateCache[toolId];
    }

    // 2. Try Session Storage (Sync fallback)
    // This allows immediate hydration of 'Success' UI even if blobs are missing initially.
    try {
        if (typeof window === 'undefined') return null; // Server Safety

        if (window.sessionStorage) {
            const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${toolId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                // We return a "Partial" state. The UI must handle missing files/blobs gracefully usually.
                // However, for 'Success' state, we really want the result.
                return {
                    files: [], // Files lost in transit
                    status: parsed.status,
                    result: parsed.result,
                    retentionTimestamp: parsed.retentionTimestamp
                };
            }
        }
    } catch (e) {
        console.warn("Failed to load tool state from session storage", e);
    }

    return null;
}

// 3. Async Full Recovery (The Heavy Lifter)
// Tries to restore Files and Result Blobs from IndexedDB (History/TransferService)
export async function recoverToolState(toolId: string): Promise<ToolState | null> {
    // Load partial state
    let state = loadToolState(toolId);

    if (!state) return null;

    // If we have files in RAM, we assume it's good (RAM is truth)
    if (state.files.length > 0 && state.status !== 'success') {
        return state;
    }

    // Check if we need to recover the Result Blob (Success State)
    if (state.status === 'success' && state.result) {
        const result = state.result;

        // If download_url is missing or is a blob: that might be dead
        // We verify if the blob is fetchable? No, that triggers errors.

        // Strategy: Look up Job ID in History to find the fresh Blob
        if (result.job_id) {
            try {
                // Lazy import to avoid circular dependencies if any
                const { fileDB } = await import("./db");
                // We can't query by job_id efficiently without index?
                // fileDB.getAll sorts by timestamp, we can scan it.
                // Usually history is small-ish.
                const allFiles = await fileDB.getAll();
                const historyItem = allFiles.find((f: any) => f.jobId === result.job_id);

                if (historyItem) {
                    console.log("Restored Result Blob from History DB:", historyItem.fileName);
                    const restoredUrl = URL.createObjectURL(historyItem.blob);

                    // Update the state with new valid URL
                    state = {
                        ...state,
                        result: {
                            ...result,
                            download_url: restoredUrl,
                            // Ensure other fields are execution receipt friendly?
                        }
                    };

                    // Update RAM cache with restored version
                    toolStateCache[toolId] = state;
                    return state;
                }
            } catch (e) {
                console.error("Failed to recover result from DB", e);
            }
        }
    }

    return state;
}

export function clearToolState(toolId: string) {
    const idx = cacheOrder.indexOf(toolId);
    if (idx !== -1) cacheOrder.splice(idx, 1);
    delete toolStateCache[toolId];

    // Clear Session Storage too
    if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(`${STORAGE_PREFIX}${toolId}`);
    }
}
