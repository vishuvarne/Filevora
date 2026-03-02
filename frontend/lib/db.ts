import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FileVoraDB extends DBSchema {
    files: {
        key: string;
        value: {
            id: string;
            jobId: string;
            fileName: string;
            toolId: string;
            timestamp: number;
            blob: Blob;
            size: number;
            type: string;
        };
        indexes: { 'by-timestamp': number };
    };
}

const DB_NAME = 'filevora-db';
const DB_VERSION = 1;

// Lazy initialization to avoid SSR issues
let dbPromise: Promise<IDBPDatabase<FileVoraDB>> | null = null;

function getDB(): Promise<IDBPDatabase<FileVoraDB>> {
    // Only initialize on client-side
    if (typeof window === 'undefined') {
        throw new Error('IndexedDB is only available in the browser');
    }

    if (!dbPromise) {
        dbPromise = openDB<FileVoraDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('files', { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }

    return dbPromise;
}

export const fileDB = {
    async saveFile(metadata: Omit<FileVoraDB['files']['value'], 'timestamp'> & { blob: Blob }) {
        const db = await getDB();
        const item = {
            ...metadata,
            timestamp: Date.now(),
        };
        await db.put('files', item);
        return item;
    },

    async getAll() {
        const db = await getDB();
        return await db.getAllFromIndex('files', 'by-timestamp');
    },

    async delete(id: string) {
        const db = await getDB();
        await db.delete('files', id);
    },

    async clear() {
        const db = await getDB();
        await db.clear('files');
    },

    /**
     * Prune old files to save space
     * @param maxAgeMs default 1 hour
     */
    async prune(maxAgeMs = 60 * 60 * 1000) {
        const db = await getDB();
        const now = Date.now();
        const cutoff = now - maxAgeMs;

        // Iterate and delete old items
        const tx = db.transaction('files', 'readwrite');
        const index = tx.store.index('by-timestamp');
        let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));

        while (cursor) {
            cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
};

