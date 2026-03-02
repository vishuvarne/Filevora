
import { useState, useCallback, useEffect } from 'react';
import { ConversionPlan, ExecutionRoute } from '../lib/dsl/types';
import { StaticAnalyzer } from '../lib/dsl/analyzer';
import { CapabilityEngine } from '../lib/dsl/capability';
import { MockRunner } from '../lib/dsl/mockRunner';
// In future, import RealRunner

export type ConversionStatus = 'IDLE' | 'ANALYZING' | 'READY' | 'EXECUTING' | 'COMPLETED' | 'ERROR';

export interface UseConversionResult {
    status: ConversionStatus;
    executionRoute: ExecutionRoute | null;
    progress: number;
    error: string | null;
    analyze: (plan: ConversionPlan, files: File[]) => void;
    run: () => Promise<void>;
    reset: () => void;
    resultUrl: string | null;
}

export function useConversion(): UseConversionResult {
    const [status, setStatus] = useState<ConversionStatus>('IDLE');
    const [executionRoute, setExecutionRoute] = useState<ExecutionRoute | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // Computed state
    const [activePlan, setActivePlan] = useState<ConversionPlan | null>(null);
    const [activeFiles, setActiveFiles] = useState<File[]>([]);

    // Singleton instances (memoized outside component in real app usually, but here is fine)
    const analyzer = new StaticAnalyzer();
    const capabilityEngine = new CapabilityEngine();
    const runner = new MockRunner(); // Swap with RealRunner later

    const analyze = useCallback((plan: ConversionPlan, files: File[]) => {
        setStatus('ANALYZING');
        setError(null);
        setProgress(0);
        setResultUrl(null);
        setActivePlan(plan);
        setActiveFiles(files);

        try {
            // Calculate total size
            const totalSize = files.reduce((acc, f) => acc + f.size, 0);

            // 1. Static Analysis
            const analysis = analyzer.analyze(plan, totalSize);

            if (!analysis.isValid) {
                setError(analysis.errors.join('\n'));
                setStatus('ERROR');
                return;
            }

            // 2. Capability Check
            const context = capabilityEngine.detectBrowserContext();
            const route = capabilityEngine.route(analysis, context);

            setExecutionRoute(route);
            setStatus('READY');

        } catch (e: any) {
            setError(e.message);
            setStatus('ERROR');
        }
    }, []);

    const run = useCallback(async () => {
        if (!activePlan || status !== 'READY') return;

        setStatus('EXECUTING');
        setProgress(0);

        try {
            const fileMap = new Map<string, File>();
            // Naive mapping: assumption that files match plan inputs by order or ID?
            // For v0.1: we just assume direct mapping or passed manually.
            // Let's assume the UI handles mapping ID to file.
            // Here we just pass raw files for the mock.

            const result = await runner.execute(activePlan, fileMap, (p) => {
                setProgress(p);
            });

            if (result.success) {
                setResultUrl(result.dummyOutput);
                setStatus('COMPLETED');
            } else {
                throw new Error("Execution failed");
            }
        } catch (err: any) {
            setError(err.message);
            setStatus('ERROR');
        }
    }, [activePlan, status]);

    const reset = useCallback(() => {
        setStatus('IDLE');
        setExecutionRoute(null);
        setProgress(0);
        setError(null);
        setResultUrl(null);
    }, []);

    return {
        status,
        executionRoute,
        progress,
        error,
        analyze,
        run,
        reset,
        resultUrl
    };
}
