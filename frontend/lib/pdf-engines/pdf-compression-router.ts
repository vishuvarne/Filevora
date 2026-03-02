/**
 * PDF Compression Router
 * 
 * Routes compression requests to appropriate engine based on device capabilities:
 * - Low-end devices → Stage-0 (fast structural compression)
 * - High-end devices → Hybrid (deep image compression)
 * 
 * Future: Add Ghostscript WASM engine for even better compression on high-end devices
 */

import { detectDeviceCapabilities } from '../device-detector';
import { compressWithStage0 } from './pdf-stage0-compressor';
import { compressWithHybrid } from './pdf-hybrid-compressor';
import type { CompressionOptions, CompressionResult } from './pdf-compression-types';

/**
 * Main compression function - routes to appropriate engine
 * 
 * @param pdfBytes - Input PDF as Uint8Array
 * @param options - Compression options
 * @param onProgress - Optional progress callback
 * @returns Compressed PDF result with engine metadata
 */
export async function compressPDF(
    pdfBytes: Uint8Array,
    options: CompressionOptions,
    onProgress?: (percent: number, message?: string) => void
): Promise<CompressionResult> {
    // Detect device capabilities
    const deviceInfo = detectDeviceCapabilities();

    console.log('[PDF Compressor] Starting compression:', {
        deviceClass: deviceInfo.deviceClass,
        preset: options.preset,
        inputSize: `${(pdfBytes.byteLength / 1024 / 1024).toFixed(2)} MB`
    });

    // Route based on device class
    if (deviceInfo.isLowEnd) {
        console.log('[PDF Compressor] Using Stage-0 (low-end device)');
        return await compressWithStage0(pdfBytes, options);
    } else {
        console.log('[PDF Compressor] Using Hybrid engine (high-end device)');
        return await compressWithHybrid(pdfBytes, options, onProgress);
    }
}

/**
 * Get recommended preset based on file size and device capabilities
 */
export function getRecommendedPreset(fileSizeBytes: number): string {
    const sizeMB = fileSizeBytes / 1024 / 1024;
    const deviceInfo = detectDeviceCapabilities();

    // Low-end devices: preset doesn't matter for Stage-0
    if (deviceInfo.isLowEnd) {
        return 'balanced'; // Default, but Stage-0 ignores it
    }

    // High-end devices: recommend preset based on file size
    if (sizeMB > 50) return 'extreme';
    if (sizeMB > 20) return 'strong';
    if (sizeMB > 10) return 'balanced';
    return 'basic';
}
