"use client";

import { useState } from "react";

const TIMEZONES = [
    "UTC (Coordinated Universal Time)",
    "EST (Eastern Standard Time)",
    "CST (Central Standard Time)",
    "MST (Mountain Standard Time)",
    "PST (Pacific Standard Time)",
    "IST (India Standard Time)",
    "GMT (Greenwich Mean Time)",
    "CET (Central European Time)"
];

export default function TimeConverter() {
    const [fromZone, setFromZone] = useState("CST (Central Standard Time)");
    const [toZone, setToZone] = useState("EST (Eastern Standard Time)");
    const [time, setTime] = useState("22:45"); // 10:45 PM
    const [date, setDate] = useState("2026-01-17");

    // Mock calculation logic for visual fidelity
    const calculateDestTime = (srcTime: string) => {
        // Just adding 1 hour for mock CST -> EST logic
        const [h, m] = srcTime.split(':').map(Number);
        let newH = (h + 1) % 24;
        return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const destTime = calculateDestTime(time);

    const formatAmPm = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return { time: `${h12}:${m.toString().padStart(2, '0')}`, ampm };
    };

    const srcDisplay = formatAmPm(time);
    const destDisplay = formatAmPm(destTime);

    return (
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-4">Time Zone Converter</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
                Convert between Central Standard Time (CST) and Eastern Standard Time (EST). Click on the time field to change time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Card */}
                <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-primary text-primary-foreground text-center py-3 font-bold uppercase tracking-wider">
                        {fromZone.split(' ')[0]}
                    </div>
                    <div className="p-8 text-center bg-card">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-5xl font-extrabold text-foreground">{srcDisplay.time}</span>
                            <span className="text-2xl font-bold text-muted-foreground">{srcDisplay.ampm}</span>
                        </div>

                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full text-center mt-4 p-2 bg-muted/30 rounded-xl text-sm font-medium text-foreground border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                            />
                        </div>

                        <div className="mt-6">
                            <select
                                value={fromZone}
                                onChange={(e) => setFromZone(e.target.value)}
                                className="w-full text-xs text-muted-foreground border-none bg-transparent text-center cursor-pointer focus:ring-0"
                            >
                                {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-muted/30 p-3 border-t border-border flex justify-center">
                        <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            Copy to clipboard
                        </button>
                    </div>
                </div>

                {/* Dest Card */}
                <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-primary text-primary-foreground text-center py-3 font-bold uppercase tracking-wider">
                        {toZone.split(' ')[0]}
                    </div>
                    <div className="p-8 text-center bg-card">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-5xl font-extrabold text-foreground">{destDisplay.time}</span>
                            <span className="text-2xl font-bold text-muted-foreground">{destDisplay.ampm}</span>
                        </div>

                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                readOnly
                                className="block w-full text-center mt-4 p-2 bg-muted/30 rounded-xl text-sm font-medium text-foreground border border-border"
                            />
                        </div>

                        <div className="mt-6">
                            <select
                                value={toZone}
                                onChange={(e) => setToZone(e.target.value)}
                                className="w-full text-xs text-muted-foreground border-none bg-transparent text-center cursor-pointer focus:ring-0"
                            >
                                {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-muted/30 p-3 border-t border-border flex justify-center">
                        <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            Copy to clipboard
                        </button>
                    </div>
                </div>
            </div>

            <button className="w-full mt-6 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-lg hover:bg-primary/90 transition-all">
                Copy Link
            </button>
        </div>
    );
}
