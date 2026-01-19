"use client";

import { useState, useEffect } from "react";
import { ToolDef } from "@/config/tools";
import Dropzone from "@/components/Dropzone";
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
import { processJob, getDownloadUrl, ProcessResponse } from "@/lib/api";

interface ToolInterfaceProps {
    tool: ToolDef;
}

export default function ToolInterface({ tool }: ToolInterfaceProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
    const [result, setResult] = useState<ProcessResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [simulatedProgress, setSimulatedProgress] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "uploading") {
            setSimulatedProgress(0);
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    if (prev < 60) return prev + Math.random() * 8;
                    return prev;
                });
            }, 250);
        } else if (status === "processing") {
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    if (prev < 95) return prev + Math.random() * 4;
                    return prev;
                });
            }, 400);
        } else if (status === "success") {
            setSimulatedProgress(100);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Tool Specific Options
    const [rotateAngle, setRotateAngle] = useState(90);
    const [targetFormat, setTargetFormat] = useState("JPEG");
    const [quality, setQuality] = useState(85);
    const [compressionLevel, setCompressionLevel] = useState("basic");

    // Manual PDF Compression Controls
    const [pdfQuality, setPdfQuality] = useState(85);
    const [pdfDpi, setPdfDpi] = useState(150);
    const [useManualCompression, setUseManualCompression] = useState(false);

    useEffect(() => {
        console.log("Tool Changed:", tool.id);
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
        console.log("Status Changed:", status);
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
                        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
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

    const handleProcess = async () => {
        if (files.length === 0) return;

        setStatus("uploading");
        try {
            const formData = new FormData();

            if (tool.multiple) {
                files.forEach(f => formData.append("files", f));
            } else {
                formData.append("file", files[0]);
            }

            if (tool.id.includes("rotate")) {
                formData.append("angle", rotateAngle.toString());
            }

            if (tool.id === "compress-pdf") {
                if (useManualCompression) {
                    formData.append("quality", pdfQuality.toString());
                    formData.append("dpi", pdfDpi.toString());
                } else {
                    formData.append("level", compressionLevel);
                }
            }

            const presetFormat = tool.presetOptions?.target_format || tool.presetOptions?.format;

            if (presetFormat) {
                formData.append(tool.endpoint.includes("pdf-to-image") ? "format" : "target_format", String(presetFormat).toLowerCase());
            } else {
                if (tool.id === "convert-image" || tool.endpoint.includes("pdf-to-image")) {
                    formData.append(tool.endpoint.includes("pdf-to-image") ? "format" : "target_format", targetFormat.toLowerCase());
                }
            }

            if (tool.id === "convert-image") {
                formData.append("quality", quality.toString());
            }

            // Set processing status immediately before API call
            setStatus("processing");

            const res = await processJob(tool.endpoint, formData);
            setResult(res);
            setStatus("success");
        } catch (e: any) {
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

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 bg-gradient-to-b from-slate-50 to-white">
                    <div className={`w-16 h-16 ${tool.theme.bgLight} rounded-2xl flex items-center justify-center mb-6 mx-auto ${tool.theme.text}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">{tool.name}</h1>
                    <p className="text-center text-slate-500 max-w-lg mx-auto">{tool.description}</p>
                </div>

                <div className="p-8">
                    {/* Success State */}
                    {status === "success" && result ? (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Complete!</h3>
                            <p className="text-gray-500 mb-8">Your file is ready to download.</p>

                            {/* Compression Stats for compress-pdf */}
                            {tool.id === "compress-pdf" && result.original_size && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                    <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                        </svg>
                                        Compression Results
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="text-left">
                                            <p className="text-slate-500 mb-1">Original Size</p>
                                            <p className="font-bold text-slate-900">{(result.original_size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-slate-500 mb-1">Compressed Size</p>
                                            <p className="font-bold text-slate-900">{((result.compressed_size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-600 font-medium">Space Saved</span>
                                            <span className="text-2xl font-bold text-green-600">{result.reduction_percent}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <a
                                    href={getDownloadUrl(result.download_url)}
                                    download={result.filename}
                                    className={`px-8 py-4 ${tool.theme.bg} text-white rounded-xl font-bold hover:bg-opacity-90 shadow-lg ${tool.theme.hoverShadow} transition-all flex items-center justify-center gap-2`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    Download File
                                </a>
                                <button
                                    onClick={reset}
                                    className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Start Over
                                </button>
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

                            {files.length > 0 && (
                                <div className={`bg-slate-50 rounded-xl p-4 max-h-48 overflow-y-auto border ${tool.theme.border} scrollbar-thin scrollbar-thumb-slate-300`}>
                                    <ul className="space-y-2">
                                        {files.map((f, i) => (
                                            <li key={i} className="text-sm text-slate-600 flex items-center gap-3">
                                                <div className="w-8 h-8 min-w-[32px] rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {f.name.split('.').pop()?.toUpperCase().slice(0, 4)}
                                                </div>
                                                <span className="truncate flex-1 font-medium">{f.name}</span>
                                                <span className="text-xs text-slate-400 whitespace-nowrap">{(f.size / 1024).toFixed(0)} KB</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="space-y-6">
                                    {tool.id.includes("rotate") && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                            <label className="block text-sm font-bold text-slate-700 mb-4">Rotation Angle</label>
                                            <div className="flex flex-wrap items-center gap-3">
                                                {[90, 180, 270].map(angle => (
                                                    <button
                                                        key={angle}
                                                        onClick={() => setRotateAngle(angle)}
                                                        className={`flex-1 min-w-[80px] py-2.5 rounded-lg border transition-all ${rotateAngle === angle
                                                            ? `${tool.theme.bgLight} ${tool.theme.border} ${tool.theme.text}`
                                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                                            }`}
                                                    >
                                                        {angle}°
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {tool.id === "compress-pdf" && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
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
                                                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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

                            {errorMsg && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    {errorMsg}
                                </div>
                            )}

                            {(status === "uploading" || status === "processing") && (
                                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                            {status === "uploading" ? "Uploading..." : "Processing..."}
                                        </p>
                                        <p className="text-sm font-black text-slate-900">{Math.round(simulatedProgress)}%</p>
                                    </div>
                                    <ProgressBar progress={simulatedProgress} className={tool.theme.bg} />
                                </div>
                            )}

                            {/* Process Button - Desktop Standard / Mobile Sticky */}
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:p-0 md:bg-transparent md:border-none md:shadow-none">
                                <button
                                    onClick={handleProcess}
                                    disabled={files.length === 0 || status === "uploading" || status === "processing"}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.99] ${files.length === 0
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none"
                                        : `${tool.theme.gradient} text-white ${tool.theme.hoverShadow}`
                                        }`}
                                >
                                    <span className={files.length > 0 ? "" : ""}>
                                        {status === "uploading" ? "Please wait..." : status === "processing" ? "Almost there..." : `Process ${tool.name}`}
                                    </span>
                                </button>
                            </div>

                            {/* Spacer to prevent content from being hidden behind sticky footer on mobile */}
                            <div className="h-24 md:hidden"></div>
                        </div>
                    )}
                </div>
            </div>

            <ToolInfoSection tool={tool} />
        </div>
    );
}
