"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import BeforeAfterSlider from "@/components/shared/BeforeAfterSlider";
import FileSizeCard from "@/components/shared/FileSizeCard";
import FormatInfo from "@/components/shared/FormatInfo";

type OutputFormat = "jpeg" | "webp" | "png";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function ImageCompressor() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);

    // Standard Compression States
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState<OutputFormat>("jpeg");
    const [maxLongest, setMaxLongest] = useState(0);

    // Target Size Compression States
    const [useTargetSize, setUseTargetSize] = useState(false);
    const [targetSizeKB, setTargetSizeKB] = useState(100);
    const [isCompressing, setIsCompressing] = useState(false);

    // Outputs
    const [compressedSize, setCompressedSize] = useState<number | null>(null);
    const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prevBlobUrlRef = useRef<string | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleFiles = (files: File[]) => {
        if (files.length > 0) {
            setOriginalFile(files[0]);
            setImageSrc(URL.createObjectURL(files[0]));
            setCompressedSize(null);
            setCompressedDataUrl(null);
        }
    };

    const runCompression = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        setIsCompressing(true);

        try {
            const img = new Image();
            img.src = imageSrc;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";

            const getBlob = (w: number, h: number, q?: number): Promise<Blob> => {
                canvas.width = Math.max(1, w);
                canvas.height = Math.max(1, h);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    if (mime === "image/jpeg") {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, w, h);
                    }
                    ctx.drawImage(img, 0, 0, w, h);
                }
                return new Promise((resolve, reject) => {
                    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Failed to create blob")), mime, q);
                });
            };

            let finalBlob: Blob | null = null;

            if (!useTargetSize) {
                // Standard mode
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
                const q = format === "png" ? undefined : quality / 100;
                finalBlob = await getBlob(w, h, q);
            } else {
                // Target size iterative mode
                const targetBytes = targetSizeKB * 1024;
                let currentScale = 1.0;
                let currentQuality = 0.9;
                let bestBlob: Blob | null = null;

                for (let iter = 0; iter < 25; iter++) {
                    const w = Math.round(img.width * currentScale);
                    const h = Math.round(img.height * currentScale);

                    const q = format === "png" ? undefined : currentQuality;
                    const blob = await getBlob(w, h, q);

                    bestBlob = blob;

                    if (blob.size <= targetBytes) {
                        break; // Success
                    }

                    // Not small enough, make it smaller
                    if (format !== "png" && currentQuality > 0.1) {
                        currentQuality -= 0.15;
                    } else if (currentScale > 0.1) {
                        currentScale -= 0.15;
                        if (format !== "png") currentQuality = 0.5; // Reset quality when dropping resolution
                    } else {
                        break; // Can't go smaller
                    }
                }
                finalBlob = bestBlob;
            }

            if (finalBlob) {
                if (prevBlobUrlRef.current) {
                    URL.revokeObjectURL(prevBlobUrlRef.current);
                }
                const newUrl = URL.createObjectURL(finalBlob);
                prevBlobUrlRef.current = newUrl;
                setCompressedSize(finalBlob.size);
                setCompressedDataUrl(newUrl);
            }
        } catch (err) {
            console.error("Compression loop failed:", err);
        } finally {
            setIsCompressing(false);
        }
    }, [imageSrc, quality, format, maxLongest, useTargetSize, targetSizeKB]);

    useEffect(() => {
        if (imageSrc) {
            // Debounce to prevent rapid compressions during slider drags
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = setTimeout(() => {
                runCompression();
            }, 300);
        }
    }, [imageSrc, runCompression]);

    const download = () => {
        if (!compressedDataUrl) return;
        const ext = format === "jpeg" ? "jpg" : format;
        const base = originalFile?.name.replace(/\.[^/.]+$/, "") || "compressed";
        const link = document.createElement("a");
        link.download = `${base}-compressed.${ext}`;
        link.href = compressedDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        if (prevBlobUrlRef.current) {
            URL.revokeObjectURL(prevBlobUrlRef.current);
            prevBlobUrlRef.current = null;
        }
        if (imageSrc && imageSrc.startsWith('blob:')) {
            URL.revokeObjectURL(imageSrc);
        }
        setImageSrc(null);
        setOriginalFile(null);
        setCompressedSize(null);
        setCompressedDataUrl(null);
        setQuality(80);
        setMaxLongest(0);
        setUseTargetSize(false);
        setTargetSizeKB(100);
    };

    const origBytes = originalFile?.size ?? 0;
    const saved = compressedSize != null && origBytes > 0
        ? Math.round((1 - compressedSize / origBytes) * 100)
        : null;

    return (
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Image Compressor</h2>

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

                        {/* Target Size Toggle */}
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-4 rounded-xl">
                            <input
                                type="checkbox"
                                id="useTargetSize"
                                checked={useTargetSize}
                                onChange={(e) => setUseTargetSize(e.target.checked)}
                                className="w-5 h-5 accent-primary shrink-0"
                            />
                            <label htmlFor="useTargetSize" className="text-sm font-bold text-primary cursor-pointer select-none">
                                Compress to target file size (KB)
                            </label>
                        </div>

                        {useTargetSize && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Target Size (KB)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={targetSizeKB || ""}
                                    onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 0)}
                                    placeholder="e.g. 100"
                                    className="w-full rounded-2xl border border-border bg-muted/30 p-3 focus:ring-2 focus:ring-primary outline-none text-foreground font-semibold"
                                />
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">We will automatically reduce the image quality and dimensions to meet this size if possible.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Output format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                                className="w-full rounded-2xl border border-border bg-muted/30 p-3 focus:ring-2 focus:ring-primary outline-none text-foreground"
                            >
                                <option value="jpeg">JPEG (smallest, lossy)</option>
                                <option value="webp">WebP (small, lossy)</option>
                                <option value="png">PNG (lossless, larger)</option>
                            </select>
                        </div>

                        {(!useTargetSize && (format === "jpeg" || format === "webp")) && (
                            <div>
                                <label className="flex justify-between text-sm font-bold text-muted-foreground mb-2">
                                    Quality <span className="font-normal text-muted-foreground">{quality}%</span>
                                </label>
                                <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    className="w-full accent-primary"
                                />
                            </div>
                        )}

                        {!useTargetSize && (
                            <div>
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Max longest side (px, 0 = no resize)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={4096}
                                    value={maxLongest || ""}
                                    onChange={(e) => { const v = parseInt(e.target.value); setMaxLongest(isNaN(v) ? 0 : v); }}
                                    placeholder="e.g. 1920"
                                    className="w-full rounded-2xl border border-border bg-muted/30 p-3 focus:ring-2 focus:ring-primary outline-none text-foreground"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Resizing reduces file size by lowering resolution.</p>
                            </div>
                        )}

                        {compressedSize != null && (
                            <FileSizeCard
                                originalSize={origBytes}
                                compressedSize={compressedSize}
                                showSavings={true}
                            />
                        )}

                        <FormatInfo
                            currentFormat={originalFile?.type.split('/')[1] || format}
                            supportedFormats={['JPEG', 'PNG', 'WebP', 'GIF']}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={download}
                                disabled={!compressedDataUrl || isCompressing}
                                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground font-bold py-3 rounded-2xl transition-colors flex justify-center items-center gap-2"
                            >
                                {isCompressing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </>
                                ) : "Download"}
                            </button>
                            <button onClick={reset} className="px-4 py-3 border border-border rounded-2xl font-medium text-muted-foreground hover:bg-secondary transition-all">
                                New Image
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

                        {(compressedDataUrl && !isCompressing) ? (
                            <BeforeAfterSlider
                                beforeImage={imageSrc}
                                afterImage={compressedDataUrl}
                                beforeLabel="Original"
                                afterLabel="Compressed"
                                className="min-h-[400px]"
                            />
                        ) : (
                            <div className="bg-muted/30 rounded-3xl p-4 flex items-center justify-center min-h-[400px] border border-border">
                                <img src={imageSrc} alt="Preview" className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-lg" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
