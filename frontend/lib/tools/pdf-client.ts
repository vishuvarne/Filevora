// Imports removed for dynamic loading

export interface PDFProcessResponse {
    blob: Blob;
    filename: string;
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
}

export const validatePDFs = (files: File[]): boolean => {
    return files.every(f => f.type === 'application/pdf');
};

export const mergePDFsClient = async (files: File[]): Promise<PDFProcessResponse> => {
    if (files.length < 2) {
        throw new Error("At least 2 files are required for merging.");
    }

    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();
    let totalOriginalSize = 0;

    for (const file of files) {
        totalOriginalSize += file.size;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });

    return {
        blob,
        filename: `merged_${Date.now()}.pdf`,
        originalSize: totalOriginalSize,
        compressedSize: blob.size,
        reductionPercent: 0
    };
};

export const rotatePDFClient = async (file: File, angle: number): Promise<PDFProcessResponse> => {
    const { PDFDocument, degrees } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    pages.forEach((page) => {
        const rotation = page.getRotation();
        page.setRotation(degrees(rotation.angle + angle));
    });

    const pdfBytes = await pdf.save();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

    return {
        blob,
        filename: `rotated_${file.name}`,
        originalSize: file.size,
        compressedSize: blob.size,
        reductionPercent: 0
    };
};

export const splitPDFClient = async (file: File): Promise<PDFProcessResponse> => {
    const { PDFDocument } = await import('pdf-lib');
    const JSZip = (await import('jszip')).default;

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const pageCount = srcPdf.getPageCount();

    const zip = new JSZip();

    // Create a separate PDF for each page
    for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();

        // Add to zip
        // Pad page number with zeros for sorting, e.g. .001, .002
        const pageNum = (i + 1).toString().padStart(3, '0');
        const fileName = `${file.name.replace('.pdf', '')}_page_${pageNum}.pdf`;
        zip.file(fileName, pdfBytes);
    }

    const content = await zip.generateAsync({ type: "blob" });

    return {
        blob: content,
        filename: `${file.name.replace('.pdf', '')}_split.zip`,
        originalSize: file.size,
        compressedSize: content.size,
        reductionPercent: 0
    };
};
