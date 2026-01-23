"use client";

import { useState, useEffect, useRef } from "react";
import AIAssistant from "./AIAssistant";
import { ToolDef } from "@/config/tools";
import Dropzone from "@/components/SmartDropzone";
import NeuroProgressBar from "@/components/NeuroProgressBar";
import CompletionSuccess from "@/components/CompletionSuccess";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConversionSuccessModal from "@/components/ConversionSuccessModal";
import UnitConverter from "@/components/tools/UnitConverter";
import TimeConverter from "@/components/tools/TimeConverter";
import ColorPicker from "@/components/tools/ColorPicker";
import CollageMaker from "@/components/tools/CollageMaker";
import ImageCropper from "@/components/tools/ImageCropper";
import ImageResizer from "@/components/tools/ImageResizer";
import MemeGenerator from "@/components/tools/MemeGenerator";
import PhotoEditor from "@/components/tools/PhotoEditor";
import QRCodeGenerator from "@/components/tools/QRCodeGenerator";
import ImageCompressor from "@/components/tools/ImageCompressor";
import ToolInfoSection from "@/components/ToolInfoSection";
import VoiceRecorder from "@/components/tools/VoiceRecorder";
import PDFChat from "@/components/tools/PDFChat";
import { processJob, getDownloadUrl, ProcessResponse, sendEmail } from "@/lib/api";
import { SortableFileList } from "@/components/SortableFileList";
import { authAPI } from "@/lib/auth-api";
import { FirestoreService } from "@/lib/firestore-service";
import AdUnit from "@/components/AdUnit";
import { useFileHistory } from "@/hooks/useFileHistory";
import { canProcessLocally, processLocally } from "@/lib/client-processor";
import GhostModeBadge from "@/components/GhostModeBadge";
import GhostModeExplainerModal from "@/components/GhostModeExplainerModal";
import RangeSlider from "@/components/RangeSlider";

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

interface ToolInterfaceProps {
    tool: ToolDef;
}

export default function ToolInterface({ tool }: ToolInterfaceProps) {
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

    {/* Processing/Uploading State */ }
    {
        (status === "uploading" || status === "converting" || status === "processing") && (
            <div className="w-full max-w-xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500" ref={progressRef}>
                <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">

                    {/* Status Text - High Contrast */}
                    <div className="relative z-10 mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {isGhostMode
                                ? "⚡ Processing Locally"
                                : status === "uploading" ? "Uploading Files..." : "Processing..."
                            }
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {isGhostMode ? "Private & Secure" : "Please wait..."}
                        </p>
                    </div>

                    {/* Big Percentage - Centered */}
                    <div className="relative z-10 mb-8">
                        <span className="text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                            {Math.round(simulatedProgress)}
                        </span>
                        <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 ml-1">%</span>
                    </div>

                    {/* Progress Bar - Wide & Clean */}
                    <div className="relative z-10 mb-8 max-w-sm mx-auto">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${simulatedProgress}%` }}
                            />
                            {/* Pulse effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                    </div>

                    {/* Cancel Button - Separated at Bottom */}
                    <div className="relative z-10">
                        <button
                            onClick={handleCancel}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                        >
                            <span>Cancel Operation</span>
                        </button>
                    </div>

                </div>
            </div>
        )
    }

    // Tool Specific Options
    const [rotateAngle, setRotateAngle] = useState(90);
    const [targetFormat, setTargetFormat] = useState("JPEG");
    const [quality, setQuality] = useState(85);
    const [compressionLevel, setCompressionLevel] = useState("basic");
    const [pdfPassword, setPdfPassword] = useState("");

    // Manual PDF Compression Controls
    const [pdfQuality, setPdfQuality] = useState(85);
    const [pdfDpi, setPdfDpi] = useState(150);
    const [useManualCompression, setUseManualCompression] = useState(false);

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
    }, [tool.id]);

    useEffect(() => {
        // Status monitoring if needed
    }, [status]);

    // Keyboard Shortcuts: Ctrl+Enter to Process
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (files.length > 0 && status === 'idle') {
                    e.preventDefault();
                    handleProcess();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, status]);

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
                    "collage-maker", "image-resizer", "crop-image", "color-picker", "meme-generator", "photo-editor", "qr-code-generator", "image-compressor", "voice-recorder", "chat-with-pdf"].includes(tool.id) && (
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
                    // Simulated upload progress for UX consistency, though it's instant
                    setSimulatedProgress(30);

                    const localResult = await processLocally(tool.id, files, {
                        rotateAngle,
                        targetFormat,
                        compressionLevel,
                        quality,
                        password: pdfPassword
                    });

                    setSimulatedProgress(100);
                    setResult(localResult);
                    setStatus("success");

                    // Add to local history
                    addToHistory({
                        jobId: localResult.job_id,
                        fileName: localResult.filename,
                        toolId: tool.id,
                        downloadUrl: localResult.download_url,
                        size: localResult.compressed_size ? `${(localResult.compressed_size / 1024 / 1024).toFixed(2)} MB` : undefined,
                        type: 'processed'
                    });

                    return; // Exit early, do not send to server

                } catch (localError: any) {
                    console.error("Local processing failed:", localError);
                    // Do NOT fallback to server for Ghost Mode tools to respect privacy
                    setStatus("error");
                    setErrorMsg(`Local processing failed: ${localError.message || "Unknown error"}. Please check your browser console.`);
                    setSimulatedProgress(0);
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

            // Add to local history
            addToHistory({
                jobId: res.job_id || crypto.randomUUID(),
                fileName: res.filename,
                toolId: tool.id,
                downloadUrl: getDownloadUrl(res.download_url),
                size: res.compressed_size ? `${(res.compressed_size / 1024 / 1024).toFixed(2)} MB` : undefined,
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
        }
    };

    const reset = () => {
        setFiles([]);
        setStatus("idle");
        setResult(null);
        setErrorMsg("");
        setSimulatedProgress(0);
    };

    const showFormatSelector = (tool.id === "convert-image" || tool.endpoint.includes("pdf-to-image")) && !tool.presetOptions?.target_format && !tool.presetOptions?.format;

    return (
        <div className="max-w-[1400px] mx-auto px-4 pb-12">

            <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: tool.name }
            ]} />

            {/* Split Layout Container */}
            <div className="mt-8 grid lg:grid-cols-12 gap-8 items-start">

                {/* LEFT PANEL: Info & Actions (Sticky on Desktop) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">

                    {/* Header Card */}
                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`w-14 h-14 ${tool.theme.bgLight} rounded-2xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 shrink-0`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-7 h-7 ${tool.theme.text}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-foreground leading-tight mb-1">{tool.name}</h1>
                                <GhostModeBadge
                                    mode={isGhostMode ? "local" : "cloud"}
                                    onClick={isGhostMode ? () => setShowGhostExplainer(true) : undefined}
                                />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{tool.description}</p>

                        {/* Desktop: Primary Action Button (Only show if files selected) */}
                        {files.length > 0 && status === "idle" && (
                            <button
                                onClick={() => handleProcess()}
                                className={`hidden lg:flex w-full py-4 ${tool.theme.bg} text-white rounded-xl font-bold hover:bg-opacity-90 shadow-lg ${tool.theme.hoverShadow} transition-all items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] text-lg animate-in fade-in slide-in-from-bottom-2`}
                            >
                                <span>Process Files</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        )}

                        {/* Tool Options (Moved to Left Panel) */}
                        {files.length > 0 && status === "idle" && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">


                                {tool.id.includes("rotate") && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rotation</label>
                                        <div className="flex gap-2">
                                            {[90, 180, 270].map(angle => (
                                                <button
                                                    key={angle}
                                                    onClick={() => setRotateAngle(angle)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${rotateAngle === angle
                                                        ? `${tool.theme.bgLight} ${tool.theme.border} ${tool.theme.text}`
                                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground'
                                                        }`}
                                                >
                                                    {angle}°
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {tool.id === "compress-pdf" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Compression Mode</label>
                                            <button
                                                onClick={() => setUseManualCompression(!useManualCompression)}
                                                className="text-[10px] text-blue-500 hover:underline font-medium"
                                            >
                                                {useManualCompression ? "Switch to Easy Mode" : "Switch to Manual Mode"}
                                            </button>
                                        </div>

                                        {!useManualCompression ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { id: 'extreme', label: 'Extreme', desc: 'Low quality, high compression' },
                                                    { id: 'recommended', label: 'Recommended', desc: 'Good quality, good compression' },
                                                    { id: 'basic', label: 'Basic', desc: 'High quality, low compression' }
                                                ].map((mode) => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => setCompressionLevel(mode.id)}
                                                        className={`text-left p-3 rounded-xl border transition-all ${compressionLevel === mode.id
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                                            : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <div className={`font-bold text-sm ${compressionLevel === mode.id ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>{mode.label}</div>
                                                        <div className="text-[10px] text-muted-foreground">{mode.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium">Image Quality: {pdfQuality}%</label>
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
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium">Max DPI: {pdfDpi}</label>
                                                    </div>
                                                    <RangeSlider
                                                        value={pdfDpi}
                                                        min={72}
                                                        max={600}
                                                        step={20} // Discrete steps for DPI
                                                        onChange={setPdfDpi}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div >
                                )}

                                {
                                    showFormatSelector && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Format</label>
                                            <select
                                                value={targetFormat}
                                                onChange={(e) => setTargetFormat(e.target.value)}
                                                className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="JPEG">JPEG (Best for photos)</option>
                                                <option value="PNG">PNG (Best for screenshots)</option>
                                                <option value="WEBP">WEBP (Modern web format)</option>
                                            </select>
                                        </div>
                                    )
                                }

                                {
                                    tool.id === "convert-image" && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quality</label>
                                                <span className="text-xs font-mono text-muted-foreground">{quality}%</span>
                                            </div>
                                            <RangeSlider
                                                value={quality}
                                                min={1}
                                                max={100}
                                                onChange={setQuality}
                                            />
                                        </div>
                                    )
                                }
                                {/* AI Tips moved to bottom to prevent pushing content down */}
                                <AIAssistant
                                    tool={tool}
                                    files={files}
                                    currentFormat={targetFormat}
                                    compressionLevel={compressionLevel}
                                    quality={quality}
                                    onApply={handleAIRecommendation}
                                />
                            </div>
                        )}
                    </div >
                </div >

                {/* RIGHT PANEL: Workspace (Dropzone, Files, Results) */}
                < div className="lg:col-span-7 xl:col-span-8" >
                    <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden min-h-[500px] flex flex-col">
                        <div className="flex-1 p-6 relative flex flex-col justify-center">

                            {/* Success State or Dropzone */}
                            {status === "success" && result ? (
                                <ConversionSuccessModal
                                    result={result}
                                    tool={tool}
                                    isGhostMode={isGhostMode}
                                    onReset={reset}
                                />
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Dropzone */}
                                    <Dropzone
                                        onFilesSelected={handleFilesSelected}
                                        acceptedTypes={tool.acceptedTypes}
                                        multiple={tool.multiple}
                                        label={files.length > 0
                                            ? `${files.length} file(s) selected`
                                            : `Drop files here`
                                        }
                                    />

                                    {/* Security Banner */}
                                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium text-muted-foreground bg-secondary/50 rounded-xl md:rounded-full px-3 py-1.5 w-full md:w-fit mx-auto text-center leading-tight">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0">
                                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                        </svg>
                                        <span>{isGhostMode ? "Processed entirely on your device • No upload • No storage" : "SSL Encrypted • Auto-delete in 1h • Max 500MB"}</span>
                                    </div>



                                    {/* Add More Input (Hidden) */}
                                    <input
                                        type="file"
                                        ref={addMoreInputRef}
                                        className="hidden"
                                        multiple={tool.multiple}
                                        accept={tool.acceptedTypes}
                                        onChange={handleAddMoreFiles}
                                    />

                                    {/* File List Header with Add More Button */}
                                    {files.length > 0 && (
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ready ({files.length})</span>
                                            </div>
                                            <button
                                                onClick={handleAddMoreClick}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground`}
                                                title={tool.multiple ? "Add more files to the list" : "Replace the current file with a new one"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                <span>Add More</span>
                                            </button>
                                        </div>
                                    )}

                                    {
                                        files.length > 0 && (
                                            <div className={`bg-slate-50/50 dark:bg-slate-900/20 rounded-xl p-2 max-h-[350px] overflow-y-auto border border-dashed border-slate-200 dark:border-slate-800 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-300 transition-colors`}>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {files.map((f, i) => (
                                                        <div key={`${f.name}-${i}`} className="group relative aspect-square bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer" onClick={() => setPreviewFile(f)}>
                                                            {/* Preview Image/Icon */}
                                                            <div className="w-full h-full flex items-center justify-center p-4">
                                                                {f.type.startsWith("image/") ? (
                                                                    <img
                                                                        src={URL.createObjectURL(f)}
                                                                        alt=""
                                                                        className="w-full h-full object-contain"
                                                                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                                                    />
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-slate-300 dark:text-slate-600">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            {/* Hover Overlay */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setPreviewFile(f); }}
                                                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md"
                                                                    title="Quick Preview"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newFiles = [...files];
                                                                        newFiles.splice(i, 1);
                                                                        setFiles(newFiles);
                                                                    }}
                                                                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md"
                                                                    title="Remove File"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                            </div>

                                                            {/* Info Badge */}
                                                            <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-bold truncate">
                                                                {f.name}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }

                                    {
                                        files.length > 0 && (
                                            <div className="lg:hidden text-center text-xs text-muted-foreground my-4">
                                                (Options available in top panel on mobile)
                                            </div>
                                        )
                                    }

                                    {/* Results Area (Stable Ref for Scrolling) */}
                                    <div ref={progressRef} className="scroll-mt-24 space-y-4">
                                        {errorMsg && (
                                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                </svg>
                                                <div className="flex-1 break-words">{errorMsg}</div>
                                            </div>
                                        )}

                                        {(status === "uploading" || status === "converting" || status === "processing") && (
                                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm text-center relative group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                        {status === "uploading" && (
                                                            <span className="text-blue-600 animate-pulse">Uploading...</span>
                                                        )}
                                                        {(status === "converting" || status === "processing") && (
                                                            <span className="text-indigo-600 animate-pulse">{isGhostMode ? "Processing on your device..." : "Converting..."}</span>
                                                        )}
                                                    </p>
                                                    <div className="flex justify-end mb-2">
                                                        <button
                                                            onClick={handleCancel}
                                                            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <NeuroProgressBar
                                                        progress={simulatedProgress}
                                                        className={isGhostMode ? "bg-[#a3e635]" : "bg-blue-600"}
                                                        color={isGhostMode ? "lime" : "blue"}
                                                        segments={["Read", "Process", "Sign"]}
                                                        isGhostMode={isGhostMode}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {status === "success" && result && (
                                            <CompletionSuccess
                                                tool={tool}
                                                result={result}
                                                onReset={() => {
                                                    setStatus("idle");
                                                    setFiles([]);
                                                    setResult(null);
                                                    setSimulatedProgress(0);
                                                }}
                                            />
                                        )}


                                        {/* Process Button - Desktop Standard / Mobile Sticky */}
                                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:p-0 md:bg-transparent md:border-none md:shadow-none text-center lg:hidden">
                                            <button
                                                onClick={() => handleProcess()}
                                                disabled={files.length === 0 || status === "uploading" || status === "processing"}
                                                className={`w-full md:w-auto md:min-w-[280px] md:px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ease-out transform relative group overflow-hidden
                                     hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] active:translate-y-0 active:shadow-sm
                                     ${files.length > 0 && status === 'idle' ? 'animate-pulse-subtle ring-4 ring-primary/20' : ''}
                                     ${status !== 'idle' ? 'hidden' : ''} 
                                     ${files.length === 0
                                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none hover:transform-none"
                                                        : `${tool.theme.gradient} text-white ${tool.theme.hoverShadow}`
                                                    }`}
                                            >
                                                {/* Shine Effect */}
                                                {files.length > 0 && status !== 'processing' && status !== 'uploading' && (
                                                    <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-white/30 group-hover:animate-shine" />
                                                )}

                                                <span className={`relative flex items-center justify-center gap-2 ${files.length > 0 ? "" : ""}`}>
                                                    {status === "uploading" ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Uploading...
                                                        </>
                                                    ) : status === "processing" ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Almost there...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Process {tool.name}
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                            </svg>
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Spacer to prevent content from being hidden behind sticky footer on mobile */}
                                        <div className="h-24 md:hidden"></div>
                                    </div>
                                    {/* Bottom Ad Unit - Removed */}
                                    {/* <AdUnit slotId={process.env.NEXT_PUBLIC_AD_SLOT_BOTTOM || "0987654321"} className="mt-8 mb-8 mx-auto max-w-[728px] flex justify-center bg-slate-100/50 rounded-lg overflow-hidden" style={{ minHeight: '90px' }} /> */}

                                    <ToolInfoSection tool={tool} />

                                    {/* Render Modal */}
                                    {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

                                    {/* Render Explainer Modal */}
                                    {showGhostExplainer && <GhostModeExplainerModal onClose={() => setShowGhostExplainer(false)} />}
                                </div >
                            )}
                        </div >
                    </div >
                </div >

            </div >
        </div >
    );
}
