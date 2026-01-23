export class PDFWorkerClient {
    private worker: Worker | null = null;
    private tasks: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();

    private getWorker(): Worker {
        if (!this.worker) {
            // Path is relative to the *output* generic file structure OR public folder
            this.worker = new Worker(`/workers/pdf.worker.js?v=${Date.now()}`);
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = (err: ErrorEvent) => {
                console.error("Worker Error:", err);
                // Fail all pending tasks
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
    }

    // Note: transferables argument is ignored to enforce stability (copy only)
    public async executeTask(taskType: string, payload: any, transferables: Transferable[] = []): Promise<any> {
        const worker = this.getWorker();
        const jobId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            this.tasks.set(jobId, { resolve, reject });
            worker.postMessage({
                type: taskType,
                payload,
                jobId
            }); // removed transferables to fix transferable type error
        });
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

// Singleton instance
export const pdfWorker = new PDFWorkerClient();
