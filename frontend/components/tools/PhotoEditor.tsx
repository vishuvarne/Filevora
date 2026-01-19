"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/Dropzone";

export default function PhotoEditor() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [blur, setBlur] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFiles = (files: File[]) => {
        if (files.length > 0) setImageSrc(URL.createObjectURL(files[0]));
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
            ctx.drawImage(img, 0, 0);
        };
    }, [imageSrc, brightness, contrast, saturation, blur]);

    useEffect(() => {
        draw();
    }, [draw]);

    const reset = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setBlur(0);
    };

    const download = () => {
        if (!canvasRef.current) return;
        const link = document.createElement("a");
        link.download = "edited-photo.png";
        link.href = canvasRef.current.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Photo Editor</h2>

            {!imageSrc ? (
                <Dropzone
                    onFilesSelected={handleFiles}
                    acceptedTypes="image/*"
                    multiple={false}
                    label="Upload Photo to Edit"
                />
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="space-y-5 w-full lg:w-72">
                        <div>
                            <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                Brightness <span className="font-normal text-slate-500">{brightness}%</span>
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={200}
                                value={brightness}
                                onChange={(e) => setBrightness(parseInt(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                        </div>
                        <div>
                            <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                Contrast <span className="font-normal text-slate-500">{contrast}%</span>
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={200}
                                value={contrast}
                                onChange={(e) => setContrast(parseInt(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                        </div>
                        <div>
                            <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                Saturation <span className="font-normal text-slate-500">{saturation}%</span>
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={200}
                                value={saturation}
                                onChange={(e) => setSaturation(parseInt(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                        </div>
                        <div>
                            <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                Blur <span className="font-normal text-slate-500">{blur}px</span>
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={20}
                                value={blur}
                                onChange={(e) => setBlur(parseInt(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={reset} className="flex-1 border border-slate-200 rounded-xl py-2.5 font-medium text-slate-600 hover:bg-slate-50">
                                Reset
                            </button>
                            <button
                                onClick={download}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl"
                            >
                                Download
                            </button>
                        </div>
                        <button
                            onClick={() => { setImageSrc(null); reset(); }}
                            className="w-full text-sm text-slate-500 hover:text-slate-700"
                        >
                            Choose different image
                        </button>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[300px] overflow-auto">
                        <canvas ref={canvasRef} className="max-w-full max-h-[60vh] shadow-lg rounded-lg bg-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
