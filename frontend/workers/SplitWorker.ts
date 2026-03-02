import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

/**
 * Worker specifically for Splitting PDFs.
 * Uses pdf-lib for lossless slicing without rasterization.
 */
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, jobId } = e.data;

    if (type !== 'split-pdf') {
        self.postMessage({ type: 'error', jobId, error: 'Unknown worker action' });
        return;
    }

    try {
        const fileData: ArrayBuffer = payload.file;
        const { mode, customRanges, mergeAll, sizeLimit, sizeUnit } = payload;

        self.postMessage({ type: 'progress', jobId, percent: 10, message: 'Loading PDF...' });
        const pdf = await PDFDocument.load(fileData, { ignoreEncryption: true });
        const pageCount = pdf.getPageCount();

        // Helper to safely parse strings like "1-3" or "5"
        const parseRange = (r: any) => {
            let from = parseInt(r.from);
            let to = parseInt(r.to);
            if (isNaN(from) || from < 1) from = 1;
            if (isNaN(to) || to > pageCount) to = pageCount;
            if (from > to) { const temp = from; from = to; to = temp; }
            return { from, to };
        };

        const createPdfFromIndices = async (indices: number[]) => {
            const newPdf = await PDFDocument.create();
            if (indices.length > 0) {
                // Chunk to prevent OOM
                const chunkSize = 50;
                for (let j = 0; j < indices.length; j += chunkSize) {
                    const chunk = indices.slice(j, Math.min(j + chunkSize, indices.length));
                    const copiedPages = await newPdf.copyPages(pdf, chunk);
                    copiedPages.forEach(p => newPdf.addPage(p));
                    await new Promise(resolve => setTimeout(resolve, 0)); // Yield
                }
            }
            return newPdf;
        };

        let resultBuffer: ArrayBuffer;
        let resultExt = 'zip';

        if (mode === 'range') {
            let rangesToExtract = customRanges && customRanges.length > 0 ? customRanges.map(parseRange) : [{ from: 1, to: pageCount }];

            if (mergeAll) {
                const newPdf = await PDFDocument.create();
                for (const range of rangesToExtract) {
                    const indices = [];
                    for (let i = range.from - 1; i <= range.to - 1; i++) indices.push(i);
                    const copiedPages = await newPdf.copyPages(pdf, indices);
                    copiedPages.forEach(p => newPdf.addPage(p));
                    await new Promise(resolve => setTimeout(resolve, 0)); // Yield
                }
                const pdfBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
                resultBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteLength + pdfBytes.byteOffset) as ArrayBuffer;
                resultExt = 'pdf';
            } else {
                const zip = new JSZip();
                for (let idx = 0; idx < rangesToExtract.length; idx++) {
                    const range = rangesToExtract[idx];
                    const indices = [];
                    for (let i = range.from - 1; i <= range.to - 1; i++) indices.push(i);
                    if (indices.length > 0) {
                        const newPdf = await createPdfFromIndices(indices);
                        const pdfBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
                        const fileName = range.from === range.to ? `page_${range.from}.pdf` : `pages_${range.from}-${range.to}.pdf`;
                        zip.file(fileName, pdfBytes);
                    }
                    self.postMessage({ type: 'progress', jobId, percent: Math.round(((idx + 1) / rangesToExtract.length) * 80) + 10, message: `Processing range ${idx + 1}...` });
                }
                self.postMessage({ type: 'progress', jobId, percent: 90, message: 'Zipping files...' });
                const blob = await zip.generateAsync({ type: 'blob' });
                resultBuffer = await blob.arrayBuffer();
            }
        } else if (mode === 'pages') {
            // ... (Pages logic is extremely similar to ranges, simplified for brevity here)
            // For production, the full logic handles individual pages.
            const zip = new JSZip();
            for (let i = 0; i < pageCount; i++) {
                const newPdf = await createPdfFromIndices([i]);
                const pdfBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
                zip.file(`page_${i + 1}.pdf`, pdfBytes);
                if (i % 10 === 0) {
                    self.postMessage({ type: 'progress', jobId, percent: Math.round((i / pageCount) * 80) + 10, message: `Extracting page ${i + 1}...` });
                    await new Promise(resolve => setTimeout(resolve, 0)); // Yield
                }
            }
            self.postMessage({ type: 'progress', jobId, percent: 90, message: 'Zipping files...' });
            const blob = await zip.generateAsync({ type: 'blob' });
            resultBuffer = await blob.arrayBuffer();
        } else {
            throw new Error('Unsupported split mode in SplitWorker');
        }

        self.postMessage({
            type: 'success',
            jobId,
            result: {
                buffer: resultBuffer,
                filename: `split_${Date.now()}.${resultExt}`,
                original_size: fileData.byteLength,
                compressed_size: resultBuffer.byteLength,
                reduction_percent: 0
            }
        }, [resultBuffer] as any);

    } catch (error: any) {
        console.error("SplitWorker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};
