
import { ConversionPlan } from './types';
import { ConversionRunner } from './runner';

/**
 * Mock implementation of the runner for UI testing.
 * Doesn't actually process files, but respects the sleep times and chunking logic
 * to verify UI progress bars and status updates.
 */
export class MockRunner extends ConversionRunner {

    // Override the execute method
    async execute(plan: ConversionPlan, inputFiles: Map<string, File>, onProgress?: (p: number) => void) {
        console.log("[MockRunner] Starting execution for:", plan.inputs.map(i => i.id));

        const steps = 20;
        const totalDuration = 2000; // 2 seconds
        const interval = totalDuration / steps;

        for (let i = 0; i <= steps; i++) {
            await new Promise(r => setTimeout(r, interval));
            const progress = Math.round((i / steps) * 100);
            if (onProgress) onProgress(progress);
        }

        console.log("[MockRunner] Execution complete.");

        // Return a dummy text file as a blob
        const resultBlob = new Blob(["Processed content via DSL Mock"], { type: "text/plain" });
        const url = URL.createObjectURL(resultBlob);

        return {
            success: true,
            dummyOutput: url
        };
    }
}
