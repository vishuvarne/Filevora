export interface WatchdogOptions {
    onThrottle?: () => void;
    onResume?: () => void;
    onWarning?: () => void;
    onCritical?: () => void;
    onEmergency?: () => void;
    mobileThreshold?: number; // bytes
    desktopThreshold?: number; // bytes
}

export class MemoryWatchdog {
    private checkInterval: NodeJS.Timeout | null = null;
    private state: 'normal' | 'warning' | 'critical' | 'emergency' = 'normal';
    private options: WatchdogOptions;
    private isMobile: boolean;

    constructor(options: WatchdogOptions = {}) {
        this.options = {
            mobileThreshold: 250 * 1024 * 1024,
            desktopThreshold: 800 * 1024 * 1024, // 800MB limit for check
            ...options
        };

        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    public start() {
        if (this.checkInterval) return;
        this.checkInterval = setInterval(() => this.checkMemory(), 2000);
    }

    public stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private checkMemory() {
        // @ts-ignore
        const memory = (performance as any).memory;
        if (!memory) return;

        const usedHeap = memory.usedJSHeapSize;
        const limit = this.isMobile ? this.options.mobileThreshold! : this.options.desktopThreshold!;

        const ratio = usedHeap / limit;
        let newState: 'normal' | 'warning' | 'critical' | 'emergency' = 'normal';

        if (ratio > 0.95) newState = 'emergency';
        else if (ratio > 0.85) newState = 'critical';
        else if (ratio > 0.70) newState = 'warning';

        // State transition handling
        if (newState !== this.state) {
            console.log(`[MemoryWatchdog] State change: ${this.state} -> ${newState} (${(usedHeap / 1024 / 1024).toFixed(0)}MB / ${(ratio * 100).toFixed(1)}%)`);

            this.state = newState;

            switch (newState) {
                case 'warning':
                    // e.g. Pause decorative animations
                    this.options.onWarning?.();
                    break;
                case 'critical':
                    // e.g. Throttle to 1 worker
                    this.options.onThrottle?.();
                    this.options.onCritical?.();
                    break;
                case 'emergency':
                    // e.g. Kill idle workers immediately, maybe alert user
                    this.options.onEmergency?.();
                    break;
                case 'normal':
                    // Recover
                    this.options.onResume?.();
                    break;
            }
        }
    }

    public getState() {
        return this.state;
    }

    public getIsThrottled(): boolean {
        return this.state === 'critical' || this.state === 'emergency';
    }
}
