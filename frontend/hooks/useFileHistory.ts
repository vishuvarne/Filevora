import { useState, useEffect } from 'react';
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

export function useFileHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        let active = true;
        const objectUrls: string[] = [];

        async function loadHistory() {
            try {
                // Prune old files
                await fileDB.prune();

                // Load valid files
                const items = await fileDB.getAll();

                if (!active) return;

                // Sort by timestamp desc
                items.sort((a, b) => b.timestamp - a.timestamp);

                // Create blob URLs
                const historyItems: HistoryItem[] = items.map(item => {
                    const url = URL.createObjectURL(item.blob);
                    objectUrls.push(url);
                    return {
                        id: item.id,
                        jobId: item.jobId,
                        fileName: item.fileName,
                        toolId: item.toolId,
                        timestamp: item.timestamp,
                        downloadUrl: url,
                        size: (item.size / 1024).toFixed(0) + ' KB',
                        type: item.type
                    };
                });

                setHistory(historyItems);
            } catch (e) {
                console.error("Failed to load history from IDB", e);
            }
        }

        loadHistory();

        return () => {
            active = false;
            // Revoke all created URLs to avoid leaks
            objectUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const addToHistory = async (item: Omit<HistoryItem, 'timestamp' | 'id' | 'size'> & { blob?: Blob }) => {
        // We need the blob to persist it.
        // If passed explicitly, use it. If not, try to fetch from downloadUrl (if it is a blob url).
        let blobToStore = item.blob;

        if (!blobToStore && item.downloadUrl.startsWith('blob:')) {
            try {
                const r = await fetch(item.downloadUrl);
                blobToStore = await r.blob();
            } catch (e) {
                console.warn("Could not fetch blob from URL for persistence", e);
            }
        }

        if (!blobToStore) {
            // For remote URLs (cloud), we might not be able to store the file itself 
            // without CORS issues, or we might just store the link.
            // For MVP Phase 2 Offline First, we assume Local processing primarily.
            // If no blob, we skip persistence logic or store dummy?
            // Actually, the interface `fileDB.saveFile` expects `blob: Blob`.
            return;
        }

        const id = crypto.randomUUID();
        const savedItem = await fileDB.saveFile({
            id,
            jobId: item.jobId,
            fileName: item.fileName,
            toolId: item.toolId,
            blob: blobToStore,
            size: blobToStore.size,
            type: item.type
        });

        // Update state
        const newUrl = URL.createObjectURL(blobToStore);
        const newItem: HistoryItem = {
            id,
            jobId: savedItem.jobId,
            fileName: savedItem.fileName,
            toolId: savedItem.toolId,
            timestamp: savedItem.timestamp,
            downloadUrl: newUrl,
            size: (savedItem.size / 1024).toFixed(0) + ' KB',
            type: savedItem.type
        };

        setHistory(prev => [newItem, ...prev]);
    };

    const removeFromHistory = async (id: string) => {
        await fileDB.delete(id);
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const clearHistory = async () => {
        await fileDB.clear();
        setHistory([]);
    };

    return { history, addToHistory, removeFromHistory, clearHistory };
}
