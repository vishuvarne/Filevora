import React from 'react';

// Unified sizing for all visuals
const SIZE_CLASSES = "w-16 h-16 md:w-20 md:h-20";

export const MergeAnimation = () => (
    <div className={`relative ${SIZE_CLASSES} flex items-center justify-center opacity-80`}>
        {/* Left File - Sliding In */}
        <svg
            className="w-10 h-10 absolute left-0 text-blue-500 dark:text-blue-400 animate-merge-left drop-shadow-lg"
            fill="currentColor" viewBox="0 0 24 24"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>
        {/* Right File - Sliding In */}
        <svg
            className="w-10 h-10 absolute right-0 text-indigo-500 dark:text-indigo-400 animate-merge-right drop-shadow-lg" /* opacity-80 to blend */
            fill="currentColor" viewBox="0 0 24 24"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>
        {/* Sparkle/Pulse effect in center (optional) */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full animate-ping opacity-75" />
        </div>
    </div>
);

export const SplitAnimation = () => (
    <div className={`relative ${SIZE_CLASSES} flex items-center justify-center`}>
        {/* Main File - Fading Out */}
        <svg
            className="w-12 h-12 text-slate-400 absolute opacity-30 animate-pulse"
            fill="currentColor" viewBox="0 0 24 24"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>

        {/* Three parts splitting out */}
        <svg className="w-6 h-6 absolute text-blue-500 animate-split-left" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>
        <svg className="w-6 h-6 absolute text-indigo-500 animate-split-center" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>
        <svg className="w-6 h-6 absolute text-violet-500 animate-split-right" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>
    </div>
);

export const CompressAnimation = () => (
    <div className={`relative ${SIZE_CLASSES} flex items-center justify-center`}>
        {/* The File being squeezed */}
        <svg
            className="w-14 h-14 text-blue-500 dark:text-blue-400 animate-squeeze origin-center drop-shadow-md"
            fill="currentColor" viewBox="0 0 24 24"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>

        {/* Arrows Pushing In */}
        <svg className="w-6 h-6 absolute -left-2 text-slate-600 dark:text-slate-300 animate-point-in-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <svg className="w-6 h-6 absolute -right-2 text-slate-600 dark:text-slate-300 animate-point-in-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
    </div>
);

export const RotateAnimation = () => (
    <div className={`relative ${SIZE_CLASSES} flex items-center justify-center`}>
        <svg
            className="w-12 h-12 text-orange-500 dark:text-orange-400 animate-spin-slow drop-shadow-md"
            fill="currentColor" viewBox="0 0 24 24"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path className="text-white/50" d="M12 8v8m-4-4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    </div>
);

export const ConvertVisual = () => (
    <div className={`relative ${SIZE_CLASSES} flex items-center justify-center`}>
        {/* Standard Spinner, but bigger/cleaner */}
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary dark:border-t-blue-400 rounded-full animate-spin" />
        {/* Icon in middle */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
        </div>
    </div>
);

export const getProcessingVisual = (toolId: string) => {
    if (toolId.includes('merge')) return <MergeAnimation />;
    if (toolId.includes('compress')) return <CompressAnimation />;
    if (toolId.includes('split') || toolId.includes('extract')) return <SplitAnimation />;
    if (toolId.includes('rotate')) return <RotateAnimation />;

    // Default
    return <ConvertVisual />;
};

export const getProcessingTitle = (toolId: string) => {
    if (toolId.includes('merge')) return "Merging...";
    if (toolId.includes('compress')) return "Compressing...";
    if (toolId.includes('split')) return "Splitting...";
    if (toolId.includes('rotate')) return "Rotating...";
    if (toolId.includes('extract')) return "Extracting...";
    if (toolId.includes('organize')) return "Organizing...";
    return "Converting...";
};
