
import { describe, it, expect, vi } from 'vitest';
import { ConversionScheduler } from './conversion-scheduler';
import { MemoryWatchdog } from './memory-watchdog';
import { DocxStreamingBuilder } from './docx-streaming-builder';

describe('Core Engine Refinements', () => {
    it('should allow pausing and resuming the scheduler', async () => {
        const file = new File(["dummy pdf content"], "test.pdf", { type: "application/pdf" });
        const builder = new DocxStreamingBuilder();
        const scheduler = new ConversionScheduler(file, builder, {
            onProgress: (p, m) => console.log(`Progress: ${p}% - ${m}`),
            onComplete: (b) => console.log("Complete")
        });

        // Mock controller to avoid actual PDF loading during unit test
        (scheduler as any).controller = {
            load: vi.fn(),
            distributeToWorkers: vi.fn(),
            determineMode: vi.fn(),
            getPageCount: () => 10,
            destroy: vi.fn(),
            getActiveWorkerIndices: () => undefined,
            getIsFastMode: () => true
        };

        // We don't call start() because it triggers a complex loop.
        // We just test the pause/resume state logic.

        expect((scheduler as any).isPaused).toBe(false);
        scheduler.pause();
        expect((scheduler as any).isPaused).toBe(true);
        expect((scheduler as any).resumePromise).not.toBeNull();

        scheduler.resume();
        expect((scheduler as any).isPaused).toBe(false);
        expect((scheduler as any).resumePromise).toBeNull();
    });

    it('MemoryWatchdog should trigger throttle/resume callbacks', () => {
        const onThrottle = vi.fn();
        const onResume = vi.fn();
        const watchdog = new MemoryWatchdog({
            onThrottle,
            onResume,
            desktopThreshold: 100 // 100 bytes
        });

        // Mock performance.memory
        (global as any).performance = {
            memory: {
                usedJSHeapSize: 50
            }
        };

        // First check: under threshold, no throttle
        (watchdog as any).checkMemory();
        expect(watchdog.getIsThrottled()).toBe(false);

        // Breach threshold
        (global as any).performance.memory.usedJSHeapSize = 150;
        (watchdog as any).checkMemory();
        expect(watchdog.getIsThrottled()).toBe(true);
        expect(onThrottle).toHaveBeenCalled();

        // Recovery (below 80% of 100 = 80)
        (global as any).performance.memory.usedJSHeapSize = 70;
        (watchdog as any).checkMemory();
        expect(watchdog.getIsThrottled()).toBe(false);
        expect(onResume).toHaveBeenCalled();
    });
});
