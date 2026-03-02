export interface ProgressEvent {
    stage: string;       // e.g. "init", "processing", "encoding", "uploading"
    progress: number;    // 0-100
    message?: string;
    details?: any;
    startTime?: number;
    estimatedTimeRemaining?: number;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export class ProgressReporter {
    private onProgress: ProgressCallback;
    private startTime: number;

    constructor(callback: ProgressCallback) {
        this.onProgress = callback;
        this.startTime = Date.now();
    }

    public update(progress: number, message: string, stage: string = 'processing') {
        const now = Date.now();
        const elapsed = now - this.startTime;
        let eta = undefined;

        if (progress > 0 && progress < 100) {
            const msPerPercent = elapsed / progress;
            const remaining = 100 - progress;
            eta = Math.round(msPerPercent * remaining);
        }

        this.onProgress({
            stage,
            progress,
            message,
            startTime: this.startTime,
            estimatedTimeRemaining: eta
        });
    }

    public start(message: string = "Starting...") {
        this.startTime = Date.now();
        this.update(0, message, 'init');
    }

    public complete(message: string = "Done") {
        this.update(100, message, 'complete');
    }

    public error(error: Error) {
        this.onProgress({
            stage: 'error',
            progress: 0,
            message: error.message,
            details: error
        });
    }
}
