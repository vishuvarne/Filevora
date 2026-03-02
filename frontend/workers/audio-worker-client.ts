export class AudioWorkerClient {
    private worker: Worker | null = null;
    private tasks: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();
    private isFFmpegLoaded: boolean = false;
    private idleTimer: NodeJS.Timeout | null = null;
    private readonly IDLE_TIMEOUT_MS = 1000 * 60 * 5; // 5 Minutes

    private getWorker(): Worker {
        this.clearIdleTermination();
        if (!this.worker) {
            this.worker = new Worker(`/workers/audio.worker.js?v=${Date.now()}`);
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = (err: ErrorEvent) => {
                console.error("Audio Worker Error:", err);
                this.tasks.forEach((task, id) => {
                    task.reject(new Error("Worker crashed or failed to load ffmpeg."));
                });
                this.tasks.clear();
                this.worker = null;
                this.isFFmpegLoaded = false;
            };
        }
        return this.worker;
    }

    public init() {
        this.getWorker();
    }

    private clearIdleTermination() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    private scheduleIdleTermination() {
        if (this.tasks.size === 0 && !this.idleTimer) {
            this.idleTimer = setTimeout(() => {
                console.log("[AudioWorkerClient] Terminating worker due to inactivity.");
                this.terminate();
            }, this.IDLE_TIMEOUT_MS);
        }
    }

    private handleMessage(e: MessageEvent) {
        const { type, jobId, result, error, progress } = e.data;

        // Handle progress updates (optional, ffmpeg can report progress)
        if (type === 'progress' && progress !== undefined) {
            // Could emit progress events here
            return;
        }

        const task = this.tasks.get(jobId);

        if (!task) return;

        if (type === 'success') {
            this.isFFmpegLoaded = true; // Mark as loaded after first success
            task.resolve(result);
        } else {
            task.reject(new Error(error || "Unknown worker error"));
        }

        this.tasks.delete(jobId);

        if (this.tasks.size === 0) {
            this.scheduleIdleTermination();
        }
    }

    // Note: transferables argument is ignored to enforce stability (copy only)
    public async executeTask(
        taskType: string,
        payload: any,
        filename: string,
        transferables: Transferable[] = [],
        capabilityBundle?: import('@/lib/cbee/capability-types').CapabilityBundle,
        onChunk?: (chunk: any) => void,
        onProgress?: (percent: number, message?: string) => void,
        signal?: AbortSignal
    ): Promise<any> {
        this.clearIdleTermination();

        // === CBEE: Verify Capability (Mechanical Enforcement) ===
        if (capabilityBundle) {
            const { verifyCapability } = await import('@/lib/cbee/worker-capability-verifier');
            const { CapabilityType } = await import('@/lib/cbee/capability-types');

            // Map task types to capability types
            const capMap: Record<string, import('@/lib/cbee/capability-types').CapabilityType> = {
                'mp4-to-mp3': CapabilityType.FILE_READ,
                'audio-trim': CapabilityType.FILE_READ,
                'audio-compress': CapabilityType.FILE_READ,
                'video-to-gif': CapabilityType.CPU_EXECUTE,
                'mp4-to-gif': CapabilityType.CPU_EXECUTE,
                'gif-to-mp4': CapabilityType.CPU_EXECUTE,
            };

            const capType = capMap[taskType];
            if (capType) {
                const check = verifyCapability(capabilityBundle, capType, '*');
                if (!check.allowed) {
                    throw new Error(`CBEE Violation: ${check.violation}`);
                }
            }
        }

        const worker = this.getWorker();
        const jobId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(new Error("Task aborted"));
            const onAbort = () => {
                this.terminate();
                reject(new Error("Task cancelled"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });

            this.tasks.set(jobId, { resolve, reject });
            worker.postMessage({
                type: taskType,
                payload: { ...payload, filename },
                jobId,
                capabilityBundle
            }); // removed transferables
        });
    }

    public isLoaded(): boolean {
        return this.isFFmpegLoaded;
    }

    public terminate() {
        this.clearIdleTermination();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isFFmpegLoaded = false;
        }
        if (this.tasks.size > 0) {
            const err = new Error("Worker terminated");
            this.tasks.forEach(t => t.reject(err));
            this.tasks.clear();
        }
    }
}

// Lazy singleton instance to prevent SSR issues
let _audioWorkerInstance: AudioWorkerClient | null = null;

export function getAudioWorker(): AudioWorkerClient {
    if (typeof window === 'undefined') {
        throw new Error('AudioWorker can only be used in browser environment');
    }
    if (!_audioWorkerInstance) {
        _audioWorkerInstance = new AudioWorkerClient();
    }
    return _audioWorkerInstance;
}

// For backward compatibility
export const audioWorker = {
    get instance() {
        return getAudioWorker();
    }
};
