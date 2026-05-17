import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { fileDB } from '@/lib/db';

export interface HistoryItem {
    id: string;
    jobId: string;
    fileName: string;
    toolId: string;
    timestamp: number;
    downloadUrl: string; // Blob URL (created from IDB blob)
    size?: string;
    type: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Shared singleton store — ensures all useFileHistory() consumers share the
// same state and stay in sync without requiring a React Context provider.
// ────────────────────────────────────────────────────────────────────────────

type Listener = () => void;

let _items: HistoryItem[] = [];
let _listeners: Set<Listener> = new Set();
let _initialized = false;
let _initializing = false;
/** Track blob URLs we've created so we can revoke them on reload */
let _blobUrls: string[] = [];

function _notify() {
    _listeners.forEach(fn => fn());
}

function _subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
}

function _getSnapshot(): HistoryItem[] {
    return _items;
}

/** Server snapshot (SSR) — always empty */
function _getServerSnapshot(): HistoryItem[] {
    return [];
}

/** Revoke old blob URLs to avoid memory leaks */
function _revokeUrls() {
    _blobUrls.forEach(u => URL.revokeObjectURL(u));
    _blobUrls = [];
}

/** Load all files from IDB into shared state */
async function _loadFromIDB() {
    if (typeof window === 'undefined') return;
    if (_initializing) return; // Prevent double-init
    _initializing = true;

    try {
        await fileDB.prune();
        const records = await fileDB.getAll();
        records.sort((a, b) => b.timestamp - a.timestamp);

        // Revoke any previous blob URLs before creating new ones
        _revokeUrls();

        _items = records.map(rec => {
            const url = URL.createObjectURL(rec.blob);
            _blobUrls.push(url);
            return {
                id: rec.id,
                jobId: rec.jobId,
                fileName: rec.fileName,
                toolId: rec.toolId,
                timestamp: rec.timestamp,
                downloadUrl: url,
                size: (rec.size / 1024).toFixed(0) + ' KB',
                type: rec.type,
            };
        });

        _initialized = true;
        _notify();
    } catch (e) {
        console.error("Failed to load history from IDB", e);
    } finally {
        _initializing = false;
    }
}

/** Add a new item — persists to IDB + updates shared state immediately */
async function _addItem(item: Omit<HistoryItem, 'timestamp' | 'id' | 'size'> & { blob?: Blob }) {
    let blobToStore = item.blob;

    if (!blobToStore && item.downloadUrl.startsWith('blob:')) {
        try {
            const r = await fetch(item.downloadUrl);
            blobToStore = await r.blob();
        } catch (e) {
            console.warn("Could not fetch blob from URL for persistence", e);
        }
    }

    if (!blobToStore) return;

    const id = crypto.randomUUID();
    const savedItem = await fileDB.saveFile({
        id,
        jobId: item.jobId,
        fileName: item.fileName,
        toolId: item.toolId,
        blob: blobToStore,
        size: blobToStore.size,
        type: item.type,
    });

    const newUrl = URL.createObjectURL(blobToStore);
    _blobUrls.push(newUrl);

    const historyItem: HistoryItem = {
        id,
        jobId: savedItem.jobId,
        fileName: savedItem.fileName,
        toolId: savedItem.toolId,
        timestamp: savedItem.timestamp,
        downloadUrl: newUrl,
        size: (savedItem.size / 1024).toFixed(0) + ' KB',
        type: savedItem.type,
    };

    // Prepend to the shared list (newest first)
    _items = [historyItem, ..._items];
    _notify();
}

/** Remove a single item */
async function _removeItem(id: string) {
    await fileDB.delete(id);
    const removed = _items.find(h => h.id === id);
    if (removed?.downloadUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.downloadUrl);
    }
    _items = _items.filter(h => h.id !== id);
    _notify();
}

/** Clear all items */
async function _clearAll() {
    await fileDB.clear();
    _revokeUrls();
    _items = [];
    _notify();
}


// ────────────────────────────────────────────────────────────────────────────
// Public hook — thin wrapper around the shared store
// ────────────────────────────────────────────────────────────────────────────

export function useFileHistory() {
    const history = useSyncExternalStore(_subscribe, _getSnapshot, _getServerSnapshot);

    // Trigger initial load on first mount (idempotent)
    useEffect(() => {
        if (!_initialized && !_initializing) {
            _loadFromIDB();
        }
    }, []);

    const addToHistory = useCallback(
        (item: Omit<HistoryItem, 'timestamp' | 'id' | 'size'> & { blob?: Blob }) => _addItem(item),
        []
    );

    const removeFromHistory = useCallback(
        (id: string) => _removeItem(id),
        []
    );

    const clearHistory = useCallback(
        () => _clearAll(),
        []
    );

    return { history, addToHistory, removeFromHistory, clearHistory };
}
