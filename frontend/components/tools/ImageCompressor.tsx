"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/Dropzone";

type OutputFormat = "jpeg" | "webp" | "png";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function ImageCompressor() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState<OutputFormat>("jpeg");
    const [maxLongest, setMaxLongest] = useState(0);
    const [compressedSize, setCompressedSize] = useState<number | null>(null);
    const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFiles = (files: File[]) => {
        if (files.length > 0) {
            setOriginalFile(files[0]);
            setImageSrc(URL.createObjectURL(files[0]));
            setCompressedSize(null);
            setCompressedDataUrl(null);
        }
    };

    const compress = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            let w = img.width;
            let h = img.height;
            if (maxLongest > 0 && Math.max(w, h) > maxLongest) {
                if (w >= h) {
                    h = Math.round((h * maxLongest) / w);
                    w = maxLongest;
                } else {
                    w = Math.round((w * maxLongest) / h);
                    h = maxLongest;
                }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, w, h);

            const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
            const q = format === "png" ? undefined : quality / 100;
            const dataUrl = canvas.toDataURL(mime, q);
            const base64 = dataUrl.split(",")[1];
            if (!base64) return;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            setCompressedSize(bytes.length);
            setCompressedDataUrl(dataUrl);
        };
    }, [imageSrc, quality, format, maxLongest]);

    useEffect(() => {
        if (imageSrc) compress();
    }, [imageSrc, compress]);

    const download = () => {
        if (!compressedDataUrl) return;
        const ext = format === "jpeg" ? "jpg" : format;
        const base = originalFile?.name.replace(/\.[^/.]+$/, "") || "compressed";
        const link = document.createElement("a");
        link.download = `${base}-compressed.${ext}`;
        link.href = compressedDataUrl;
        link.click();
    };

    const reset = () => {
        setImageSrc(null);
        setOriginalFile(null);
        setCompressedSize(null);
        setCompressedDataUrl(null);
        setQuality(80);
        setMaxLongest(0);
    };

    const origBytes = originalFile?.size ?? 0;
    const saved = compressedSize != null && origBytes > 0
        ? Math.round((1 - compressedSize / origBytes) * 100)
        : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Image Compressor</h2>

            {!imageSrc ? (
                <Dropzone
                    onFilesSelected={handleFiles}
                    acceptedTypes="image/*"
                    multiple={false}
                    label="Upload Image to Compress"
                />
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="space-y-6 w-full lg:w-80">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Output format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="jpeg">JPEG (smallest, lossy)</option>
                                <option value="webp">WebP (small, lossy)</option>
                                <option value="png">PNG (lossless, larger)</option>
                            </select>
                        </div>
                        {(format === "jpeg" || format === "webp") && (
                            <div>
                                <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                    Quality <span className="font-normal text-slate-500">{quality}%</span>
                                </label>
                                <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Max longest side (px, 0 = no resize)</label>
                            <input
                                type="number"
                                min={0}
                                max={4096}
                                value={maxLongest || ""}
                                onChange={(e) => { const v = parseInt(e.target.value); setMaxLongest(isNaN(v) ? 0 : v); }}
                                placeholder="e.g. 1920"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">Resizing reduces file size by lowering resolution.</p>
                        </div>

                        {compressedSize != null && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
                                <p className="text-sm text-slate-600">Original: <strong>{formatBytes(origBytes)}</strong></p>
                                <p className="text-sm text-slate-600">Compressed: <strong>{formatBytes(compressedSize)}</strong></p>
                                {saved != null && (
                                    <p className={`text-sm font-bold ${saved >= 0 ? "text-green-600" : "text-amber-600"}`}>
                                        {saved >= 0 ? `Saved ${saved}%` : `+${-saved}% (format changed)`}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={download}
                                disabled={!compressedDataUrl}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Download
                            </button>
                            <button onClick={reset} className="px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50">
                                New Image
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
                        <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[260px]">
                            <img src={imageSrc} alt="Preview" className="max-w-full max-h-[50vh] object-contain rounded-lg shadow" />
                        </div>
                        {compressedDataUrl && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Compressed preview</p>
                                <img src={compressedDataUrl} alt="Compressed" className="max-w-full max-h-40 object-contain rounded" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
