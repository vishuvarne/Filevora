/**
 * Photon Worker Client
 * 
 * TypeScript wrapper for the photon WASM worker.
 * Provides a clean async API for high-performance image processing.
 */

export interface PhotonConvertOptions {
    targetFormat: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number; // 1-100 for JPEG
}

export interface PhotonResizeOptions {
    width: number;
    height: number;
    samplingFilter?: 1 | 2 | 3 | 4 | 5; // 1=Nearest, 2=Triangle, 3=CatmullRom, 4=Gaussian, 5=Lanczos3
    outputFormat?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number;
}

export interface PhotonRotateOptions {
    angle: 90 | 180 | 270;
    outputFormat?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number;
}

export interface PhotonFlipOptions {
    direction: 'horizontal' | 'vertical';
    outputFormat?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number;
}

export interface PhotonCropOptions {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    outputFormat?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number;
}

export type PhotonFilter =
    | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'sharpen' | 'emboss'
    | 'edge_detection' | 'noise_reduction'
    // Preset filters
    | 'oceanic' | 'islands' | 'marine' | 'seagreen' | 'cali' | 'dramatic'
    | 'firenze' | 'golden' | 'lix' | 'lofi' | 'neue' | 'obsidian'
    | 'pastel_pink' | 'ryo';

export interface PhotonFilterOptions {
    filter: PhotonFilter;
    outputFormat?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number;
    useGpu?: boolean;
}

export interface PhotonAdjustOptions {
    brightness?: number; // -255 to 255
    contrast?: number;   // -255 to 255
    saturation?: number; // -100 to 100
    outputFormat?: 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';
    quality?: number;
    useGpu?: boolean;
}

export interface PhotonResult {
    buffer: ArrayBuffer;
    filename: string;
    originalSize: number;
    outputSize: number;
    width?: number;
    height?: number;
}

type ProgressCallback = (percent: number, message?: string) => void;

interface PendingRequest {
    resolve: (result: PhotonResult) => void;
    reject: (error: Error) => void;
    onProgress?: ProgressCallback;
}

/**
 * Photon Worker Client
 * 
 * Singleton class that manages communication with the photon worker.
 */
class PhotonWorkerClient {
    private worker: Worker | null = null;
    private pending = new Map<string, PendingRequest>();
    private idCounter = 0;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the worker
     */
    private async init(): Promise<void> {
        if (this.worker) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            try {
                this.worker = new Worker('/workers/photon.worker.js', { type: 'module' });
                this.worker.onmessage = this.handleMessage.bind(this);
                this.worker.onerror = (e) => {
                    console.error('[PhotonClient] Worker error:', e);
                    reject(new Error(e.message));
                };
                // Wait a tick for worker to be ready
                setTimeout(resolve, 100);
            } catch (error) {
                reject(error);
            }
        });

        return this.initPromise;
    }

    /**
     * Handle messages from worker
     */
    private handleMessage(e: MessageEvent): void {
        const { id, type, result, error, progress, message } = e.data;

        const pending = this.pending.get(id);
        if (!pending) return;

        if (type === 'progress') {
            pending.onProgress?.(progress, message);
            return;
        }

        this.pending.delete(id);

        if (type === 'error') {
            pending.reject(new Error(error));
        } else if (type === 'success') {
            pending.resolve(result);
        }
    }

    /**
     * Send a request to the worker
     */
    private async send<T>(
        type: string,
        payload: any,
        onProgress?: ProgressCallback
    ): Promise<T> {
        await this.init();

        return new Promise((resolve, reject) => {
            const id = String(++this.idCounter);

            this.pending.set(id, {
                resolve: resolve as any,
                reject,
                onProgress
            });

            // Extract transferables
            const transferables: Transferable[] = [];
            if (payload.fileData instanceof ArrayBuffer) {
                transferables.push(payload.fileData);
            }

            this.worker!.postMessage({ id, type, payload }, transferables);
        });
    }

    /**
     * Convert image format
     */
    async convert(
        file: File | ArrayBuffer,
        options: PhotonConvertOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('convert', {
            fileData,
            targetFormat: options.targetFormat,
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Resize image
     */
    async resize(
        file: File | ArrayBuffer,
        options: PhotonResizeOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('resize', {
            fileData,
            width: options.width,
            height: options.height,
            samplingFilter: options.samplingFilter ?? 5, // Lanczos3 default
            outputFormat: options.outputFormat ?? 'jpeg',
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Rotate image
     */
    async rotate(
        file: File | ArrayBuffer,
        options: PhotonRotateOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('rotate', {
            fileData,
            angle: options.angle,
            outputFormat: options.outputFormat ?? 'jpeg',
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Flip image
     */
    async flip(
        file: File | ArrayBuffer,
        options: PhotonFlipOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('flip', {
            fileData,
            direction: options.direction,
            outputFormat: options.outputFormat ?? 'jpeg',
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Crop image
     */
    async crop(
        file: File | ArrayBuffer,
        options: PhotonCropOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('crop', {
            fileData,
            x1: options.x1,
            y1: options.y1,
            x2: options.x2,
            y2: options.y2,
            outputFormat: options.outputFormat ?? 'jpeg',
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Apply filter to image
     */
    async applyFilter(
        file: File | ArrayBuffer,
        options: PhotonFilterOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('filter', {
            fileData,
            filter: options.filter,
            outputFormat: options.outputFormat ?? 'jpeg',
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Adjust image properties (brightness, contrast, saturation)
     */
    async adjust(
        file: File | ArrayBuffer,
        options: PhotonAdjustOptions,
        onProgress?: ProgressCallback
    ): Promise<PhotonResult> {
        const fileData = file instanceof File ? await file.arrayBuffer() : file;
        return this.send('adjust', {
            fileData,
            brightness: options.brightness,
            contrast: options.contrast,
            saturation: options.saturation,
            outputFormat: options.outputFormat ?? 'jpeg',
            quality: options.quality ?? 85
        }, onProgress);
    }

    /**
     * Terminate the worker
     */
    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pending.clear();
        this.initPromise = null;
    }

    /**
     * Check if photon WASM is supported
     */
    static isSupported(): boolean {
        return typeof WebAssembly !== 'undefined' && typeof Worker !== 'undefined';
    }
}

// Singleton instance
export const photonWorker = new PhotonWorkerClient();

// Also export the class for testing
export { PhotonWorkerClient };
