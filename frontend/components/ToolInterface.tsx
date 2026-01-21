"use client";

import { useState, useEffect, useRef } from "react";
import AIAssistant from "./AIAssistant";
import { ToolDef } from "@/config/tools";
import Dropzone from "@/components/SmartDropzone";
import ProgressBar from "@/components/ProgressBar";
import Breadcrumbs from "@/components/Breadcrumbs";
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
import { authAPI } from "@/lib/auth-api";
import { FirestoreService } from "@/lib/firestore-service";
import AdUnit from "@/components/AdUnit";

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

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "uploading") {
            setSimulatedProgress(0);
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    const next = prev + Math.random() * 8;
                    return next > 60 ? 60 : next;
                });
            }, 250);
        } else if (status === "processing") {
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    const next = prev + Math.random() * 4;
                    return next > 95 ? 95 : next;
                });
            }, 400);
        } else if (status === "success") {
            setSimulatedProgress(100);
        }
        return () => clearInterval(interval);
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


    // Tool Specific Options
    const [rotateAngle, setRotateAngle] = useState(90);
    const [targetFormat, setTargetFormat] = useState("JPEG");
    const [quality, setQuality] = useState(85);
    const [compressionLevel, setCompressionLevel] = useState("basic");

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

        // Scroll to process area
        setTimeout(() => {
            progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);

        try {
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
                    setSimulatedProgress(percent);
                    setStatus(stage); // 'uploading' or 'converting'
                }
            );

            setResult(res);
            setStatus("success");
            setSimulatedProgress(100);

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
        <div className="max-w-4xl mx-auto px-4">

            <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: tool.name }
            ]} />

            {/* Top Ad Unit */}
            {/* Top Ad Unit - Removed */}
            {/* <AdUnit slotId={process.env.NEXT_PUBLIC_AD_SLOT_TOP || "1234567890"} className="mb-2 mx-auto max-w-[728px] flex justify-center bg-slate-100/50 rounded-lg overflow-hidden" style={{ minHeight: '90px' }} /> */}

            <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
                {/* Header */}
                <div className={`p-8 border-b border-border bg-secondary ${tool.theme.text === 'text-white' ? '' : 'dark:bg-slate-800'}`}>
                    <div className={`w-16 h-16 ${tool.theme.bgLight} rounded-2xl flex items-center justify-center mb-6 mx-auto ${tool.theme.text}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">{tool.name}</h1>
                    <p className="text-center text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6">{tool.description}</p>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                            </svg>
                            Secure (SSL)
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Success State */}
                    {status === "success" && result ? (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Processing Complete!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">Your file is ready to download.</p>

                            {/* Compression Stats for compress-pdf */}
                            {tool.id === "compress-pdf" && result.original_size && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                        </svg>
                                        Compression Results
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="text-left">
                                            <p className="text-slate-500 dark:text-slate-400 mb-1">Original Size</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{(result.original_size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-slate-500 dark:text-slate-400 mb-1">Compressed Size</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{((result.compressed_size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Space Saved</span>
                                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{result.reduction_percent}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                                <a
                                    href={getDownloadUrl(result.download_url)}
                                    download={result.filename}
                                    className={`px-6 py-4 ${tool.theme.bg} text-white rounded-2xl font-bold hover:bg-opacity-90 shadow-lg ${tool.theme.hoverShadow} transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] min-h-[56px]`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    Download File
                                </a>
                                <button
                                    onClick={reset}
                                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[56px]"
                                >
                                    Start Over
                                </button>
                            </div>

                            {/* Email Section */}
                            <div className="mt-8 max-w-sm mx-auto">
                                {emailStatus === "sent" ? (
                                    <div className="text-green-600 bg-green-50 p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Email sent successfully!
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="email"
                                            placeholder="Enter email to save link"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex-1 px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-[56px]"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!email) return;
                                                setEmailStatus("sending");
                                                try {
                                                    await sendEmail(email, getDownloadUrl(result.download_url), result.filename);
                                                    setEmailStatus("sent");
                                                } catch (e) {
                                                    console.error(e);
                                                    setEmailStatus("error");
                                                }
                                            }}
                                            disabled={emailStatus === "sending" || !email}
                                            className="px-6 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 transition-all min-h-[56px] w-full sm:w-auto"
                                        >
                                            {emailStatus === "sending" ? "Sending..." : "Email Me"}
                                        </button>
                                    </div>
                                )}
                                {emailStatus === "error" && <p className="text-red-500 text-xs mt-2">Failed to send email. Please try again.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Dropzone */}
                            <Dropzone
                                onFilesSelected={handleFilesSelected}
                                acceptedTypes={tool.acceptedTypes}
                                multiple={tool.multiple}
                                label={files.length > 0
                                    ? `${files.length} file(s) selected`
                                    : `Drop files here to ${tool.name.toLowerCase()}`
                                }
                            />

                            {/* Security Banner */}
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 w-fit mx-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                                <span>Files are <span className="font-semibold text-slate-700">automatically deleted</span> after 1 hour. Max 500MB.</span>
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
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Files ({files.length})</span>
                                    <button
                                        onClick={handleAddMoreClick}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-medium text-xs shadow-md transition-all hover:scale-105 active:scale-95 ${tool.multiple
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        title={tool.multiple ? "Add more files to the list" : "Replace the current file with a new one"}
                                    >
                                        {tool.multiple ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                                </svg>
                                                <span>Add More</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                    <path d="M7.712 4.819A1.5 1.5 0 018.99 4H15a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8.5a2 2 0 012-2h.255a1.5 1.5 0 001.234-.65l.223-.335z" />
                                                    <path fillRule="evenodd" d="M10 10a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 0110 10z" clipRule="evenodd" />
                                                </svg>
                                                <span>Replace</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 max-h-48 overflow-y-auto border ${tool.theme.border} scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600`}>
                                    <ul className="space-y-2">
                                        {files.map((f, i) => (
                                            <li key={`${f.name}-${i}`} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-4 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden">
                                                <div className="w-12 h-12 min-w-[48px] rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm overflow-hidden relative group-hover:scale-105 transition-transform">
                                                    {f.type.startsWith("image/") ? (
                                                        <img
                                                            src={URL.createObjectURL(f)}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                                        />
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-bold text-slate-700 dark:text-slate-200 text-base">{f.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {(f.size / 1024).toFixed(0)} KB • {(f.name.split('.').pop()?.toUpperCase() || f.type.split('/')[1]?.toUpperCase() || 'FILE').slice(0, 8)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setPreviewFile(f)}
                                                        className="p-2.5 text-slate-400 hover:text-white hover:bg-blue-500 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                        title="Preview"
                                                        aria-label={`Preview ${f.name}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="p-2.5 text-slate-400 hover:text-white hover:bg-red-500 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                        title="Remove"
                                                        aria-label={`Remove ${f.name}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="space-y-6">
                                    <AIAssistant
                                        tool={tool}
                                        files={files}
                                        currentFormat={targetFormat}
                                        compressionLevel={compressionLevel}
                                        quality={quality}
                                        onApply={handleAIRecommendation}
                                    />

                                    {tool.id.includes("rotate") && (
                                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                            <label className="block text-sm font-bold text-slate-700 mb-4">Rotation Angle</label>
                                            <div className="flex flex-wrap items-center gap-3">
                                                {[90, 180, 270].map(angle => (
                                                    <button
                                                        key={angle}
                                                        onClick={() => setRotateAngle(angle)}
                                                        className={`flex-1 min-w-[80px] py-2.5 rounded-lg border transition-all ${rotateAngle === angle
                                                            ? `${tool.theme.bgLight} ${tool.theme.border} ${tool.theme.text}`
                                                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        {angle}°
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {tool.id === "compress-pdf" && (
                                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-4">Compression Mode</label>
                                                <div className="flex gap-3 mb-4">
                                                    <button
                                                        onClick={() => setUseManualCompression(false)}
                                                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${!useManualCompression
                                                            ? `${tool.theme.bg} text-white`
                                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        Automatic
                                                    </button>
                                                    <button
                                                        onClick={() => setUseManualCompression(true)}
                                                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${useManualCompression
                                                            ? `${tool.theme.bg} text-white`
                                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        Manual
                                                    </button>
                                                </div>
                                            </div>

                                            {!useManualCompression ? (
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-4">Compression Level</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {[
                                                            { id: "basic", label: "Recommended", desc: "Good quality, smaller size" },
                                                            { id: "strong", label: "Strong", desc: "Lower quality, smallest size" },
                                                            { id: "extreme", label: "Extreme", desc: "Lowest quality, tiny size" }
                                                        ].map(opt => (
                                                            <div
                                                                key={opt.id}
                                                                onClick={() => setCompressionLevel(opt.id)}
                                                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${compressionLevel === opt.id
                                                                    ? `${tool.theme.border} ${tool.theme.bgLight}`
                                                                    : "border-slate-100 hover:border-slate-200"
                                                                    }`}
                                                            >
                                                                <div className="font-bold text-slate-900">{opt.label}</div>
                                                                <div className="text-xs text-slate-500">{opt.desc}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="flex justify-between text-sm font-bold text-slate-700 mb-3">
                                                            JPEG Quality
                                                            <span className="font-normal text-slate-500">{pdfQuality}%</span>
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min={10}
                                                            max={100}
                                                            value={pdfQuality}
                                                            onChange={(e) => setPdfQuality(Number(e.target.value))}
                                                            className="w-full accent-blue-600"
                                                        />
                                                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                            <span>Smallest file</span>
                                                            <span>Best quality</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="flex justify-between text-sm font-bold text-slate-700 mb-3">
                                                            Maximum DPI
                                                            <span className="font-normal text-slate-500">{pdfDpi} DPI</span>
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min={72}
                                                            max={300}
                                                            step={1}
                                                            value={pdfDpi}
                                                            onChange={(e) => setPdfDpi(Number(e.target.value))}
                                                            className="w-full accent-blue-600"
                                                        />
                                                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                            <span>72 DPI (web)</span>
                                                            <span>300 DPI (print)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {showFormatSelector && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Target Format</label>
                                                <select
                                                    value={targetFormat}
                                                    onChange={(e) => setTargetFormat(e.target.value)}
                                                    className="w-full rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                >
                                                    <option value="JPEG">JPEG</option>
                                                    <option value="PNG">PNG</option>
                                                    <option value="WEBP">WebP</option>
                                                    <option value="BMP">BMP</option>
                                                    <option value="TIFF">TIFF</option>
                                                    <option value="ICO">ICO</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Quality ({quality}%)</label>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="100"
                                                    value={quality}
                                                    onChange={(e) => setQuality(Number(e.target.value))}
                                                    className={`w-full accent-blue-600`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

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
                                                    <span className="text-indigo-600 animate-pulse">Converting...</span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                                    {status === "uploading" && `${Math.round(simulatedProgress)}%`}
                                                    {status === "converting" && (
                                                        <span className="flex items-center gap-2">
                                                            <span>{Math.round(simulatedProgress)}%</span>
                                                            <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </p>
                                                <button
                                                    onClick={handleCancel}
                                                    className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                        <ProgressBar progress={simulatedProgress} className={tool.theme.bg} />
                                    </div>
                                )}

                                {status === "success" && result && (
                                    <div className="bg-green-50 p-8 rounded-2xl border border-green-100 text-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-green-900 mb-2">Success!</h3>
                                        <p className="text-green-700 mb-6">Your file has been processed.</p>

                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <a
                                                href={getDownloadUrl(result.download_url)}
                                                download={result.filename}
                                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 ${tool.theme.gradient}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                                Download File
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setStatus("idle");
                                                    setFiles([]);
                                                    setResult(null);
                                                    setSimulatedProgress(0);
                                                }}
                                                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all"
                                            >
                                                Start Over
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Process Button - Desktop Standard / Mobile Sticky */}
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:p-0 md:bg-transparent md:border-none md:shadow-none text-center">
                                <button
                                    onClick={() => handleProcess()}
                                    disabled={files.length === 0 || status === "uploading" || status === "processing"}
                                    className={`w-full md:w-auto md:min-w-[280px] md:px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ease-out transform relative group overflow-hidden
                                     hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] active:translate-y-0 active:shadow-sm
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
                    )}
                </div>
            </div>
            {/* Bottom Ad Unit - Removed */}
            {/* <AdUnit slotId={process.env.NEXT_PUBLIC_AD_SLOT_BOTTOM || "0987654321"} className="mt-8 mb-8 mx-auto max-w-[728px] flex justify-center bg-slate-100/50 rounded-lg overflow-hidden" style={{ minHeight: '90px' }} /> */}

            <ToolInfoSection tool={tool} />

            {/* Render Modal */}
            {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
        </div>
    );
}
