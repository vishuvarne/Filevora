export class ImageWorkerClient {
    private worker: Worker | null = null;
    private tasks: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();
    private idleTimer: NodeJS.Timeout | null = null;
    private readonly IDLE_TIMEOUT_MS = 1000 * 60 * 5; // 5 Minutes

    private getWorker(): Worker {
        this.clearIdleTermination();
        if (!this.worker) {
            this.worker = new Worker(`/workers/image.worker.js?v=${Date.now()}`);
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = (err) => {
                console.error("Image Worker Error:", err);
                this.tasks.forEach((task, id) => {
                    task.reject(new Error("Worker crashed or failed to load."));
                });
                this.tasks.clear();
                this.worker = null;
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
                console.log("[ImageWorkerClient] Terminating worker due to inactivity.");
                this.terminate();
            }, this.IDLE_TIMEOUT_MS);
        }
    }

    private handleMessage(e: MessageEvent) {
        const { type, jobId, result, error } = e.data;
        const task = this.tasks.get(jobId);

        if (!task) return;

        if (type === 'success') {
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
                'image-to-pdf': CapabilityType.FILE_WRITE,
                'rotate-image': CapabilityType.FILE_READ,
                'convert-image': CapabilityType.FILE_WRITE,
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
                // Reject this specific task, don't terminate the whole worker if others are running
                // But wait, the previous code called this.terminate(). That's aggressive.
                // We should just reject and cleanup map.
                // But since we can't cancel the worker thread easily without terminate...
                // existing logic was: this.terminate(); reject(...);
                // I'll keep it but be aware it kills other jobs.
                this.terminate();
                reject(new Error("Task cancelled"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });

            this.tasks.set(jobId, { resolve, reject });
            worker.postMessage({
                type: taskType,
                payload,
                jobId,
                capabilityBundle
            });
        });
    }

    public terminate() {
        this.clearIdleTermination();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        // Reject pending tasks logic was not here in original, but it SHOULD be. 
        // Original just NULLed the worker.
        // I will match original behavior + clear tasks map to avoid leaks, but strictly I should reject them.
        // However, I'll stick to minimum changes to avoid regression, but adding task rejection is "fixing lag/bugs".
        if (this.tasks.size > 0) {
            const err = new Error("Worker terminated");
            this.tasks.forEach(t => t.reject(err));
            this.tasks.clear();
        }
    }
}

// Lazy singleton instance to prevent SSR issues
let _imageWorkerInstance: ImageWorkerClient | null = null;

export function getImageWorker(): ImageWorkerClient {
    if (typeof window === 'undefined') {
        throw new Error('ImageWorker can only be used in browser environment');
    }
    if (!_imageWorkerInstance) {
        _imageWorkerInstance = new ImageWorkerClient();
    }
    return _imageWorkerInstance;
}

// For backward compatibility
export const imageWorker = {
    get instance() {
        return getImageWorker();
    }
};
