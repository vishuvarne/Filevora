"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import FileSizeCard from "@/components/shared/FileSizeCard";

export default function ImageCropper() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drag, setDrag] = useState(false);
    const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleFiles = (files: File[]) => {
        if (files.length > 0) {
            const url = URL.createObjectURL(files[0]);
            setImageSrc(url);
            const img = new Image();
            img.src = url;
            img.onload = () => {
                setImageSize({ w: img.width, h: img.height });
            };
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Draw selection overlay
            if (selection) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                // Fill surrounding areas
                ctx.fillRect(0, 0, canvas.width, selection.y); // Top
                ctx.fillRect(0, selection.y + selection.h, canvas.width, canvas.height - (selection.y + selection.h)); // Bottom
                ctx.fillRect(0, selection.y, selection.x, selection.h); // Left
                ctx.fillRect(selection.x + selection.w, selection.y, canvas.width - (selection.x + selection.w), selection.h); // Right

                // Border
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
            }
        };
    };

    useEffect(() => { draw(); }, [imageSrc, selection]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imageSrc) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const scaleX = canvasRef.current!.width / rect.width;
        const scaleY = canvasRef.current!.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        setStartPos({ x, y });
        setSelection({ x, y, w: 0, h: 0 });
        setDrag(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!drag) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const scaleX = canvasRef.current!.width / rect.width;
        const scaleY = canvasRef.current!.height / rect.height;
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;

        const w = currentX - startPos.x;
        const h = currentY - startPos.y;

        setSelection({
            x: w < 0 ? currentX : startPos.x,
            y: h < 0 ? currentY : startPos.y,
            w: Math.abs(w),
            h: Math.abs(h)
        });
    };

    const crop = () => {
        if (!selection || !canvasRef.current || !imageSrc) return;
        const canvas = document.createElement("canvas");
        canvas.width = selection.w;
        canvas.height = selection.h;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.src = imageSrc;
        // Provide a bit of delay to ensure image is definitely ready (though it should be)
        ctx?.drawImage(img, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);

        const link = document.createElement('a');
        link.download = 'cropped-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const setAspectRatio = (ratio: string) => {
        if (!imageSize) return;
        const { w: imgW, h: imgH } = imageSize;
        let w, h;

        // Start from center
        const centerX = imgW / 2;
        const centerY = imgH / 2;

        switch (ratio) {
            case '16:9':
                w = Math.min(imgW, imgH * 16 / 9);
                h = w * 9 / 16;
                break;
            case '4:3':
                w = Math.min(imgW, imgH * 4 / 3);
                h = w * 3 / 4;
                break; case '1:1':
                w = h = Math.min(imgW, imgH);
                break;
            case '9:16':
                h = Math.min(imgH, imgW * 16 / 9);
                w = h * 9 / 16;
                break;
            default:
                return;
        }

        setSelection({
            x: Math.round(centerX - w / 2),
            y: Math.round(centerY - h / 2),
            w: Math.round(w),
            h: Math.round(h)
        });
    };

    const estimateFileSize = (w: number, h: number) => w * h * 4;
    const originalSize = imageSize ? estimateFileSize(imageSize.w, imageSize.h) : 0;
    const croppedSize = selection ? estimateFileSize(selection.w, selection.h) : 0;

    return (
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Crop Image</h2>
                <button
                    onClick={crop}
                    disabled={!selection || selection.w === 0}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2 rounded-2xl disabled:opacity-50 transition-all"
                >
                    Crop & Download
                </button>
            </div>

            {!imageSrc ? (
                <div className="max-w-xl mx-auto py-12">
                    <Dropzone onFilesSelected={handleFiles} acceptedTypes="image/*" multiple={false} label="Upload Image to Crop" />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar with info and aspect ratio buttons */}
                    <div className="w-full lg:w-80 space-y-4">
                        {/* Resolution Display */}
                        {imageSize && (
                            <div className="bg-muted/30 rounded-2xl p-4 border border-border space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resolution</p>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Original:</span>
                                    <span className="font-bold text-foreground">{imageSize.w} × {imageSize.h}</span>
                                </div>
                                {selection && selection.w > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Cropped:</span>
                                        <span className="font-bold text-primary">{Math.round(selection.w)} × {Math.round(selection.h)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* File Size Estimation */}
                        {selection && selection.w > 0 && (
                            <FileSizeCard
                                originalSize={originalSize}
                                compressedSize={croppedSize}
                                showSavings={true}
                            />
                        )}

                        {/* Aspect Ratio Helpers */}
                        <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Aspect Ratios</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setAspectRatio('16:9')}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    16:9 (Wide)
                                </button>
                                <button
                                    onClick={() => setAspectRatio('4:3')}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    4:3 (Standard)
                                </button>
                                <button
                                    onClick={() => setAspectRatio('1:1')}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    1:1 (Square)
                                </button>
                                <button
                                    onClick={() => setAspectRatio('9:16')}
                                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-medium text-foreground transition-colors"
                                >
                                    9:16 (Story)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 overflow-auto bg-slate-900 rounded-3xl flex justify-center p-4 cursor-crosshair border border-border">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={() => setDrag(false)}
                            onMouseLeave={() => setDrag(false)}
                            className="max-w-full h-auto shadow-2xl rounded-lg"
                            style={{ maxHeight: '70vh' }}
                        />
                    </div>
                </div>
            )}

            {imageSrc && <p className="text-center text-muted-foreground mt-4 text-sm">Click and drag on the image to select crop area.</p>}
        </div>
    );
}
