/**
 * TypeScript types for PDF Compression System
 */

export type DeviceClass = 'low-end' | 'high-end';
export type CompressionEngine = 'stage0' | 'ghostscript' | 'hybrid' | 'legacy';
export type CompressionPreset = 'basic' | 'balanced' | 'extreme' | 'recommended' | 'strong';

/**
 * Compression options passed to PDF compression functions
 */
export interface CompressionOptions {
    preset: CompressionPreset;
    timeoutMs?: number;
    maxMemoryMB?: number;
    // Manual override options (legacy support)
    useManual?: boolean;
    quality?: number;
    dpi?: number;
}

/**
 * Result returned from PDF compression
 */
export interface CompressionResult {
    output: Uint8Array;
    engineUsed: CompressionEngine;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    // Additional metadata
    processingTimeMs?: number;
    imagesProcessed?: number;
    imagesCompressed?: number;
}

/**
 * Device capabilities detected by device-detector
 */
export interface DeviceCapabilities {
    deviceClass: DeviceClass;
    memory: number | undefined;
    cores: number | undefined;
    isLowEnd: boolean;
}

/**
 * Internal compression settings derived from preset
 */
export interface CompressionSettings {
    dpi: number;
    quality: number;
    enableObjectStreams?: boolean;
    flateCompress?: boolean;
    removeMetadata?: boolean;
}
