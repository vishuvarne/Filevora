
const DB_NAME = 'FilevoraTransferDB';
const STORE_NAME = 'transfers';

/**
 * Service to handle efficient file transfer between pages using IndexedDB.
 * This effectively prevents memory leaks and reduce RAM usage by offloading to browser storage.
 */
export const FileTransferService = {
    /**
     * Open (or create) the IndexedDB database
     */
    async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME); // Key is the toolId or unique token
                }
            };
        });
    },

    /**
     * Save a file for transfer to another tool
     * @param key Unique key (e.g. 'transfer-to-compress-pdf')
     * @param file The file object to store
     * @param metadata Optional metadata
     */
    async saveTransfer(key: string, file: File, metadata: any = {}): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // We store the file (Blob) directly. IDB handles this efficiently.
            const request = store.put({ file, metadata, timestamp: Date.now() }, key);

            request.onerror = () => {
                console.error("IDB Save Error:", request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                console.log(`IDB: Saved transfer ${key}`, file.name, file.size);
                resolve();
            };
        });
    },

    /**
     * Retrieve a file sent from another tool
     * @param key The unique key used to save it
     * @param cleanup Whether to delete it after reading (default: true)
     */
    async getTransfer(key: string, cleanup = true): Promise<{ file: File, metadata: any } | null> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite'); // readwrite if we clean up
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onerror = () => {
                console.error("IDB Get Error:", request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                const result = request.result;
                console.log(`IDB: Retrieved transfer ${key}`, result ? "Found" : "Not Found");
                if (result) {
                    if (cleanup) {
                        store.delete(key);
                    }
                    resolve(result);
                } else {
                    resolve(null);
                }
            };
        });
    },

    /**
     * Clean up old transfers to free up space
     */
    async cleanupOld(maxAgeMatches = 1000 * 60 * 60): Promise<void> { // 1 hour default
        const db = await this.openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
                const value = cursor.value;
                if (Date.now() - value.timestamp > maxAgeMatches) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    }
};
