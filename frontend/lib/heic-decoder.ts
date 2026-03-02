/**
 * HEIC Decoder Utility
 * 
 * Converts HEIC/HEIF images to standard formats using heic-convert.
 * This runs in the main thread because heic-convert doesn't support workers.
 */

// Dynamic import for browser version
let heicConvert: ((options: { buffer: ArrayBuffer, format: 'JPEG' | 'PNG', quality?: number }) => Promise<ArrayBuffer>) | null = null;

/**
 * Load the heic-convert module (main thread only)
 */
async function loadHeicConvert() {
    if (heicConvert) return heicConvert;

    try {
        // Browser-specific import
        const module = await import('heic-convert/browser');
        heicConvert = module.default || module;
        console.log('[HEIC] heic-convert loaded successfully');
        return heicConvert;
    } catch (error) {
        console.error('[HEIC] Failed to load heic-convert:', error);
        throw new Error('HEIC conversion is not available in this browser');
    }
}

/**
 * Check if a file is a HEIC/HEIF image
 */
export function isHeicFile(file: File): boolean {
    const heicMimeTypes = [
        'image/heic',
        'image/heif',
        'image/heic-sequence',
        'image/heif-sequence'
    ];

    // Check MIME type
    if (heicMimeTypes.includes(file.type.toLowerCase())) {
        return true;
    }

    // Check extension (some browsers don't report correct MIME)
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif';
}

export interface HeicConversionResult {
    buffer: ArrayBuffer;
    filename: string;
    originalSize: number;
    outputSize: number;
}

/**
 * Convert a HEIC file to JPEG
 */
export async function heicToJpeg(
    file: File,
    quality: number = 0.92,
    onProgress?: (percent: number) => void
): Promise<HeicConversionResult> {
    onProgress?.(10);

    const convert = await loadHeicConvert();
    if (!convert) {
        throw new Error('HEIC converter not available');
    }

    onProgress?.(20);

    const inputBuffer = await file.arrayBuffer();

    onProgress?.(40);

    const outputBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: quality
    });

    onProgress?.(100);

    // Generate output filename
    const baseName = file.name.replace(/\.(heic|heif)$/i, '');
    const filename = `${baseName}.jpg`;

    return {
        buffer: outputBuffer,
        filename,
        originalSize: file.size,
        outputSize: outputBuffer.byteLength
    };
}

/**
 * Convert a HEIC file to PNG
 */
export async function heicToPng(
    file: File,
    onProgress?: (percent: number) => void
): Promise<HeicConversionResult> {
    onProgress?.(10);

    const convert = await loadHeicConvert();
    if (!convert) {
        throw new Error('HEIC converter not available');
    }

    onProgress?.(20);

    const inputBuffer = await file.arrayBuffer();

    onProgress?.(40);

    const outputBuffer = await convert({
        buffer: inputBuffer,
        format: 'PNG'
    });

    onProgress?.(100);

    // Generate output filename
    const baseName = file.name.replace(/\.(heic|heif)$/i, '');
    const filename = `${baseName}.png`;

    return {
        buffer: outputBuffer,
        filename,
        originalSize: file.size,
        outputSize: outputBuffer.byteLength
    };
}

/**
 * Convert HEIC to a standard format that other converters can process
 * (e.g., for chaining with photon)
 */
export async function heicToStandardFormat(
    file: File,
    onProgress?: (percent: number) => void
): Promise<File> {
    const result = await heicToJpeg(file, 1.0, onProgress);

    return new File(
        [result.buffer],
        result.filename,
        { type: 'image/jpeg' }
    );
}
