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

    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const activeSegmentIndex = segments && segments.length > 0
        ? Math.min(Math.floor((safeProgress / 100) * segments.length), segments.length - 1)
        : 0;

    // Map short segment names to full descriptive verbs
    const segmentVerbs: Record<string, string> = {
        'Read': 'Reading File',
        'Process': 'Processing',
        'Save': 'Saving File',
        'Upload': 'Uploading',
        'Download': 'Downloading',
    };

    const activeSegment = segments?.[activeSegmentIndex] ?? '';
    const loadingText = safeProgress === 100
        ? "Finishing Up..."
        : (segmentVerbs[activeSegment] || activeSegment || 'Processing') + '...';

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center">

            <div className="flex items-baseline justify-center mb-3">
                <span className="text-6xl md:text-[5rem] font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                    {safeProgress}
                </span>
                <span className="text-2xl md:text-3xl font-black text-slate-500 dark:text-white/70 ml-1">
                    %
                </span>
            </div>

            <div className="mb-6 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 backdrop-blur-md rounded-full px-5 py-1.5 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                <div className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {safeProgress < 3 ? "Warming Up..." : loadingText}
                </span>
            </div>

            {/* Bar Container */}
            <div className={`h-3 md:h-4 w-full bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden relative shadow-inner backdrop-blur-sm dark:border dark:border-slate-700/30`}>
                {/* Fill Bar */}
                <div
                    className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]`}
                    style={{ width: `${safeProgress}%` }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -translate-x-full animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
}
