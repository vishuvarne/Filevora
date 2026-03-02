import React from 'react';

export default function RemoteProcessingBadge() {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full animate-in fade-in">
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Remote Worker Active
            </div>

            {/* Tooltip trigger or info icon could go here */}
        </div>
    );
}
