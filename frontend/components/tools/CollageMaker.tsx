"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/Dropzone"; // Reusing existing dropzone

export default function CollageMaker() {
    const [images, setImages] = useState<string[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [layout, setLayout] = useState<"grid" | "vertical" | "horizontal">("grid");

    const handleFiles = (files: File[]) => {
        // Create object URLs
        const newImages = files.map(f => URL.createObjectURL(f));
        setImages(prev => [...prev, ...newImages].slice(0, 4)); // Max 4 for simplicity
    };

    const drawCollage = () => {
        const canvas = canvasRef.current;
        if (!canvas || images.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Hardcoded Collage Logic for 1-4 images
        const width = 800;
        const height = 800;
        canvas.width = width;
        canvas.height = height;

        // Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const imgs = images.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        // Wait for load - in real world use promises, here we rely on standard caching/speed or basic callback
        let loaded = 0;
        imgs.forEach((img, i) => {
            img.onload = () => {
                loaded++;
                if (loaded === imgs.length) render();
            };
        });

        const render = () => {
            const count = imgs.length;

            if (count === 1) {
                drawImageCover(ctx, imgs[0], 0, 0, width, height);
            } else if (count === 2) {
                if (layout === 'vertical') {
                    drawImageCover(ctx, imgs[0], 0, 0, width, height / 2);
                    drawImageCover(ctx, imgs[1], 0, height / 2, width, height / 2);
                } else {
                    drawImageCover(ctx, imgs[0], 0, 0, width / 2, height);
                    drawImageCover(ctx, imgs[1], width / 2, 0, width / 2, height);
                }
            } else if (count === 3) {
                drawImageCover(ctx, imgs[0], 0, 0, width / 2, height);
                drawImageCover(ctx, imgs[1], width / 2, 0, width / 2, height / 2);
                drawImageCover(ctx, imgs[2], width / 2, height / 2, width / 2, height / 2);
            } else if (count >= 4) {
                drawImageCover(ctx, imgs[0], 0, 0, width / 2, height / 2);
                drawImageCover(ctx, imgs[1], width / 2, 0, width / 2, height / 2);
                drawImageCover(ctx, imgs[2], 0, height / 2, width / 2, height / 2);
                drawImageCover(ctx, imgs[3], width / 2, height / 2, width / 2, height / 2);
            }
        };
    };

    // Zoom/Cover Fit helper
    const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
        const ratio = w / h;
        const imgRatio = img.width / img.height;
        let sx, sy, sw, sh;

        if (imgRatio > ratio) {
            sh = img.height;
            sw = img.height * ratio;
            sy = 0;
            sx = (img.width - sw) / 2;
        } else {
            sw = img.width;
            sh = img.width / ratio;
            sx = 0;
            sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    };

    useEffect(() => {
        drawCollage();
    }, [images, layout]);

    const download = () => {
        const link = document.createElement('a');
        link.download = 'collage.jpg';
        link.href = canvasRef.current!.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Collage Maker</h2>
                <div className="flex gap-2">
                    <button onClick={() => setLayout('grid')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${layout === 'grid' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200'}`}>Grid</button>
                    <button onClick={() => setLayout('vertical')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${layout === 'vertical' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200'}`}>Vertical</button>
                    <button onClick={() => setLayout('horizontal')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${layout === 'horizontal' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200'}`}>Horizontal</button>
                    <button onClick={() => setImages([])} className="px-4 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50">Reset</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Controls */}
                <div className="w-full md:w-1/3 space-y-6">
                    <Dropzone onFilesSelected={handleFiles} acceptedTypes="image/*" multiple={true} label="Add Images (Max 4)" />

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-2">Images ({images.length}/4)</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {images.map((src, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group">
                                    <img src={src} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={download}
                        disabled={images.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Download Collage
                    </button>
                </div>

                {/* Canvas Preview */}
                <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center p-4 min-h-[400px]">
                    {images.length > 0 ? (
                        <canvas ref={canvasRef} className="max-w-full h-auto shadow-xl rounded-lg bg-white" />
                    ) : (
                        <div className="text-slate-400 text-center">
                            <p>Add images to start</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
