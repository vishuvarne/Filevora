"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import BeforeAfterSlider from "@/components/shared/BeforeAfterSlider";
import FileSizeCard from "@/components/shared/FileSizeCard";

export default function ImageResizer() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const [keepAspect, setKeepAspect] = useState(true);
    const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
    const [resizedDataUrl, setResizedDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFiles = (files: File[]) => {
        if (files.length > 0) {
            setOriginalFile(files[0]);
            const url = URL.createObjectURL(files[0]);
            setImageSrc(url);
            const img = new Image();
            img.src = url;
            img.onload = () => {
                setOrigSize({ w: img.width, h: img.height });
                setWidth(img.width);
                setHeight(img.height);
            };
        }
    };

    useEffect(() => {
        if (keepAspect && origSize && origSize.w > 0) {
            setHeight(Math.round((width / origSize.w) * origSize.h));
        }
    }, [width, keepAspect, origSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            setResizedDataUrl(canvas.toDataURL("image/png"));
        };
    }, [imageSrc, width, height]);

    // Estimate file size based on dimensions
    const estimateFileSize = (w: number, h: number) => {
        // Rough estimation: 4 bytes per pixel for RGBA
        return w * h * 4;
    };

    const originalEstimatedSize = origSize ? estimateFileSize(origSize.w, origSize.h) : 0;
    const resizedEstimatedSize = estimateFileSize(width, height);

    const download = () => {
        if (!canvasRef.current) return;
        const link = document.createElement("a");
        link.download = "resized-image.png";
        link.href = canvasRef.current.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        setImageSrc(null);
        setOrigSize(null);
        setWidth(800);
        setHeight(600);
    };

    return (
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 max-w-5xl mx-auto">
            {!imageSrc ? (
                <Dropzone
                    onFilesSelected={handleFiles}
                    acceptedTypes="image/*"
                    multiple={false}
                    label="Upload Image to Resize"
                />
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="space-y-6 w-full lg:w-80">
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Width (px)</label>
                            <input
                                type="number"
                                min={1}
                                max={4096}
                                value={width}
                                onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                                className="w-full rounded-2xl border border-border bg-muted/30 p-3 focus:ring-2 focus:ring-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Height (px)</label>
                            <input
                                type="number"
                                min={1}
                                max={4096}
                                value={height}
                                onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                                disabled={keepAspect}
                                className={`w-full rounded-2xl border border-border p-3 focus:ring-2 focus:ring-primary outline-none ${keepAspect ? "bg-muted text-muted-foreground" : "bg-muted/30 text-foreground"}`}
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={keepAspect}
                                onChange={(e) => setKeepAspect(e.target.checked)}
                                className="rounded border-border bg-card text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-foreground">Keep aspect ratio</span>
                        </label>
                        {origSize && (
                            <div className="bg-muted/30 rounded-2xl p-4 border border-border space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Original:</span>
                                    <span className="font-bold text-foreground">{origSize.w} × {origSize.h}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">New:</span>
                                    <span className="font-bold text-primary">{width} × {height}</span>
                                </div>
                            </div>
                        )}

                        {origSize && (
                            <FileSizeCard
                                originalSize={originalEstimatedSize}
                                compressedSize={resizedEstimatedSize}
                                showSavings={true}
                            />
                        )}

                        {/* Dimension Recommendations */}
                        <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Sizes</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setWidth(1920)}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    Web (1920px)
                                </button>
                                <button
                                    onClick={() => setWidth(1080)}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    Mobile (1080px)
                                </button>
                                <button
                                    onClick={() => setWidth(400)}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    Thumb (400px)
                                </button>
                                <button
                                    onClick={() => setWidth(800)}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    Medium (800px)
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={download}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-2xl transition-all"
                            >
                                Download
                            </button>
                            <button onClick={reset} className="px-4 py-3 border border-border rounded-2xl font-medium text-muted-foreground hover:bg-secondary transition-all">
                                New Image
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
                        {resizedDataUrl ? (
                            <BeforeAfterSlider
                                beforeImage={imageSrc}
                                afterImage={resizedDataUrl}
                                beforeLabel={`Original (${origSize?.w}×${origSize?.h})`}
                                afterLabel={`Resized (${width}×${height})`}
                                className="min-h-[400px]"
                            />
                        ) : (
                            <div className="flex-1 bg-muted/30 rounded-3xl p-4 flex items-center justify-center min-h-[400px] border border-border">
                                <img src={imageSrc} alt="Preview" className="max-w-full max-h-[60vh] shadow-lg rounded-xl" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
