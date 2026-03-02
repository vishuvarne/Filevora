
import { ConversionPlan, ExecutionRoute, ResourceLimits } from './types';
import { OperationRegistry } from './registry';

export interface AnalysisResult {
    isValid: boolean;
    errors: string[];
    route: ExecutionRoute;
    estimatedMemoryBytes: number;
    reason: string;
}

export class StaticAnalyzer {
    private registry: OperationRegistry;

    constructor() {
        this.registry = OperationRegistry.getInstance();
    }

    /**
     * Statically analyzes a conversion plan to determine safety and routing.
     * This runs BEFORE any file processing starts.
     */
    analyze(plan: ConversionPlan, inputTotalSizeBytes: number = 0): AnalysisResult {
        const errors: string[] = [];
        let maxMemoryObserved = 0;
        let requiresServer = false;
        let forceChunked = false;
        let anyStepDetails = "";

        // 1. Validate Steps
        for (const step of plan.steps) {
            const def = this.registry.get(step.opName);

            if (!def) {
                errors.push(`Unknown operation: ${step.opName}`);
                continue;
            }

            // 2. Check Memory Impact
            // Roughly: Base + (InputSize * Multiplier)
            // Note: In a real multi-step plan, we'd track intermediate stream sizes.
            // For v0.1, we assume single-step dominance or linear flow.
            const estimatedStepMemory = def.baseMemoryOverhead + (inputTotalSizeBytes * def.memoryMultiplier);
            if (estimatedStepMemory > maxMemoryObserved) {
                maxMemoryObserved = estimatedStepMemory;
            }

            // 3. Check Context Requirements
            if (def.requiresFullContext) {
                // If it requires full context, we generally can't stream it efficiently in low-memory environments
                // unless we load the whole file.
                // If file is large, this might force NATIVE or SERVER.
            }

            if (!def.isStreamable) {
                // If ANY step is not streamable, we cannot use WASM_CHUNKED effectively for the whole pipeline
                // unless we buffer. 
            }
        }

        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
                route: ExecutionRoute.SERVER_REQUIRED, // Fail safe
                estimatedMemoryBytes: 0,
                reason: 'Plan validation failed'
            };
        }

        // 4. Decision Logic
        const MEMORY_LIMIT_WASM_DIRECT = 1024 * 1024 * 500; // 500MB (conservative browser limit)

        // If Plan explicitly demands server or has blocked ops (none in v0.1 registry yet)
        // requiresServer = ... check flags ...

        if (maxMemoryObserved > plan.limits.maxMemoryBytes) {
            // Exceeds plan's OWN declared limits?
            // Use the plan limit as a hard ceiling.
        }

        let route = ExecutionRoute.WASM_DIRECT;
        let reason = "Fits in browser memory.";

        if (maxMemoryObserved > MEMORY_LIMIT_WASM_DIRECT) {
            // Too big for direct WASM memory
            // Can we chunk it?
            // We need to check if ALL steps support streaming/chunking.
            const allStreamable = plan.steps.every(s => {
                const d = this.registry.get(s.opName);
                return d?.isStreamable && !d.requiresFullContext;
            });

            if (allStreamable) {
                route = ExecutionRoute.WASM_CHUNKED;
                reason = "Large file, but operations support chunked streaming.";
            } else {
                // Too big and can't stream
                route = ExecutionRoute.NATIVE_REQUIRED; // Or Server if native not avail
                reason = "File too large for browser memory and requires full context.";
                // Fallback logic could go to SERVER if user consents
            }
        }

        return {
            isValid: true,
            errors: [],
            route,
            estimatedMemoryBytes: maxMemoryObserved,
            reason
        };
    }
}
