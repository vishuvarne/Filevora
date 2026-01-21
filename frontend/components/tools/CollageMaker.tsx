"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/SmartDropzone"; // Reusing smart dropzone

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
        <div className="bg-card rounded-3xl shadow-xl border border-border p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-foreground">Collage Maker</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={() => setLayout('grid')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold border ${layout === 'grid' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>Grid</button>
                    <button onClick={() => setLayout('vertical')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold border ${layout === 'vertical' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>Vertical</button>
                    <button onClick={() => setLayout('horizontal')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold border ${layout === 'horizontal' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>Horizontal</button>
                    <button onClick={() => setImages([])} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20">Reset</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Controls */}
                <div className="w-full md:w-1/3 space-y-6">
                    <Dropzone onFilesSelected={handleFiles} acceptedTypes="image/*" multiple={true} label="Add Images (Max 4)" />

                    <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                        <h3 className="font-bold text-foreground mb-2">Images ({images.length}/4)</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {images.map((src, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border relative group bg-card">
                                    <img src={src} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={download}
                        disabled={images.length === 0}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Download Collage
                    </button>
                </div>

                {/* Canvas Preview */}
                <div className="flex-1 bg-muted/30 rounded-3xl flex items-center justify-center p-4 min-h-[400px] border border-border">
                    {images.length > 0 ? (
                        <canvas ref={canvasRef} className="max-w-full h-auto shadow-xl rounded-xl bg-white" />
                    ) : (
                        <div className="text-muted-foreground text-center">
                            <p>Add images to start</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
