/**
 * Hybrid PDF Compression Engine
 * 
 * Purpose: Provide good compression on high-end devices using enhanced image processing
 * Fallback: Used when Ghostscript is unavailable or fails
 * 
 * This is an enhanced version of the existing compression logic with:
 * - Better image quality preservation
 * - More aggressive deduplication
 * - Optimized for memory efficiency
 * 
 * Expected Result: 100 MB → 30-50 MB (depending on image content)
 */

import type { CompressionResult, CompressionOptions, CompressionSettings } from './pdf-compression-types';

/**
 * Map compression preset to settings
 */
function getSettingsForPreset(preset: string, useManual: boolean, quality?: number, dpi?: number): CompressionSettings {
    // Manual override
    if (useManual) {
        return {
            dpi: dpi || 150,
            quality: (quality || 85) / 100,
            enableObjectStreams: true,
            flateCompress: true,
            removeMetadata: true
        };
    }

    // Preset mapping (calibrated for quality)
    const presets: Record<string, CompressionSettings> = {
        'extreme': { dpi: 72, quality: 0.4, enableObjectStreams: true, flateCompress: true, removeMetadata: true },
        'strong': { dpi: 120, quality: 0.6, enableObjectStreams: true, flateCompress: true, removeMetadata: true },
        'recommended': { dpi: 150, quality: 0.75, enableObjectStreams: true, flateCompress: true, removeMetadata: true },
        'balanced': { dpi: 150, quality: 0.75, enableObjectStreams: true, flateCompress: true, removeMetadata: true },
        'basic': { dpi: 220, quality: 0.9, enableObjectStreams: true, flateCompress: true, removeMetadata: true }
    };

    return presets[preset] || presets.balanced;
}

/**
 * Perform hybrid compression using image recompression and structural optimization
 * 
 * @param pdfBytes - Input PDF as Uint8Array
 * @param options - Compression options
 * @param onProgress - Optional progress callback
 * @returns Compressed PDF result
 */
export async function compressWithHybrid(
    pdfBytes: Uint8Array,
    options: CompressionOptions,
    onProgress?: (percent: number, message?: string) => void
): Promise<CompressionResult> {
    const startTime = performance.now();

    // Dynamic imports
    const { PDFDocument, PDFName, PDFDict, PDFStream, PDFNumber } = await import('pdf-lib');

    const settings = getSettingsForPreset(
        options.preset,
        options.useManual || false,
        options.quality,
        options.dpi
    );

    console.log('[Hybrid] Starting compression:', {
        preset: options.preset,
        dpi: settings.dpi,
        quality: settings.quality
    });

    try {
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;
        let imagesProcessed = 0;
        let imagesCompressedCount = 0;

        // Map to track and deduplicate compressed images
        const originalToNewRef = new Map();

        for (let i = 0; i < totalPages; i++) {
            const page = pages[i];

            // Progress update
            onProgress?.(
                Math.round((i / totalPages) * 100),
                `Processing page ${i + 1}/${totalPages}...`
            );

            const resources = pdfDoc.context.lookup(page.node.Resources());
            if (!resources || !(resources instanceof PDFDict)) continue;

            const xObjects = pdfDoc.context.lookup(resources.get(PDFName.of('XObject')));
            if (!(xObjects instanceof PDFDict)) continue;

            const xObjectEntries = xObjects.entries();
            for (const [name, xObjectRaw] of xObjectEntries) {
                const xObject = pdfDoc.context.lookup(xObjectRaw);
                if (!xObject) continue;
                const ref = pdfDoc.context.getObjectRef(xObject);
                if (!ref) continue;

                const refHash = ref.toString();
                imagesProcessed++;

                // If already processed this shared image, reuse the new reference
                if (originalToNewRef.has(refHash)) {
                    xObjects.set(name, originalToNewRef.get(refHash));
                    continue;
                }

                if (xObject instanceof PDFStream) {
                    const dict = xObject.dict;
                    const subtype = dict.get(PDFName.of('Subtype'));

                    if (subtype === PDFName.of('Image')) {
                        const filter = pdfDoc.context.lookup(dict.get(PDFName.of('Filter')));
                        const isJpg = filter === PDFName.of('DCTDecode') ||
                            filter === PDFName.of('DCT') ||
                            (Array.isArray(filter) && (filter.includes(PDFName.of('DCTDecode')) || filter.includes(PDFName.of('DCT'))));

                        const widthObj = pdfDoc.context.lookup(dict.get(PDFName.of('Width')));
                        const heightObj = pdfDoc.context.lookup(dict.get(PDFName.of('Height')));

                        const width = widthObj instanceof PDFNumber ? widthObj.asNumber() : 0;
                        const height = heightObj instanceof PDFNumber ? heightObj.asNumber() : 0;
                        const targetLongestSide = settings.dpi * 11; // 11 inches (letter size)

                        if (isJpg || width > targetLongestSide || height > targetLongestSide) {
                            let bitmap = null;
                            try {
                                const imgBytes = xObject.getContents();
                                const blob = new Blob([new Uint8Array(imgBytes)]);
                                bitmap = await createImageBitmap(blob);

                                const scale = Math.min(1, targetLongestSide / Math.max(bitmap.width, bitmap.height));

                                // Compress if scaling down significantly or quality is low
                                if (scale < 0.95 || settings.quality < 0.6) {
                                    const newWidth = Math.round(bitmap.width * scale);
                                    const newHeight = Math.round(bitmap.height * scale);

                                    const canvas = new OffscreenCanvas(newWidth, newHeight);
                                    const ctx = canvas.getContext('2d');
                                    if (!ctx) throw new Error('Failed to get canvas context');

                                    ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

                                    const compressedBlob = await canvas.convertToBlob({
                                        type: 'image/jpeg',
                                        quality: settings.quality
                                    });

                                    const newBytes = new Uint8Array(await compressedBlob.arrayBuffer());

                                    // Threshold: extreme mode accepts any reduction, others need 5%+
                                    const sizeThreshold = options.preset === 'extreme' ? 0.99 : 0.95;

                                    if (newBytes.length < imgBytes.length * sizeThreshold) {
                                        const embeddedImage = await pdfDoc.embedJpg(newBytes);
                                        originalToNewRef.set(refHash, embeddedImage.ref);
                                        xObjects.set(name, embeddedImage.ref);
                                        imagesCompressedCount++;
                                    } else {
                                        originalToNewRef.set(refHash, ref);
                                    }
                                } else {
                                    originalToNewRef.set(refHash, ref);
                                }
                            } catch (err) {
                                console.warn('[Hybrid] Image processing skipped:', err);
                                originalToNewRef.set(refHash, ref);
                            } finally {
                                if (bitmap) bitmap.close();
                            }
                        }
                    }
                }
            }
        }

        console.log(`[Hybrid] Processed ${imagesProcessed} objects, compressed ${imagesCompressedCount}`);

        // Clean save strategy to remove de-referenced objects
        const cleanPdf = await PDFDocument.create();
        const copiedPages = await cleanPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(p => cleanPdf.addPage(p));

        const compressedBytes = await cleanPdf.save({
            useObjectStreams: settings.enableObjectStreams !== false,
            addDefaultPage: false,
            updateFieldAppearances: false
        });

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        const originalSize = pdfBytes.byteLength;
        const compressedSize = compressedBytes.byteLength;
        const ratio = ((originalSize - compressedSize) / originalSize) * 100;

        console.log('[Hybrid] Compression complete:', {
            originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
            compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
            reduction: `${ratio.toFixed(1)}%`,
            processingTime: `${processingTime.toFixed(0)}ms`
        });

        return {
            output: compressedBytes,
            engineUsed: 'hybrid',
            originalSize,
            compressedSize,
            compressionRatio: Math.max(0, ratio),
            processingTimeMs: processingTime,
            imagesProcessed,
            imagesCompressed: imagesCompressedCount
        };

    } catch (error) {
        console.error('[Hybrid] Compression failed:', error);
        throw new Error(`Hybrid compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
