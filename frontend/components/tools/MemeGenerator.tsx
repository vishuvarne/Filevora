"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/Dropzone";

export default function MemeGenerator() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [topText, setTopText] = useState("TOP TEXT");
    const [bottomText, setBottomText] = useState("BOTTOM TEXT");
    const [fontSize, setFontSize] = useState(48);
    const [textColor, setTextColor] = useState("#ffffff");
    const [strokeColor, setStrokeColor] = useState("#000000");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFiles = (files: File[]) => {
        if (files.length > 0) setImageSrc(URL.createObjectURL(files[0]));
    };

    useEffect(() => {
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

            const stroke = Math.max(2, Math.floor(fontSize / 12));
            ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            // Top text
            if (topText) {
                const x = canvas.width / 2;
                const y = 20;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = stroke;
                ctx.strokeText(topText.toUpperCase(), x, y);
                ctx.fillStyle = textColor;
                ctx.fillText(topText.toUpperCase(), x, y);
            }

            ctx.textBaseline = "bottom";
            // Bottom text
            if (bottomText) {
                const x = canvas.width / 2;
                const y = canvas.height - 20;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = stroke;
                ctx.strokeText(bottomText.toUpperCase(), x, y);
                ctx.fillStyle = textColor;
                ctx.fillText(bottomText.toUpperCase(), x, y);
            }
        };
    }, [imageSrc, topText, bottomText, fontSize, textColor, strokeColor]);

    const download = () => {
        if (!canvasRef.current) return;
        const link = document.createElement("a");
        link.download = "meme.png";
        link.href = canvasRef.current.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Meme Generator</h2>

            {!imageSrc ? (
                <Dropzone
                    onFilesSelected={handleFiles}
                    acceptedTypes="image/*"
                    multiple={false}
                    label="Upload Image for Meme"
                />
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="space-y-6 w-full lg:w-80">
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Top text</label>
                            <input
                                type="text"
                                value={topText}
                                onChange={(e) => setTopText(e.target.value)}
                                placeholder="TOP TEXT"
                                className="w-full rounded-2xl border border-border bg-muted/30 p-3 focus:ring-2 focus:ring-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Bottom text</label>
                            <input
                                type="text"
                                value={bottomText}
                                onChange={(e) => setBottomText(e.target.value)}
                                placeholder="BOTTOM TEXT"
                                className="w-full rounded-2xl border border-border bg-muted/30 p-3 focus:ring-2 focus:ring-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground mb-2">Font size: {fontSize}px</label>
                            <input
                                type="range"
                                min={16}
                                max={120}
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Text color</label>
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                    className="w-full h-10 rounded-xl cursor-pointer border border-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-muted-foreground mb-2">Outline</label>
                                <input
                                    type="color"
                                    value={strokeColor}
                                    onChange={(e) => setStrokeColor(e.target.value)}
                                    className="w-full h-10 rounded-xl cursor-pointer border border-border"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={download}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-2xl transition-all"
                            >
                                Download Meme
                            </button>
                            <button
                                onClick={() => setImageSrc(null)}
                                className="px-4 py-3 border border-border rounded-2xl font-medium text-muted-foreground hover:bg-secondary transition-all"
                            >
                                New Image
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-muted/30 rounded-3xl p-4 flex items-center justify-center min-h-[280px] overflow-auto border border-border">
                        <canvas ref={canvasRef} className="max-w-full max-h-[60vh] shadow-lg rounded-xl bg-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
