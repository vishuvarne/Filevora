"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import AIAssistant from "./AIAssistant";
import { ToolDef } from "@/config/tools";
import FormatSelector from "./FormatSelector";
import Dropzone from "@/components/SmartDropzone";
import NeuroProgressBar from "@/components/NeuroProgressBar";
import CompletionSuccess from "@/components/CompletionSuccess";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConversionSuccessModal from "@/components/ConversionSuccessModal";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { FEATURES } from "@/config/features";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToolLoadingSkeleton from "@/components/ui/ToolLoadingSkeleton";
import { IMAGE_CONVERTER_FORMATS, AUDIO_CONVERTER_FORMATS } from "@/config/formatConstants";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Dynamically import Interactive Tool components with loading skeletons
// to prevent main-thread blocking during ToolCard navigation
const UnitConverter = dynamic(() => import("@/components/tools/UnitConverter"), { loading: () => <ToolLoadingSkeleton /> });
const TimeConverter = dynamic(() => import("@/components/tools/TimeConverter"), { loading: () => <ToolLoadingSkeleton /> });
const ColorPicker = dynamic(() => import("@/components/tools/ColorPicker"), { loading: () => <ToolLoadingSkeleton /> });
const CollageMaker = dynamic(() => import("@/components/tools/CollageMaker"), { loading: () => <ToolLoadingSkeleton /> });
const ImageCropper = dynamic(() => import("@/components/tools/ImageCropper"), { loading: () => <ToolLoadingSkeleton /> });
const ImageResizer = dynamic(() => import("@/components/tools/ImageResizer"), { loading: () => <ToolLoadingSkeleton /> });
const MemeGenerator = dynamic(() => import("@/components/tools/MemeGenerator"), { loading: () => <ToolLoadingSkeleton /> });
const PhotoEditor = dynamic(() => import("@/components/tools/PhotoEditor"), { loading: () => <ToolLoadingSkeleton /> });
const QRCodeGenerator = dynamic(() => import("@/components/tools/QRCodeGenerator"), { loading: () => <ToolLoadingSkeleton /> });
const ImageCompressor = dynamic(() => import("@/components/tools/ImageCompressor"), { loading: () => <ToolLoadingSkeleton /> });
import ToolInfoSection from "@/components/ToolInfoSection";
const VoiceRecorder = dynamic(() => import("@/components/tools/VoiceRecorder"), { loading: () => <ToolLoadingSkeleton /> });
const PDFChat = dynamic(() => import("@/components/tools/PDFChat"), { loading: () => <ToolLoadingSkeleton /> });
const PDFEditor = dynamic(() => import("@/components/tools/PDFEditor"), { loading: () => <ToolLoadingSkeleton /> });
import { processJob, getDownloadUrl, ProcessResponse, sendEmail } from "@/lib/api";
import { SortableFileList } from "@/components/SortableFileList";
import { authAPI } from "@/lib/auth-api";
import { FirestoreService } from "@/lib/firestore-service";
import AdUnit from "@/components/AdUnit";
import AdSlot from "@/components/ads/AdSlot";
import { useFileHistory } from "@/hooks/useFileHistory";
import { canProcessLocally, processLocally } from "@/lib/client-processor";
import GhostModeBadge from "@/components/GhostModeBadge";
import GhostModeExplainerModal from "@/components/GhostModeExplainerModal";
import RangeSlider from "@/components/ui/RangeSlider";
import { useToolSession } from "@/hooks/useToolSession";
import { MemoryTransferCache } from "@/lib/memory-transfer-cache";

// Preview Modal Component
function FilePreviewModal({ file, onClose }: { file: File; onClose: () => void }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const isImage = file.type.startsWith("image/");

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-lg truncate pr-4 text-slate-900 dark:text-slate-100">{file.name}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-hidden p-0 bg-slate-100 dark:bg-slate-950 relative">
                    {isImage && previewUrl ? (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <img src={previewUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                        </div>
                    ) : file.type === "application/pdf" && previewUrl ? (
                        <iframe src={previewUrl} className="w-full h-full border-none bg-white" title={file.name}></iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <p>Preview not available for this file type</p>
                            <p className="text-xs mt-2 opacity-70">({file.type || 'Unknown type'})</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Custom Sortable Item component using dnd-kit
function SortableFileItem(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        // Scale up slightly when dragging for tactile feel
        scale: isDragging ? "1.02" : "1",
        boxShadow: isDragging ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none h-full outline-none">
            {props.children}
        </div>
    );
}

// Format constants (IMAGE_CONVERTER_FORMATS, AUDIO_CONVERTER_FORMATS) are imported from @/config/formatConstants


interface ToolInterfaceProps {
    tool: ToolDef;
}

function ToolInterfaceInner({ tool }: ToolInterfaceProps) {
    // ── DNE Session Engine ───────────────────────────────────────────────
    const {
        session,
        state: sessionState,
        isRestoring,
        expiredMessage,
        startSession,
        transition,
        reset: sessionReset,
    } = useToolSession(tool.id);

    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<"idle" | "uploading" | "converting" | "processing" | "success" | "error">("idle");
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [simulatedProgress, setSimulatedProgress] = useState(0);
    const [email, setEmail] = useState("");
    const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const { addToHistory } = useFileHistory();
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [showGhostExplainer, setShowGhostExplainer] = useState(false);
    const [isTransferLoading, setIsTransferLoading] = useState(false);

    // ── TRANSFER LOAD LOGIC (Restored post-DNE) ──────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const transferKey = params.get('transfer');

        if (!transferKey) return;

        let isMounted = true;

        const loadContent = async () => {
            setIsTransferLoading(true);

            // 1. Try Memory Cache
            const fastData = MemoryTransferCache.consume(transferKey);
            if (fastData) {
                if (fastData.file) {
                    if (isMounted) setFiles([fastData.file]);
                    window.history.replaceState({}, '', window.location.pathname);
                    if (isMounted) setIsTransferLoading(false);
                    return;
                } else if (fastData.deferred) {
                    try {
                        const res = await fetch(fastData.deferred.url);
                        const blob = await res.blob();
                        const file = new File([blob], fastData.deferred.filename, { type: fastData.deferred.type || blob.type });
                        if (isMounted) setFiles([file]);
                    } catch (e) {
                        console.error('Deferred transfer fetch failed:', e);
                        if (isMounted) setErrorMsg('Failed to load transferred file.');
                    }
                    window.history.replaceState({}, '', window.location.pathname);
                    if (isMounted) setIsTransferLoading(false);
                    return;
                }
            }

            // 2. Try IndexedDB Service via dynamic import
            try {
                const { FileTransferService } = await import('@/lib/file-transfer-service');
                const data = await FileTransferService.getTransfer(transferKey);
                if (data && data.file && isMounted) {
                    setFiles([data.file]);
                }
            } catch (e) {
                console.error("IDB Transfer failed", e);
            } finally {
                window.history.replaceState({}, '', window.location.pathname);
                if (isMounted) setIsTransferLoading(false);
            }
        };

        loadContent();

        return () => { isMounted = false; };
    }, [tool.id]);

    // ── DNE: Restore session state on mount (refresh recovery) ───────────
    useEffect(() => {
        if (session && sessionState === 'success' && session.result && status !== 'success') {
            // Session was restored from IndexedDB with a successful result
            setResult(session.result);
            setStatus('success');
            setSimulatedProgress(100);
            setIsGhostMode(session.isGhostMode);
        } else if (session && sessionState === 'error' && status !== 'error') {
            setStatus('error');
            setErrorMsg('Previous session encountered an error.');
        }
    }, [session, sessionState]);

    // ── DNE: Enforce Reset on URL back-navigation ───────────────────────
    // Critical: If the user presses Back and the URL drops the ?session param,
    // useToolSession resets its state to idle, but ToolInterface MUST also reset 
    // its independent local state to prevent a sticky UI.
    useEffect(() => {
        if (!session && sessionState === 'idle' && status !== 'idle') {
            setStatus('idle');
            setResult(null);
            setFiles([]);
            setSimulatedProgress(0);
            setErrorMsg(null);
        }
    }, [session, sessionState, status]);

    // ── CRITICAL: Direct popstate listener for reliable Back/Forward navigation ──
    // React state propagation from useToolSession can miss edge cases during rapid
    // history traversal. This listener directly resets local component state.
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const hasSession = params.has('session');
            const urlState = params.get('state');

            if (!hasSession && !urlState) {
                // User navigated back to clean tool URL — reset everything
                setStatus('idle');
                setResult(null);
                setSimulatedProgress(0);
                setErrorMsg(null);
                // Keep files so user can re-process
            } else if (urlState === 'success' && !result) {
                // Forward navigation to success but we lost the result — session hook will restore
                // Just ensure progress shows complete
                setSimulatedProgress(100);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [result]);

    // ── DNE: Show expired session message ────────────────────────────────
    useEffect(() => {
        if (expiredMessage) {
            setErrorMsg(expiredMessage);
            // Clear after 5 seconds
            const timer = setTimeout(() => setErrorMsg(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [expiredMessage]);

    // Check if tool supports Ghost Mode on mount
    useEffect(() => {
        setIsGhostMode(canProcessLocally(tool.id));
    }, [tool.id]);

    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Progress Logic - strictly monotonic to prevent "backward" jitter
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Reset only on 0 or idle, otherwise keep current
        if (status === "idle") {
            setSimulatedProgress(0);
        } else if (status === "uploading" && !isGhostMode) {
            setSimulatedProgress(prev => Math.max(prev, 10)); // Start at 10%
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    const next = prev + Math.random() * 5;
                    // Cap uploading at 60% until server responds
                    return (next > 60 ? 60 : next);
                });
            }, 500);
        } else if ((status === "processing" || status === "converting") && !isGhostMode) {
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    const next = prev + Math.random() * 3;
                    // Ease towards 95%
                    return (next > 95 ? 95 : next);
                });
            }, 800);
        } else if (status === "success") {
            setSimulatedProgress(100);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Auto-scroll to results on success (Mobile UX)
    useEffect(() => {
        if (status === "success" && progressRef.current) {
            // Small delay to ensure render
            setTimeout(() => {
                progressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [status]);

    // Request Cancellation
    const abortControllerRef = useRef<AbortController | null>(null);
    // Add More Files
    const addMoreInputRef = useRef<HTMLInputElement>(null);
    // Progress scroll ref
    const progressRef = useRef<HTMLDivElement>(null);

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus("idle");
        setErrorMsg("");
        setSimulatedProgress(0);
    };

    const handleAddMoreClick = () => {
        addMoreInputRef.current?.click();
    };

    const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            if (tool.multiple) {
                // Multi-file tools: add new files with deduplication
                setFiles(prev => {
                    const existingNames = new Set(prev.map(f => f.name));
                    const uniqueNew = newFiles.filter(f => !existingNames.has(f.name));
                    return [...prev, ...uniqueNew];
                });
            } else {
                // Single-file tools: replace the existing file
                setFiles(newFiles.slice(0, 1)); // Only take the first file
            }

            // Reset input so same file can be selected again if needed
            e.target.value = "";
        }
    };

    // NOTE: Processing/Uploading UI was previously in a dead block scope here.
    // The actual processing UI is rendered in the return statement below.

    // Tool Specific Options
    const [rotateAngle, setRotateAngle] = useState(90);
    const [targetFormat, setTargetFormat] = useState("JPEG");
    const [quality, setQuality] = useState(85);
    const [compressionLevel, setCompressionLevel] = useState("basic");
    const [pdfPassword, setPdfPassword] = useState("");
    const [settingsExpanded, setSettingsExpanded] = useState(false);

    // Drag and drop reordering (using ref for reliable tracking)
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    // Initialize dnd-kit sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum drag distance to activate, allows clicks to pass through
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ── Dnd-Kit Drag End Handler ─────────────────────────────────────────
    const handleDragEndDnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(f => `${f.name}-${f.size}-${f.lastModified}` === active.id);
                const newIndex = items.findIndex(f => `${f.name}-${f.size}-${f.lastModified}` === over.id);

                // Swap rotations as well to match the new file order
                setFileRotations(prev => {
                    const newRots = { ...prev };
                    const temp = newRots[oldIndex];
                    newRots[oldIndex] = newRots[newIndex];
                    newRots[newIndex] = temp;
                    return newRots;
                });

                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setDragIndex(null);
    };

    const handleDragStartDnd = (event: any) => {
        const { active } = event;
        const index = files.findIndex(f => `${f.name}-${f.size}-${f.lastModified}` === active.id);
        setDragIndex(index);
    };

    // Image to PDF Options
    const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [pdfPageSize, setPdfPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
    const [pdfMargin, setPdfMargin] = useState<'none' | 'small' | 'big'>('none');
    const [mergeAll, setMergeAll] = useState(true);
    const [fileRotations, setFileRotations] = useState<Record<number, number>>({});

    // Manual PDF Compression Controls
    const [pdfQuality, setPdfQuality] = useState(85);
    const [pdfDpi, setPdfDpi] = useState(150);
    const [showDragOverlay, setShowDragOverlay] = useState(false);
    const [useManualCompression, setUseManualCompression] = useState(false);

    // Split PDF Options
    const [splitMode, setSplitMode] = useState<'range' | 'pages' | 'size'>('range');
    const [customRanges, setCustomRanges] = useState<{ from: string, to: string }[]>([{ from: '1', to: '1' }]);
    const [fixedRange, setFixedRange] = useState<number>(1);
    const [splitMergeRanges, setSplitMergeRanges] = useState(false);
    // Pages (Extract) mode
    const [extractMode, setExtractMode] = useState<'all' | 'select'>('all');
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [extractPagesInput, setExtractPagesInput] = useState('');
    // Size mode
    const [sizeLimit, setSizeLimit] = useState<number>(1);
    const [sizeUnit, setSizeUnit] = useState<'KB' | 'MB'>('MB');
    const [allowCompression, setAllowCompression] = useState(true);
    // PDF page thumbnails (for split-pdf)
    const [pdfPageCount, setPdfPageCount] = useState<number>(0);
    const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
    const [pdfFileSize, setPdfFileSize] = useState<number>(0);

    // Per-file first-page thumbnails (for PDFs in non-split-pdf tools)
    const [fileThumbnails, setFileThumbnails] = useState<Record<string, string>>({});

    // Generate first-page thumbnails for PDF files in default file cards
    // Uses an abort flag to prevent stale state updates if files change or component unmounts
    useEffect(() => {
        if (tool.id === 'split-pdf' || files.length === 0) return;
        const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length === 0) return;

        let aborted = false;

        const generateThumb = async (file: File) => {
            const key = `${file.name}-${file.size}-${file.lastModified}`;
            if (fileThumbnails[key]) return; // already cached
            try {
                const arrayBuffer = await file.arrayBuffer();
                if (aborted) return;
                const header = new Uint8Array(arrayBuffer.slice(0, 5));
                const magic = String.fromCharCode(...header);
                if (!magic.startsWith('%PDF')) return;

                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                if (aborted) return;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    if (aborted) return;
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setFileThumbnails(prev => ({ ...prev, [key]: dataUrl }));
                }
            } catch (e) {
                if (!aborted) {
                    console.warn('[FileThumbnail] Failed to render PDF thumbnail:', file.name, e);
                }
            }
        };

        pdfFiles.forEach(generateThumb);

        return () => { aborted = true; };
    }, [files, tool.id]);

    // Prevent body scroll when mobile settings are open
    useEffect(() => {
        if (settingsExpanded) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
        return () => {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        };
    }, [settingsExpanded]);

    const handleAIRecommendation = (suggestion: { type: 'format' | 'compression' | 'batch' | 'quality', value: string, autoRun?: boolean }) => {
        if (suggestion.type === 'format') {
            setTargetFormat(suggestion.value);
            if (suggestion.autoRun) {
                handleProcess({ targetFormat: suggestion.value });
            }
        } else if (suggestion.type === 'compression') {
            setCompressionLevel(suggestion.value);
            setUseManualCompression(false);
            if (suggestion.autoRun) {
                handleProcess({ compressionLevel: suggestion.value });
            }
        } else if (suggestion.type === 'quality') {
            setQuality(Number(suggestion.value));
            // Quality optimization requires user to click process button
            // No auto-run
        } else if (suggestion.type === 'batch') {
            // For batch, we just trigger process
            if (suggestion.autoRun) {
                handleProcess();
            }
        }
    };

    useEffect(() => {
        // Reset state when tool changes
        setFiles([]);
        setStatus("idle");
        setResult(null);
        setErrorMsg("");
        setRotateAngle(90);
        setTargetFormat("JPEG");
        setQuality(85);
        setCompressionLevel("basic");
        setPdfQuality(85);
        setPdfDpi(150);
        setUseManualCompression(false);
        setSplitMode('range');
        setCustomRanges([{ from: '1', to: '1' }]);
        setFixedRange(1);
        setSplitMergeRanges(false);
        setExtractMode('all');
        setSelectedPages(new Set());
        setExtractPagesInput('');
        setSizeLimit(1);
        setSizeUnit('MB');
        setAllowCompression(true);
        setPdfPageCount(0);
        setPdfThumbnails([]);
        setPdfFileSize(0);
    }, [tool.id]);

    // Empty status monitoring effect removed — was a no-op causing unnecessary re-render tracking

    // Generate PDF page thumbnails when a PDF is uploaded for split-pdf tool
    useEffect(() => {
        if (tool.id !== 'split-pdf' || files.length === 0) {
            setPdfPageCount(0);
            setPdfThumbnails([]);
            setPdfFileSize(0);
            return;
        }
        const file = files[0];
        setPdfFileSize(file.size);

        const generateThumbnails = async () => {
            try {
                // Validate that the file is actually a PDF
                if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
                    console.warn('[Split PDF] File is not a PDF:', file.name, file.type);
                    setPdfPageCount(0);
                    setPdfThumbnails([]);
                    return;
                }
                const arrayBuffer = await file.arrayBuffer();
                // Double-check PDF magic bytes (%PDF-)
                const header = new Uint8Array(arrayBuffer.slice(0, 5));
                const magic = String.fromCharCode(...header);
                if (!magic.startsWith('%PDF')) {
                    console.warn('[Split PDF] File does not have a valid PDF header:', file.name);
                    setPdfPageCount(0);
                    setPdfThumbnails([]);
                    return;
                }
                // Use pdf-lib just for page count (already loaded)
                const { PDFDocument } = await import('pdf-lib');
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                const count = pdfDoc.getPageCount();
                setPdfPageCount(count);

                // Use pdf.js to render thumbnails
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const thumbs: string[] = [];

                for (let i = 1; i <= count; i++) {
                    try {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 0.3 }); // small thumbnails
                        const canvas = document.createElement('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            await page.render({ canvasContext: ctx, viewport }).promise;
                            thumbs.push(canvas.toDataURL('image/jpeg', 0.6));
                        } else {
                            thumbs.push('');
                        }
                    } catch {
                        thumbs.push('');
                    }
                }
                setPdfThumbnails(thumbs);
            } catch (err) {
                console.error('[SplitPDF] Failed to generate thumbnails:', err);
            }
        };
        generateThumbnails();
    }, [files, tool.id]);

    // Keyboard Shortcuts: Ctrl+Enter to Process
    // Uses refs to avoid recreating the listener on every files/status change
    const filesRef = useRef(files);
    const statusRef = useRef(status);
    filesRef.current = files;
    statusRef.current = status;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (filesRef.current.length > 0 && statusRef.current === 'idle') {
                    e.preventDefault();
                    handleProcess();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Stable — reads from refs

    // Handle Interactive Tools Early
    if (tool.endpoint === "/coming-soon") {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
                <p>This tool is under development.</p>
                <a href="/coming-soon" className="text-blue-600 hover:underline mt-4 block">Go to Coming Soon Page</a>
            </div>
        );
    }

    if (tool.type === "interactive") {
        // Full width Tools (matches ToolLayout exactly)
        if (tool.id === "edit-pdf") {
            return (
                <div className="flex-1 min-h-0 flex flex-col w-full mx-auto px-4 pb-16 relative isolate">
                    {/* Header */}
                    <div className="shrink-0 pt-1 pb-4">
                        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: tool.name }]} />

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${tool.theme.bgLight} rounded-2xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 shrink-0`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${tool.theme.text}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                    </svg>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <h1 className="text-2xl font-extrabold text-foreground leading-tight">{tool.name}</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Tool Component */}
                    <PDFEditor />
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto px-4">
                <Breadcrumbs items={[
                    { label: "Home", href: "/" },
                    { label: tool.name }
                ]} />

                {tool.id === "unit-converter" && <UnitConverter />}
                {tool.id === "length-converter" && <UnitConverter initialCategory="Length" />}
                {tool.id === "weight-converter" && <UnitConverter initialCategory="Weight" />}
                {tool.id === "temperature-converter" && <UnitConverter initialCategory="Temperature" />}
                {tool.id === "speed-converter" && <UnitConverter initialCategory="Speed" />}
                {tool.id === "volume-converter" && <UnitConverter initialCategory="Volume" />}
                {tool.id === "area-converter" && <UnitConverter initialCategory="Area" />}

                {tool.id === "time-converter" && <TimeConverter />}
                {tool.id === "utc-converter" && <TimeConverter />}
                {tool.id === "time-zone-map" && <TimeConverter />}
                {tool.id === "pst-to-est" && <TimeConverter />}

                {tool.id === "collage-maker" && <CollageMaker />}
                {tool.id === "image-resizer" && <ImageResizer />}
                {tool.id === "crop-image" && <ImageCropper />}
                {tool.id === "color-picker" && <ColorPicker />}
                {tool.id === "meme-generator" && <MemeGenerator />}
                {tool.id === "photo-editor" && <PhotoEditor />}
                {tool.id === "qr-code-generator" && <QRCodeGenerator />}
                {tool.id === "image-compressor" && <ImageCompressor />}
                {tool.id === "voice-recorder" && <VoiceRecorder />}
                {tool.id === "chat-with-pdf" && <PDFChat />}

                {/* Fallback for other interactive tools */}
                {!["unit-converter", "length-converter", "weight-converter", "temperature-converter", "speed-converter", "volume-converter", "area-converter",
                    "time-converter", "utc-converter", "time-zone-map", "pst-to-est",
                    "collage-maker", "image-resizer", "crop-image", "color-picker", "meme-generator", "photo-editor", "qr-code-generator", "image-compressor", "voice-recorder", "chat-with-pdf", "edit-pdf"].includes(tool.id) && (
                        <div className="bg-card p-12 text-center rounded-xl border border-border">
                            <h2 className="text-xl font-bold mb-2">{tool.name}</h2>
                            <p className="text-slate-500">Interactive tool coming soon.</p>
                        </div>
                    )}
            </div>
        );
    }

    // --- File Processing Tool Logic ---

    const handleFilesSelected = (selectedFiles: File[]) => {
        if (!tool.multiple) {
            setFiles([selectedFiles[0]]);
        } else {
            setFiles(selectedFiles);
        }
        setStatus("idle");
        setResult(null);
        setErrorMsg("");
        setSimulatedProgress(0);
    };

    const handleProcess = async (overrides?: { targetFormat?: string, compressionLevel?: string }) => {
        if (files.length === 0) return;

        // ── DNE: Create session on process start ────────────────────────
        const ghostMode = canProcessLocally(tool.id);
        const newSessionId = await startSession(files, ghostMode, 'uploading');

        // Reset abort controller
        abortControllerRef.current = new AbortController();

        setStatus("uploading");
        setSimulatedProgress(0); // Reset progress

        // Scroll to process area - Disabled for smoother UX
        // setTimeout(() => {
        //     progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        // }, 100);

        try {
            // Check for Client-Side Processing (Ghost Mode)
            if (canProcessLocally(tool.id)) {
                try {
                    setStatus("processing");
                    // Start from 0 to avoid jumping to Process segment directly
                    setSimulatedProgress(0);

                    const localResult = await processLocally(tool.id, files, {
                        rotateAngle,
                        fileRotations,
                        targetFormat,
                        compressionLevel,
                        quality,
                        password: pdfPassword,
                        pdfOrientation,
                        pdfPageSize,
                        pdfMargin,
                        mergeAll,
                        splitMode,
                        customRanges,
                        fixedRange,
                        splitMergeRanges,
                        extractMode,
                        selectedPages: Array.from(selectedPages),
                        extractPagesInput,
                        sizeLimit,
                        sizeUnit,
                        allowCompression,
                    }, undefined, undefined, (percent) => {
                        setSimulatedProgress(percent);
                    }, abortControllerRef.current?.signal);

                    setSimulatedProgress(100);
                    setResult(localResult);
                    setStatus("success");

                    // ── DNE: Persist success to session ──────────────────
                    await transition('success', localResult);

                    // Add to local history
                    addToHistory({
                        jobId: localResult.job_id,
                        fileName: localResult.filename,
                        toolId: tool.id,
                        downloadUrl: localResult.download_url,
                        type: 'processed'
                    });

                    return; // Exit early, do not send to server

                } catch (localError: any) {
                    console.error("Local processing failed:", localError);
                    // Do NOT fallback to server for Ghost Mode tools to respect privacy
                    setStatus("error");
                    setErrorMsg(`Local processing failed: ${localError.message || "Unknown error"}. Please check your browser console.`);
                    setSimulatedProgress(0);
                    // ── DNE: Persist error to session ────────────────────
                    await transition('error');
                    return;
                }
            }

            const formData = new FormData();

            if (tool.multiple) {
                files.forEach(f => formData.append("files", f));
            } else {
                formData.append("file", files[0]);
            }

            // Use overrides or current state
            const currentRotateAngle = rotateAngle;
            const currentTargetFormat = overrides?.targetFormat || targetFormat;
            const currentCompressionLevel = overrides?.compressionLevel || compressionLevel;
            const currentQuality = quality;

            if (tool.id.includes("rotate")) {
                formData.append("angle", currentRotateAngle.toString());
            }

            if (tool.id === "compress-pdf") {
                if (useManualCompression && !overrides?.compressionLevel) { // If manual and no override
                    formData.append("quality", pdfQuality.toString());
                    formData.append("dpi", pdfDpi.toString());
                } else {
                    formData.append("level", currentCompressionLevel);
                }
            }

            // Format handling - prioritize override from AI Assistant
            const presetFormat = tool.presetOptions?.target_format || tool.presetOptions?.format;

            // If override is provided (from AI Assistant), use it; otherwise use preset or current
            const finalFormat = overrides?.targetFormat || (presetFormat ? String(presetFormat) : currentTargetFormat);

            if (tool.id === "convert-image" || tool.endpoint.includes("pdf-to-image")) {
                formData.append(tool.endpoint.includes("pdf-to-image") ? "format" : "target_format", finalFormat.toLowerCase());
            }

            if (tool.id === "convert-image") {
                formData.append("quality", currentQuality.toString());
            }

            const res = await processJob(
                tool.endpoint,
                formData,
                abortControllerRef.current?.signal,
                (percent, stage) => {
                    // Start progress immediately if it's 0
                    setSimulatedProgress(prev => Math.max(prev, percent));
                    setStatus(stage); // 'uploading' or 'converting'
                }
            );

            setResult(res);
            setStatus("success");
            setSimulatedProgress(100);

            // ── DNE: Persist success to session ──────────────────────────
            await transition('success', res);

            // Add to local history
            addToHistory({
                jobId: res.job_id || crypto.randomUUID(),
                fileName: res.filename,
                toolId: tool.id,
                downloadUrl: getDownloadUrl(res.download_url),
                type: 'processed'
            });

            // Log history if user is logged in
            if (authAPI.isAuthenticated()) {
                const user = authAPI.getStoredUser();
                if (user) {
                    FirestoreService.logConversion({
                        userId: user.id, // User interface has 'id', not 'uid'
                        toolId: tool.id,
                        status: "success",
                        fileName: files.length === 1 ? files[0].name : `${files.length} files`,
                        outputFileName: res.filename,
                        downloadUrl: res.download_url,
                        fileSize: files.reduce((acc, f) => acc + f.size, 0)
                    });
                }
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                return; // Do nothing, state already reset by handleCancel if needed, or we just stay idle
            }
            console.error(e);
            setErrorMsg(e.message || "An error occurred");
            setStatus("error");
            // ── DNE: Persist error to session ────────────────────────────
            await transition('error');
        }
    };

    const reset = () => {
        setFiles([]);
        setStatus("idle");
        setResult(null);
        setErrorMsg("");
        setSimulatedProgress(0);
        // ── DNE: Clear session from URL ──────────────────────────────────
        sessionReset();
    };

    const showFormatSelector = (tool.id === "convert-image" || tool.endpoint.includes("pdf-to-image")) && !tool.presetOptions?.target_format && !tool.presetOptions?.format;

    return (
        <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 pb-12">

            <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: tool.name }
            ]} />

            {/* Main Content Area - Subpages */}
            <div className="mt-2 w-full">

                {/* 1. SELECTION SUBPAGE (Idle Status) */}
                {status === "idle" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-32">

                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 shrink-0 bg-white dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-red-500`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight tracking-tight">{tool.name}</h1>
                                    <GhostModeBadge
                                        mode={isGhostMode ? "local" : "cloud"}
                                        onClick={isGhostMode ? () => setShowGhostExplainer(true) : undefined}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Interaction Area (Unified Card) */}
                        <div
                            className={`flex flex-col gap-6 relative min-h-[400px] ${files.length === 0 ? 'bg-card dark:bg-[#1A1D24] rounded-[2rem] p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-200 dark:border-slate-800' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Ignore internal card reorder drags
                                if (e.dataTransfer.getData('text/plain')?.startsWith('card-reorder')) return;
                                if (e.dataTransfer.files?.length) {
                                    const droppedFiles = Array.from(e.dataTransfer.files);
                                    handleFilesSelected(droppedFiles);
                                }
                            }}
                        >

                            <div className="flex flex-col gap-8 w-full">
                                {/* Full Dropzone — only when no files selected */}
                                {files.length === 0 && (
                                    <>
                                        {/* Mobile Ad (Above Dropzone) */}
                                        <div className="block md:hidden w-full max-w-[320px] mx-auto mb-2">
                                            <AdSlot adSlotId="mobile-top-dropzone" format="mobile-banner" isTest={true} />
                                        </div>

                                        <Dropzone
                                            onFilesSelected={handleFilesSelected}
                                            acceptedTypes={tool.acceptedTypes}
                                            multiple={tool.multiple}
                                            label="Drag & Drop files here, or click to select"
                                        />

                                        {/* Mobile Ad (Below Dropzone) */}
                                        <div className="block md:hidden w-full max-w-[320px] mx-auto mt-2">
                                            <AdSlot adSlotId="mobile-bottom-dropzone" format="mobile-banner" isTest={true} />
                                        </div>

                                        <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-[#f4f4f5] dark:bg-slate-800 rounded-full px-4 py-2 w-fit mx-auto border-2 border-slate-900 dark:border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-600 dark:text-green-500 shrink-0">
                                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                            </svg>
                                            <span className="uppercase tracking-wide">{isGhostMode ? "Processed entirely on your device • No upload • No storage" : "SSL Encrypted • Auto-delete in 1h • Max 500MB"}</span>
                                        </div>
                                    </>
                                )}

                                {/* Hidden file input for adding more files */}
                                <input
                                    type="file"
                                    ref={addMoreInputRef}
                                    className="hidden"
                                    multiple={tool.multiple}
                                    accept={tool.acceptedTypes}
                                    onChange={handleAddMoreFiles}
                                />

                                {/* Mobile: Full-screen settings overlay - kept outside regular flow */}
                                {settingsExpanded && (
                                    <>
                                        {/* Backdrop */}
                                        <div className="lg:hidden fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSettingsExpanded(false)} />
                                        <div className="lg:hidden fixed inset-x-0 bottom-0 z-[100] flex flex-col bg-background rounded-t-3xl shadow-2xl max-h-[65vh] animate-in slide-in-from-bottom-32 fade-in duration-500 ease-out border-t border-slate-200 dark:border-slate-700">
                                            {/* Overlay Header */}
                                            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-xl">
                                                <div className="flex items-center gap-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <h2 className="text-xl font-extrabold text-foreground">Settings</h2>
                                                </div>
                                                <button
                                                    onClick={() => setSettingsExpanded(false)}
                                                    className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full transition-colors active:scale-95 bg-slate-100 dark:bg-slate-800"
                                                    aria-label="Close"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Overlay Body — scrollable */}
                                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-32">
                                                <div className="flex flex-col gap-6 w-full">
                                                    {tool.id.includes("rotate") && (
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Rotation Angle</label>
                                                            <div className="flex gap-2">
                                                                {[90, 180, 270].map(angle => (
                                                                    <button
                                                                        key={angle}
                                                                        onClick={() => setRotateAngle(angle)}
                                                                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${rotateAngle === angle
                                                                            ? `${tool.theme.bgLight} ${tool.theme.border} ${tool.theme.text} shadow-sm scale-[1.02]`
                                                                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground hover:scale-[1.02]'
                                                                            }`}
                                                                    >
                                                                        {angle}°
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(tool.id === 'image-to-pdf' || tool.id === 'jpg-to-pdf') && (
                                                        <div className="space-y-6">
                                                            {/* Page Orientation */}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Page orientation</label>
                                                                <div className="flex gap-3">
                                                                    {[
                                                                        { id: 'portrait' as const, label: 'Portrait', icon: (<svg viewBox="0 0 24 32" className="w-5 h-7" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="2" width="18" height="28" rx="2" /></svg>) },
                                                                        { id: 'landscape' as const, label: 'Landscape', icon: (<svg viewBox="0 0 32 24" className="w-7 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="28" height="18" rx="2" /></svg>) },
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => setPdfOrientation(opt.id)}
                                                                            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl text-sm font-bold border transition-all ${pdfOrientation === opt.id
                                                                                ? `${tool.theme.bgLight} ${tool.theme.border} ${tool.theme.text} shadow-sm scale-[1.02]`
                                                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground hover:scale-[1.02]'
                                                                                }`}
                                                                        >
                                                                            {opt.icon}
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Page Size */}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Page size</label>
                                                                <select
                                                                    value={pdfPageSize}
                                                                    onChange={(e) => setPdfPageSize(e.target.value as 'fit' | 'a4' | 'letter')}
                                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
                                                                >
                                                                    <option value="fit">Fit (Same page size as image)</option>
                                                                    <option value="a4">A4 (297×210 mm)</option>
                                                                    <option value="letter">US Letter (215×279.4 mm)</option>
                                                                </select>
                                                            </div>

                                                            {/* Margin */}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Margin</label>
                                                                <div className="flex gap-3">
                                                                    {[
                                                                        { id: 'none' as const, label: 'No margin', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="2" /><rect x="4" y="4" width="16" height="16" rx="1" fill="currentColor" opacity="0.15" /></svg>) },
                                                                        { id: 'small' as const, label: 'Small', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="2" /><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" opacity="0.15" /></svg>) },
                                                                        { id: 'big' as const, label: 'Big', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" opacity="0.15" /></svg>) },
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => setPdfMargin(opt.id)}
                                                                            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl text-sm font-bold border transition-all ${pdfMargin === opt.id
                                                                                ? `${tool.theme.bgLight} ${tool.theme.border} ${tool.theme.text} shadow-sm scale-[1.02]`
                                                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground hover:scale-[1.02]'
                                                                                }`}
                                                                        >
                                                                            {opt.icon}
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Merge all */}
                                                            <label className="flex items-center gap-3 cursor-pointer group mt-2">
                                                                <div className={`relative w-11 h-6 rounded-full transition-colors ${mergeAll ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`} onClick={() => setMergeAll(!mergeAll)}>
                                                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${mergeAll ? 'translate-x-5' : ''}`} />
                                                                </div>
                                                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Merge all images in one PDF</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {tool.id === "split-pdf" && (
                                                        <div className="space-y-6">
                                                            {pdfPageCount > 0 && (
                                                                <div className="text-xs text-muted-foreground space-y-0.5">
                                                                    <p>Original file size: <b>{pdfFileSize > 1024 * 1024 ? (pdfFileSize / 1024 / 1024).toFixed(2) + ' MB' : (pdfFileSize / 1024).toFixed(0) + ' KB'}</b></p>
                                                                    <p>Total pages: <b>{pdfPageCount}</b></p>
                                                                </div>
                                                            )}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Split mode</label>
                                                                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                                    {(['range', 'pages', 'size'] as const).map(mode => (
                                                                        <button key={mode} onClick={() => setSplitMode(mode)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${splitMode === mode ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
                                                                            {mode === 'range' && <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
                                                                            {mode === 'pages' && <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="8" height="10" rx="1" /><rect x="13" y="3" width="8" height="10" rx="1" /><rect x="3" y="15" width="8" height="6" rx="1" /><rect x="13" y="15" width="8" height="6" rx="1" /></svg>}
                                                                            {mode === 'size' && <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="9" height="12" rx="1" /><rect x="13" y="4" width="9" height="12" rx="1" /><path d="M6.5 20h11" strokeLinecap="round" /></svg>}
                                                                            <span className="capitalize">{mode === 'pages' ? 'Extract' : mode}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {splitMode === 'range' && (
                                                                <div className="space-y-4">
                                                                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                                                                        {customRanges.map((range, idx) => (
                                                                            <div key={idx} className="flex flex-col gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-bold text-foreground">Range {idx + 1}</span>
                                                                                    {customRanges.length > 1 && (<button onClick={() => setCustomRanges(customRanges.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 transition-colors p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>)}
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="flex-1 flex items-center border border-border rounded-lg bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                                                                                        <span className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-r border-border font-medium">from</span>
                                                                                        <input type="number" min="1" max={pdfPageCount || undefined} value={range.from} onChange={(e) => { const nr = [...customRanges]; nr[idx].from = Math.min(parseInt(e.target.value) || 1, pdfPageCount || Infinity).toString(); setCustomRanges(nr); }} className="w-full px-3 py-2 text-sm font-bold bg-transparent outline-none text-center" />
                                                                                    </div>
                                                                                    <div className="flex-1 flex items-center border border-border rounded-lg bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                                                                                        <span className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-r border-border font-medium">to</span>
                                                                                        <input type="number" min="1" max={pdfPageCount || undefined} value={range.to} onChange={(e) => { const nr = [...customRanges]; nr[idx].to = Math.min(parseInt(e.target.value) || 1, pdfPageCount || Infinity).toString(); setCustomRanges(nr); }} className="w-full px-3 py-2 text-sm font-bold bg-transparent outline-none text-center" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <button onClick={() => { const lastTo = Math.min(parseInt(customRanges[customRanges.length - 1]?.to) || 0, (pdfPageCount || Infinity) - 1); const next = Math.min(lastTo + 1, pdfPageCount || Infinity); setCustomRanges([...customRanges, { from: next.toString(), to: next.toString() }]); }} className="w-full py-2.5 bg-white dark:bg-slate-800 border-2 border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                                        Add Range
                                                                    </button>
                                                                    <label className="flex items-center gap-3 cursor-pointer group mt-2">
                                                                        <div className={`relative w-6 h-6 rounded-md border-2 transition-colors flex items-center justify-center ${splitMergeRanges ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/50'}`} onClick={() => setSplitMergeRanges(!splitMergeRanges)}>
                                                                            {splitMergeRanges && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                        </div>
                                                                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Merge all ranges in one PDF</span>
                                                                    </label>
                                                                </div>
                                                            )}
                                                            {splitMode === 'pages' && (
                                                                <div className="space-y-4">
                                                                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                                        <button onClick={() => setExtractMode('all')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${extractMode === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Extract all pages</button>
                                                                        <button onClick={() => setExtractMode('select')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${extractMode === 'select' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Select pages</button>
                                                                    </div>
                                                                    {extractMode === 'select' && (
                                                                        <div className="space-y-3">
                                                                            <label className="text-xs font-bold text-muted-foreground">Pages to extract:</label>
                                                                            <input type="text" placeholder="e.g. 1-3,6" value={extractPagesInput} onChange={(e) => { setExtractPagesInput(e.target.value); const pages = new Set<number>(); e.target.value.split(',').forEach(part => { const t = part.trim(); if (t.includes('-')) { const [a, b] = t.split('-').map(Number); if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) pages.add(i); } else { const n = parseInt(t); if (!isNaN(n)) pages.add(n); } }); setSelectedPages(pages); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                                <div className={`relative w-6 h-6 rounded-md border-2 transition-colors flex items-center justify-center ${splitMergeRanges ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/50'}`} onClick={() => setSplitMergeRanges(!splitMergeRanges)}>
                                                                                    {splitMergeRanges && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                                </div>
                                                                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Merge extracted pages into one PDF</span>
                                                                            </label>
                                                                            {selectedPages.size > 0 && (
                                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                                                                                    <b>{selectedPages.size}</b> page{selectedPages.size > 1 ? 's' : ''} selected. {splitMergeRanges ? '1 merged PDF' : `${selectedPages.size} PDF${selectedPages.size > 1 ? 's' : ''}`} will be created.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {splitMode === 'size' && (
                                                                <div className="space-y-4">
                                                                    <label className="text-sm font-bold text-foreground">Maximum size per file:</label>
                                                                    <div className="flex items-center gap-3">
                                                                        <input type="number" min="1" value={sizeLimit} onChange={(e) => setSizeLimit(parseInt(e.target.value) || 1)} className="w-24 px-4 py-2.5 border-2 border-border rounded-xl text-lg font-bold bg-card text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                                            <button onClick={() => setSizeUnit('KB')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${sizeUnit === 'KB' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground'}`}>KB</button>
                                                                            <button onClick={() => setSizeUnit('MB')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${sizeUnit === 'MB' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground'}`}>MB</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                                                                        ℹ️ This PDF will be split into files no larger than <b>{sizeLimit} {sizeUnit}</b> each.
                                                                    </div>
                                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                                        <div className={`relative w-6 h-6 rounded-md border-2 transition-colors flex items-center justify-center ${allowCompression ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/50'}`} onClick={() => setAllowCompression(!allowCompression)}>
                                                                            {allowCompression && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                        </div>
                                                                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Allow compression</span>
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {tool.id === "compress-pdf" && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Compression Mode</label>
                                                                <button
                                                                    onClick={() => setUseManualCompression(!useManualCompression)}
                                                                    className="text-xs text-primary hover:underline font-bold bg-primary/10 px-3 py-1 rounded-full transition-colors"
                                                                >
                                                                    {useManualCompression ? "Switch to Easy Mode" : "Switch to Manual Mode"}
                                                                </button>
                                                            </div>

                                                            {!useManualCompression ? (
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {[
                                                                        { id: 'extreme', label: 'Extreme', desc: 'Low quality, high compression', mult: 0.15 },
                                                                        { id: 'recommended', label: 'Recommended', desc: 'Good quality, good compression', mult: 0.45 },
                                                                        { id: 'basic', label: 'Basic', desc: 'High quality, text focused', mult: 0.85 }
                                                                    ].map((mode) => {
                                                                        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
                                                                        let estSizeStr = null;
                                                                        if (totalSize > 0) {
                                                                            const estBytes = totalSize * mode.mult;
                                                                            estSizeStr = estBytes > 1024 * 1024
                                                                                ? `~${(estBytes / 1024 / 1024).toFixed(1)} MB`
                                                                                : `~${(estBytes / 1024).toFixed(0)} KB`;
                                                                        }
                                                                        return (
                                                                            <button
                                                                                key={mode.id}
                                                                                onClick={() => setCompressionLevel(mode.id)}
                                                                                className={`relative text-left p-4 rounded-xl border transition-all ${compressionLevel === mode.id
                                                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                                                                                    : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'
                                                                                    }`}
                                                                            >
                                                                                <div className={`font-bold text-sm mb-1 ${compressionLevel === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.label}</div>
                                                                                {estSizeStr && <div className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit mb-1.5">{estSizeStr}</div>}
                                                                                <div className="text-xs text-muted-foreground leading-snug">{mode.desc}</div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border">
                                                                    <div>
                                                                        <div className="flex justify-between mb-3">
                                                                            <label className="text-sm font-bold text-foreground">Image Quality</label>
                                                                            <span className="text-sm font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">{pdfQuality}%</span>
                                                                        </div>
                                                                        <RangeSlider
                                                                            value={pdfQuality}
                                                                            min={10}
                                                                            max={100}
                                                                            step={5}
                                                                            onChange={setPdfQuality}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex justify-between mb-3">
                                                                            <label className="text-sm font-bold text-foreground">Maximum DPI</label>
                                                                            <span className="text-sm font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">{pdfDpi} DPI</span>
                                                                        </div>
                                                                        <RangeSlider
                                                                            value={pdfDpi}
                                                                            min={72}
                                                                            max={600}
                                                                            step={20}
                                                                            onChange={setPdfDpi}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {showFormatSelector && (
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Format</label>
                                                            <div className="relative">
                                                                <FormatSelector
                                                                    value={targetFormat}
                                                                    onChange={setTargetFormat}
                                                                    options={tool.id === "convert-audio" ? AUDIO_CONVERTER_FORMATS : IMAGE_CONVERTER_FORMATS}
                                                                    theme="light"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {tool.id === "convert-image" && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quality</label>
                                                                <span className="text-sm font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">{quality}%</span>
                                                            </div>
                                                            <RangeSlider
                                                                value={quality}
                                                                min={1}
                                                                max={100}
                                                                onChange={setQuality}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <AIAssistant
                                                    tool={tool}
                                                    files={files}
                                                    currentFormat={targetFormat}
                                                    compressionLevel={compressionLevel}
                                                    quality={quality}
                                                    onApply={handleAIRecommendation}
                                                />
                                            </div>

                                            {/* Sticky Bottom Done Button for Thumb Access */}
                                            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent pt-12 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150">
                                                <button
                                                    onClick={() => setSettingsExpanded(false)}
                                                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-extrabold transition-all hover:bg-primary/90 active:scale-[0.98] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-primary/25 flex items-center justify-center gap-2"
                                                >
                                                    Apply Settings
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}{/* End mobile settings overlay */}

                                {/* Desktop Two-Column Layout: Files LEFT, Options RIGHT */}
                                {files.length > 0 && (
                                    <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-0 animate-in fade-in zoom-in-95 duration-300 bg-card dark:bg-[#1A1D24] rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                                        {/* LEFT COLUMN: Selected Files (80%) */}
                                        <div className="space-y-3 min-w-0 p-4 sm:p-5 lg:p-6 flex flex-col min-h-[50vh]">
                                            {/* Mobile: Settings overlay trigger — above files */}
                                            <button
                                                onClick={() => setSettingsExpanded(true)}
                                                className="lg:hidden group/settings flex items-center justify-between w-full px-5 py-4 bg-[#f4f4f5] dark:bg-slate-800 border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none rounded-2xl text-[15px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 transition-all duration-200 ease-out"
                                            >
                                                <span className="flex items-center gap-3 text-primary">
                                                    <div className="bg-primary/10 p-2 rounded-xl transition-transform duration-200 group-active/settings:scale-90 group-active/settings:rotate-45">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    Configure Tool Settings
                                                </span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-primary/50 mr-1 transition-transform duration-200 group-active/settings:translate-x-1">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Selected Files</span>
                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    <button
                                                        onClick={() => setFiles([])}
                                                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-[2px] border-slate-900 dark:border-slate-800 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none rounded-full text-xs font-black uppercase tracking-wider transition-all min-w-28 whitespace-nowrap"
                                                        title="Delete all files"
                                                    >
                                                        <span>Delete All</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 shrink-0">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={handleAddMoreClick}
                                                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white border-[2px] border-slate-900 dark:border-slate-800 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none rounded-full text-xs font-black uppercase tracking-wider transition-all min-w-28 whitespace-nowrap"
                                                        title={tool.multiple ? "Add more files to the list" : "Replace current file"}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                        </svg>
                                                        <span>Add More</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col items-stretch pt-2">
                                                {tool.id === 'split-pdf' && splitMode === 'pages' && extractMode === 'select' && pdfPageCount > 0 ? (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar p-2">
                                                        {pdfThumbnails.map((thumbData, index) => {
                                                            const pageNum = index + 1;
                                                            const isSelected = selectedPages.has(pageNum);
                                                            return (
                                                                <div
                                                                    key={`page-${pageNum}`}
                                                                    onClick={() => {
                                                                        const newPages = new Set(selectedPages);
                                                                        if (isSelected) newPages.delete(pageNum);
                                                                        else newPages.add(pageNum);
                                                                        setSelectedPages(newPages);

                                                                        // Also update the input text representation
                                                                        const sorted = Array.from(newPages).sort((a, b) => a - b);
                                                                        setExtractPagesInput(sorted.join(','));
                                                                    }}
                                                                    className={`group flex flex-col relative aspect-[1/1.3] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border-2 ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg -translate-y-0.5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-white dark:bg-[#1A1D24]'}`}
                                                                >
                                                                    {/* Page Number Badge */}
                                                                    <div className={`absolute top-2 left-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold shadow-md ring-2 ring-white/30 ${isSelected ? 'bg-primary text-white' : 'bg-slate-900/80 text-white'}`}>
                                                                        {pageNum}
                                                                    </div>
                                                                    <div className="flex-1 w-full p-1 sm:p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40">
                                                                        {thumbData ? (
                                                                            <img src={thumbData} alt={`Page ${pageNum}`} className="w-[95%] h-[95%] object-contain shadow-sm bg-white" />
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground animate-pulse font-medium">Loading...</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Selection Checkmark */}
                                                                    <div className={`absolute top-3 right-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${isSelected ? 'bg-primary border-primary text-white scale-110' : 'bg-white/90 dark:bg-black/50 border-slate-300 dark:border-slate-500 text-transparent group-hover:border-primary/40 group-hover:text-primary/20'}`}>
                                                                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 sm:w-4 sm:h-4" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        </svg>
                                                                    </div>

                                                                    <div className={`w-full py-2.5 transition-colors border-t border-slate-100 dark:border-slate-800 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-white dark:bg-[#1A1D24] text-foreground group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80'} text-center`}>
                                                                        <span className="text-sm font-bold tracking-tight">Page {pageNum}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragStart={handleDragStartDnd}
                                                        onDragEnd={handleDragEndDnd}
                                                    >
                                                        <SortableContext
                                                            items={files.map(f => `${f.name}-${f.size}-${f.lastModified}`)}
                                                            strategy={rectSortingStrategy}
                                                        >
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-1">
                                                                <AnimatePresence>
                                                                    {files.map((f, i) => (
                                                                        <SortableFileItem key={`${f.name}-${f.size}-${f.lastModified}`} id={`${f.name}-${f.size}-${f.lastModified}`}>
                                                                            <m.div
                                                                                layoutId={`${f.name}-${f.size}-${f.lastModified}`}
                                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                                                data-file-card
                                                                                className={`w-full h-full group relative aspect-square bg-[#1A1D24] dark:bg-[#1A1D24] rounded-lg border shadow-sm hover:shadow-md transition-colors duration-200 overflow-hidden select-none ${dragIndex === i ? 'opacity-40 border-primary z-40' : 'border-slate-800 hover:border-slate-600 z-10'}`}
                                                                            >
                                                                                {/* File Number Badge */}
                                                                                <div className="absolute top-2 left-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900/80 ring-2 ring-white/30 flex items-center justify-center text-xs sm:text-sm font-extrabold text-white shadow-md">
                                                                                    {i + 1}
                                                                                </div>

                                                                                <div
                                                                                    onClick={() => { setPreviewFile(f); }}
                                                                                    className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
                                                                                />

                                                                                <div className="w-full h-full flex items-center justify-center p-2 sm:p-3 pb-7 sm:pb-3 pointer-events-none">
                                                                                    {f.type.startsWith("image/") ? (
                                                                                        <img draggable={false} src={URL.createObjectURL(f)} alt="" className="w-full h-full object-contain drop-shadow-sm rounded-lg transition-transform duration-300 select-none" style={{ transform: `rotate(${fileRotations[i] || 0}deg)` }} onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} />
                                                                                    ) : fileThumbnails[`${f.name}-${f.size}-${f.lastModified}`] ? (
                                                                                        <img draggable={false} src={fileThumbnails[`${f.name}-${f.size}-${f.lastModified}`]} alt={f.name} className="w-full h-full object-contain drop-shadow-sm rounded-lg bg-white select-none" />
                                                                                    ) : (
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-slate-400">
                                                                                            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A9 9 0 0011.25 3.75H10.5V7.125A2.625 2.625 0 0113.125 9.75h3.375v.375a.375.375 0 01-.375.375H13.5a4.125 4.125 0 01-4.125-4.125V1.5H5.625z" />
                                                                                            <path d="M12.971 1.816A5.23 5.23 0 0114.25 3.75c2.232 0 4.058 1.651 4.367 3.795a.75.75 0 01-.065.404A9.006 9.006 0 0020.25 12.75v7.875A3.375 3.375 0 0116.875 24H5.625A3.375 3.375 0 012.25 20.625V3.375A3.375 3.375 0 015.625 0h4.846c.95 0 1.864.377 2.5 1.066l.001-.001z" fillOpacity="0" />
                                                                                        </svg>
                                                                                    )}
                                                                                </div>
                                                                                {/* Always-visible action buttons — z-30 to sit above drag overlay */}
                                                                                <div className="absolute top-1.5 right-1.5 z-30 flex flex-col gap-1">
                                                                                    <button onClick={(e) => { e.stopPropagation(); setFileRotations(prev => ({ ...prev, [i]: ((prev[i] || 0) + 90) % 360 })); }} className="p-1.5 bg-slate-800 hover:bg-white hover:text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-white rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-95" title="Rotate 90°">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                                                                                    </button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); const newFiles = [...files]; newFiles.splice(i, 1); setFiles(newFiles); setFileRotations(prev => { const newRots = { ...prev }; delete newRots[i]; return newRots; }); }} className="p-1.5 bg-slate-800 hover:bg-red-500 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-white rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-95" title="Remove File">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                    </button>
                                                                                </div>
                                                                                <div data-file-card-label className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/80 backdrop-blur-md text-slate-300 text-[10px] sm:text-xs font-bold truncate text-center pointer-events-none border-t border-slate-700/50">
                                                                                    {f.name}
                                                                                </div>
                                                                            </m.div>
                                                                        </SortableFileItem>
                                                                    ))}
                                                                </AnimatePresence>
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                )}
                                            </div>
                                        </div>


                                        {/* RIGHT COLUMN: Desktop-only Options Sidebar (20%) */}
                                        <div className="hidden lg:flex flex-col gap-8 self-stretch overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 border-l border-slate-200 dark:border-slate-700 p-6 xl:p-8 bg-slate-50/50 dark:bg-[#111318]">
                                            <div className="space-y-8">
                                                <div className="flex flex-col gap-6 w-full">
                                                    {tool.id.includes("rotate") && (
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Rotation Angle</label>
                                                            <div className="flex gap-2">
                                                                {[90, 180, 270].map(angle => (
                                                                    <button
                                                                        key={angle}
                                                                        onClick={() => setRotateAngle(angle)}
                                                                        className={`flex-1 py-3.5 rounded-xl text-base font-black uppercase tracking-wider border-[2px] transition-all duration-200 ${rotateAngle === angle
                                                                            ? `${tool.theme.bgLight} border-slate-900 ${tool.theme.text} shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5`
                                                                            : 'border-slate-900/20 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-500 hover:bg-[#f4f4f5] dark:hover:bg-slate-800 text-muted-foreground hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,0.2)] dark:hover:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]'
                                                                            }`}
                                                                    >
                                                                        {angle}°
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(tool.id === 'image-to-pdf' || tool.id === 'jpg-to-pdf') && (
                                                        <div className="space-y-6">
                                                            {/* Page Orientation */}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Page orientation</label>
                                                                <div className="flex gap-3">
                                                                    {[
                                                                        { id: 'portrait' as const, label: 'Portrait', icon: (<svg viewBox="0 0 24 32" className="w-5 h-7" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="2" width="18" height="28" rx="2" /></svg>) },
                                                                        { id: 'landscape' as const, label: 'Landscape', icon: (<svg viewBox="0 0 32 24" className="w-7 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="28" height="18" rx="2" /></svg>) },
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => setPdfOrientation(opt.id)}
                                                                            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl text-sm font-black uppercase tracking-wider border-[2px] transition-all duration-200 ${pdfOrientation === opt.id
                                                                                ? `${tool.theme.bgLight} border-slate-900 ${tool.theme.text} shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5`
                                                                                : 'border-slate-900/20 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-500 hover:bg-[#f4f4f5] dark:hover:bg-slate-800 text-muted-foreground hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,0.2)] dark:hover:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]'
                                                                                }`}
                                                                        >
                                                                            {opt.icon}
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Page Size */}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Page size</label>
                                                                <select
                                                                    value={pdfPageSize}
                                                                    onChange={(e) => setPdfPageSize(e.target.value as 'fit' | 'a4' | 'letter')}
                                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground font-semibold text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
                                                                >
                                                                    <option value="fit">Fit (Same as image)</option>
                                                                    <option value="a4">A4 (297×210 mm)</option>
                                                                    <option value="letter">US Letter</option>
                                                                </select>
                                                            </div>

                                                            {/* Margin */}
                                                            <div className="space-y-3">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Margin</label>
                                                                <div className="flex gap-2">
                                                                    {[
                                                                        { id: 'none' as const, label: 'None' },
                                                                        { id: 'small' as const, label: 'Small' },
                                                                        { id: 'big' as const, label: 'Big' },
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => setPdfMargin(opt.id)}
                                                                            className={`flex-1 py-3 rounded-xl text-center text-sm font-black uppercase tracking-wider border-[2px] transition-all duration-200 ${pdfMargin === opt.id
                                                                                ? `${tool.theme.bgLight} border-slate-900 ${tool.theme.text} shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5`
                                                                                : 'border-slate-900/20 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-500 hover:bg-[#f4f4f5] dark:hover:bg-slate-800 text-muted-foreground hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,0.2)] dark:hover:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]'
                                                                                }`}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Merge all */}
                                                            <label className="flex items-center gap-3 cursor-pointer group mt-1">
                                                                <div className={`relative w-10 h-[22px] rounded-full transition-colors ${mergeAll ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`} onClick={() => setMergeAll(!mergeAll)}>
                                                                    <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-md transition-transform ${mergeAll ? 'translate-x-[18px]' : ''}`} />
                                                                </div>
                                                                <span className="text-sm font-bold text-foreground leading-tight">Merge all in one PDF</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {tool.id === "compress-pdf" && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Compression</label>
                                                                <button
                                                                    onClick={() => setUseManualCompression(!useManualCompression)}
                                                                    className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-full border-2 border-primary/30 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,0.1)] active:translate-y-0 active:shadow-none transition-all"
                                                                >
                                                                    {useManualCompression ? "Easy" : "Manual"}
                                                                </button>
                                                            </div>

                                                            {!useManualCompression ? (
                                                                <div className="flex flex-col gap-2">
                                                                    {[
                                                                        { id: 'extreme', label: 'Extreme', desc: 'Max compression' },
                                                                        { id: 'recommended', label: 'Recommended', desc: 'Balanced' },
                                                                        { id: 'basic', label: 'Basic', desc: 'High quality' }
                                                                    ].map((mode) => (
                                                                        <button
                                                                            key={mode.id}
                                                                            onClick={() => setCompressionLevel(mode.id)}
                                                                            className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${compressionLevel === mode.id
                                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                                                : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                                }`}
                                                                        >
                                                                            <div className={`font-bold ${compressionLevel === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.label}</div>
                                                                            <div className="text-xs text-muted-foreground">{mode.desc}</div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border">
                                                                    <div>
                                                                        <div className="flex justify-between mb-2">
                                                                            <label className="text-xs font-bold text-foreground">Quality</label>
                                                                            <span className="text-xs font-mono text-primary font-bold">{pdfQuality}%</span>
                                                                        </div>
                                                                        <RangeSlider value={pdfQuality} min={10} max={100} step={5} onChange={setPdfQuality} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex justify-between mb-2">
                                                                            <label className="text-xs font-bold text-foreground">Max DPI</label>
                                                                            <span className="text-xs font-mono text-primary font-bold">{pdfDpi}</span>
                                                                        </div>
                                                                        <RangeSlider value={pdfDpi} min={72} max={600} step={20} onChange={setPdfDpi} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {tool.id === "split-pdf" && (
                                                        <div className="space-y-5">
                                                            {pdfPageCount > 0 && (
                                                                <div className="text-sm text-muted-foreground space-y-1">
                                                                    <p>Original file size: <b>{pdfFileSize > 1024 * 1024 ? (pdfFileSize / 1024 / 1024).toFixed(2) + ' MB' : (pdfFileSize / 1024).toFixed(0) + ' KB'}</b></p>
                                                                    <p>Total pages: <b>{pdfPageCount}</b></p>
                                                                </div>
                                                            )}
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">SPLIT MODE</label>
                                                                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                                    {(['range', 'pages', 'size'] as const).map(mode => (
                                                                        <button key={mode} onClick={() => setSplitMode(mode)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${splitMode === mode ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
                                                                            {mode === 'range' && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
                                                                            {mode === 'pages' && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="8" height="10" rx="1" /><rect x="13" y="3" width="8" height="10" rx="1" /><rect x="3" y="15" width="8" height="6" rx="1" /><rect x="13" y="15" width="8" height="6" rx="1" /></svg>}
                                                                            {mode === 'size' && <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="9" height="12" rx="1" /><rect x="13" y="4" width="9" height="12" rx="1" /><path d="M6.5 20h11" strokeLinecap="round" /></svg>}
                                                                            <span className="capitalize">{mode === 'pages' ? 'Extract' : mode}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {splitMode === 'range' && (
                                                                <div className="space-y-3">
                                                                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                                                        {customRanges.map((range, idx) => (
                                                                            <div key={idx} className="flex flex-col gap-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[11px] font-bold text-foreground">Range {idx + 1}</span>
                                                                                    {customRanges.length > 1 && (<button onClick={() => setCustomRanges(customRanges.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>)}
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="flex-1 flex items-center border border-border rounded-lg bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                                                                                        <span className="px-2 py-1.5 text-[10px] text-muted-foreground bg-muted/50 border-r border-border font-medium">from</span>
                                                                                        <input type="number" min="1" max={pdfPageCount || undefined} value={range.from} onChange={(e) => { const nr = [...customRanges]; nr[idx].from = Math.min(parseInt(e.target.value) || 1, pdfPageCount || Infinity).toString(); setCustomRanges(nr); }} className="w-full px-2 py-1.5 text-xs font-bold bg-transparent outline-none text-center" />
                                                                                    </div>
                                                                                    <div className="flex-1 flex items-center border border-border rounded-lg bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                                                                                        <span className="px-2 py-1.5 text-[10px] text-muted-foreground bg-muted/50 border-r border-border font-medium">to</span>
                                                                                        <input type="number" min="1" max={pdfPageCount || undefined} value={range.to} onChange={(e) => { const nr = [...customRanges]; nr[idx].to = Math.min(parseInt(e.target.value) || 1, pdfPageCount || Infinity).toString(); setCustomRanges(nr); }} className="w-full px-2 py-1.5 text-xs font-bold bg-transparent outline-none text-center" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <button onClick={() => { const lastTo = Math.min(parseInt(customRanges[customRanges.length - 1]?.to) || 0, (pdfPageCount || Infinity) - 1); const next = Math.min(lastTo + 1, pdfPageCount || Infinity); setCustomRanges([...customRanges, { from: next.toString(), to: next.toString() }]); }} className="w-full py-1.5 bg-white dark:bg-slate-800 border-2 border-primary text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                                        Add Range
                                                                    </button>
                                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                                        <div className={`relative w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${splitMergeRanges ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/50'}`} onClick={() => setSplitMergeRanges(!splitMergeRanges)}>
                                                                            {splitMergeRanges && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                        </div>
                                                                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Merge all ranges</span>
                                                                    </label>
                                                                </div>
                                                            )}
                                                            {splitMode === 'pages' && (
                                                                <div className="space-y-3">
                                                                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                                        <button onClick={() => setExtractMode('all')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${extractMode === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>All pages</button>
                                                                        <button onClick={() => setExtractMode('select')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${extractMode === 'select' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Select pages</button>
                                                                    </div>
                                                                    {extractMode === 'select' && (
                                                                        <div className="space-y-2">
                                                                            <label className="text-sm font-bold text-muted-foreground">Pages to extract:</label>
                                                                            <input type="text" placeholder="e.g. 1-3,6" value={extractPagesInput} onChange={(e) => { setExtractPagesInput(e.target.value); const pages = new Set<number>(); e.target.value.split(',').forEach(part => { const t = part.trim(); if (t.includes('-')) { const [a, b] = t.split('-').map(Number); if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) pages.add(i); } else { const n = parseInt(t); if (!isNaN(n)) pages.add(n); } }); setSelectedPages(pages); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                                <div className={`relative w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${splitMergeRanges ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/50'}`} onClick={() => setSplitMergeRanges(!splitMergeRanges)}>
                                                                                    {splitMergeRanges && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                                </div>
                                                                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Merge into one PDF</span>
                                                                            </label>
                                                                            {selectedPages.size > 0 && (
                                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                                                                                    <b>{selectedPages.size}</b> page{selectedPages.size > 1 ? 's' : ''} → {splitMergeRanges ? '1 merged PDF' : `${selectedPages.size} PDF${selectedPages.size > 1 ? 's' : ''}`}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {splitMode === 'size' && (
                                                                <div className="space-y-3">
                                                                    <label className="text-sm font-bold text-foreground">Max size per file:</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <input type="number" min="1" value={sizeLimit} onChange={(e) => setSizeLimit(parseInt(e.target.value) || 1)} className="w-16 px-3 py-1.5 border-2 border-border rounded-xl text-sm font-bold bg-card text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                                                        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                                            <button onClick={() => setSizeUnit('KB')} className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${sizeUnit === 'KB' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground'}`}>KB</button>
                                                                            <button onClick={() => setSizeUnit('MB')} className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${sizeUnit === 'MB' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-muted-foreground'}`}>MB</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px] text-blue-700 dark:text-blue-300">
                                                                        ℹ️ Split into files ≤ <b>{sizeLimit} {sizeUnit}</b> each.
                                                                    </div>
                                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                                        <div className={`relative w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${allowCompression ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/50'}`} onClick={() => setAllowCompression(!allowCompression)}>
                                                                            {allowCompression && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                        </div>
                                                                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Allow compression</span>
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {showFormatSelector && (
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Format</label>
                                                            <FormatSelector
                                                                value={targetFormat}
                                                                onChange={setTargetFormat}
                                                                options={tool.id === "convert-audio" ? AUDIO_CONVERTER_FORMATS : IMAGE_CONVERTER_FORMATS}
                                                                theme="dark"
                                                            />
                                                        </div>
                                                    )}

                                                    {tool.id === "convert-image" && (
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quality</label>
                                                                <span className="text-xs font-mono text-primary font-bold">{quality}%</span>
                                                            </div>
                                                            <RangeSlider value={quality} min={1} max={100} onChange={setQuality} />
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* State 1 and 2: "Under Tool" Ad - Shown when idle (both before and during file configuration) */}
                            {status === "idle" && (
                                <div className="hidden md:flex w-full justify-center pt-8 pb-4">
                                    <AdSlot adSlotId="UNDER_TOOL_BANNER" format="leaderboard" isTest={true} />
                                </div>
                            )}

                            <ToolInfoSection tool={tool} />
                        </div>
                    </div>
                )
                } {/* End Selection Subpage */}

                {/* 2. PROCESSING SUBPAGE */}
                {
                    (status === "uploading" || status === "converting" || status === "processing") && (
                        <div className="w-full flex flex-col items-center justify-center min-h-[500px] animate-in zoom-in-95 fade-in duration-500 pb-32">
                            <div className="bg-card dark:bg-[#1A1D24] w-full p-8 md:p-12 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl text-center relative overflow-hidden">
                                <div className="relative z-10 flex flex-col items-center justify-between mb-8">
                                    <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                                        {status === "uploading" && <><span className="text-blue-500 animate-pulse">Uploading</span> files...</>}
                                        {(status === "converting" || status === "processing") && (
                                            isGhostMode
                                                ? <><span className="text-indigo-500 animate-pulse">Processing files</span> locally...</>
                                                : <><span className="text-indigo-500 animate-pulse">Converting</span> files...</>
                                        )}
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground mt-3 md:mt-2 px-4">
                                        {isGhostMode ? "Your data never leaves your device." : "Hang tight, we are crunching the numbers..."}
                                    </p>
                                </div>
                                <div className="relative z-10">
                                    <NeuroProgressBar
                                        progress={simulatedProgress}
                                        className={`h-4 md:h-6 rounded-full w-full max-w-lg mx-auto bg-blue-600 overflow-hidden shadow-inner ring-1 ring-border`}
                                        color="blue"
                                        segments={isGhostMode ? ["Read", "Process", "Save"] : ["Upload", "Process", "Download"]}
                                        isGhostMode={isGhostMode}
                                    />
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={handleCancel}
                                            className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-red-500 hover:bg-red-400 active:bg-red-600 text-white font-black text-sm uppercase tracking-wider rounded-full border-[3px] border-slate-900 dark:border-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] transition-all duration-[200ms] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none active:scale-95"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:rotate-90 group-active:scale-75"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            Cancel Operation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                } {/* End Processing Subpage */}

                {/* 3. DOWNLOAD SUBPAGE (Success Status) */}
                {
                    status === "success" && result && (
                        <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
                            <div className="flex-1 w-full animate-in slide-in-from-bottom-4 fade-in duration-500 min-h-[500px] bg-card dark:bg-[#1A1D24] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6 md:p-8">
                                <ConversionSuccessModal
                                    result={result}
                                    tool={tool}
                                    isGhostMode={isGhostMode}
                                    onReset={reset}
                                />
                            </div>

                            {/* State 3: Success "High Conversion" Ad Card (Mobile & Desktop) */}
                            <div className="flex flex-col md:flex-row xl:flex-col justify-center items-center gap-6 w-full xl:w-[332px] shrink-0 animate-in fade-in duration-500 delay-300 bg-card dark:bg-[#1A1D24] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6 xl:p-4">
                                {/* Ad 1 */}
                                <div className="w-full flex-1 flex items-center justify-center">
                                    <AdSlot adSlotId="SUCCESS_SIDEBAR_AD_1" format="rectangle" isTest={true} className="!w-full !max-w-[300px] !h-full" />
                                </div>
                                {/* Separator */}
                                <div className="hidden xl:block w-full h-px bg-slate-200 dark:bg-slate-800"></div>
                                <div className="md:hidden xl:hidden w-full h-px bg-slate-200 dark:bg-slate-800"></div>
                                {/* Ad 2 */}
                                <div className="w-full flex-1 flex items-center justify-center">
                                    <AdSlot adSlotId="SUCCESS_SIDEBAR_AD_2" format="rectangle" isTest={true} className="!w-full !max-w-[300px] !h-full" />
                                </div>
                            </div>
                        </div>
                    )
                } {/* End Download Subpage */}

                {/* Error Banner fallback in case processing wasn't caught by the progress screen */}
                {
                    status === "error" && errorMsg && (
                        <div className="bg-[#ff4d4f] text-white p-6 md:p-8 rounded-2xl text-center max-w-2xl mx-auto border-[3px] border-slate-900 dark:border-slate-800 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] dark:shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center gap-5 animate-in fade-in slide-in-from-top-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 flex-shrink-0 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            <div className="text-xl font-black break-words tracking-tight uppercase leading-snug">{errorMsg}</div>
                            <button onClick={reset} className="mt-4 px-8 py-3 bg-white text-slate-900 rounded-xl font-black uppercase tracking-wider border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none active:scale-95 transition-all duration-200">
                                Try Again
                            </button>
                        </div>
                    )
                }

                {/* UNIVERSAL STICKY PROCESS BUTTON */}
                {
                    files.length > 0 && status === "idle" && (
                        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-border md:border-t-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-none flex justify-center animate-in slide-in-from-bottom-8">
                            <button
                                onClick={() => handleProcess()}
                                className={`w-full md:w-auto md:min-w-[400px] h-14 md:h-16 rounded-full font-black uppercase tracking-wider text-xl transition-all duration-200 transform group relative overflow-hidden active:translate-y-0 active:scale-95 active:shadow-none hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] border-[3px] border-slate-900 dark:border-slate-800 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] dark:shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] ${tool.theme.gradient} text-white`}
                            >
                                <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-white/30 group-hover:animate-[shine_1.5s_ease-out_infinite]" />
                                <span className="relative flex items-center justify-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 animate-bounce-horizontal"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                    Process {files.length} File{files.length !== 1 ? 's' : ''}
                                </span>
                            </button>
                        </div>
                    )
                }

                {/* Modals outside main view container */}
                {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
                {showGhostExplainer && <GhostModeExplainerModal onClose={() => setShowGhostExplainer(false)} />}
            </div >
        </div >
    );
}

/**
 * Public export wrapped in Suspense + ErrorBoundary.
 * - Suspense: required because useToolSession uses useSearchParams.
 * - ErrorBoundary: catches render errors in tool components (dynamic imports)
 *   to prevent full-page crashes and allow recovery.
 */
export default function ToolInterface({ tool }: ToolInterfaceProps) {
    return (
        <ErrorBoundary
            fallback={
                <div className="max-w-md mx-auto mt-20 p-8 text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6">This tool encountered an error. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary text-white text-sm font-black uppercase tracking-wider rounded-full border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none transition-all"
                    >
                        Refresh Page
                    </button>
                </div>
            }
        >
            <Suspense fallback={
                <div className="max-w-[1400px] mx-auto px-4 pb-12 animate-pulse">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 mb-8" />
                    <div className="h-96 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
                </div>
            }>
                <ToolInterfaceInner tool={tool} />
            </Suspense>
        </ErrorBoundary>
    );
}
