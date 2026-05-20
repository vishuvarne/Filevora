/**
 * MuPDF WASM-based PDF Merge Worker.
 *
 * Loads MuPDF directly from /wasm/mupdf/ via URL import, BYPASSING
 * the bundler entirely. This ensures:
 *   1. import.meta.url inside mupdf-wasm.js resolves correctly
 *   2. The .wasm file is found at /wasm/mupdf/mupdf-wasm.wasm
 *   3. No Turbopack/webpack URL transformation issues
 */

let mupdfModule: any = null;

async function getMupdf() {
    if (!mupdfModule) {
        // Load mupdf.js directly from the public directory via URL.
        // This bypasses the bundler — the browser's native ES module loader
        // resolves ./mupdf-wasm.js relative to /wasm/mupdf/mupdf.js,
        // and mupdf-wasm.js resolves mupdf-wasm.wasm via import.meta.url
        // which correctly points to /wasm/mupdf/mupdf-wasm.wasm.
        const url = '/wasm/mupdf/mupdf.js';
        mupdfModule = await import(/* webpackIgnore: true */ url);
    }
    return mupdfModule;
}

self.onmessage = async (e: MessageEvent) => {
    const { type, payload, jobId } = e.data;

    if (type !== 'merge-pdf') {
        self.postMessage({ type: 'error', jobId, error: 'Unknown worker action' });
        return;
    }

    try {
        // Load MuPDF WASM engine
        self.postMessage({
            type: 'progress',
            jobId,
            percent: 5,
            message: 'Loading PDF engine...'
        });

        const mupdf = await getMupdf();

        const filesData: any[] = payload.files;
        let totalOriginalSize = 0;

        // Create a blank target PDF document
        const outputDoc = new mupdf.PDFDocument();

        let totalPagesGrafted = 0;

        for (let i = 0; i < filesData.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 0));

            const percent = 10 + Math.round((i / filesData.length) * 80);
            self.postMessage({
                type: 'progress',
                jobId,
                percent,
                message: `Merging file ${i + 1} of ${filesData.length}...`
            });

            const rawFileData = filesData[i];
            let fileBytes: ArrayBuffer;
            if (rawFileData instanceof File || rawFileData instanceof Blob) {
                fileBytes = await rawFileData.arrayBuffer();
            } else {
                fileBytes = rawFileData;
            }
            totalOriginalSize += fileBytes.byteLength;

            // Open source PDF with MuPDF — handles ALL PDF types natively at the C level
            const srcDoc = new mupdf.PDFDocument(new Uint8Array(fileBytes));
            const pageCount = srcDoc.countPages();

            // graftPage copies pages at the native WASM/C level —
            // raw PDF objects and streams are transplanted without
            // any JavaScript-side decompression or re-encoding
            for (let p = 0; p < pageCount; p++) {
                outputDoc.graftPage(totalPagesGrafted, srcDoc, p);
                totalPagesGrafted++;

                // Yield every 20 pages for responsiveness
                if (p % 20 === 19) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Clean up source document to free WASM memory
            srcDoc.destroy();
        }

        self.postMessage({
            type: 'progress',
            jobId,
            percent: 95,
            message: 'Finalizing merged document...'
        });

        // Save to buffer — MuPDF produces standards-compliant output
        // "compress" option enables stream compression for smaller output
        const outputBuffer = outputDoc.saveToBuffer("compress");
        const outputBytes = outputBuffer.asUint8Array();

        // Copy to a transferable ArrayBuffer (asUint8Array returns a view into WASM heap)
        const resultBuffer = new ArrayBuffer(outputBytes.byteLength);
        new Uint8Array(resultBuffer).set(outputBytes);

        // Clean up MuPDF objects
        outputBuffer.destroy();
        outputDoc.destroy();

        self.postMessage({
            type: 'success',
            jobId,
            result: {
                buffer: resultBuffer,
                filename: `merged_${Date.now()}.pdf`,
                original_size: totalOriginalSize,
                compressed_size: resultBuffer.byteLength,
                reduction_percent: 0
            }
        }, [resultBuffer] as any);

    } catch (error: any) {
        console.error("MergeWorker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};
