"use client";

import { useState } from "react";

export default function ColorPicker() {
    const [color, setColor] = useState("#3b82f6");
    const [rgb, setRgb] = useState("rgb(59, 130, 246)");
    const [copied, setCopied] = useState("");

    const hexToRgb = (hex: string) => {
        let c: any;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split("");
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = "0x" + c.join("");
            return "rgb(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(", ") + ")";
        }
        return "";
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setColor(val);
        setRgb(hexToRgb(val));
        setCopied("");
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(""), 2000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Color Picker</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Visual Picker */}
                <div className="flex flex-col items-center gap-6">
                    <div
                        className="w-48 h-48 rounded-full shadow-lg border-4 border-white ring-2 ring-slate-100 transition-colors"
                        style={{ backgroundColor: color }}
                    />
                    <input
                        type="color"
                        value={color}
                        onChange={handleColorChange}
                        className="w-full h-12 cursor-pointer rounded-lg overflow-hidden"
                    />
                    <p className="text-slate-500 text-sm">Click the bar above to open system picker</p>
                </div>

                {/* Values */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">HEX</label>
                        <div className="flex items-center gap-4">
                            <code className="text-2xl font-mono text-slate-800 font-bold">{color}</code>
                            <button
                                onClick={() => copyToClipboard(color, "HEX")}
                                className="ml-auto text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-md font-bold text-slate-600 transition-colors"
                            >
                                {copied === "HEX" ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">RGB</label>
                        <div className="flex items-center gap-4">
                            <code className="text-xl font-mono text-slate-800 font-bold">{rgb}</code>
                            <button
                                onClick={() => copyToClipboard(rgb, "RGB")}
                                className="ml-auto text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-md font-bold text-slate-600 transition-colors"
                            >
                                {copied === "RGB" ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">CSS</label>
                        <div className="flex items-center gap-4">
                            <code className="text-sm font-mono text-slate-800 font-bold truncate">background-color: {color};</code>
                            <button
                                onClick={() => copyToClipboard(`background-color: ${color};`, "CSS")}
                                className="ml-auto text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-md font-bold text-slate-600 transition-colors"
                            >
                                {copied === "CSS" ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
