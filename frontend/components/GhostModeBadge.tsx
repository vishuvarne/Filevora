import React from 'react';
import { useCapabilities } from '@/lib/capabilities';

type ProcessingMode = 'local' | 'cloud' | 'hybrid';

interface GhostModeBadgeProps {
    mode: ProcessingMode;
    className?: string;
    onClick?: () => void;
}

export default function GhostModeBadge({ mode, className = '', onClick }: GhostModeBadgeProps) {
    const capabilities = useCapabilities();
    const isTurbo = capabilities?.turboMode;

    if (mode === 'local') {
        return (
            <div
                onClick={onClick}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#f4f4f5] dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wide border-[2px] sm:border-[3px] border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] sm:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:dark:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none active:scale-95 transition-all duration-200' : ''} ${className}`}
                title="Files are processed entirely on your device. No network transmission. Click to learn more."
            >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm shadow-green-400/50"></span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="hidden sm:block w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] text-green-600 dark:text-green-400 shrink-0">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <span className="leading-none mt-0.5 sm:mt-0">On-Device</span>
                    {isTurbo && (
                        <span className="flex items-center gap-0.5 bg-slate-900 border border-slate-900 px-[3px] py-[1px] sm:px-[5px] sm:py-[1px] rounded-[4px] text-[7px] sm:text-[8px] uppercase tracking-wider font-black text-white ml-0.5 sm:ml-1 mb-[1px] sm:mb-0 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] text-white">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            Turbo
                        </span>
                    )}
                </span>
            </div>
        );
    }

    if (mode === 'cloud') {
        return (
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#f4f4f5] dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wide border-[2px] sm:border-[3px] border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] sm:dark:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] ${className}`} title="Secure cloud processing. Files are encrypted in transit and auto-deleted.">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="hidden sm:block w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] text-blue-600 dark:text-blue-500 shrink-0">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                <span className="leading-none mt-0.5 sm:mt-0">Cloud-Processed</span>
            </div>
        );
    }

    return null;
}
