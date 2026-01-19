"use client";

import { useState } from "react";

const API_BASE = "https://api.qrserver.com/v1/create-qr-code";

export default function QRCodeGenerator() {
    const [text, setText] = useState("");
    const [size, setSize] = useState(300);
    const [fg, setFg] = useState("#000000");
    const [bg, setBg] = useState("#ffffff");

    const encoded = encodeURIComponent(text || " ");
    const qrUrl = `${API_BASE}/?size=${size}x${size}&color=${fg.slice(1)}&bgcolor=${bg.slice(1)}&data=${encoded}`;

    const download = () => {
        if (!text.trim()) return;
        const link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = qrUrl;
        link.target = "_blank";
        link.click();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">QR Code Generator</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Text or URL</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="https://example.com or any text"
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Size: {size}×{size}px</label>
                    <input
                        type="range"
                        min={100}
                        max={500}
                        step={50}
                        value={size}
                        onChange={(e) => setSize(parseInt(e.target.value))}
                        className="w-full accent-blue-600"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Foreground</label>
                        <input
                            type="color"
                            value={fg}
                            onChange={(e) => setFg(e.target.value)}
                            className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Background</label>
                        <input
                            type="color"
                            value={bg}
                            onChange={(e) => setBg(e.target.value)}
                            className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                    <div className="bg-slate-100 rounded-xl p-6 flex items-center justify-center min-w-[200px] min-h-[200px]">
                        {text.trim() ? (
                            <img src={qrUrl} alt="QR Code" className="max-w-full h-auto" />
                        ) : (
                            <span className="text-slate-400 text-sm text-center">Enter text to preview</span>
                        )}
                    </div>
                    <button
                        onClick={download}
                        disabled={!text.trim()}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl font-bold transition-colors"
                    >
                        Download QR Code
                    </button>
                </div>
            </div>
        </div>
    );
}
