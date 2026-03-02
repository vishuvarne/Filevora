import { PDFDocument } from 'pdf-lib';

/**
 * Worker specifically for Merging PDFs.
 * Contains only pdf-lib dependency, keeping bundle extremely small.
 * Implements chunked processing to prevent OOM (Out of Memory) crashes on massive documents.
 */
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, jobId } = e.data;

    if (type !== 'merge-pdf') {
        self.postMessage({ type: 'error', jobId, error: 'Unknown worker action' });
        return;
    }

    try {
        const filesData: ArrayBuffer[] = payload.files;
        let totalOriginalSize = 0;
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < filesData.length; i++) {
            // Memory Management: Yield back to the event loop between files
            await new Promise(resolve => setTimeout(resolve, 0));

            const percent = Math.round((i / filesData.length) * 100);
            self.postMessage({
                type: 'progress',
                jobId,
                percent,
                message: `Merging file ${i + 1} of ${filesData.length}...`
            });

            const fileData = filesData[i];
            totalOriginalSize += fileData.byteLength;

            const pdf = await PDFDocument.load(fileData, { ignoreEncryption: true });

            // Memory Management: Copy pages in chunks of 50
            const indices = pdf.getPageIndices();
            const chunkSize = 50;

            for (let j = 0; j < indices.length; j += chunkSize) {
                const chunk = indices.slice(j, Math.min(j + chunkSize, indices.length));
                const copiedPages = await mergedPdf.copyPages(pdf, chunk);
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                // Allow Garbage Collection in between heavy page copies
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        self.postMessage({
            type: 'progress',
            jobId,
            percent: 95,
            message: 'Finalizing merged document...'
        });

        // Fast structural save
        const mergedPdfBytes = await mergedPdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50
        });

        self.postMessage({
            type: 'success',
            jobId,
            result: {
                buffer: mergedPdfBytes.buffer.slice(mergedPdfBytes.byteOffset, mergedPdfBytes.byteLength + mergedPdfBytes.byteOffset),
                filename: `merged_${Date.now()}.pdf`,
                original_size: totalOriginalSize,
                compressed_size: mergedPdfBytes.byteLength,
                reduction_percent: 0
            }
        }, [mergedPdfBytes.buffer] as any);

    } catch (error: any) {
        console.error("MergeWorker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};
