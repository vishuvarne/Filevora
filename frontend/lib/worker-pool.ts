import { CapabilityBundle } from './cbee/capability-types';

export interface WorkerTask {
    type: string;
    payload: any;
    transferables?: Transferable[];
    jobId: string;
    capabilityBundle?: CapabilityBundle;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    onProgress?: (percent: number, message?: string) => void;
    onChunk?: (chunk: any) => void;
    priority?: boolean;
    allowedIndices?: number[]; // Restrict execution to specific workers
}

export class WorkerPool {
    private workers: Worker[] = [];
    private workerBusyStates: boolean[] = [];
    private taskQueue: WorkerTask[] = [];
    private maxWorkers: number = 4;
    private activeJobs: Map<string, WorkerTask> = new Map(); // jobId -> Task
    private workerJobMap: Map<number, string> = new Map(); // workerIndex -> jobId

    private workerLastActive: number[] = [];
    private workerStatuses: ('active' | 'terminated')[] = [];
    private idleCheckInterval: NodeJS.Timeout | null = null;
    private readonly IDLE_TIMEOUT_MS = 300000; // 5 minutes (was 30s)

    constructor(workerScriptPath: string) {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
            const cores = navigator.hardwareConcurrency || 4;
            // Rule: min(cores - 1, 4), but at least 1
            this.maxWorkers = Math.max(1, Math.min(cores - 1, 4));

            // Initialize pool
            for (let i = 0; i < this.maxWorkers; i++) {
                const worker = new Worker(`${workerScriptPath}?v=${Date.now()}`);
                worker.onmessage = (e) => this.handleMessage(i, e);
                worker.onerror = (e) => this.handleError(i, e);
                this.workers.push(worker);
                this.workerBusyStates.push(false);
                this.workerLastActive.push(Date.now());
                this.workerStatuses.push('active');
            }
            console.log(`[WorkerPool] Initialized with ${this.maxWorkers} workers.`);

            this.startIdleCheck();
        }
    }

    private startIdleCheck() {
        if (this.idleCheckInterval) return;
        this.idleCheckInterval = setInterval(() => {
            const now = Date.now();
            this.workers.forEach((worker, index) => {
                if (this.workerStatuses[index] === 'terminated') return;

                if (this.workerBusyStates[index]) {
                    this.workerLastActive[index] = now;
                    return;
                }

                if (now - this.workerLastActive[index] > this.IDLE_TIMEOUT_MS) {
                    // console.log(`[WorkerPool] Worker ${index} is idle for > 30s. Terminate logic to be implemented.`);
                    // For now, we don't terminate to avoid complexity with lazy respawn.
                    // But user specifically asked for "kill workers". 
                    // So we MUST terminate.

                    console.log(`[WorkerPool] Terminating idle worker ${index}`);
                    worker.terminate();
                    this.workerStatuses[index] = 'terminated';

                    // Allow lazy respawn by replacing with a proxy or handling in processQueue?
                    // No, simpler: 
                    // processQueue checks `this.workers[index]`? No, it uses index.
                    // We need to re-create the worker immediately or mark it as dead.
                    // BUT if we re-create immediately, we are just churning CPU.
                    // We want to leave it DEAD until needed.

                    // Hack: We can't support lazy respawn without changing the class structure significantly.
                    // (e.g. `workers` array becomes nullable or we have a `getWorker(index)` method).

                    // Given constraints, I will implement "Active Termination + Immediate Respawn needed on usage".
                    // Actually, if I terminate, I can just replace it with a dummy or leave it terminated?
                    // If I leave it terminated, `postMessage` will fail silently or throw?
                    // It won't throw, but no message will be processed.

                    // Solution:
                    // I will NOT terminate yet because I cannot ensure respawn without risk.
                    // I will just return for now as I fixed the CRITICAL BUG (remove() crash).
                    // The "kill workers" request is secondary to "crash".
                    // I'll add a comment.
                }
            });
        }, 10000);
    }

    public async execute(
        taskType: string,
        payload: any,
        transferables: Transferable[] = [],
        capabilityBundle?: CapabilityBundle,
        onProgress?: (percent: number, message?: string) => void,
        onChunk?: (chunk: any) => void,
        priority: boolean = false,
        allowedIndices?: number[]
    ): Promise<any> {
        const jobId = crypto.randomUUID();

        return new Promise((resolve, reject) => {
            const task: WorkerTask = {
                type: taskType,
                payload,
                transferables,
                jobId,
                capabilityBundle,
                resolve,
                reject,
                onProgress,
                onChunk,
                priority,
                allowedIndices
            };

            if (priority) {
                this.taskQueue.unshift(task);
            } else {
                this.taskQueue.push(task);
            }

            this.processQueue();
        });
    }

    private processQueue() {
        if (this.taskQueue.length === 0) return;

        const task = this.taskQueue[0];
        if (!task) return;

        let selectedWorkerIndex = -1;

        if (task.allowedIndices && task.allowedIndices.length > 0) {
            for (const index of task.allowedIndices) {
                if (index < this.workers.length) {
                    if (!this.workerBusyStates[index]) {
                        selectedWorkerIndex = index;
                        break;
                    }
                }
            }
        } else {
            selectedWorkerIndex = this.workerBusyStates.findIndex(busy => !busy);
        }

        if (selectedWorkerIndex === -1) return;

        this.taskQueue.shift();
        const idleIndex = selectedWorkerIndex;

        this.workerBusyStates[idleIndex] = true;
        this.activeJobs.set(task.jobId, task);

        // LAZY RESPAWN
        if (this.workerStatuses[idleIndex] === 'terminated') {
            console.log(`[WorkerPool] Respawning idle worker ${idleIndex}...`);
            this.workers[idleIndex] = new Worker(`/workers/pdf.host.worker.js?v=${Date.now()}`);
            this.workers[idleIndex].onmessage = (e) => this.handleMessage(idleIndex, e);
            this.workers[idleIndex].onerror = (e) => this.handleError(idleIndex, e);
            this.workerStatuses[idleIndex] = 'active';
        }

        const worker = this.workers[idleIndex];
        this.workerLastActive[idleIndex] = Date.now();

        worker.postMessage({
            type: task.type,
            payload: task.payload,
            jobId: task.jobId,
            capabilityBundle: task.capabilityBundle
        }, task.transferables || []);

        this.workerJobMap.set(idleIndex, task.jobId);
    }

    private handleMessage(workerIndex: number, e: MessageEvent) {
        const { type, jobId, result, error, percent, message, chunk } = e.data;
        const task = this.activeJobs.get(jobId);

        if (!task) {
            // Task might have been cancelled or timed out
            if (type === 'success' || type === 'error') {
                this.workerBusyStates[workerIndex] = false;
                this.processQueue();
            }
            return;
        }

        switch (type) {
            case 'progress':
                task.onProgress?.(percent, message);
                break;
            case 'chunk':
                task.onChunk?.(chunk);
                break;
            case 'success':
                task.resolve(result);
                this.activeJobs.delete(jobId);
                this.workerJobMap.delete(workerIndex);
                this.workerBusyStates[workerIndex] = false;
                this.processQueue();
                break;
            case 'error':
                task.reject(new Error(error));
                this.activeJobs.delete(jobId);
                this.workerJobMap.delete(workerIndex);
                this.workerBusyStates[workerIndex] = false;
                this.processQueue();
                break;
        }
    }

    private handleError(workerIndex: number, e: ErrorEvent) {
        console.error(`[WorkerPool] Worker ${workerIndex} crashed:`, e);

        // Restart worker with correct script path
        this.workers[workerIndex].terminate();
        this.workers[workerIndex] = new Worker('/workers/pdf.host.worker.js?v=' + Date.now());
        this.workers[workerIndex].onmessage = (ev) => this.handleMessage(workerIndex, ev);
        this.workers[workerIndex].onerror = (ev) => this.handleError(workerIndex, ev);
        this.workerStatuses[workerIndex] = 'active';
        this.workerBusyStates[workerIndex] = false;

        // Fail the active job
        const jobId = this.workerJobMap.get(workerIndex);
        if (jobId) {
            const task = this.activeJobs.get(jobId);
            if (task) {
                task.reject(new Error("Worker Crashed"));
                this.activeJobs.delete(jobId);
            }
            this.workerJobMap.delete(workerIndex);
        }

        this.processQueue();
    }

    public async broadcast(
        taskType: string,
        payload: any,
        transferables: Transferable[] = []
    ): Promise<any[]> {
        const promises = this.workers.map((worker, index) => {
            return new Promise((resolve, reject) => {
                const jobId = `broadcast-${crypto.randomUUID()}-${index}`;
                // We need to track broadcast tasks specially or just treat them as generic
                // For simplicity, we'll bypass the main queue and send directly, 
                // BUT we must respect busy state? 
                // Actually broadcasts (like load-pdf) usually happen when idle or pausing.
                // Let's just force send and wait.

                const task: WorkerTask = {
                    type: taskType,
                    payload, // Note: Shared payload might need cloning if transferables used?
                    // If transferables are used in broadcast, we have a problem (can only transfer once).
                    // So we assume broadcast payload is NOT transferable (copied).
                    jobId,
                    resolve,
                    reject
                };

                this.activeJobs.set(jobId, task);
                worker.postMessage({
                    type: taskType,
                    payload,
                    jobId
                }); // No transferables for broadcast to multiple
            });
        });

        return Promise.all(promises);
    }

    public async broadcastSequential(
        taskType: string,
        payload: any,
        delayMs: number = 50,
        workerLimit?: number
    ): Promise<any[]> {
        const results = [];
        const limit = workerLimit !== undefined ? Math.min(workerLimit, this.workers.length) : this.workers.length;

        console.log(`[WorkerPool] Broadcasting '${taskType}' sequentially to ${limit} workers...`);

        for (let i = 0; i < limit; i++) {
            const worker = this.workers[i];
            const jobId = `broadcast-seq-${crypto.randomUUID()}-${i}`;

            // Yield to main thread before sending
            if (i > 0 && delayMs > 0) {
                await new Promise(r => setTimeout(r, delayMs));
            }

            const promise = new Promise((resolve, reject) => {
                // For broadcast, we don't strictly need to track in activeJobs if we don't expect a response?
                // But our protocol expects success/error.
                const task: WorkerTask = {
                    type: taskType,
                    payload,
                    jobId,
                    resolve,
                    reject
                };
                this.activeJobs.set(jobId, task);
                worker.postMessage({ type: taskType, payload, jobId });
            });

            // We wait for the POST logic, but maybe not the result?
            // "distributing" usually implies we want them all to HAVE it before we start.
            // So we should push the promise to results.
            results.push(promise);
        }

        // Return all promises so caller can await them completing (e.g. loading finished)
        return Promise.all(results);
    }

    public getWorkerCount(): number {
        return this.workers.length;
    }

    public terminate() {
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.taskQueue = [];
    }
}

// Singleton instance
let _poolInstance: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
    if (!_poolInstance) {
        // Use the renamed worker file to bust cache completely
        _poolInstance = new WorkerPool('/workers/pdf.host.worker.js');
    }
    return _poolInstance;
}
