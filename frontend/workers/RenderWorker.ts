// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import JSZip from 'jszip';

// Configure worker loader for pdf.js via external CDN to prevent bundle bloating
if (typeof self !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

/**
 * Worker for Progressive PDF Rendering (PDF to Image).
 * Keeps canvas memory strictly managed.
 */
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, jobId } = e.data;

    if (type !== 'pdf-to-image') {
        self.postMessage({ type: 'error', jobId, error: 'Unknown worker action' });
        return;
    }

    try {
        const fileData: ArrayBuffer = payload.file;
        const format = payload.format === 'png' ? 'png' : 'jpeg';
        const quality = payload.quality || 0.95;
        // The key to crisp PDF.js rendering is the scale factor. 
        // 2.0x is double resolution (High-DPI).
        const scale = payload.scale || 2.0;

        self.postMessage({ type: 'progress', jobId, percent: 10, message: 'Loading PDF for rendering...' });

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileData) });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        if (pageCount === 1) {
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale });
            const canvas = new OffscreenCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            if (!context) throw new Error('Failed to get 2D context');

            // White background for JPEG (PDFs are naturally transparent)
            if (format === 'jpeg') {
                context.fillStyle = 'white';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

            await page.render({ canvasContext: context, viewport }).promise;

            const blob = await canvas.convertToBlob({
                type: format === 'png' ? 'image/png' : 'image/jpeg',
                quality: format === 'png' ? undefined : quality
            });

            // Destroy canvas immediately
            canvas.width = 0; canvas.height = 0;
            page.cleanup(); // Memory Management

            const buffer = await blob.arrayBuffer();

            self.postMessage({
                type: 'success',
                jobId,
                result: {
                    buffer,
                    filename: `page_1.${format}`,
                    original_size: fileData.byteLength,
                    compressed_size: blob.size,
                    reduction_percent: 0
                }
            }, [buffer] as any);

        } else {
            // Multiple Pages
            const zip = new JSZip();
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale });
                const canvas = new OffscreenCanvas(viewport.width, viewport.height);
                const context = canvas.getContext('2d');
                if (!context) continue;

                if (format === 'jpeg') {
                    context.fillStyle = 'white';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }

                await page.render({ canvasContext: context, viewport }).promise;

                const blob = await canvas.convertToBlob({
                    type: format === 'png' ? 'image/png' : 'image/jpeg',
                    quality: format === 'png' ? undefined : quality
                });

                // Memory Management: Strictly destroy offscreen canvas immediately
                canvas.width = 0; canvas.height = 0;
                page.cleanup();

                const pageNumStr = i.toString().padStart(pageCount.toString().length, '0');
                zip.file(`page_${pageNumStr}.${format}`, blob);

                self.postMessage({
                    type: 'progress',
                    jobId,
                    percent: Math.round((i / pageCount) * 80) + 10,
                    message: `Rendering page ${i} of ${pageCount}...`
                });

                // Memory Management: Yield back to event loop to allow GC
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            self.postMessage({ type: 'progress', jobId, percent: 90, message: 'Zipping images...' });
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const buffer = await zipBlob.arrayBuffer();

            self.postMessage({
                type: 'success',
                jobId,
                result: {
                    buffer,
                    filename: `pdf_images_${Date.now()}.zip`,
                    original_size: fileData.byteLength,
                    compressed_size: zipBlob.size,
                    reduction_percent: 0
                }
            }, [buffer] as any);
        }

        await pdf.destroy(); // Memory Management

    } catch (error: any) {
        console.error("RenderWorker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};
