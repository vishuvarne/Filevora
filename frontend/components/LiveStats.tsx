"use client";

import { useState, useEffect } from "react";

export default function LiveStats() {
    // Start with a base number (e.g., total conversions from "server")
    // For demo, we start with a static impressive number
    const [count, setCount] = useState(14582);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Randomly increment the counter
        const interval = setInterval(() => {
            // Random chance to update - increased frequency
            if (Math.random() > 0.1) {
                const increase = Math.floor(Math.random() * 12) + 3; // +3 to +15
                setCount((prev) => prev + increase);
            }
        }, 1200); // Check every 1.2s

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 sm:bottom-6 sm:left-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-card/90 dark:bg-slate-900/90 backdrop-blur-md border border-border/50 shadow-xl rounded-full pl-3 pr-4 py-2 flex items-center gap-3 transition-all hover:scale-105 group">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Live Conversions</span>
                    <span className="font-mono font-bold text-foreground text-sm tabular-nums flex items-center gap-1">
                        {count.toLocaleString()}
                        <span className="text-[10px] text-green-500 font-normal group-hover:block hidden animate-in fade-in">
                            ▲ rising
                        </span>
                    </span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="ml-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
