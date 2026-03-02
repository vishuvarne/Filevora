
import { AnalysisResult } from './analyzer';
import { ExecutionRoute } from './types';

export interface BrowserContext {
    userAgent: string;
    hardwareConcurrency: number;
    deviceMemory?: number; // In GB, experimental API
    hasWasmSupport: boolean;
    hasSharedArrayBuffer: boolean; // Needed for some threaded WASM
}

export class CapabilityEngine {

    /**
     * Routes the execution based on plan analysis and browser capabilities.
     * This is the final gatekeeper before execution starts.
     */
    route(analysis: AnalysisResult, context: BrowserContext): ExecutionRoute {
        // 1. If analysis already determined we NEED native/server, respect that (unless we can downgrade?)
        if (analysis.route === ExecutionRoute.SERVER_REQUIRED) {
            return ExecutionRoute.SERVER_REQUIRED; // No choice
        }

        if (analysis.route === ExecutionRoute.NATIVE_REQUIRED) {
            // If we had a native bridge, check if it's connected.
            // For now, if Native is required but we don't handle that check here, we might fall back to Server with consent.
            return ExecutionRoute.NATIVE_REQUIRED;
        }

        // 2. Browser Capability Checks
        if (!context.hasWasmSupport) {
            console.warn("WASM not supported. Fallback to Server.");
            return ExecutionRoute.SERVER_REQUIRED;
        }

        // 3. Performance Tuning
        // If it's a "WASM_DIRECT" route (fits in memory), is the device powerful enough?
        // e.g., if deviceMemory is < 2GB and we estimated 600MB usage, maybe unsafe?

        if (analysis.route === ExecutionRoute.WASM_DIRECT) {
            if (context.deviceMemory && context.deviceMemory < 4) {
                // Low memory device? Maybe force logical chunking if poss, 
                // but if Analyzer said DIRECT was needed (random access), then we might crash tab.
                // We'll stick to DIRECT but warn.
            }
        }

        return analysis.route;
    }

    detectBrowserContext(): BrowserContext {
        return {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Node',
            hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 1,
            // @ts-ignore - deviceMemory is experimental
            deviceMemory: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined,
            hasWasmSupport: typeof WebAssembly !== 'undefined',
            hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
        };
    }
}
