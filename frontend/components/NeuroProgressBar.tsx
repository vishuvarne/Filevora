import { useEffect, useState } from "react";

interface NeuroProgressBarProps {
    progress: number;
    className?: string; // Gradient class
    color?: "blue" | "green" | "purple" | "lime"; // Explicit color mode for glow
    segments?: string[]; // e.g. ["Read", "Process", "Sign"]
    isGhostMode?: boolean; // Triggers circuit board glow
}

export default function NeuroProgressBar({ progress, className, color = "blue", segments, isGhostMode }: NeuroProgressBarProps) {

    // Glow styles based on color
    const glowColor = {
        blue: "shadow-[0_0_20px_hsl(var(--primary)/0.5)]",
        green: "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
        purple: "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
        lime: "shadow-[0_0_20px_rgba(163,230,53,0.6)]" // Cyber Lime Glow
    }[color];

    const barColor = {
        blue: "bg-primary",
        green: "bg-green-600",
        purple: "bg-purple-600",
        lime: "bg-[#a3e635]" // Cyber Lime
    }[color];

    // Calculate current segment based on progress
    const activeSegmentIndex = segments ? Math.min(Math.floor((progress / 100) * segments.length), segments.length - 1) : 0;

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Segment Labels */}
            {segments && (
                <div className="flex justify-between mb-2 px-1">
                    {segments.map((seg, i) => (
                        <div key={i} className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${i <= activeSegmentIndex ? "text-primary dark:text-[#a3e635]" : "text-slate-300 dark:text-slate-700"}`}>
                            {seg}
                        </div>
                    ))}
                </div>
            )}

            {/* Bar Container */}
            <div className={`h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner ${glowColor}`}>
                {/* Circuit Board Pattern (Ghost Mode) */}
                {isGhostMode && (
                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMUMxbTQgMGgydjJINW00IDBoMnYySDltNCAwaDJ2MmgxbTQgMGgydjJ2LTJ6IiBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]"></div>
                )}

                {/* Fill Bar */}
                <div
                    className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${className || barColor}`}
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full -translate-x-full animate-shimmer"></div>
                </div>

                {/* Segment Dividers */}
                {segments && segments.map((_, i) => i > 0 && (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 w-0.5 bg-white/20 dark:bg-slate-900/50 z-10"
                        style={{ left: `${(i / segments.length) * 100}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
