/**
 * Universal Stage-0 Image Normalizer
 * 
 * Purpose: Pre-process Image files on low-end devices.
 * 
 * Strategies for Low-End:
 * 1. Cap Resolution: If image > 4096px, resize down.
 * 2. Strip EXIF/Metadata: (Implicitly done by Canvas draw)
 * 
 * Returns: Blob/Uint8Array
 */

import { detectDeviceCapabilities } from '../device-detector';

const MAX_DIMENSION_LOW_END = 4096; // 4K cap for low-end
const COMPRESSION_QUALITY_STAGE0 = 0.92; // High quality but re-encoded

/**
 * Normalize an image for safe processing.
 * - Checks dimensions
 * - Resizes if too large for low-end device
 * - Returns original if safe
 */
export async function normalizeImage(file: File | Blob): Promise<Blob> {
    const deviceInfo = detectDeviceCapabilities();

    if (!deviceInfo.isLowEnd) {
        return file; // Pass/Stream through
    }

    // Quick check: If file size is small (< 5MB), assume dimensions are likely safe enough
    // to avoid decoding overhead. Exception: PNGs can be small but huge dimensions.
    if (file.size < 5 * 1024 * 1024) {
        return file;
    }

    console.log('[Stage-0] Checking Image for low-end device...');
    const startTime = performance.now();

    try {
        // Use ImageBitmap for fast decoding off main thread (if supported)
        if (typeof createImageBitmap !== 'function') {
            return file; // Fallback
        }

        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;

        // If dimensions are within safe limits, return original
        if (width <= MAX_DIMENSION_LOW_END && height <= MAX_DIMENSION_LOW_END) {
            bitmap.close();
            return file;
        }

        console.log(`[Stage-0] Resizing oversized image (${width}x${height}) for stability...`);

        // Calculate new dimensions respecting aspect ratio
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

        // Draw to OffscreenCanvas
        const canvas = new OffscreenCanvas(newWidth, newHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close();
            return file;
        }

        ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
        bitmap.close();

        // Convert back to blob
        // Determine type: keep original unless it's unsupported, then JPEG
        const type = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp'
            ? file.type
            : 'image/jpeg';

        const normalizedBlob = await canvas.convertToBlob({
            type,
            quality: COMPRESSION_QUALITY_STAGE0
        });

        const duration = performance.now() - startTime;
        console.log(`[Stage-0] Image normalized in ${duration.toFixed(0)}ms to ${newWidth}x${newHeight}`);

        return normalizedBlob;

    } catch (error) {
        console.warn('[Stage-0] Image normalization failed, using original:', error);
        return file;
    }
}
