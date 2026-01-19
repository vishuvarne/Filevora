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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-4">Time Zone Converter</h2>
            <p className="text-center text-slate-500 mb-10 max-w-xl mx-auto">
                Convert between Central Standard Time (CST) and Eastern Standard Time (EST). Click on the time field to change time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-red-500 text-white text-center py-3 font-bold uppercase tracking-wider">
                        {fromZone.split(' ')[0]}
                    </div>
                    <div className="p-8 text-center bg-white">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-5xl font-extrabold text-slate-900">{srcDisplay.time}</span>
                            <span className="text-2xl font-bold text-slate-500">{srcDisplay.ampm}</span>
                        </div>

                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full text-center mt-4 p-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100"
                            />
                        </div>

                        <div className="mt-6">
                            <select
                                value={fromZone}
                                onChange={(e) => setFromZone(e.target.value)}
                                className="w-full text-xs text-slate-500 border-none bg-transparent text-center cursor-pointer"
                            >
                                {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-center">
                        <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            Copy to clipboard
                        </button>
                    </div>
                </div>

                {/* Dest Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-red-500 text-white text-center py-3 font-bold uppercase tracking-wider">
                        {toZone.split(' ')[0]}
                    </div>
                    <div className="p-8 text-center bg-white">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-5xl font-extrabold text-slate-900">{destDisplay.time}</span>
                            <span className="text-2xl font-bold text-slate-500">{destDisplay.ampm}</span>
                        </div>

                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                readOnly
                                className="block w-full text-center mt-4 p-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-600 border border-slate-200"
                            />
                        </div>

                        <div className="mt-6">
                            <select
                                value={toZone}
                                onChange={(e) => setToZone(e.target.value)}
                                className="w-full text-xs text-slate-500 border-none bg-transparent text-center cursor-pointer"
                            >
                                {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-center">
                        <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            Copy to clipboard
                        </button>
                    </div>
                </div>
            </div>

            <button className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all">
                Copy Link
            </button>
        </div>
    );
}
