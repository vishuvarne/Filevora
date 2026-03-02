/* eslint-disable no-restricted-globals */

// Polyfill for PDF.js compatibility in Web Worker
// PDF.js checks for 'document' during initialization but doesn't actually use DOM in worker context
if (typeof document === 'undefined') {
    self.document = {
        currentScript: null,
        createElement: function () {
            return {
                getContext: function () { return null; }
            };
        },
        createElementNS: function () {
            return {
                getContext: function () { return null; }
            };
        },
        documentElement: {
            style: {}
        },
        head: {
            appendChild: function () { }
        }
    };
}

let PDFDocument, JSZip;

try {
    // Import libraries with CDN fallback
    try {
        importScripts('/workers/libs/pdf-lib.min.js');
    } catch (e) {
        console.warn('Failed to load local pdf-lib, trying CDN...');
        importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
    }

    try {
        importScripts('/workers/libs/jszip.min.js');
    } catch (e) {
        console.warn('Failed to load local jszip, trying CDN...');
        importScripts('https://unpkg.com/jszip@3.10.1/dist/jszip.min.js');
    }

    const globalScope = self || window || globalThis;

    if (globalScope.PDFLib) {
        PDFDocument = globalScope.PDFLib.PDFDocument;
    } else {
        throw new Error('PDFLib not found in global scope');
    }

    JSZip = globalScope.JSZip;
    if (!JSZip) {
        throw new Error('JSZip not found in global scope');
    }

} catch (e) {
    console.error('[Worker] Image Worker Init Error:', e);
    self.initError = e;
}

// ============================================================================
// DEVICE DETECTION (cached per worker session)
// ============================================================================
let cachedDeviceClass = null;

function detectDeviceClass() {
    if (cachedDeviceClass) return cachedDeviceClass;

    // 1. Mobile Safari / iOS Detection (User Agent check in Worker)
    // Note: navigator.maxTouchPoints might not be available in Worker context in all browsers,
    // but userAgent is generally available.
    const isIOS = typeof navigator !== 'undefined' &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent));

    // 2. Constrained Runtime Check
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Get device memory in GB (if available)
    const memory = typeof navigator !== 'undefined' && navigator.deviceMemory
        ? navigator.deviceMemory
        : undefined;

    // Get hardware concurrency (CPU cores)
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : undefined;

    if (isIOS) {
        cachedDeviceClass = { isLowEnd: true };
        return cachedDeviceClass;
    }

    // Conservative fallback: treat unknown devices as low-end for stability
    if (memory === undefined && cores === undefined) {
        if (isMobile) {
            cachedDeviceClass = { isLowEnd: true };
            return cachedDeviceClass;
        }
        // Desktop unknown -> assume low-end for safety per PRD
        cachedDeviceClass = { isLowEnd: true };
        return cachedDeviceClass;
    }

    // Low-end criteria: deviceMemory ≤ 4 GB OR hardwareConcurrency ≤ 4
    const isLowEndMemory = memory !== undefined && memory <= 4;
    const isLowEndCores = cores !== undefined && cores <= 4;
    const isLowEnd = isLowEndMemory || isLowEndCores;

    cachedDeviceClass = { isLowEnd, memory, cores };
    console.log('[Device Detector]', {
        deviceClass: isLowEnd ? 'low-end' : 'high-end',
        memory: memory ? `${memory} GB` : 'unknown',
        cores: cores || 'unknown'
    });

    return cachedDeviceClass;
}

// ============================================================================
// UNIVERSAL STAGE-0 NORMALIZER (IMAGE)
// ============================================================================
const MAX_DIMENSION_LOW_END = 4096;
const COMPRESSION_QUALITY_STAGE0 = 0.92;

async function normalizeImage(fileBuffer) {
    // 1. Check Device Class
    const deviceInfo = detectDeviceClass();
    if (!deviceInfo.isLowEnd) {
        return fileBuffer; // High-end devices skip normalization
    }

    // Quick check: If file size is small (< 5MB), assume dimensions are likely safe enough
    if (fileBuffer.byteLength < 5 * 1024 * 1024) {
        return fileBuffer;
    }

    console.log('[Stage-0] Checking Image for low-end device...');
    const startTime = performance.now();

    try {
        const blob = new Blob([fileBuffer]);
        const bitmap = await createImageBitmap(blob);
        const { width, height } = bitmap;

        // If dimensions are within safe limits, return original
        if (width <= MAX_DIMENSION_LOW_END && height <= MAX_DIMENSION_LOW_END) {
            bitmap.close();
            return fileBuffer;
        }

        console.log(`[Stage-0] Resizing oversized image (${width}x${height}) for stability...`);

        // Calculate new dimensions
        let newWidth = width;
        let newHeight = height;

        if (width > MAX_DIMENSION_LOW_END || height > MAX_DIMENSION_LOW_END) {
            const ratio = width / height;
            if (width > height) {
                newWidth = MAX_DIMENSION_LOW_END;
                newHeight = Math.round(MAX_DIMENSION_LOW_END / ratio);
            } else {
                newHeight = MAX_DIMENSION_LOW_END;
                newWidth = Math.round(MAX_DIMENSION_LOW_END * ratio);
            }
        }

        const canvas = new OffscreenCanvas(newWidth, newHeight);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
        bitmap.close();

        // Convert back to ArrayBuffer -> always JPEG for safety/speed in Stage-0 normalization if resized
        const normalizedBlob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: COMPRESSION_QUALITY_STAGE0
        });

        const normalizedBuffer = await normalizedBlob.arrayBuffer();
        const duration = performance.now() - startTime;
        console.log(`[Stage-0] Image normalized in ${duration.toFixed(0)}ms to ${newWidth}x${newHeight}`);

        return normalizedBuffer;

    } catch (error) {
        console.warn('[Stage-0] Image normalization failed, using original:', error);
        return fileBuffer;
    }
}

// ============================================================================
// PDF IMAGE OPTIMIZER — Downscale + JPEG encode before embedding
// A4 at 150 DPI = ~1240×1754px. We use 2480px as max to preserve quality.
// ============================================================================
const MAX_PDF_IMAGE_DIMENSION = 1200; // Reduced from 2480 to significantly lower output PDF size (approx 500KB vs 1.8MB)
const PDF_JPEG_QUALITY = 0.70;

async function prepareImageForPdf(fileBuffer) {
    try {
        const blob = new Blob([fileBuffer]);
        const bitmap = await createImageBitmap(blob);
        const { width, height } = bitmap;

        // Calculate target dimensions
        let targetWidth = width;
        let targetHeight = height;

        if (width > MAX_PDF_IMAGE_DIMENSION || height > MAX_PDF_IMAGE_DIMENSION) {
            const ratio = width / height;
            if (width > height) {
                targetWidth = MAX_PDF_IMAGE_DIMENSION;
                targetHeight = Math.round(MAX_PDF_IMAGE_DIMENSION / ratio);
            } else {
                targetHeight = MAX_PDF_IMAGE_DIMENSION;
                targetWidth = Math.round(MAX_PDF_IMAGE_DIMENSION * ratio);
            }
            console.log(`[PDF Optimize] Downscaling ${width}x${height} → ${targetWidth}x${targetHeight}`);
        }

        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');

        // White background (handles PNG transparency)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
        bitmap.close();

        const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: PDF_JPEG_QUALITY });
        return await jpegBlob.arrayBuffer();
    } catch (err) {
        console.warn('[PDF Optimize] Image preparation failed, using original:', err);
        return fileBuffer;
    }
}

self.onmessage = async (e) => {
    const { type, payload, jobId } = e.data;

    // ... (rest of the handler)
    if (self.initError) {
        self.postMessage({ type: 'error', jobId, error: `Worker Initialization Failed: ${self.initError.message}` });
        return;
    }

    try {
        let result;

        switch (type) {
            case 'image-to-pdf':
                result = await imagesToPDF(payload.files, payload.options);
                break;
            case 'convert-image':
                result = await convertImages(payload.files, payload.targetFormat, payload.quality, jobId);
                break;
            case 'rotate-image':
                result = await rotateImage(payload.file, payload.angle, payload.quality);
                break;
            default:
                throw new Error(`Unknown worker action: ${type}`);
        }

        const transferables = [];
        if (result && result.buffer) {
            if (result.buffer instanceof ArrayBuffer) {
                transferables.push(result.buffer);
            } else if (ArrayBuffer.isView(result.buffer)) {
                transferables.push(result.buffer.buffer);
            }
        }

        self.postMessage({ type: 'success', jobId, result }, transferables);
    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};

// Page size definitions in PDF points (1pt = 1/72 inch)
const PAGE_SIZES = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
};

const MARGIN_VALUES = {
    none: 0,
    small: 20,
    big: 60,
};

async function imagesToPDF(filesData, options = {}) {
    const orientation = options.orientation || 'portrait';
    const pageSizeKey = options.pageSize || 'a4';
    const marginKey = options.margin || 'none';
    const margin = MARGIN_VALUES[marginKey] ?? 0;
    const mergeAll = options.mergeAll !== false;

    if (!mergeAll && filesData.length > 1) {
        // Separate PDFs mode — one PDF per image, zipped together
        const zip = new JSZip();
        for (let idx = 0; idx < filesData.length; idx++) {
            let fileData = filesData[idx];
            if (fileData.arrayBuffer && typeof fileData.arrayBuffer === 'function') {
                fileData = await fileData.arrayBuffer();
            }
            fileData = await normalizeImage(fileData);
            fileData = await prepareImageForPdf(fileData);

            const singleDoc = await PDFDocument.create();
            let image;
            try {
                image = await singleDoc.embedJpg(fileData);
            } catch (e) {
                try { image = await singleDoc.embedPng(fileData); } catch (e2) { continue; }
            }

            let pageWidth, pageHeight;
            if (pageSizeKey === 'fit') {
                pageWidth = image.width + (margin * 2);
                pageHeight = image.height + (margin * 2);
                if (orientation === 'landscape' && pageHeight > pageWidth) {
                    [pageWidth, pageHeight] = [pageHeight, pageWidth];
                }
            } else {
                const size = PAGE_SIZES[pageSizeKey] || PAGE_SIZES.a4;
                if (orientation === 'landscape') {
                    pageWidth = size.height; pageHeight = size.width;
                } else {
                    pageWidth = size.width; pageHeight = size.height;
                }
            }

            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);
            const scale = Math.min(availableWidth / image.width, availableHeight / image.height, 1.0);
            const drawWidth = image.width * scale;
            const drawHeight = image.height * scale;
            const x = (pageWidth - drawWidth) / 2;
            const y = (pageHeight - drawHeight) / 2;

            const page = singleDoc.addPage([pageWidth, pageHeight]);
            page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });

            const pdfBytes = await singleDoc.save();
            zip.file(`image_${idx + 1}.pdf`, pdfBytes);
        }

        const zipBytes = await zip.generateAsync({ type: 'arraybuffer' });
        return {
            buffer: zipBytes,
            filename: `converted_${Date.now()}.zip`,
            original_size: filesData.reduce((acc, f) => acc + (f.byteLength || 0), 0),
            compressed_size: zipBytes.byteLength,
            reduction_percent: 0
        };
    }

    // Merged mode (default) — all images in one PDF
    const pdfDoc = await PDFDocument.create();

    for (let fileData of filesData) {
        if (fileData.arrayBuffer && typeof fileData.arrayBuffer === 'function') {
            fileData = await fileData.arrayBuffer();
        }

        // STAGE-0: Normalize oversized images for low-end device safety
        fileData = await normalizeImage(fileData);

        // STAGE-1: Optimize for PDF — downscale to max 2480px + convert to JPEG
        fileData = await prepareImageForPdf(fileData);

        let image;
        try {
            // prepareImageForPdf always outputs JPEG
            image = await pdfDoc.embedJpg(fileData);
        } catch (e) {
            console.warn("JPEG embedding failed, trying PNG fallback:", e);
            try {
                image = await pdfDoc.embedPng(fileData);
            } catch (e2) {
                console.warn("Embedding failed entirely, skipping image:", e2);
                continue;
            }
        }

        // Determine page dimensions
        let pageWidth, pageHeight;

        if (pageSizeKey === 'fit') {
            // Page sized to image (+ margins)
            pageWidth = image.width + (margin * 2);
            pageHeight = image.height + (margin * 2);
            if (orientation === 'landscape' && pageHeight > pageWidth) {
                [pageWidth, pageHeight] = [pageHeight, pageWidth];
            }
        } else {
            const size = PAGE_SIZES[pageSizeKey] || PAGE_SIZES.a4;
            if (orientation === 'landscape') {
                pageWidth = size.height;
                pageHeight = size.width;
            } else {
                pageWidth = size.width;
                pageHeight = size.height;
            }
        }

        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        // Calculate scale to fit
        const scale = Math.min(
            availableWidth / image.width,
            availableHeight / image.height,
            pageSizeKey === 'fit' ? 1.0 : 1.0 // Don't scale up
        );

        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;

        // Center on page
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(image, {
            x: x,
            y: y,
            width: drawWidth,
            height: drawHeight,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return {
        buffer: pdfBytes,
        filename: `converted_${Date.now()}.pdf`,
        original_size: filesData.reduce((acc, f) => acc + f.byteLength, 0),
        compressed_size: pdfBytes.byteLength,
        reduction_percent: 0
    };
}

async function convertImages(filesData, targetFormat = 'jpeg', quality = 0.9, jobId) {
    // Validate format for Canvas
    const mimeType = `image/${targetFormat}`;

    const isSingle = filesData.length === 1;
    const zip = isSingle ? null : new JSZip();
    let totalSize = 0;
    let resultBuffer = null;
    let resultFilename = "";

    for (let i = 0; i < filesData.length; i++) {
        let fileBuffer = filesData[i];

        if (fileBuffer.arrayBuffer && typeof fileBuffer.arrayBuffer === 'function') {
            fileBuffer = await fileBuffer.arrayBuffer();
        }

        // STAGE-0: Normalize
        fileBuffer = await normalizeImage(fileBuffer);

        const blob = new Blob([fileBuffer]);
        const bitmap = await createImageBitmap(blob);

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0); // No resizing in Stage-1, we assume Stage-0 handled safety or user wants original

        const convertedBlob = await canvas.convertToBlob({ type: mimeType, quality });
        const convertedBuffer = await convertedBlob.arrayBuffer();

        if (isSingle) {
            resultBuffer = convertedBuffer;
            resultFilename = `converted.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
        } else {
            zip.file(`image_${i + 1}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`, convertedBuffer);
        }

        totalSize += convertedBuffer.byteLength;
        bitmap.close();
    }

    if (!isSingle) {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        resultBuffer = await zipBlob.arrayBuffer();
        resultFilename = `converted_images.zip`;
    }

    return {
        buffer: resultBuffer,
        filename: resultFilename,
        original_size: filesData.reduce((acc, f) => acc + f.byteLength, 0),
        compressed_size: resultBuffer.byteLength,
        reduction_percent: 0
    };
}

async function rotateImage(fileData, angle = 90, quality = 0.95) {
    if (fileData.arrayBuffer && typeof fileData.arrayBuffer === 'function') {
        fileData = await fileData.arrayBuffer();
    }

    // STAGE-0: Normalize
    fileData = await normalizeImage(fileData);

    const blob = new Blob([fileData]);
    const bitmap = await createImageBitmap(blob);

    const isRightAngle = angle % 180 === 0;
    const canvasWidth = isRightAngle ? bitmap.width : bitmap.height;
    const canvasHeight = isRightAngle ? bitmap.height : bitmap.width;

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

    const resultBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality
    });

    const resultBuffer = await resultBlob.arrayBuffer();
    bitmap.close();

    return {
        buffer: resultBuffer,
        filename: `rotated_${Date.now()}.jpg`,
        original_size: fileData.byteLength,
        compressed_size: resultBuffer.byteLength,
        reduction_percent: 0
    };
}
