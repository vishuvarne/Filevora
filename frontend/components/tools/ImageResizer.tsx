"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/Dropzone";

export default function ImageResizer() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const [keepAspect, setKeepAspect] = useState(true);
    const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFiles = (files: File[]) => {
        if (files.length > 0) {
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
        };
    }, [imageSrc, width, height]);

    const download = () => {
        if (!canvasRef.current) return;
        const link = document.createElement("a");
        link.download = "resized-image.png";
        link.href = canvasRef.current.toDataURL("image/png");
        link.click();
    };

    const reset = () => {
        setImageSrc(null);
        setOrigSize(null);
        setWidth(800);
        setHeight(600);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Image Resizer</h2>

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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Width (px)</label>
                            <input
                                type="number"
                                min={1}
                                max={4096}
                                value={width}
                                onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Height (px)</label>
                            <input
                                type="number"
                                min={1}
                                max={4096}
                                value={height}
                                onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                                disabled={keepAspect}
                                className={`w-full rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-blue-500 outline-none ${keepAspect ? "bg-slate-100 text-slate-500" : "bg-slate-50"}`}
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={keepAspect}
                                onChange={(e) => setKeepAspect(e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700">Keep aspect ratio</span>
                        </label>
                        {origSize && (
                            <p className="text-xs text-slate-500">Original: {origSize.w} × {origSize.h}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={download}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
                            >
                                Download
                            </button>
                            <button onClick={reset} className="px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50">
                                New Image
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[280px]">
                        <canvas ref={canvasRef} className="max-w-full max-h-[60vh] shadow-lg rounded-lg bg-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
