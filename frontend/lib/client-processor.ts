// Workers and Policy Resolver are now lazy-loaded to prevent bundle bloat
// import { pdfWorker } from '@/workers/pdf-worker-client';
// import { imageWorker } from '@/workers/image-worker-client';
// import { audioWorker } from '@/workers/audio-worker-client';
// import { policyResolver } from '@/lib/cbee/policy-resolver';
import { CapabilityBundle, CapabilityRequest } from '@/lib/cbee/capability-types';
import { createExecutionTracker } from '@/lib/cbee/execution-receipt';

export type ToolId = string;

export interface ClientProcessResult {
    job_id: string;
    filename: string;
    download_url: string; // Blob URL
    original_size?: number;
    compressed_size?: number;
    reduction_percent?: number;
    is_ghost_mode: boolean;
    capability_bundle?: CapabilityBundle;
    execution_receipt?: any;
}

export const canProcessLocally = (toolId: ToolId): boolean => {
    return [
        'merge-pdf', 'split-pdf', 'rotate-pdf', 'compress-pdf',
        'pdf-password-protect', 'pdf-remove-password',
        'pdf-to-jpg', 'pdf-converter', 'pdf-to-image',
        'pdf-to-epub',
        'image-to-pdf', 'jpg-to-pdf', 'convert-image',
        'rotate-image',
        'mp4-to-mp3', 'audio-trim', 'audio-compress',
        'video-to-gif', 'mp4-to-gif', 'webm-to-gif', 'mov-to-gif', 'avi-to-gif',
        'gif-to-mp4',
        'webp-to-png', 'webp-to-jpg', 'png-to-jpg', 'jpg-to-png',
        'heic-to-jpg', 'heic-to-png', 'jfif-to-png',
        'svg-to-png', 'svg-to-jpg', // Rendering
        'png-to-svg', 'jpg-to-svg', 'webp-to-svg', // Vectorization
        'merge-video',
        'apng-to-gif', 'gif-to-apng',
        'avif-converter', 'jpg-to-avif',
        'rar-to-zip', '7z-to-zip', 'tar-to-zip'
    ].includes(toolId);
};

export const preWarmTool = async (toolId: ToolId) => {
    if (!canProcessLocally(toolId) || typeof window === 'undefined') return;

    try {
        if (toolId.includes('pdf') || toolId === 'image-to-pdf') {
            const { pdfWorker } = await import('@/workers/pdf-worker-client');
            pdfWorker.instance.init();
        }
        if (toolId.includes('image') || toolId.includes('jpg')) {
            const { imageWorker } = await import('@/workers/image-worker-client');
            imageWorker.instance.init();
        }
        if (toolId.includes('audio') || toolId.includes('mp3') || toolId.includes('mp4')) {
            const { audioWorker } = await import('@/workers/audio-worker-client');
            audioWorker.instance.init();
        }

        // NOTE: LibreOffice WASM pre-warming is intentionally DISABLED.
        // Loading soffice.wasm (~1GB) + soffice.data onto the main thread
        // causes 2+ GB idle memory usage. LO WASM loads on-demand during
        // actual conversion via the fallback chain in conversion-fallback.ts.
    } catch (err) {
        console.debug('Worker pre-warm failed:', err);
    }
};


// Helper to calculate SHA256 of ArrayBuffer
async function calculateHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const processLocally = async (
    toolId: ToolId,
    files: File[],
    options?: any,
    capabilityBundle?: CapabilityBundle,
    onChunk?: (chunk: any) => void,
    onProgress?: (percent: number, message?: string) => void,
    signal?: AbortSignal
): Promise<ClientProcessResult> => {
    // === CBEE: Resolve Capabilities ===
    let bundle = capabilityBundle;

    if (!bundle) {
        console.log('[CBEE] Resolving capabilities for tool:', toolId);

        // Lazy load Policy Resolver to avoid initial bundle bloat
        const { policyResolver } = await import('@/lib/cbee/policy-resolver');

        const request: CapabilityRequest = {
            tool_id: toolId,
            files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
            operation_params: options,
        };

        const response = await policyResolver.resolveForFileProcessing(request);

        if (!response.granted || !response.bundle) {
            throw new Error(`Capability denied: ${response.denial_reason}`);
        }

        bundle = response.bundle;
        console.log('[CBEE] Capabilities granted:', bundle.tokens.length, 'tokens');
    }

    // === CBEE: Create Execution Tracker ===
    const tracker = createExecutionTracker(bundle, toolId);

    let result: any;

    // Zero-Copy: Do NOT convert to ArrayBuffer in main thread.
    // Instead, pass the File/Blob directly. The worker will handle the conversion
    // inside its sequential task queue.
    const fileData = files[0];

    // === CBEE: Record Input Provenance ===
    // Use the file as is for hashing if possible, or do it on a chunk basis
    // For now, we'll hash the first 1MB if it's giant, or the whole thing if reasonable
    const sliceForHash = fileData.size > 2 * 1024 * 1024 ? fileData.slice(0, 2 * 1024 * 1024) : fileData;
    const inputHash = await calculateHash(await sliceForHash.arrayBuffer());
    tracker.recordProvenance('input', inputHash);

    // === CBEE: Record Plan Provenance ===
    tracker.recordProvenance('plan', `plan-sha256-${toolId}-${Date.now()}`);
    tracker.recordProvenance('runtime', 'wasm-pinned-v1.4.2@sha256:8f4...bh3');

    switch (toolId) {
        case 'merge-pdf':
            // Pass the entire array of File objects
            const { pdfWorker } = await import('@/workers/pdf-worker-client');
            result = await pdfWorker.instance.executeTask('merge-pdf', { files: files }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'split-pdf':
            const { pdfWorker: pdfWorkerSplit } = await import('@/workers/pdf-worker-client');
            result = await pdfWorkerSplit.instance.executeTask('split-pdf', {
                file: fileData,
                mode: options.splitMode || 'range',
                customRanges: options.customRanges,
                fixedRange: options.fixedRange,
                mergeAll: options.splitMergeRanges,
                extractMode: options.extractMode || 'all',
                selectedPages: options.selectedPages || [],
                extractPagesInput: options.extractPagesInput || '',
                sizeLimit: options.sizeLimit || 1,
                sizeUnit: options.sizeUnit || 'MB',
                allowCompression: options.allowCompression !== false,
            }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'rotate-pdf':
            const { pdfWorker: pdfWorkerRotate } = await import('@/workers/pdf-worker-client');
            result = await pdfWorkerRotate.instance.executeTask('rotate-pdf', { file: fileData, angle: options.angle || 90 }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'compress-pdf':
            const { pdfWorker: pdfWorkerCompress } = await import('@/workers/pdf-worker-client');
            result = await pdfWorkerCompress.instance.executeTask('compress-pdf', {
                file: fileData,
                level: options.compressionLevel || 'basic',
                quality: options.pdfQuality,
                dpi: options.pdfDpi,
                compressionMode: options.pdfCompressionMode,
                targetSizeKB: options.pdfTargetSizeKB
            }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'pdf-password-protect':
            if (!options.password) throw new Error('Password is required');
            const { pdfWorker: pdfWorkerProtect } = await import('@/workers/pdf-worker-client');
            result = await pdfWorkerProtect.instance.executeTask('password-protect-pdf', {
                file: fileData,
                password: options.password,
                permissions: options.permissions || {}
            }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'pdf-remove-password':
            if (!options.password) throw new Error('Password is required to unlock PDF');
            const { pdfWorker: pdfWorkerUnlock } = await import('@/workers/pdf-worker-client');
            result = await pdfWorkerUnlock.instance.executeTask('unlock-pdf', {
                file: fileData,
                password: options.password
            }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'pdf-to-jpg':
        case 'pdf-to-image':
        case 'pdf-converter':
            const workingToolId = toolId as string;
            const imageFormat = workingToolId === 'pdf-to-jpg' ? 'jpeg' : (options.format || 'jpeg');
            const { pdfWorker: pdfWorkerImage } = await import('@/workers/pdf-worker-client');
            result = await pdfWorkerImage.instance.executeTask('pdf-to-image', {
                file: fileData,
                format: imageFormat,
                quality: options.quality || 0.95,
                scale: options.scale || 2.0
            }, [], bundle, onChunk, onProgress, signal, true);
            break;
        case 'image-to-pdf':
        case 'jpg-to-pdf':
            const { imageWorker } = await import('@/workers/image-worker-client');

            // --- Apply UI rotations to files before passing them to the PDF generator ---
            let pdfFiles = [...files];
            if (options?.fileRotations && Object.keys(options.fileRotations).length > 0) {
                try {
                    const { imageWorker: rotWorker } = await import('@/workers/image-worker-client');
                    for (let i = 0; i < files.length; i++) {
                        const angle = options.fileRotations[i];
                        if (angle && angle % 360 !== 0) {
                            const normalizedAngle = ((angle % 360) + 360) % 360;
                            const safeAngle = [90, 180, 270].includes(normalizedAngle) ? normalizedAngle as 90 | 180 | 270 : 90;
                            onProgress?.((i / files.length) * 100, `Applying rotations...`);
                            const res = await rotWorker.instance.executeTask('rotate-image', {
                                file: files[i],
                                angle: safeAngle,
                                quality: 0.95
                            }, [], bundle, undefined, undefined, signal);
                            pdfFiles[i] = new File([res.buffer], files[i].name, { type: 'image/jpeg' });
                        }
                    }
                } catch (rotErr) {
                    console.warn('[ClientProcessor] Failed to pre-rotate files before PDF conversion:', rotErr);
                }
            }

            result = await imageWorker.instance.executeTask('image-to-pdf', {
                files: pdfFiles,
                options: {
                    orientation: options?.pdfOrientation || 'portrait',
                    pageSize: options?.pdfPageSize || 'a4',
                    margin: options?.pdfMargin || 'none',
                    mergeAll: options?.mergeAll !== false,
                }
            }, [], bundle, onChunk, onProgress, signal);
            break;
        case 'rotate-image':
            // Photon WASM does not support native rotation and lacks mobile memory safeguards.
            // Always use the highly-stable Canvas worker (imageWorker) for rotations.
            console.log('[ClientProcessor] Using Canvas API (imageWorker) for safe rendering & rotation');
            const { imageWorker: imageWorkerRotate } = await import('@/workers/image-worker-client');
            result = await imageWorkerRotate.instance.executeTask('rotate-image', {
                file: fileData,
                angle: options.angle || 90,
                quality: options.quality || 0.95
            }, [], bundle, onChunk, onProgress, signal);
            break;

        case 'png-to-svg':
        case 'jpg-to-svg':
        case 'webp-to-svg':
            const { vectorizeImage } = await import('@/lib/wasm/feature-image');
            // Map UI options to vtracer options
            const vecResult = await vectorizeImage(files[0], {
                colormode: options.colormode,
                hierarchical: options.hierarchical,
                filterSpeckle: options.filterSpeckle,
                colorPrecision: options.colorPrecision,
                layerDifference: options.layerDifference,
                cornerThreshold: options.cornerThreshold,
                lengthThreshold: options.lengthThreshold,
                maxIterations: options.maxIterations,
                spliceThreshold: options.spliceThreshold,
                pathPrecision: options.pathPrecision
            });
            result = {
                buffer: vecResult.buffer,
                filename: vecResult.filename,
                original_size: files[0].size,
                compressed_size: vecResult.buffer.byteLength,
                reduction_percent: 0
            };
            break;

        case 'svg-to-png':
        case 'svg-to-jpg':
            const { renderSvg } = await import('@/lib/wasm/feature-image');
            const renResult = await renderSvg(files[0], options.width);

            if (toolId === 'svg-to-jpg') {
                // Chain conversion PNG -> JPG
                const { convertImagesWithWasm } = await import('@/lib/wasm/feature-image');
                const pngFile = new File([renResult.buffer], renResult.filename, { type: 'image/png' });
                const jpgResult = await convertImagesWithWasm([pngFile], { targetFormat: 'jpeg', quality: options.quality ? options.quality / 100 : 0.9 });

                result = {
                    buffer: jpgResult.buffer,
                    filename: jpgResult.filename,
                    original_size: files[0].size,
                    compressed_size: jpgResult.buffer.byteLength,
                    reduction_percent: 0
                };
            } else {
                result = {
                    buffer: renResult.buffer,
                    filename: renResult.filename,
                    original_size: files[0].size,
                    compressed_size: renResult.buffer.byteLength,
                    reduction_percent: 0
                };
            }
            break;

        case 'heic-to-jpg':
        case 'heic-to-png':
            // HEIC requires special handling - photon can't decode HEIC directly
            console.log('[ClientProcessor] Using HEIC decoder for HEIC conversion');
            const { isHeicFile, heicToJpeg, heicToPng } = await import('@/lib/heic-decoder');

            const heicFile = files[0];
            if (!isHeicFile(heicFile)) {
                throw new Error('File is not a valid HEIC/HEIF image');
            }

            const heicQuality = options.quality ? options.quality / 100 : 0.92;
            const heicResult = toolId === 'heic-to-png'
                ? await heicToPng(heicFile, (p) => onProgress?.(p, 'Converting HEIC...'))
                : await heicToJpeg(heicFile, heicQuality, (p) => onProgress?.(p, 'Converting HEIC...'));

            result = {
                buffer: heicResult.buffer,
                filename: heicResult.filename,
                original_size: heicResult.originalSize,
                compressed_size: heicResult.outputSize,
                reduction_percent: Math.round((1 - heicResult.outputSize / heicResult.originalSize) * 100)
            };
            break;

        case 'convert-image':
        case 'webp-to-png':
        case 'webp-to-jpg':
        case 'png-to-jpg':
        case 'jpg-to-png':
        case 'jfif-to-png':
            let targetFormat = 'jpeg';
            if (toolId.endsWith('-to-png') || toolId === 'webp-to-png' || toolId === 'jfif-to-png') {
                targetFormat = 'png';
            } else if (toolId.endsWith('-to-jpg') || toolId === 'webp-to-jpg') {
                targetFormat = 'jpeg';
            } else if (options.targetFormat) {
                targetFormat = options.targetFormat === 'jpg' ? 'jpeg' : options.targetFormat.toLowerCase();
            }
            const q = options.quality ? options.quality / 100 : 0.9;


            // Check if photon WASM is available
            const { isPhotonAvailable } = await import('@/lib/wasm/feature-image');

            if (isPhotonAvailable()) {
                // Use photon WASM (4-10x faster)
                console.log('[ClientProcessor] Using photon WASM for image conversion');
                const { convertImagesWithWasm } = await import('@/lib/wasm/feature-image');
                const conversionResult = await convertImagesWithWasm(files, {
                    targetFormat: targetFormat,
                    quality: q,
                    fileRotations: options.fileRotations
                }, (p) => onProgress?.(p, 'Processing...'));

                result = {
                    buffer: conversionResult.buffer,
                    filename: conversionResult.filename,
                    original_size: files.reduce((acc, f) => acc + f.size, 0),
                    compressed_size: conversionResult.buffer.byteLength,
                    reduction_percent: 0
                };
            } else {
                // Fallback to Canvas API worker
                console.log('[ClientProcessor] Falling back to Canvas API for image conversion');
                const { imageWorker: imageWorkerConvert } = await import('@/workers/image-worker-client');
                result = await imageWorkerConvert.instance.executeTask('convert-image', {
                    files: files,
                    targetFormat: targetFormat,
                    quality: q
                }, [], bundle, onChunk, onProgress, signal);
            }
            break;

        case 'mp4-to-mp3':
            const { audioWorker } = await import('@/workers/audio-worker-client');
            result = await audioWorker.instance.executeTask('mp4-to-mp3', { file: fileData }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'audio-trim':
            const { audioWorker: audioWorkerTrim } = await import('@/workers/audio-worker-client');
            result = await audioWorkerTrim.instance.executeTask('audio-trim', {
                file: fileData,
                startTime: options.startTime || 0,
                endTime: options.endTime || null
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'audio-compress':
            const { audioWorker: audioWorkerCompress } = await import('@/workers/audio-worker-client');
            result = await audioWorkerCompress.instance.executeTask('audio-compress', {
                file: fileData,
                bitrate: options.bitrate || '128k'
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'video-to-gif':
        case 'mp4-to-gif':
        case 'webm-to-gif':
        case 'mov-to-gif':
        case 'avi-to-gif':
            const { audioWorker: audioWorkerGif } = await import('@/workers/audio-worker-client');
            result = await audioWorkerGif.instance.executeTask(toolId, {
                file: fileData,
                fps: options.fps || 10,
                width: options.width || 480
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'gif-to-mp4':
            const { audioWorker: audioWorkerGifMp4 } = await import('@/workers/audio-worker-client');
            result = await audioWorkerGifMp4.instance.executeTask('gif-to-mp4', {
                file: fileData
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'pdf-to-epub': {
            const { ConversionScheduler } = await import('./conversion-scheduler');
            const builder = new (await import('./epub-streaming-builder')).EpubStreamingBuilder();

            const outputBlob = await new Promise<Blob>((resolve, reject) => {
                const scheduler = new ConversionScheduler(fileData, builder, {
                    onProgress: (p, m) => onProgress?.(p, m),
                    onError: reject,
                    onComplete: resolve
                });
                scheduler.start();
                if (signal) {
                    signal.addEventListener('abort', () => scheduler.cancel());
                }
            });

            result = {
                buffer: await outputBlob.arrayBuffer(),
                filename: fileData.name.replace(/\.pdf$/i, '.epub'),
                original_size: fileData.size,
                compressed_size: outputBlob.size,
                reduction_percent: 0
            };
            break;
        }




        case 'merge-video':
            const { audioWorker: audioWorkerMerge } = await import('@/workers/audio-worker-client');
            result = await audioWorkerMerge.instance.executeTask('merge-video', {
                files: files
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'apng-to-gif':
            const { audioWorker: audioWorkerApng } = await import('@/workers/audio-worker-client');
            result = await audioWorkerApng.instance.executeTask('apng-to-gif', {
                file: fileData,
                fps: options.fps || 15
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;
        case 'gif-to-apng':
            const { audioWorker: audioWorkerGifApng } = await import('@/workers/audio-worker-client');
            result = await audioWorkerGifApng.instance.executeTask('gif-to-apng', {
                file: fileData
            }, files[0].name, [], bundle, onChunk, onProgress, signal);
            break;

        case 'avif-converter':
        case 'jpg-to-avif':
            const { convertImagesWithWasm: avifConvert } = await import('@/lib/wasm/feature-image');
            const avifQuality = options.quality ? options.quality / 100 : 0.85;
            const avifResult = await avifConvert(files, {
                targetFormat: 'avif',
                quality: avifQuality,
            }, (p) => onProgress?.(p, 'Encoding AVIF...'));

            result = {
                buffer: avifResult.buffer,
                filename: avifResult.filename,
                original_size: files.reduce((acc, f) => acc + f.size, 0),
                compressed_size: avifResult.buffer.byteLength,
                reduction_percent: 0
            };
            break;



        case 'rar-to-zip':
        case '7z-to-zip':
        case 'tar-to-zip':
            const { ArchiveWorker } = await import('@/lib/wasm/archive-worker');
            const archWorker = new ArchiveWorker();
            onProgress?.(10, 'Extracting archive...');
            const extractedFiles = await archWorker.extract(files[0], (p) => onProgress?.(10 + p * 0.4));
            onProgress?.(50, 'Creating ZIP...');
            const zipBlob = await archWorker.createZip(extractedFiles, (p) => onProgress?.(50 + p * 0.5));
            result = {
                buffer: await zipBlob.arrayBuffer(),
                filename: files[0].name.replace(/\.[^.]+$/, '.zip'),
                original_size: files[0].size,
                compressed_size: zipBlob.size,
                reduction_percent: 0
            };
            break;

        default:
            throw new Error(`Tool ${toolId} not supported for local processing.`);
    }

    if (!result.buffer) {
        throw new Error("Worker did not return a file buffer.");
    }

    // Determine mime type
    let mimeType = 'application/octet-stream';
    if (result.filename.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (result.filename.endsWith('.zip')) mimeType = 'application/zip';
    else if (result.filename.endsWith('.jpg') || result.filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (result.filename.endsWith('.png')) mimeType = 'image/png';
    else if (result.filename.endsWith('.webp')) mimeType = 'image/webp';
    else if (result.filename.endsWith('.mp3')) mimeType = 'audio/mpeg';
    else if (result.filename.endsWith('.wav')) mimeType = 'audio/wav';
    else if (result.filename.endsWith('.m4a')) mimeType = 'audio/mp4';
    else if (result.filename.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (result.filename.endsWith('.epub')) mimeType = 'application/epub+zip';

    const blob = new Blob([result.buffer], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    // === CBEE: Track File Write ===
    tracker.recordUsage(
        'file.write' as any,
        result.filename,
        { bytes: result.buffer.byteLength, file_count: 1 }
    );

    // === CBEE: Record Output Provenance ===
    const outputHash = await calculateHash(result.buffer);
    tracker.recordProvenance('output', outputHash);

    // === CBEE: Generate Execution Receipt ===
    const receipt = tracker.generateReceipt();
    console.log('[CBEE] Execution complete. Receipt:', receipt);

    return {
        job_id: `local-${Date.now()}`,
        filename: result.filename,
        download_url: downloadUrl,
        original_size: result.original_size,
        compressed_size: result.compressed_size,
        reduction_percent: result.reduction_percent,
        is_ghost_mode: true,
        capability_bundle: bundle,
        execution_receipt: receipt,
    };
};
