import { PDFDocument } from 'pdf-lib';
import { getWorkerPool, WorkerPool } from './worker-pool';

export interface PageExtractionResult {
    pageNumber: number;
    textBlocks: string[]; // Simplification for now
    hasImages: boolean;
}

export class PdfDocumentController {
    private file: File;
    private arrayBuffer: ArrayBuffer | null = null;
    private pageCount: number = 0;
    private workerPool: WorkerPool;
    private isFastMode: boolean = false;
    private activeWorkerLimit: number | undefined;

    constructor(file: File) {
        this.file = file;
        this.workerPool = getWorkerPool();
    }

    private metadata: any = {};

    public async load(): Promise<void> {
        console.log('[PdfDocumentController] Loading file...');
        this.arrayBuffer = await this.file.arrayBuffer();

        // Fast metadata load using pdf-lib (main thread)
        try {
            const pdfDoc = await PDFDocument.load(this.arrayBuffer, {
                ignoreEncryption: true,
                updateMetadata: false
            });
            this.pageCount = pdfDoc.getPageCount();

            // Extract Metadata
            this.metadata = {
                info: {
                    Title: pdfDoc.getTitle(),
                    Author: pdfDoc.getAuthor(),
                    Subject: pdfDoc.getSubject(),
                    Keywords: pdfDoc.getKeywords(),
                    Creator: pdfDoc.getCreator(),
                    Producer: pdfDoc.getProducer(),
                    CreationDate: pdfDoc.getCreationDate(),
                    ModificationDate: pdfDoc.getModificationDate()
                }
            };

            console.log(`[PdfDocumentController] Loaded. Pages: ${this.pageCount}`);

            // Run Preflight Scan (Ticket 4.1) will be done after distribution

        } catch (e) {
            console.error('[PdfDocumentController] Failed to load PDF metadata:', e);
            throw e;
        }
    }

    public async getMetadata(): Promise<any> {
        return this.metadata;
    }


    public async determineMode(): Promise<void> {
        // New method to be called after distributeToWorkers
        const totalPages = this.pageCount;
        const samples = [1, 5, 10].filter(p => p <= totalPages);

        if (samples.length === 0) return;

        try {
            const results = await Promise.all(samples.map(pageNumber =>
                this.workerPool.execute('analyze-page', { pageNumber }, [], undefined, undefined, undefined, true, this.getActiveWorkerIndices())
            ));

            let isSimple = true;
            for (const res of results) {
                if (res.error) continue;
                // Thresholds for "Simple"
                // > 100 chars of text
                // < 2 images
                // < 100 vector paths
                if (res.textLength < 50 || res.imageCount > 2 || res.vectorPathCount > 200) {
                    isSimple = false;
                    break;
                }
            }

            this.isFastMode = isSimple;
            console.log(`[PdfDocumentController] Mode determination: ${this.isFastMode ? 'FAST' : 'ACCURATE'}`, results);

        } catch (e) {
            console.warn('[PdfDocumentController] Mode determination failed:', e);
            this.isFastMode = false;
        }
    }

    public async distributeToWorkers(): Promise<void> {
        if (!this.arrayBuffer) throw new Error("Document not loaded");

        console.log('[PdfDocumentController] Broadcasting PDF to workers...');
        // Send the PDF data to all workers so they can cache it.
        // On low-end devices, we might want to reconsider sending 100MB to 4 workers.
        // The WorkerPool handles the actual posting.

        // Optimization: clone buffer? postMessage transfers if we use transferables.
        // But we need to send to N workers. We can't transfer the *same* buffer N times.
        // We must copy it. 
        // 100MB PDF -> 400MB RAM.
        // The user accepted this trade-off for desktop.

        // 100MB PDF -> 400MB RAM.
        // The user accepted this trade-off for desktop.

        const sizeParams = this.arrayBuffer.byteLength;
        const isHuge = sizeParams > 100 * 1024 * 1024; // > 100MB

        let workerLimit = undefined; // All
        let delay = 50;

        if (isHuge) {
            // CHECK FOR SHARED MEMORY SUPPORT
            if (typeof window.crossOriginIsolated !== 'undefined' && window.crossOriginIsolated) {
                console.log('[PdfDocumentController] Cross-Origin Isolated. Using SharedArrayBuffer for Zero-Copy!');

                // Create SharedArrayBuffer and copy data once
                const sharedBuffer = new SharedArrayBuffer(sizeParams);
                const sharedView = new Uint8Array(sharedBuffer);
                sharedView.set(new Uint8Array(this.arrayBuffer));

                // Broadcast the SHARED buffer. 
                // It will NOT be copied. It will be shared.
                await this.workerPool.broadcastSequential(
                    'load-document',
                    { data: sharedBuffer },
                    50, // Minimal delay
                    undefined // NO WORKER LIMIT! Use all 4!
                );

                // We don't limit active workers because memory usage is flat (200MB shared).
                this.activeWorkerLimit = undefined;
                console.log('[PdfDocumentController] PDF distributed via Shared Memory (All Workers).');
                return;
            }

            console.warn(`[PdfDocumentController] Large file detected (${(sizeParams / 1024 / 1024).toFixed(0)}MB). Limiting to 2 workers.`);
            // Low Memory Mode: Only use 2 workers to prevent OOM
            workerLimit = 2;
            delay = 300; // Slower distribution to keep UI responsive
        }

        await this.workerPool.broadcastSequential(
            'load-document',
            { data: this.arrayBuffer },
            delay,
            workerLimit
        );

        this.activeWorkerLimit = workerLimit;

        console.log('[PdfDocumentController] PDF distributed.');
    }

    public getPageCount(): number {
        return this.pageCount;
    }

    public getIsFastMode(): boolean {
        return this.isFastMode;
    }

    public getActiveWorkerIndices(): number[] | undefined {
        if (!this.activeWorkerLimit) return undefined; // All
        // Create array [0, 1, ... limit-1]
        return Array.from({ length: this.activeWorkerLimit }, (_, i) => i);
    }

    public destroy() {
        this.arrayBuffer = null;
        // Tell workers to free the cached doc
        this.workerPool.broadcast('close-document', {});
    }
}
