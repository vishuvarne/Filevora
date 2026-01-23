/* eslint-disable no-restricted-globals */
importScripts('/workers/libs/pdf-lib.min.js');
importScripts('/workers/libs/jszip.min.js');

const { PDFDocument } = self.PDFLib;
const JSZip = self.JSZip;

self.onmessage = async (e) => {
    const { type, payload, jobId } = e.data;

    try {
        let result;

        switch (type) {
            case 'image-to-pdf':
                result = await imagesToPDF(payload.files);
                break;
            case 'convert-image':
                result = await convertImages(payload.files, payload.targetFormat, payload.quality);
                break;
            case 'rotate-image':
                result = await rotateImage(payload.file, payload.angle, payload.quality);
                break;
            default:
                throw new Error(`Unknown worker action: ${type}`);
        }

        // Transfer optimization removed due to stability issues with certain browser versions
        self.postMessage({ type: 'success', jobId, result });
    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};

async function imagesToPDF(filesData) {
    const pdfDoc = await PDFDocument.create();

    for (const fileData of filesData) {
        let image;
        // Determine type from bytes or just try embedding?
        // pdf-lib requires knowing if it's PNG or JPG.
        // We can pass mime type in payload or detect.
        // Simple magic byte check:
        const u8 = new Uint8Array(fileData);
        const isPng = u8[0] === 0x89 && u8[1] === 0x50;

        try {
            if (isPng) {
                image = await pdfDoc.embedPng(fileData);
            } else {
                // Assume JPG/JPEG
                image = await pdfDoc.embedJpg(fileData);
            }
        } catch (e) {
            console.warn("Embedding failed, might be unsupported format, trying fallback or skip", e);
            continue; // Skip unsupported images for now
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return {
        buffer: pdfBytes,
        filename: `converted_${Date.now()}.pdf`,
        originalSize: filesData.reduce((acc, f) => acc + f.byteLength, 0),
        compressedSize: pdfBytes.byteLength,
        reductionPercent: 0
    };
}

async function convertImages(filesData, targetFormat = 'jpeg', quality = 0.9) {
    // If multiple files, return ZIP. If single, return file.
    // targetFormat: 'jpeg', 'png', 'webp'

    // Validate format for Canvas
    const mimeType = `image/${targetFormat}`;

    // Check if single file
    const isSingle = filesData.length === 1;
    const zip = isSingle ? null : new JSZip();
    let totalSize = 0;
    let resultBuffer = null;
    let resultFilename = "";

    for (let i = 0; i < filesData.length; i++) {
        const fileBuffer = filesData[i];

        // Create ImageBitmap (efficient in worker)
        const blob = new Blob([fileBuffer]);
        const bitmap = await createImageBitmap(blob);

        // Draw to OffscreenCanvas
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);

        // Convert to blob
        const convertedBlob = await canvas.convertToBlob({ type: mimeType, quality });
        const convertedBuffer = await convertedBlob.arrayBuffer();

        if (isSingle) {
            resultBuffer = convertedBuffer;
            resultFilename = `converted.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
        } else {
            zip.file(`image_${i + 1}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`, convertedBuffer);
        }

        totalSize += convertedBuffer.byteLength;

        // Cleanup
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
        originalSize: filesData.reduce((acc, f) => acc + f.byteLength, 0),
        compressedSize: resultBuffer.byteLength,
        reductionPercent: 0 // Could calculate
    };
}

/**
 * HIGH-PERFORMANCE Image Rotation
 * Uses ImageBitmap API for hardware-accelerated transformations
 * Zero-copy transfers for maximum speed
 */
async function rotateImage(fileData, angle = 90, quality = 0.95) {
    // Create ImageBitmap from file data (hardware-accelerated)
    const blob = new Blob([fileData]);
    const bitmap = await createImageBitmap(blob);

    // Calculate new canvas dimensions based on rotation
    const isRightAngle = angle % 180 === 0;
    const canvasWidth = isRightAngle ? bitmap.width : bitmap.height;
    const canvasHeight = isRightAngle ? bitmap.height : bitmap.width;

    // Use OffscreenCanvas for better performance
    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Apply rotation transformation
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

    // Convert to blob with optimized quality
    const resultBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality
    });

    const resultBuffer = await resultBlob.arrayBuffer();

    // Cleanup
    bitmap.close();

    return {
        buffer: resultBuffer,
        filename: `rotated_${Date.now()}.jpg`,
        originalSize: fileData.byteLength,
        compressedSize: resultBuffer.byteLength,
        reductionPercent: 0
    };
}
