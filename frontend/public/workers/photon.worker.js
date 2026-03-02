/**
 * Photon WASM Worker
 * 
 * High-performance image processing using photon-rs WASM.
 * Provides 4-10x faster image operations than Canvas API.
 */

/* eslint-disable no-restricted-globals */

let photonModule = null;
let isInitialized = false;
let initPromise = null;

/**
 * Initialize the photon WASM module
 */
async function initPhoton() {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            // Dynamic import of the wasm-bindgen glue code
            // The glue code exports an init function that loads the WASM
            const wasmUrl = '/wasm/image-photon/converter_image_bg.wasm';

            // Import the JS glue module
            const glue = await import('/wasm/image-photon/converter_image.js');

            // Initialize WASM with the module path
            await glue.default(wasmUrl);

            photonModule = glue;
            isInitialized = true;
            console.log('[PhotonWorker] WASM module initialized');
        } catch (error) {
            console.error('[PhotonWorker] Failed to initialize WASM:', error);
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Detect if GPU should be used for this operation
 */
async function canUseGPU(payload) {
    if (!payload.useGpu) return false;
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;

    // Check if device is flagged as slow in this session
    // (Note: Workers might not have access to sessionStorage depending on browser, 
    // so we trust the payload flag which comes from main thread detection)
    return true;
}

/**
 * Handle incoming messages
 */
self.onmessage = async (e) => {
    const { id, type, payload } = e.data;

    try {
        let result;

        // Certain operations can opt-in to WebGPU
        const useGpu = await canUseGPU(payload);

        if (useGpu && type === 'filter' && payload.filter === 'grayscale') {
            result = await handleGpuGrayscale(payload, id);
        } else {
            // Default WASM path
            await initPhoton();
            switch (type) {
                case 'convert':
                    result = await handleConvert(payload, id);
                    break;
                case 'resize':
                    result = await handleResize(payload, id);
                    break;
                case 'rotate':
                    result = await handleRotate(payload, id);
                    break;
                case 'flip':
                    result = await handleFlip(payload, id);
                    break;
                case 'crop':
                    result = await handleCrop(payload, id);
                    break;
                case 'filter':
                    result = await handleFilter(payload, id);
                    break;
                case 'adjust':
                    result = await handleAdjust(payload, id);
                    break;
                default:
                    throw new Error(`Unknown operation: ${type}`);
            }
        }

        // Send result with transferable
        const transferables = [];
        if (result.buffer instanceof ArrayBuffer) {
            transferables.push(result.buffer);
        }

        self.postMessage({ id, type: 'success', result }, transferables);
    } catch (error) {
        console.error('[PhotonWorker] Error:', error);
        self.postMessage({
            id,
            type: 'error',
            error: error.message || 'Unknown error'
        });
    }
};

/**
 * WebGPU implementation of grayscale
 */
async function handleGpuGrayscale(payload, id) {
    const { fileData, outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Initializing GPU...');

    // We still need Photon to decode the image and encode the result 
    // because WebGPU doesn't handle JPEG/PNG decoding natively.
    await initPhoton();
    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);
    const width = img.get_width();
    const height = img.get_height();
    const rawPixels = img.get_raw_pixels();

    reportProgress(id, 30, 'Running GPU Compute Shader...');

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const shaderCode = `
        @group(0) @binding(0) var<storage, read> input : array<u32>;
        @group(0) @binding(1) var<storage, read_write> output : array<u32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            let idx = global_id.x;
            if (idx >= arrayLength(&input)) { return; }

            let pixel = input[idx];
            let r = f32(pixel & 0xffu);
            let g = f32((pixel >> 8u) & 0xffu);
            let b = f32((pixel >> 16u) & 0xffu);
            let a = (pixel >> 24u) & 0xffu;

            let gray = u32(r * 0.299 + g * 0.587 + b * 0.114);
            output[idx] = gray | (gray << 8u) | (gray << 16u) | (a << 24u);
        }
    `;

    const module = device.createShaderModule({ code: shaderCode });
    const pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: { module, entryPoint: 'main' }
    });

    const bufferSize = rawPixels.byteLength;
    const inputBuffer = device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const outputBuffer = device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
    const readBuffer = device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

    device.queue.writeBuffer(inputBuffer, 0, rawPixels);

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: inputBuffer } },
            { binding: 1, resource: { buffer: outputBuffer } }
        ]
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(width * height / 64));
    passEncoder.end();

    commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, bufferSize);
    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const processedPixels = new Uint8Array(readBuffer.getMappedRange().slice(0));
    readBuffer.unmap();

    reportProgress(id, 80, 'Encoding output...');

    // Put pixels back into a PhotonImage for encoding
    const outputImg = photonModule.PhotonImage.new_from_byteslice(processedPixels, width, height);

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = outputImg.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = outputImg.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = outputImg.get_bytes();
            ext = 'png';
    }

    img.free();
    outputImg.free();
    device.destroy();

    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `gpu_grayscale.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength
    };
}

/**
 * Convert image format
 */
async function handleConvert(payload, id) {
    const { fileData, targetFormat, quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    // Create PhotonImage from bytes
    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 50, 'Converting format...');

    let outputBytes;
    let ext;

    switch (targetFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = img.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'png':
            outputBytes = img.get_bytes();
            ext = 'png';
            break;
        case 'webp':
            outputBytes = img.get_bytes_webp();
            ext = 'webp';
            break;
        case 'avif':
            // Use the enhanced process_image function for AVIF
            img.free(); // Free the photon image first to save memory
            outputBytes = photonModule.process_image(inputBytes, 'convert', { format: 'avif', quality });
            ext = 'avif';
            return {
                buffer: outputBytes.buffer,
                filename: `converted.${ext}`,
                originalSize: fileData.byteLength,
                outputSize: outputBytes.byteLength
            };
        default:
            // Fallback to PNG
            outputBytes = img.get_bytes();
            ext = 'png';
    }

    // Cleanup
    img.free();

    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `converted.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength
    };
}

/**
 * Resize image
 */
async function handleResize(payload, id) {
    const { fileData, width, height, samplingFilter = 5, outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 30, 'Resizing image...');

    // photon.resize(img, width, height, samplingFilter)
    // samplingFilter: 1=Nearest, 2=Triangle, 3=CatmullRom, 4=Gaussian, 5=Lanczos3
    const resizedImg = photonModule.resize(img, width, height, samplingFilter);
    img.free();

    reportProgress(id, 70, 'Encoding output...');

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = resizedImg.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = resizedImg.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = resizedImg.get_bytes();
            ext = 'png';
    }

    resizedImg.free();
    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `resized_${width}x${height}.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength,
        width,
        height
    };
}

/**
 * Rotate image (90, 180, 270 degrees)
 */
async function handleRotate(payload, id) {
    const { fileData, angle = 90, outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 30, 'Rotating image...');

    // Convert angle to rotations (90 degrees each)
    // photon.rotate expects number of 90-degree rotations
    const rotations = Math.round((angle % 360) / 90);
    const rotatedImg = photonModule.rotate(img, rotations);
    img.free();

    reportProgress(id, 70, 'Encoding output...');

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = rotatedImg.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = rotatedImg.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = rotatedImg.get_bytes();
            ext = 'png';
    }

    rotatedImg.free();
    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `rotated_${angle}deg.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength
    };
}

/**
 * Flip image (horizontal or vertical)
 */
async function handleFlip(payload, id) {
    const { fileData, direction = 'horizontal', outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 30, 'Flipping image...');

    if (direction === 'horizontal') {
        photonModule.fliph(img);
    } else {
        photonModule.flipv(img);
    }

    reportProgress(id, 70, 'Encoding output...');

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = img.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = img.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = img.get_bytes();
            ext = 'png';
    }

    img.free();
    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `flipped_${direction}.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength
    };
}

/**
 * Crop image
 */
async function handleCrop(payload, id) {
    const { fileData, x1, y1, x2, y2, outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 30, 'Cropping image...');

    const croppedImg = photonModule.crop(img, x1, y1, x2, y2);
    img.free();

    reportProgress(id, 70, 'Encoding output...');

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = croppedImg.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = croppedImg.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = croppedImg.get_bytes();
            ext = 'png';
    }

    croppedImg.free();
    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `cropped.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength,
        width: x2 - x1,
        height: y2 - y1
    };
}

/**
 * Apply filter to image
 */
async function handleFilter(payload, id) {
    const { fileData, filter, outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 30, `Applying ${filter} filter...`);

    // Apply filter based on name
    switch (filter.toLowerCase()) {
        case 'grayscale':
            photonModule.grayscale(img);
            break;
        case 'sepia':
            photonModule.sepia(img);
            break;
        case 'invert':
            photonModule.invert(img);
            break;
        case 'blur':
            photonModule.box_blur(img);
            break;
        case 'sharpen':
            photonModule.sharpen(img);
            break;
        case 'emboss':
            photonModule.emboss(img);
            break;
        case 'edge_detection':
            photonModule.edge_detection(img);
            break;
        case 'noise_reduction':
            photonModule.noise_reduction(img);
            break;
        // Preset filters
        case 'oceanic':
            photonModule.oceanic(img);
            break;
        case 'islands':
            photonModule.islands(img);
            break;
        case 'marine':
            photonModule.marine(img);
            break;
        case 'seagreen':
            photonModule.seagreen(img);
            break;
        case 'cali':
            photonModule.cali(img);
            break;
        case 'dramatic':
            photonModule.dramatic(img);
            break;
        case 'firenze':
            photonModule.firenze(img);
            break;
        case 'golden':
            photonModule.golden(img);
            break;
        case 'lix':
            photonModule.lix(img);
            break;
        case 'lofi':
            photonModule.lofi(img);
            break;
        case 'neue':
            photonModule.neue(img);
            break;
        case 'obsidian':
            photonModule.obsidian(img);
            break;
        case 'pastel_pink':
            photonModule.pastel_pink(img);
            break;
        case 'ryo':
            photonModule.ryo(img);
            break;
        default:
            console.warn(`Unknown filter: ${filter}, skipping`);
    }

    reportProgress(id, 70, 'Encoding output...');

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = img.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = img.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = img.get_bytes();
            ext = 'png';
    }

    img.free();
    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `${filter}_applied.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength
    };
}

/**
 * Adjust image properties (brightness, contrast, saturation)
 */
async function handleAdjust(payload, id) {
    const { fileData, brightness, contrast, saturation, outputFormat = 'jpeg', quality = 85 } = payload;

    reportProgress(id, 10, 'Loading image...');

    const inputBytes = new Uint8Array(fileData);
    const img = photonModule.PhotonImage.new_from_byteslice(inputBytes);

    reportProgress(id, 30, 'Adjusting image...');

    if (brightness !== undefined && brightness !== 0) {
        photonModule.adjust_brightness(img, brightness);
    }

    if (contrast !== undefined && contrast !== 0) {
        photonModule.adjust_contrast(img, contrast);
    }

    if (saturation !== undefined && saturation !== 0) {
        // Use HSL saturation
        const level = saturation / 100; // Convert to 0-1 range
        if (level > 0) {
            photonModule.saturate_hsl(img, level);
        } else {
            photonModule.desaturate_hsl(img, Math.abs(level));
        }
    }

    reportProgress(id, 70, 'Encoding output...');

    let outputBytes;
    let ext;
    switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            outputBytes = img.get_bytes_jpeg(quality);
            ext = 'jpg';
            break;
        case 'webp':
            outputBytes = img.get_bytes_webp();
            ext = 'webp';
            break;
        default:
            outputBytes = img.get_bytes();
            ext = 'png';
    }

    img.free();
    reportProgress(id, 100, 'Complete');

    return {
        buffer: outputBytes.buffer,
        filename: `adjusted.${ext}`,
        originalSize: fileData.byteLength,
        outputSize: outputBytes.byteLength
    };
}

/**
 * Report progress to main thread
 */
function reportProgress(id, percent, message) {
    self.postMessage({
        id,
        type: 'progress',
        progress: percent,
        message
    });
}
