"use client";

import { useEffect, useState } from "react";
import { deleteContinuationData } from "@/lib/toolContinuation";

interface FileRetentionTimerProps {
    continuationKey: string; // The session key
    timestamp: number;       // When it was created
    onExpireOrDelete: () => void; // Callback when time is up or user deletes
    variant?: "floating" | "icon";
    className?: string;
}

export default function FileRetentionTimer({ continuationKey, timestamp, onExpireOrDelete, variant = "floating", className = "" }: FileRetentionTimerProps) {

    const DURATION_MS = 5 * 60 * 1000; // 5 minutes
    const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const elapsed = Date.now() - timestamp;
            const remaining = Math.max(0, DURATION_MS - elapsed);

            setTimeLeftMs(remaining);

            if (remaining <= 0) {
                // Time's up
                onExpireOrDelete();
            }
        };

        // Initial check
        updateTimer();

        // Interval
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [timestamp, onExpireOrDelete]);

    if (timeLeftMs <= 0) return null;

    const minutes = Math.floor(timeLeftMs / 60000);
    const seconds = Math.floor((timeLeftMs % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const handleDelete = () => {
        deleteContinuationData(continuationKey);
        onExpireOrDelete();
        setShowDialog(false);
    };

    return (
        <>
            {/* Small Floating Button */}
            {/* Trigger Button */}
            {variant === "floating" ? (
                <button
                    onClick={() => setShowDialog(true)}
                    className={`fixed bottom-4 right-4 z-40 bg-white dark:bg-slate-900 border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform animate-in fade-in slide-in-from-bottom-4 ${className}`}
                >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>File Retained: {timeString}</span>
                </button>
            ) : (
                <button
                    onClick={() => setShowDialog(true)}
                    className={`w-12 h-full flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/20 ${className}`}
                    title={`File expires in ${timeString}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {/* Small Dialog */}
            {showDialog && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]"
                        onClick={() => setShowDialog(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="fixed bottom-16 right-4 z-50 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-border p-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-sm">File Retention</h3>
                            <button onClick={() => setShowDialog(false)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Your processed file is temporarily saved for convenience. It will be automatically deleted in:
                        </p>

                        <div className="text-center bg-slate-100 dark:bg-slate-800 rounded-xl py-3 mb-4">
                            <span className="text-2xl font-black font-mono text-primary tab-nums">
                                {timeString}
                            </span>
                        </div>

                        <button
                            onClick={handleDelete}
                            className="w-full py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                            Delete Now
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
