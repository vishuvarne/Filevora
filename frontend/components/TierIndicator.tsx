'use client';

/**
 * Tier Indicator Component
 * 
 * Shows the current WASM runtime execution tier (Fast/Safe mode).
 * Helps users understand their browser's processing capabilities.
 */

import { useState, useEffect } from 'react';
import { getQuickTier, getRuntimeStatus, type RuntimeStatus } from '@/lib/wasm';

interface TierIndicatorProps {
    /** Show detailed tooltip on hover */
    showTooltip?: boolean;
    /** Compact mode for smaller spaces */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export default function TierIndicator({
    showTooltip = true,
    compact = false,
    className = ''
}: TierIndicatorProps) {
    const [status, setStatus] = useState<RuntimeStatus | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Get full status on mount
        getRuntimeStatus().then(setStatus).catch(console.error);
    }, []);

    // Quick sync check for initial render
    const quickTier = getQuickTier();

    if (!status && !quickTier) {
        return null;
    }

    const tier = status?.tier ?? quickTier.tier;
    const label = status?.tierLabel ?? quickTier.label;
    const isFast = tier === 'fast';

    // Badge colors
    const bgColor = isFast
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
        : 'bg-gradient-to-r from-amber-500 to-orange-500';
    const textColor = 'text-white';
    const pulseColor = isFast ? 'bg-emerald-400' : 'bg-amber-400';

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} ${className}`}
                title={status?.tierDescription ?? ''}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${pulseColor} animate-pulse`} />
                {isFast ? '⚡' : '🛡️'}
            </span>
        );
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                onClick={() => showTooltip && setShowDetails(!showDetails)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold 
                    ${bgColor} ${textColor} shadow-sm hover:shadow-md transition-all duration-200
                    ${showTooltip ? 'cursor-pointer' : 'cursor-default'}`}
            >
                {/* Pulse indicator */}
                <span className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`} />

                {/* Icon and label */}
                <span>{label}</span>
            </button>

            {/* Tooltip/Details panel */}
            {showDetails && status && (
                <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-white dark:bg-gray-800 
                    rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50
                    animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Title */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`w-3 h-3 rounded-full ${pulseColor}`} />
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {status.tierLabel}
                        </span>
                        {status.isOptimal && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 
                                dark:bg-green-900/30 dark:text-green-400 rounded">
                                OPTIMAL
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {status.tierDescription}
                    </p>

                    {/* Performance */}
                    <div className="text-xs space-y-1 mb-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Speed:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {status.performance.estimatedSpeedup}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Memory:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {status.performance.memoryLimit}
                            </span>
                        </div>
                    </div>

                    {/* Warnings */}
                    {status.warnings.length > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                                ⚠️ Recommendations
                            </p>
                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                {status.warnings.map((warning, i) => (
                                    <li key={i}>• {warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Capabilities */}
                    {status.capabilities && (
                        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Browser Capabilities
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {status.capabilities.wasm && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 
                                        dark:bg-blue-900/30 dark:text-blue-400 rounded">WASM</span>
                                )}
                                {status.capabilities.wasmThreads && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 
                                        dark:bg-purple-900/30 dark:text-purple-400 rounded">Threads</span>
                                )}
                                {status.capabilities.wasmSIMD && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 
                                        dark:bg-indigo-900/30 dark:text-indigo-400 rounded">SIMD</span>
                                )}
                                {status.capabilities.crossOriginIsolated && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 
                                        dark:bg-green-900/30 dark:text-green-400 rounded">COOP/COEP</span>
                                )}
                                {status.capabilities.webgpu && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-pink-100 text-pink-700 
                                        dark:bg-pink-900/30 dark:text-pink-400 rounded">WebGPU</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDetails && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDetails(false)}
                />
            )}
        </div>
    );
}
