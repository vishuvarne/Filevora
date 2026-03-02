
import { photonWorker, PhotonWorkerClient } from '@/workers/photon-worker-client';
import { wasmRuntime } from './runtime';
import JSZip from 'jszip';

// Re-export for consumer convenience
export { PhotonWorkerClient, photonWorker };

export interface ImageConversionOptions {
    targetFormat: string;
    quality?: number;
    width?: number;
    height?: number;
    filter?: string;
    fileRotations?: Record<number, number>;
}

/**
 * Check if photon WASM is available
 */
export function isPhotonAvailable(): boolean {
    return PhotonWorkerClient.isSupported();
}

export async function convertImagesWithWasm(
    files: File[],
    options: ImageConversionOptions,
    onProgress?: (percent: number) => void
): Promise<{ buffer: ArrayBuffer, filename: string }> {
    const results: { filename: string, data: Uint8Array }[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];

        // Determine operation based on options
        let result;
        const targetFormat = options.targetFormat as 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
        const quality = Math.round((options.quality || 0.8) * 100);
        const rotationAngle = options.fileRotations?.[i];

        if (rotationAngle && rotationAngle % 360 !== 0) {
            // Apply rotation and conversion simultaneously
            const normalizedAngle = ((rotationAngle % 360) + 360) % 360;
            const safeAngle = [90, 180, 270].includes(normalizedAngle) ? normalizedAngle as 90 | 180 | 270 : 90;
            result = await photonWorker.rotate(
                file,
                {
                    angle: safeAngle,
                    outputFormat: targetFormat,
                    quality
                },
                (p, m) => {
                    const fileProgress = (i / totalFiles) * 100 + (p / totalFiles);
                    onProgress?.(fileProgress);
                }
            );
        } else if (options.filter) {
            // Apply filter
            result = await photonWorker.applyFilter(
                file,
                {
                    filter: options.filter as any,
                    outputFormat: targetFormat,
                    quality
                },
                (p, m) => {
                    const fileProgress = (i / totalFiles) * 100 + (p / totalFiles);
                    onProgress?.(fileProgress);
                }
            );
        } else if (options.width && options.height) {
            // Resize
            result = await photonWorker.resize(
                file,
                {
                    width: options.width,
                    height: options.height,
                    outputFormat: targetFormat,
                    quality
                },
                (p, m) => {
                    const fileProgress = (i / totalFiles) * 100 + (p / totalFiles);
                    onProgress?.(fileProgress);
                }
            );
        } else {
            // Just convert format
            result = await photonWorker.convert(
                file,
                {
                    targetFormat,
                    quality
                },
                (p, m) => {
                    const fileProgress = (i / totalFiles) * 100 + (p / totalFiles);
                    onProgress?.(fileProgress);
                }
            );
        }

        // Determine output filename
        const namePart = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const ext = options.targetFormat === 'jpeg' ? 'jpg' : options.targetFormat;
        const newFilename = `${namePart}.${ext}`;

        results.push({ filename: newFilename, data: new Uint8Array(result.buffer) });

        onProgress?.(((i + 1) / totalFiles) * 100);
    }

    // Return single file or ZIP
    if (results.length === 1) {
        return {
            buffer: results[0].data.slice().buffer,
            filename: results[0].filename
        };
    } else {
        const zip = new JSZip();
        for (const res of results) {
            zip.file(res.filename, res.data);
        }
        const content = await zip.generateAsync({ type: 'arraybuffer' });
        return {
            buffer: content,
            filename: 'converted_images.zip'
        };
    }
}


export interface VectorizeOptions {
    colormode?: "color" | "binary";
    hierarchical?: "stacked" | "cutout";
    filterSpeckle?: number;
    colorPrecision?: number;
    layerDifference?: number;
    cornerThreshold?: number;
    lengthThreshold?: number;
    maxIterations?: number;
    spliceThreshold?: number;
    pathPrecision?: number;
}

export async function vectorizeImage(
    file: File,
    options: VectorizeOptions
): Promise<{ buffer: ArrayBuffer, filename: string }> {
    const runtime = await wasmRuntime.acquire({ module: 'image-photon' });
    try {
        const fileBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(fileBuffer);

        // Params mapping
        const params = {
            colormode: options.colormode,
            hierarchical: options.hierarchical,
            filter_speckle: options.filterSpeckle,
            color_precision: options.colorPrecision,
            layer_difference: options.layerDifference,
            corner_threshold: options.cornerThreshold,
            length_threshold: options.lengthThreshold,
            max_iterations: options.maxIterations,
            splice_threshold: options.spliceThreshold,
            path_precision: options.pathPrecision
        };

        const svgString = await runtime.run<string>('vectorize_image', [fileBytes, params]);

        // Convert string to bytes
        const encoder = new TextEncoder();
        const svgBytes = encoder.encode(svgString);

        return {
            buffer: svgBytes.buffer,
            filename: file.name.replace(/\.[^/.]+$/, "") + ".svg"
        };
    } finally {
        runtime.release();
    }
}

export async function renderSvg(
    file: File,
    width?: number
): Promise<{ buffer: ArrayBuffer, filename: string }> {
    const runtime = await wasmRuntime.acquire({ module: 'image-photon' });
    try {
        const text = await file.text();

        const params = {
            width: width,
            fit_to: 'width'
        };

        const pngBytes = await runtime.run<Uint8Array>('render_svg', [text, params]);

        return {
            buffer: pngBytes.slice().buffer,
            filename: file.name.replace(/\.svg$/i, ".png")
        };
    } finally {
        runtime.release();
    }
}
