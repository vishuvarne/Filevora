import { PdfDocumentController } from './pdf-document-controller';
import { OutputBuilder } from './output-builder-interface';
import { getWorkerPool } from './worker-pool';

export interface SchedulerOptions {
    onProgress?: (percent: number, message: string) => void;
    onError?: (error: Error) => void;
    onComplete?: (result: Blob) => void;
}

export class ConversionScheduler {
    private controller: PdfDocumentController;
    private builder: OutputBuilder;
    private options: SchedulerOptions;
    private isRunning = false;
    private isPaused = false;
    private abortController: AbortController | null = null;
    private resumePromise: Promise<void> | null = null;
    private resumeResolver: (() => void) | null = null;

    // Backpressure settings
    private readonly MAX_IN_FLIGHT = 8; // Workers * 2 typically
    private inFlightCount = 0;
    private currentPage = 1;
    private totalPages = 0;

    // TOC linking: Map of chapter text keywords to their bookmark IDs
    private chapterIds: Map<string, string> = new Map();

    constructor(
        file: File,
        builder: OutputBuilder,
        options: SchedulerOptions
    ) {
        this.controller = new PdfDocumentController(file);
        this.builder = builder;
        this.options = options;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.abortController = new AbortController();

        try {
            await this.builder.initialize();

            this.options.onProgress?.(1, "Loading PDF metadata...");
            await this.controller.load();
            this.totalPages = this.controller.getPageCount();

            // Extract Metadata
            const metadata = await this.controller.getMetadata();
            if (this.builder && 'setMetadata' in this.builder) {
                // @ts-ignore - Check for method existence at runtime
                this.builder.setMetadata({
                    title: metadata.info?.Title || "Converted Document",
                    author: metadata.info?.Author || "Filevora User"
                });
            }

            this.options.onProgress?.(5, "Distributing to workers...");
            await this.controller.distributeToWorkers(); // Broadcast loaded PDF

            this.options.onProgress?.(8, "Optimizing conversion path...");
            await this.controller.determineMode();

            // Start the loop
            this.scheduleNextBatch();

        } catch (error) {
            this.handleError(error as Error);
        }
    }

    public pause() {
        if (!this.isRunning || this.isPaused) return;
        console.log("[ConversionScheduler] Pausing...");
        this.isPaused = true;
        this.resumePromise = new Promise((resolve) => {
            this.resumeResolver = resolve;
        });
    }

    public resume() {
        if (!this.isRunning || !this.isPaused) return;
        console.log("[ConversionScheduler] Resuming...");
        this.isPaused = false;
        if (this.resumeResolver) {
            this.resumeResolver();
            this.resumeResolver = null;
            this.resumePromise = null;
        }
        this.scheduleNextBatch();
    }

    private async scheduleNextBatch() {
        if (!this.isRunning || this.abortController?.signal.aborted) return;

        // If paused, wait for resume
        if (this.isPaused && this.resumePromise) {
            await this.resumePromise;
            if (!this.isRunning) return;
        }

        // Check completion condition
        if (this.currentPage > this.totalPages && this.inFlightCount === 0) {
            this.finalize();
            return;
        }

        // Backpressure check
        const workerCount = getWorkerPool().getWorkerCount(); // e.g. 4
        const maxConcurrency = workerCount * 2; // Keep queue full but not overflowing

        while (
            this.currentPage <= this.totalPages &&
            this.inFlightCount < maxConcurrency &&
            !this.isPaused
        ) {
            this.dispatchPage(this.currentPage);
            this.currentPage++;
        }
    }

    private async dispatchPage(pageNumber: number, retryCount = 0) {
        this.inFlightCount++;
        const workerPool = getWorkerPool();

        try {
            // Task Type: 'extract-page'
            // We pass pageNumber.
            // FIX: Pass allowedIndices if we are in Low Memory Mode
            const allowedIndices = this.controller.getActiveWorkerIndices();

            const result = await workerPool.execute(
                'extract-page',
                { pageNumber, mode: this.controller.getIsFastMode() ? 'fast' : 'accurate' },
                [], // transferables
                undefined, // capabilities
                undefined, // progress
                undefined, // chunk
                true, // priority
                allowedIndices // Allowed indices
            );

            await this.handlePageComplete(pageNumber, result);

        } catch (error) {
            console.error(`Page ${pageNumber} failed (Attempt ${retryCount + 1}):`, error);

            if (retryCount < 2) {
                // Retry with exponential backoff
                const delay = 1000 * Math.pow(2, retryCount);
                console.log(`Retrying page ${pageNumber} in ${delay}ms...`);

                // Release the slot now, re-acquire later
                // We use setTimeout to decouple
                setTimeout(() => {
                    this.dispatchPage(pageNumber, retryCount + 1);
                }, delay);

                // Return to trigger finally block (which handles inFlightCount-- and scheduleNextBatch)
                return;
            } else {
                // Permanent failure - insert placeholder
                try {
                    await this.handlePageComplete(pageNumber, {
                        pageNumber,
                        textBlocks: [" [Conversion Failed for Page " + pageNumber + "] "],
                        hasImages: false
                    });
                } catch (e) {
                    // If even handling placeholder fails, we are in trouble.
                    this.handleError(e as Error);
                }
            }
        } finally {
            // This finally block will only execute if the page was successfully processed
            // or if it permanently failed (after retries).
            // If a retry was scheduled, the `return` statement above would have prevented this.
            this.inFlightCount--;
            this.scheduleNextBatch();
        }
    }

    // Buffer for reordering
    private pendingPages: Map<number, any> = new Map();
    private nextExpectedPageForBuilder = 1;

    private async handlePageComplete(pageNumber: number, result: any) {
        this.pendingPages.set(pageNumber, result);

        // Try to flush consecutive pages
        while (this.pendingPages.has(this.nextExpectedPageForBuilder)) {
            const pageData = this.pendingPages.get(this.nextExpectedPageForBuilder);
            this.pendingPages.delete(this.nextExpectedPageForBuilder);

            // Collect chapter IDs and link TOC entries
            if (pageData.blocks && Array.isArray(pageData.blocks)) {
                for (const block of pageData.blocks) {
                    // Collect chapter IDs for bookmark linking
                    if (block.id) {
                        // Extract keywords for TOC matching (e.g., "CHAPTER ONE" -> "chapter_one")
                        const keywords = block.text.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                        this.chapterIds.set(keywords, block.id);
                        // Also store chapter number variations
                        const match = block.text.match(/CHAPTER\s+(\w+)/i);
                        if (match) {
                            this.chapterIds.set(`chapter_${match[1].toLowerCase()}`, block.id);
                        }
                    }
                    // Link TOC entries to their chapter bookmarks
                    // Generate linkToId directly from TOC text (same format as chapter bookmarks)
                    if (block.isTocEntry && !block.linkToId) {
                        // Extract "CHAPTER X" pattern from TOC entry
                        const chapterMatch = block.text.match(/CHAPTER\s+(\w+)/i);
                        if (chapterMatch) {
                            // Generate ID using same format as PDF worker's generateSafeId
                            const cleanText = `CHAPTER ${chapterMatch[1]}`.toUpperCase();
                            block.linkToId = cleanText.toLowerCase()
                                .replace(/[^a-z0-9]+/g, '_')
                                .replace(/^_+|_+$/g, '')
                                .substring(0, 40);
                        }
                    }
                }
            }

            // Push to builder
            await this.builder.addPage({
                ...pageData,
                isLastPage: this.nextExpectedPageForBuilder === this.totalPages
            });
            this.processedPageCount++;

            // Track text length and debug
            if (pageData.textBlocks && Array.isArray(pageData.textBlocks)) {
                // Use trimmed length for accuracy
                const pageTextLength = pageData.textBlocks.reduce((acc: number, str: string) => acc + str.trim().length, 0);
                this.totalTextLength += pageTextLength;

                // DEBUG: Log detailed state
                const hasImage = !!pageData.pageImage;
                if (hasImage) this.totalImages++;
                // console.log(`[ConversionScheduler] Page ${pageNumber}: TextLen=${pageTextLength}, HasImage=${hasImage}`);

                if (pageTextLength > 0) {
                    const snippet = pageData.textBlocks.slice(0, 3).join(' ').substring(0, 100);
                    // console.log(`[ConversionScheduler] Text Snippet: "${snippet}..."`);
                }

                if (pageTextLength === 0 && !hasImage) {
                    console.warn(`[ConversionScheduler] WARNING: Page ${pageNumber} failed to render image and has no text.`);
                    if (pageData.renderError) {
                        console.error(`[ConversionScheduler] RENDER ERROR DETAIL: ${pageData.renderError}`);
                    }
                }
            } else {
                console.warn(`[ConversionScheduler] Page ${pageNumber} missing textBlocks array.`);
            }

            // Update progress
            const percent = 10 + Math.round((this.nextExpectedPageForBuilder / this.totalPages) * 80);
            this.options.onProgress?.(percent, `Processed page ${this.nextExpectedPageForBuilder}/${this.totalPages}`);

            this.nextExpectedPageForBuilder++;
        }
    }

    private processedPageCount = 0;
    private totalTextLength = 0;
    private totalImages = 0;

    private async finalize() {
        this.options.onProgress?.(95, "Finalizing document...");
        try {
            if (this.processedPageCount === 0) {
                throw new Error("Conversion failed: No pages were successfully processed.");
            }

            // If we have text OR we processed pages (which might be images now), we assume success.
            // Only fail if literally nothing happened.
            if (this.processedPageCount === 0) {
                throw new Error("Conversion failed: No pages were successfully processed.");
            }

            // Relaxed check: Only warn if text is low, don't fail, because we might have images now.
            // Relaxed check: Only warn if text is low AND no images were found.
            if (this.totalTextLength < 50 && this.totalImages === 0) {
                console.warn("[ConversionScheduler] Low text content detected. Scanned PDF fallback should have handled this.");
            }

            const blob = await this.builder.finalize();
            this.controller.destroy();
            this.options.onComplete?.(blob);
            this.isRunning = false;
        } catch (e) {
            this.handleError(e as Error);
        }
    }

    private handleError(error: Error) {
        this.isRunning = false;
        this.controller.destroy();
        this.options.onError?.(error);
    }

    public cancel() {
        this.isRunning = false;
        if (this.abortController) {
            this.abortController.abort();
        }
        this.controller.destroy();
    }
}
