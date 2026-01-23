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
                className={`flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold border border-green-200 dark:border-green-800 ${onClick ? 'cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors' : ''} ${className}`}
                title="Files are processed entirely on your device. No network transmission. Click to learn more."
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="flex items-center gap-1">
                    On-Device (Private)
                    {isTurbo && (
                        <span className="flex items-center gap-0.5 bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-700 dark:text-green-300">
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
            <div className={`flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-semibold border border-yellow-200 dark:border-yellow-800 ${className}`} title="Upload required (user-approved).">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm1.5-5a.75.75 0 01.75.75v3a.75.75 0 001.5 0v-3a.75.75 0 00-.75-.75h-3a.75.75 0 000 1.5h3z" clipRule="evenodd" />
                </svg>
                Cloud-Processed
            </div>
        );
    }

    return null;
}
