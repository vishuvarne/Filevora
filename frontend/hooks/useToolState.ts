import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useSharedRouter, normalizePath } from '@/lib/navigation';
import { useSearchParams } from 'next/navigation';
import { ToolDef } from '@/config/tools';
import { MemoryTransferCache } from '@/lib/memory-transfer-cache';
import { loadToolState, saveToolState, clearToolState, recoverToolState } from '@/lib/tool-state-cache';
import { FileTransferService } from '@/lib/file-transfer-service';
import { getContinuationData } from '@/lib/toolContinuation';
import { useFileHistory } from '@/hooks/useFileHistory';

import { canProcessLocally } from '@/lib/client-processor';

export interface ToolState {
    files: File[];
    status: "idle" | "uploading" | "converting" | "processing" | "success" | "error";
    result: any;
    errorMsg: string | null;
    uploadProgress: number;
    progressMessage: string | null;
    isTransferLoading: boolean;
    retentionTimestamp: number | null;
    continuedFromTool: string | null;
    isGhostMode: boolean;
    capabilityBundle: any | null; // Type as needed
    executionReceipt: any | null;
    executionDecision: any | null;
    liveLogs: any[];
    totalExpectedItems: number | null;
}

export interface ToolActions {
    setFiles: (files: File[]) => void;
    setStatus: (status: ToolState['status']) => void;
    setResult: (result: any) => void;
    setErrorMsg: (msg: string) => void;
    setUploadProgress: (progress: number) => void;
    setProgressMessage: (msg: string | null) => void;
    handleRetentionExpire: () => void;
    hardReset: () => void;
    softReset: () => void;
    setIsGhostMode: (isGhost: boolean) => void;
    setCapabilityBundle: (bundle: any) => void;
    setExecutionReceipt: (receipt: any) => void;
    setExecutionDecision: (decision: any) => void;
    addLiveLog: (log: any) => void;
    setTotalItems: (total: number) => void;
}

export function useToolState(tool: ToolDef) {
    const router = useSharedRouter();
    const searchParams = useSearchParams();
    const isHydratingRef = useRef(true);
    const isNavigatingRef = useRef(false);
    const prevResultRef = useRef<any>(null);

    // Core State
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<ToolState['status']>("idle");
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState<string | null>(null);
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const [retentionTimestamp, setRetentionTimestamp] = useState<number | null>(null);
    const [continuedFromTool, setContinuedFromTool] = useState<string | null>(null);

    // Feature Flags & Metadata
    const [isGhostMode, setIsGhostMode] = useState(canProcessLocally(tool.id));
    const [capabilityBundle, setCapabilityBundle] = useState<any>(null);
    const [executionReceipt, setExecutionReceipt] = useState<any>(null);
    const [executionDecision, setExecutionDecision] = useState<any>(null);

    // Streaming
    const [liveLogs, setLiveLogs] = useState<any[]>([]);
    const [totalExpectedItems, setTotalExpectedItems] = useState<number | null>(null);

    // Throttled progress updates — prevents 100+ state updates/sec from causing re-render storms
    const progressRef = useRef(0);
    const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const PROGRESS_THROTTLE_MS = 50; // 20fps max for progress bar updates

    const throttledSetProgress = useCallback((value: number) => {
        progressRef.current = value;
        // Immediately flush at boundaries (0%, 100%) for UX correctness
        if (value <= 0 || value >= 100) {
            if (progressTimerRef.current) {
                clearTimeout(progressTimerRef.current);
                progressTimerRef.current = null;
            }
            setUploadProgress(value);
            return;
        }
        // Throttle intermediate updates
        if (!progressTimerRef.current) {
            progressTimerRef.current = setTimeout(() => {
                progressTimerRef.current = null;
                setUploadProgress(progressRef.current);
            }, PROGRESS_THROTTLE_MS);
        }
    }, []);

    // Isomorphic Layout Effect
    const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

    // --- HYDRATION LOGIC ---
    useIsomorphicLayoutEffect(() => {
        if (!isHydratingRef.current) return;

        const hydrate = async () => {
            if (typeof window === 'undefined') return;

            const params = new URLSearchParams(window.location.search);
            const transferKeyParam = params.get('transfer');
            const doneParam = params.get('done');

            // 1. Check Transfer
            if (transferKeyParam) {
                const cached = MemoryTransferCache.peek(transferKeyParam);
                if (cached) {
                    if (cached.file) {
                        setFiles([cached.file]);
                        setContinuedFromTool(cached.metadata?.fromTool || null);
                        isHydratingRef.current = false;
                        return;
                    } else if (cached.deferred) {
                        // Deferred: mark loading, let Transfer Load Effect handle fetch
                        setIsTransferLoading(true);
                        isHydratingRef.current = false;
                        // Do NOT return here — let the Transfer Load Effect resolve the deferred URL
                    }
                }
            }

            // 2. Check Done State
            if (doneParam === '1') {
                const cachedToolState = loadToolState(tool.id);
                if (cachedToolState && (cachedToolState.status === 'success' || cachedToolState.result)) {
                    setFiles(cachedToolState.files);
                    setStatus('success');
                    setResult(cachedToolState.result);
                    setRetentionTimestamp(cachedToolState.retentionTimestamp || Date.now());
                    isHydratingRef.current = false;
                    return;
                } else {
                    router.replace(normalizePath(`/tools/${tool.id}`));
                }
            }

            // 3. Recover State
            const state = await recoverToolState(tool.id);
            if (state && status === 'idle') {
                if (state.status === 'success' && !doneParam) {
                    // Back navigation -> Idle with files
                    setFiles(state.files);
                    setStatus('idle');
                } else {
                    setFiles(state.files);
                    setStatus(state.status);
                    setResult(state.result);
                    setRetentionTimestamp(state.retentionTimestamp ?? null);
                }
            }
            isHydratingRef.current = false;
        };
        hydrate();
    }, [tool.id]);

    // Sync React state with URL changes (handle Back/Forward buttons)
    // We use a native popstate listener to reliably sync history traversal without hydration race conditions
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const doneParam = params.get('done');

            if (!doneParam) {
                // BACK NAVIGATION: User returned to the tool page.
                // Reset to idle but intentionally KEEP the files and cache intact.
                // This allows the user to easily convert again or click Forward.
                setStatus('idle');
                setUploadProgress(0);
            } else if (doneParam === '1') {
                // FORWARD NAVIGATION: User clicked Forward to return to the download page.
                // We must actively pull the result from the local cache to re-render it.
                const cached = loadToolState(tool.id);
                if (cached && (cached.status === 'success' || cached.result)) {
                    setFiles(cached.files);
                    setStatus('success');
                    setResult(cached.result);
                    setRetentionTimestamp(cached.retentionTimestamp || Date.now());
                } else {
                    // Invalid history state (cache was somehow cleared). Eject them back to tool.
                    router.replace(normalizePath(`/tools/${tool.id}`));
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [tool.id, router]);

    // --- TRANSFER LOAD LOGIC ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const transferKey = params.get('transfer');
        const continuationKey = params.get('continuation');
        const transferKeyParam = transferKey; // Alias for clarity inside closure if needed

        if (!transferKey && !continuationKey) return;

        const loadContent = async () => {
            if (transferKey) {
                setIsTransferLoading(true);
                clearToolState(tool.id);

                const fastData = MemoryTransferCache.consume(transferKey);
                if (fastData) {
                    if (fastData.file) {
                        setFiles([fastData.file]);
                        setContinuedFromTool(fastData.metadata?.fromTool || null);
                        router.replace(normalizePath(`/tools/${tool.id}`));
                        setIsTransferLoading(false);
                        return;
                    } else if (fastData.deferred) {
                        // Deferred transfer: fetch the blob URL and materialize into a File
                        try {
                            const res = await fetch(fastData.deferred.url);
                            const blob = await res.blob();
                            const file = new File([blob], fastData.deferred.filename, { type: fastData.deferred.type || blob.type });
                            setFiles([file]);
                            setContinuedFromTool(fastData.metadata?.fromTool || null);
                        } catch (e) {
                            console.error('Deferred transfer fetch failed:', e);
                        }
                        router.replace(normalizePath(`/tools/${tool.id}`));
                        setIsTransferLoading(false);
                        return;
                    }
                }

                // Fallback IDB logic could go here similar to original component
                // Simplified for refactor: relying on MemoryCache for now as per "Architecture Clean"
                // If deep IDB logic is needed, we can extract FileTransferService calls here.
                try {
                    const data = await FileTransferService.getTransfer(transferKey);
                    if (data) {
                        setFiles([data.file]);
                        setContinuedFromTool(data.metadata?.fromTool || null);
                        router.replace(normalizePath(`/tools/${tool.id}`));
                    }
                } catch (e) {
                    console.error("IDB Transfer failed", e);
                } finally {
                    setIsTransferLoading(false);
                }

            } else if (continuationKey) {
                try {
                    const data = await getContinuationData(continuationKey);
                    if (data) {
                        setFiles([data.file]);
                        setContinuedFromTool(data.fromTool);
                        if (data.timestamp) setRetentionTimestamp(data.timestamp);
                    }
                } catch (err) {
                    console.error('Error loading continuation data:', err);
                }
            }
        };
        loadContent();
    }, [tool.id]);

    // --- PERSISTENCE ---
    useEffect(() => {
        if (files.length > 0 || status !== 'idle') {
            saveToolState(tool.id, { files, status, result, retentionTimestamp });
        }
    }, [files, status, result, retentionTimestamp, tool.id]);

    // --- BLOB CLEANUP ---
    useEffect(() => {
        const prev = prevResultRef.current;
        const prevUrl = prev?.download_url;
        const currentUrl = result?.download_url;

        if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:') && prevUrl !== currentUrl) {
            URL.revokeObjectURL(prevUrl);
        }
        prevResultRef.current = result;
    }, [result]);

    // --- PROGRESS SIMULATION ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "idle") {
            setUploadProgress(0);
        } else if (status === "uploading") {
            setUploadProgress(prev => Math.max(prev, 5));
            interval = setInterval(() => {
                setUploadProgress(prev => (prev + 5 > 40 ? 40 : prev + 5));
            }, 200);
        } else if ((status === "processing" || status === "converting") && !isGhostMode) {
            interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + Math.max(0.5, (95 - prev) * 0.05);
                });
            }, 800);
        } else if (status === "success") {
            setUploadProgress(100);
        }
        return () => clearInterval(interval);
    }, [status, isGhostMode]);


    // Actions
    const handleRetentionExpire = () => {
        setStatus("idle");
        setResult(null);
        setExecutionDecision(null);
        setRetentionTimestamp(null);
        setContinuedFromTool(null);
        saveToolState(tool.id, {
            files,
            status: "idle",
            result: null,
            retentionTimestamp: null
        });
        router.replace(normalizePath(`/tools/${tool.id}`));
    };

    const hardReset = () => {
        if (result?.download_url && result.download_url.startsWith('blob:')) {
            URL.revokeObjectURL(result.download_url);
        }
        setFiles([]);
        setStatus("idle");
        setResult(null);
        setErrorMsg("");
        setExecutionDecision(null);
        setLiveLogs([]);
        setTotalExpectedItems(null);
        setUploadProgress(0);
        setProgressMessage(null);
        clearToolState(tool.id);
        isNavigatingRef.current = false;
        router.replace(normalizePath(`/tools/${tool.id}`), undefined);
    };

    const softReset = () => {
        setStatus("idle");
    };

    const addLiveLog = (log: any) => setLiveLogs(prev => [...prev, log]);
    const setTotalItems = (t: number) => setTotalExpectedItems(t);

    return {
        state: {
            files, status, result, errorMsg, uploadProgress, progressMessage,
            isTransferLoading, retentionTimestamp, continuedFromTool,
            isGhostMode, capabilityBundle, executionReceipt, executionDecision,
            liveLogs, totalExpectedItems
        },
        actions: {
            setFiles, setStatus, setResult, setErrorMsg,
            setUploadProgress: throttledSetProgress,
            setProgressMessage, handleRetentionExpire, hardReset, softReset,
            setIsGhostMode, setCapabilityBundle, setExecutionReceipt, setExecutionDecision,
            addLiveLog, setTotalItems
        }
    };
}
