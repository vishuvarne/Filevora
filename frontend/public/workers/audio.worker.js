/* eslint-disable no-restricted-globals */
// Audio Worker using ffmpeg.wasm
// Lazy-loaded on first use

let ffmpegLoaded = false;
let ffmpeg = null;

// Import ffmpeg from CDN
importScripts('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js');

const { FFmpeg } = self.FFmpegWASM;

async function loadFFmpeg() {
    if (ffmpegLoaded && ffmpeg) return ffmpeg;

    try {
        ffmpeg = new FFmpeg();

        // Load ffmpeg core
        await ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js'
        });

        ffmpegLoaded = true;
        return ffmpeg;
    } catch (error) {
        throw new Error('Failed to load ffmpeg: ' + error.message);
    }
}

self.onmessage = async (e) => {
    const { type, payload, jobId } = e.data;

    try {
        let result;

        switch (type) {
            case 'mp4-to-mp3':
                result = await convertToMP3(payload.file, payload.filename);
                break;
            case 'audio-trim':
                result = await trimAudio(payload.file, payload.filename, payload.startTime, payload.endTime);
                break;
            case 'audio-compress':
                result = await compressAudio(payload.file, payload.filename, payload.bitrate);
                break;
            case 'video-to-gif':
            case 'mp4-to-gif':
            case 'webm-to-gif':
            case 'mov-to-gif':
            case 'avi-to-gif':
                result = await convertToGIF(payload.file, payload.filename, payload.fps, payload.width);
                break;
            case 'gif-to-mp4':
                result = await convertGIFToMP4(payload.file, payload.filename);
                break;
            default:
                throw new Error(`Unknown worker action: ${type}`);
        }

        self.postMessage({ type: 'success', jobId, result });
    } catch (error) {
        console.error("Audio Worker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};

async function convertToMP3(fileBuffer, originalFilename) {
    const ffmpegInstance = await loadFFmpeg();

    // Determine input extension
    const inputExt = originalFilename.split('.').pop() || 'mp4';
    const inputName = `input.${inputExt}`;
    const outputName = 'output.mp3';

    // Write input file to ffmpeg filesystem
    await ffmpegInstance.writeFile(inputName, new Uint8Array(fileBuffer));

    // Convert to MP3 (high quality: 320kbps)
    await ffmpegInstance.exec([
        '-i', inputName,
        '-vn', // No video
        '-ar', '44100', // Sample rate
        '-ac', '2', // Stereo
        '-b:a', '320k', // Bitrate
        outputName
    ]);

    // Read output file
    const data = await ffmpegInstance.readFile(outputName);

    // Cleanup
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);

    return {
        buffer: data.buffer,
        filename: originalFilename.replace(/\.[^.]+$/, '.mp3'),
        originalSize: fileBuffer.byteLength,
        compressedSize: data.byteLength,
        reductionPercent: 0
    };
}

async function trimAudio(fileBuffer, originalFilename, startTime = 0, endTime = null) {
    const ffmpegInstance = await loadFFmpeg();

    const inputExt = originalFilename.split('.').pop() || 'mp3';
    const inputName = `input.${inputExt}`;
    const outputName = `output.${inputExt}`;

    await ffmpegInstance.writeFile(inputName, new Uint8Array(fileBuffer));

    // Build ffmpeg command
    const cmd = ['-i', inputName];

    if (startTime > 0) {
        cmd.push('-ss', startTime.toString());
    }

    if (endTime !== null && endTime > startTime) {
        cmd.push('-t', (endTime - startTime).toString());
    }

    cmd.push('-c', 'copy'); // Copy codec (fast)
    cmd.push(outputName);

    await ffmpegInstance.exec(cmd);

    const data = await ffmpegInstance.readFile(outputName);

    // Cleanup
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);

    return {
        buffer: data.buffer,
        filename: originalFilename.replace(/\.[^.]+$/, `_trimmed.${inputExt}`),
        originalSize: fileBuffer.byteLength,
        compressedSize: data.byteLength,
        reductionPercent: 0
    };
}

async function compressAudio(fileBuffer, originalFilename, bitrate = '128k') {
    const ffmpegInstance = await loadFFmpeg();

    const inputExt = originalFilename.split('.').pop() || 'mp3';
    const inputName = `input.${inputExt}`;
    const outputName = 'output.mp3';

    await ffmpegInstance.writeFile(inputName, new Uint8Array(fileBuffer));

    await ffmpegInstance.exec([
        '-i', inputName,
        '-b:a', bitrate,
        outputName
    ]);

    const data = await ffmpegInstance.readFile(outputName);

    // Cleanup
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);

    const reduction = ((fileBuffer.byteLength - data.byteLength) / fileBuffer.byteLength) * 100;

    return {
        buffer: data.buffer,
        filename: originalFilename.replace(/\.[^.]+$/, '_compressed.mp3'),
        originalSize: fileBuffer.byteLength,
        compressedSize: data.byteLength,
        reductionPercent: Math.max(0, Math.round(reduction))
    };
}

async function convertToGIF(fileBuffer, originalFilename, fps = 10, width = 480) {
    const ffmpegInstance = await loadFFmpeg();

    const inputExt = originalFilename.split('.').pop() || 'mp4';
    const inputName = `input.${inputExt}`;
    const outputName = 'output.gif';

    await ffmpegInstance.writeFile(inputName, new Uint8Array(fileBuffer));

    // Convert to GIF with quality optimization
    // fps: frames per second (lower = smaller file)
    // width: output width (smaller = smaller file)
    await ffmpegInstance.exec([
        '-i', inputName,
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop', '0',
        outputName
    ]);

    const data = await ffmpegInstance.readFile(outputName);

    // Cleanup
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);

    return {
        buffer: data.buffer,
        filename: originalFilename.replace(/\.[^.]+$/, '.gif'),
        originalSize: fileBuffer.byteLength,
        compressedSize: data.byteLength,
        reductionPercent: 0
    };
}

async function convertGIFToMP4(fileBuffer, originalFilename) {
    const ffmpegInstance = await loadFFmpeg();

    const inputName = 'input.gif';
    const outputName = 'output.mp4';

    await ffmpegInstance.writeFile(inputName, new Uint8Array(fileBuffer));

    // Convert GIF to MP4 with good quality
    await ffmpegInstance.exec([
        '-i', inputName,
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        outputName
    ]);

    const data = await ffmpegInstance.readFile(outputName);

    // Cleanup
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);

    return {
        buffer: data.buffer,
        filename: originalFilename.replace(/\.gif$/, '.mp4'),
        originalSize: fileBuffer.byteLength,
        compressedSize: data.byteLength,
        reductionPercent: 0
    };
}

