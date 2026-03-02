/**
 * Universal Stage-0 PDF Normalizer
 * 
 * Purpose: Pre-process PDF files on low-end devices to ensure they are safe to handle
 * by subsequent operations (Merge, Split, Rotate, etc.).
 * 
 * Operations:
 * 1. Stream Compression (Flate)
 * 2. Object Stream Enablement
 * 3. Metadata Stripping (reduce object count)
 * 4. Fast Save (Linearization/Check)
 * 
 * Returns: Uint8Array (Safe PDF)
 */

import { detectDeviceCapabilities } from '../device-detector';

/**
 * Normalize a PDF for safe processing on low-end devices.
 * If the device is high-end, returns the input buffer immediately.
 */
export async function normalizePDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const deviceInfo = detectDeviceCapabilities();

    // High-end devices can handle dirty/large PDFs directly
    if (!deviceInfo.isLowEnd) {
        return pdfBytes;
    }

    console.log('[Stage-0] Normalizing PDF for low-end device...');
    const startTime = performance.now();

    // Import pdf-lib only when needed
    const { PDFDocument } = await import('pdf-lib');

    try {
        // Load with minimal parsing
        const pdfDoc = await PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
            updateMetadata: false
        });

        // Strip non-essential metadata to save memory/space
        try {
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');
            pdfDoc.setKeywords([]);
        } catch (e) {
            // Ignore metadata errors
        }

        // Fast Save with Object Streams
        // This repacks the PDF, often fixing corruption and reducing memory footprint for the next step works
        const normalizedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            updateFieldAppearances: false, // Expensive operation
            objectsPerTick: Infinity       // Fastest execution
        });

        const duration = performance.now() - startTime;
        console.log(`[Stage-0] Normalization complete in ${duration.toFixed(0)}ms. Size: ${(pdfBytes.length / 1024 / 1024).toFixed(2)}MB -> ${(normalizedBytes.length / 1024 / 1024).toFixed(2)}MB`);

        return normalizedBytes;

    } catch (error) {
        console.warn('[Stage-0] Normalization failed, proceeding with original file:', error);
        return pdfBytes; // Fail open to avoid blocking the user
    }
}
