/**
 * Memory Pressure Handler
 * 
 * Monitors memory usage and triggers callbacks at warning/critical thresholds.
 * Critical for Safari stability and preventing OOM crashes.
 */

import type { MemoryConfig, MemoryPressureLevel } from './runtime-types';

/**
 * Memory pressure callback handlers
 */
interface MemoryHandlers {
    /** Called when memory usage exceeds warning threshold */
    onWarning?: () => void;
    /** Called when memory usage exceeds critical threshold */
    onCritical?: () => void;
}

/**
 * Memory usage snapshot
 */
interface MemoryUsage {
    usedMB: number;
    totalMB: number;
    limitMB: number;
    percent: number;
}

/**
 * Memory Pressure Handler
 * 
 * Monitors JavaScript heap memory and triggers callbacks when thresholds are exceeded.
 * Uses performance.memory API (Chrome only) with fallback to estimation.
 */
export class MemoryPressureHandler {
    private config: Required<MemoryConfig>;
    private onWarning?: () => void;
    private onCritical?: () => void;
    private checkInterval: number | null = null;
    private lastLevel: MemoryPressureLevel = 'ok';

    /**
     * Create a new memory pressure handler.
     */
    constructor(config: Partial<MemoryConfig> = {}) {
        this.config = {
            maxTotalMemoryMB: config.maxTotalMemoryMB ?? 512,
            warningThresholdPercent: config.warningThresholdPercent ?? 70,
            criticalThresholdPercent: config.criticalThresholdPercent ?? 85,
        };
    }

    /**
     * Set callback handlers for memory pressure events.
     */
    setHandlers(handlers: MemoryHandlers): void {
        this.onWarning = handlers.onWarning;
        this.onCritical = handlers.onCritical;
    }

    /**
     * Start periodic memory pressure monitoring.
     * @param intervalMs Check interval in milliseconds (default: 5000)
     */
    startMonitoring(intervalMs: number = 5000): void {
        if (this.checkInterval !== null) {
            this.stopMonitoring();
        }

        this.checkInterval = window.setInterval(() => {
            this.checkPressure();
        }, intervalMs);
    }

    /**
     * Stop periodic monitoring.
     */
    stopMonitoring(): void {
        if (this.checkInterval !== null) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check current memory pressure level.
     * Triggers callbacks if thresholds are exceeded.
     */
    checkPressure(): MemoryPressureLevel {
        const usage = this.getMemoryUsage();

        // If we can't measure memory, assume OK (optimistic)
        if (!usage) {
            this.lastLevel = 'ok';
            return 'ok';
        }

        let level: MemoryPressureLevel;

        if (usage.percent >= this.config.criticalThresholdPercent) {
            level = 'critical';
            if (this.lastLevel !== 'critical') {
                this.onCritical?.();
            }
        } else if (usage.percent >= this.config.warningThresholdPercent) {
            level = 'warning';
            if (this.lastLevel === 'ok') {
                this.onWarning?.();
            }
        } else {
            level = 'ok';
        }

        this.lastLevel = level;
        return level;
    }

    /**
     * Get current memory usage.
     * Uses performance.memory API (Chrome) with fallback to null.
     */
    getMemoryUsage(): MemoryUsage | null {
        // Try performance.memory (Chrome only)
        const memory = (performance as any).memory;
        if (memory && typeof memory.usedJSHeapSize === 'number') {
            const usedMB = memory.usedJSHeapSize / 1024 / 1024;
            const totalMB = memory.totalJSHeapSize / 1024 / 1024;
            const limitMB = this.config.maxTotalMemoryMB;

            return {
                usedMB,
                totalMB,
                limitMB,
                percent: (usedMB / limitMB) * 100
            };
        }

        // Fallback: return null (can't measure)
        return null;
    }

    /**
     * Check if we can allocate additional memory.
     * @param sizeMB Size to allocate in megabytes
     */
    canAllocate(sizeMB: number): boolean {
        const usage = this.getMemoryUsage();

        // If we can't measure, be optimistic
        if (!usage) return true;

        // Check if allocation would exceed 90% of limit
        const afterAllocation = usage.usedMB + sizeMB;
        return afterAllocation < this.config.maxTotalMemoryMB * 0.9;
    }

    /**
     * Get current pressure level without triggering callbacks.
     */
    getCurrentLevel(): MemoryPressureLevel {
        return this.lastLevel;
    }

    /**
     * Get configuration.
     */
    getConfig(): Readonly<Required<MemoryConfig>> {
        return { ...this.config };
    }

    /**
     * Update configuration.
     */
    updateConfig(newConfig: Partial<MemoryConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }

    /**
     * Force garbage collection hint.
     * Note: This is just a hint - JS engines may or may not honor it.
     */
    requestGC(): void {
        // Try to trigger GC by clearing references and creating memory pressure
        if (typeof (globalThis as any).gc === 'function') {
            // V8 with --expose-gc flag
            (globalThis as any).gc();
        }
    }

    /**
     * Cleanup resources.
     */
    dispose(): void {
        this.stopMonitoring();
        this.onWarning = undefined;
        this.onCritical = undefined;
    }
}
