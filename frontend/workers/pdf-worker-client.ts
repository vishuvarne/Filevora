interface PDFTaskResult {
    blob: Blob;
    fileName?: string;
    [key: string]: any;
}

interface WorkerMessageData {
    type: 'progress' | 'chunk' | 'success' | 'error';
    jobId: string;
    result?: any;
    error?: string;
    percent?: number;
    message?: string;
    chunk?: any;
}

interface TaskDef {
    resolve: (val: any) => void;
    reject: (err: Error) => void;
    onChunk?: (chunk: any) => void;
    onProgress?: (percent: number, message?: string) => void;
    watchdog?: NodeJS.Timeout;
}

interface QueueItem {
    jobId: string;
    taskType: string;
    payload: any;
    transferables: Transferable[];
    capabilityBundle?: any;
    priority: boolean;
}

export class PDFWorkerClient {
    private worker: Worker | null = null;
    private workerTaskType?: string;
    private tasks: Map<string, TaskDef> = new Map();

    // Queue management for memory-heavy tasks
    private queue: QueueItem[] = [];
    private activeHeavyJobs = 0;
    private readonly MAX_CONCURRENT_HEAVY = 1;
    private idleTimer: NodeJS.Timeout | null = null;
    private readonly IDLE_TIMEOUT_MS = 1000 * 60 * 5; // 5 Minutes

    private getWorker(taskType?: string): Worker {
        this.clearIdleTermination();

        if (this.worker && this.workerTaskType !== taskType && taskType) {
            // If the requested task requires a different worker, terminate the current one
            // This ensures we don't keep mixing mega workers and split workers
            if (this.tasks.size === 0) {
                this.terminate();
            }
        }

        if (!this.worker) {
            this.workerTaskType = taskType;
            let workerInit: Worker;

            // Route to specific tiny Split Workers
            if (taskType === 'merge-pdf') {
                workerInit = new Worker(new URL('./MergeWorker.ts', import.meta.url), { type: 'module' });
            } else if (taskType === 'split-pdf') {
                workerInit = new Worker(new URL('./SplitWorker.ts', import.meta.url), { type: 'module' });
            } else if (taskType === 'pdf-to-image') {
                workerInit = new Worker(new URL('./RenderWorker.ts', import.meta.url), { type: 'module' });
            } else {
                // Fallback to legacy mega worker
                workerInit = new Worker(`/workers/pdf.host.worker.js?v=\${Date.now()}`);
            }

            this.worker = workerInit;
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = (err: ErrorEvent) => {
                console.error("Worker Error:", err);

                // CRITICAL: Reject all pending tasks and clear queue on crash
                const error = new Error("Worker crashed unexpectedly.");
                this.tasks.forEach((task) => task.reject(error));
                this.tasks.clear();
                this.queue = [];
                this.activeHeavyJobs = 0; // Reset slot

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
        if (this.tasks.size === 0 && this.queue.length === 0 && !this.idleTimer) {
            // console.log("[PDFWorkerClient] Scheduling idle termination in 5m...");
            this.idleTimer = setTimeout(() => {
                console.log("[PDFWorkerClient] Terminating worker due to inactivity.");
                this.terminate();
            }, this.IDLE_TIMEOUT_MS);
        }
    }

    private handleMessage(e: MessageEvent) {
        const data = e.data as WorkerMessageData;
        const { type, jobId, result, error } = data;
        const task = this.tasks.get(jobId);

        if (type === 'progress') {
            task?.onProgress?.(data.percent || 0, data.message);
            return;
        }

        if (type === 'chunk') {
            task?.onChunk?.(data.chunk);
            return;
        }

        if (type === 'success' || type === 'error') {
            if (task) {
                if (type === 'success') {
                    task.resolve(result);
                } else {
                    task.reject(new Error(error || "Unknown worker error"));
                }
                this.tasks.delete(jobId);
            }

            // CRITICAL: Always decrement and process next regardless of if task was cancelled/deleted
            this.activeHeavyJobs = Math.max(0, this.activeHeavyJobs - 1);
            this.processQueue();
        }
    }

    private processQueue() {
        if (this.queue.length === 0 && this.activeHeavyJobs === 0) {
            this.scheduleIdleTermination();
            return;
        }

        if (this.queue.length === 0 || this.activeHeavyJobs >= this.MAX_CONCURRENT_HEAVY) return;

        // Sort queue by priority: true first
        this.queue.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

        while (this.queue.length > 0 && this.activeHeavyJobs < this.MAX_CONCURRENT_HEAVY) {
            const next = this.queue.shift()!;
            // Pass taskType down to get the correctly scoped worker
            const worker = this.getWorker(next.taskType);
            this.activeHeavyJobs++;

            try {
                worker.postMessage({
                    type: next.taskType,
                    payload: next.payload,
                    jobId: next.jobId,
                    capabilityBundle: next.capabilityBundle
                }, next.transferables);

                // Start active watchdog now that task is dispatched
                const task = this.tasks.get(next.jobId);
                if (task) {
                    const timeout = (next as any).timeoutMs || 60000;
                    task.watchdog = setTimeout(() => {
                        console.error(`[PDFWorkerClient] Task ${next.jobId} timed out (${timeout}ms). Performing extreme recovery...`);
                        this.terminateAndRestart();
                        // Reject is handled by terminateAndRestart clearing type map
                    }, timeout);
                }
            } catch (err) {
                console.error("Failed to post message to worker:", err);
                // Recovery: Reject the task and free the slot immediately
                const task = this.tasks.get(next.jobId);
                if (task) {
                    task.reject(new Error(`Failed to send task to worker: ${err}`));
                    this.tasks.delete(next.jobId);
                }
                this.activeHeavyJobs = Math.max(0, this.activeHeavyJobs - 1);
                // Continue to next item in queue, or schedule idle if empty
                if (this.queue.length === 0 && this.activeHeavyJobs === 0) {
                    this.scheduleIdleTermination();
                }
            }
        }
    }

    public async executeTask(
        taskType: string,
        payload: any,
        transferables: Transferable[] = [],
        capabilityBundle?: any,
        onChunk?: (chunk: any) => void,
        onProgress?: (percent: number, message?: string) => void,
        signal?: AbortSignal,
        priority?: boolean,
        timeoutMs: number = 60000 // Stricter 60s default (was 180s)
    ): Promise<any> {
        this.clearIdleTermination();

        const jobId = typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                return reject(new Error("Task aborted"));
            }

            // Watchdog will be started in processQueue when the task is actually dispatched
            const onAbort = () => {
                const pendingTask = this.tasks.get(jobId);
                if (pendingTask?.watchdog) clearTimeout(pendingTask.watchdog);

                this.tasks.delete(jobId);
                this.queue = this.queue.filter(q => q.jobId !== jobId);
                reject(new Error("Task cancelled"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });

            const wrappedResolve = (val: any) => {
                const pendingTask = this.tasks.get(jobId);
                if (pendingTask?.watchdog) clearTimeout(pendingTask.watchdog);
                resolve(val);
            };

            const wrappedReject = (err: unknown) => {
                const pendingTask = this.tasks.get(jobId);
                if (pendingTask?.watchdog) clearTimeout(pendingTask.watchdog);
                reject(err instanceof Error ? err : new Error(String(err)));
            };

            this.tasks.set(jobId, { resolve: wrappedResolve, reject: wrappedReject, onChunk, onProgress });

            // Queue the task with priority
            const taskItem = {
                jobId,
                taskType,
                payload,
                transferables,
                capabilityBundle,
                priority: !!priority,
                timeoutMs
            };

            if (priority) {
                this.queue.unshift(taskItem);
            } else {
                this.queue.push(taskItem);
            }

            this.processQueue();
        });
    }

    public terminate(reason?: Error) {
        this.clearIdleTermination();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        // Force reset queue state on manual termination too
        // Reject all pending tasks so UI doesn't hang
        const error = reason || new Error("Worker terminated.");
        this.tasks.forEach((task) => {
            task.reject(error);
        });

        this.tasks.clear();
        this.queue = [];
        this.activeHeavyJobs = 0;
    }

    private terminateAndRestart() {
        console.warn("[PDFWorkerClient] Restarting worker and rejecting pending tasks...");
        this.terminate(new Error("Task failed because the PDF worker was restarted due to a hang."));

        // Re-init for next batch
        this.getWorker();
    }
}

let _pdfWorkerInstance: PDFWorkerClient | null = null;

export function getPDFWorker(): PDFWorkerClient {
    if (typeof window === 'undefined') {
        throw new Error('PDFWorker can only be used in browser environment');
    }
    if (!_pdfWorkerInstance) {
        _pdfWorkerInstance = new PDFWorkerClient();
    }
    return _pdfWorkerInstance;
}

export const pdfWorker = {
    get instance() {
        return getPDFWorker();
    }
};
