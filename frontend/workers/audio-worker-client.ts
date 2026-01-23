export class AudioWorkerClient {
    private worker: Worker | null = null;
    private tasks: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();
    private isFFmpegLoaded: boolean = false;

    private getWorker(): Worker {
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
    }

    // Note: transferables argument is ignored to enforce stability (copy only)
    public async executeTask(taskType: string, payload: any, filename: string, transferables: Transferable[] = []): Promise<any> {
        const worker = this.getWorker();
        const jobId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            this.tasks.set(jobId, { resolve, reject });
            worker.postMessage({
                type: taskType,
                payload: { ...payload, filename },
                jobId
            }); // removed transferables
        });
    }

    public isLoaded(): boolean {
        return this.isFFmpegLoaded;
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isFFmpegLoaded = false;
        }
    }
}

export const audioWorker = new AudioWorkerClient();
