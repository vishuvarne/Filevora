"use client";

import { ToolDef, TOOLS } from "@/config/tools";
import { getDownloadUrl } from "@/lib/api";
import { getSuggestedTools } from "@/config/toolSuggestions";
import { downloadResultAsFile, navigateToToolWithFile, navigateToToolWithDeferred, getCompatibilityMessage, isFileCompatibleWithTool } from "@/lib/toolContinuation";
import { useSharedRouter } from "@/lib/navigation";
import { useState, useEffect } from "react";
import FileRetentionTimer from "@/components/FileRetentionTimer";
import { FileTransferService } from "@/lib/file-transfer-service";
import { MemoryTransferCache } from "@/lib/memory-transfer-cache";


interface ConversionSuccessModalProps {
    result: any;
    tool: ToolDef;
    isGhostMode: boolean;
    onReset: () => void;
    onViewReceipt?: () => void;
    retention?: {
        continuationKey: string;
        timestamp: number;
        onExpireOrDelete: () => void;
    } | null;
    retentionVariant?: "floating" | "icon";
}


export default function ConversionSuccessModal({
    result,
    tool,
    isGhostMode,
    onReset,
    onViewReceipt,
    retention,
    retentionVariant = "icon"
}: ConversionSuccessModalProps) {


    const router = useSharedRouter();
    const [continuingTo, setContinuingTo] = useState<string | null>(null);
    const [showAllTools, setShowAllTools] = useState(false);

    // Optimization: Prefetch the result as a blob for instant continuation
    const [preloadedBlobUrl, setPreloadedBlobUrl] = useState<string | null>(null);
    const [detectedFileSize, setDetectedFileSize] = useState<number | null>(null);
    // Removed hasTransferredOwnership - we always want to clean up our local blob references!

    useEffect(() => {
        let active = true;
        const fetchBlob = async () => {
            if (!result.download_url) return;

            try {
                const res = await fetch(result.download_url);

                if (!res.ok) {
                    if (res.status === 404) {
                        console.warn("Prefetch 404: Blob might have been revoked already", result.download_url);
                        // Do NOT set active=false here, ensuring we don't retry in a loop if the effect re-runs
                        return;
                    }
                    throw new Error(`Fetch failed with status ${res.status}`);
                }

                const blob = await res.blob();
                if (active) {
                    const objectUrl = URL.createObjectURL(blob);
                    setPreloadedBlobUrl(objectUrl);
                    if (!result.compressed_size) {
                        setDetectedFileSize(blob.size);
                    }
                }
            } catch (err) {
                console.error("Failed to prefetch result", err);
            }
        };
        fetchBlob();

        return () => {
            active = false;
        };
    }, [result.download_url]);

    // STRICT CLEANUP: Always revoke blob URL when component unmounts or url changes
    // STRICT CLEANUP: Removed.
    // We cannot revoke the URL here because we are passing it to the next page for deferred loading.
    // If we revoke it on unmount, the next page's fetch (or background IDB save) will fail 404.
    // The browser will clean up blob URLs on document unload (refresh/close).
    // ToolInterface also cleans up after consumption.
    /*
    useEffect(() => {
        return () => {
            if (preloadedBlobUrl) {
                URL.revokeObjectURL(preloadedBlobUrl);
                console.log("Cleaned up preloaded blob");
            }
        };
    }, [preloadedBlobUrl]);
    */


    // Calculate stats if available
    const originalSize = result.original_size;
    const compressedSize = result.compressed_size || detectedFileSize;
    const savedBytes = originalSize && compressedSize ? originalSize - compressedSize : 0;
    const savedPercent = originalSize && compressedSize ? Math.round((savedBytes / originalSize) * 100) : 0;
    const downloadUrl = (result.download_url.startsWith("http") || result.download_url.startsWith("blob:")) ? result.download_url : getDownloadUrl(result.download_url);

    // Handle continuing to next tool
    const handleContinueToTool = async (toolId: string) => {
        try {
            setContinuingTo(toolId);

            // INP OPTIMIZATION: Yield to main thread immediately
            await new Promise(resolve => setTimeout(resolve, 0));

            // LARGE FILE OPTIMIZATION: Zero-Copy Deferred Transfer
            // Instead of fetching the blob here (blocking), we pass the URL reference.
            // The target tool will fetch it in the background.

            const targetUrl = preloadedBlobUrl || (
                (result.download_url.startsWith("http") || result.download_url.startsWith("blob:"))
                    ? result.download_url
                    : getDownloadUrl(result.download_url)
            );

            const deferredData = {
                url: targetUrl,
                filename: result.filename || 'converted-file',
                type: result.type || 'application/octet-stream' // We might not know exact type, target will sniff or fallback
            };

            // Pass execution to the centralized helper
            // We do NOT revoke the blob URL here - the target page needs to read it.
            // ToolInterface will be responsible for revoking blob: URLs after consumption.
            navigateToToolWithDeferred(router, toolId, deferredData, tool.id);

        } catch (error) {
            console.error('Error continuing to tool:', error);
            alert('Failed to continue to next tool. Please try downloading and uploading manually.');
            setContinuingTo(null);
        }
    };

    // Smart Idle Prefetching Removed:
    // This was causing 404 errors for index.txt?_rsc=... because it triggered 
    // App Router RSC lookups for Pages Router tool pages.
    // Standard Link prefetch={false} handles the hygiene now.

    return (
        <div className="flex flex-col items-center justify-start p-4 py-6 md:p-6 md:py-8 animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-full w-full max-w-4xl mx-auto relative overflow-visible">

            {/* Solid Design: Clean Halo Backdrop */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[60px] pointer-events-none -z-10"></div>



            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-4xl font-black text-foreground mb-3 tracking-tightest">
                    Done & <span className="text-primary">Ready</span>
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    {tool.id === 'compress-pdf' && originalSize ? (
                        <div className="w-full max-w-md mx-auto my-6 bg-slate-900 rounded-2xl p-6 flex items-center justify-between border-[3px] border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] dark:shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                            <div className="flex flex-col items-center flex-1 border-r-2 border-slate-700">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Saved</span>
                                <span className="text-4xl font-black text-green-400">{savedPercent}%</span>
                            </div>
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">New Size</span>
                                <span className="text-4xl font-black text-white">{(result.compressed_size / 1024 / 1024).toFixed(2)} <span className="text-sm font-black text-slate-400">MB</span></span>
                            </div>
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            {compressedSize && !isNaN(compressedSize)
                                ? (compressedSize < 1024 * 1024
                                    ? `${(compressedSize / 1024).toFixed(2)} KB Result`
                                    : `${(compressedSize / 1024 / 1024).toFixed(2)} MB Result`)
                                : 'Ready to download'
                            }
                        </div>
                    )}


                    {isGhostMode && (
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                            </svg>
                            Securely Wiped
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons - Moved Above Next Action */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg relative mb-8`}>
                <button
                    onClick={onReset}
                    className="order-2 sm:order-1 px-6 py-4 rounded-2xl font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base tracking-tight"
                >
                    Process Another
                </button>

                <div className="order-1 sm:order-2 flex gap-2">
                    <a
                        href={downloadUrl}
                        download={result.filename}
                        target="_self"
                        className="flex-1 px-6 py-4 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.95] text-sm md:text-base flex items-center justify-center gap-3 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-7.5-7.5M12 12.75l7.5-7.5M12 12.75V3" />
                        </svg>
                        Download Now
                    </a>

                    {/* Retention/Delete Button */}
                    {retention && (
                        <FileRetentionTimer
                            continuationKey={retention.continuationKey}
                            timestamp={retention.timestamp}
                            onExpireOrDelete={retention.onExpireOrDelete}
                            variant={retentionVariant}
                            className={retentionVariant === 'icon' ? "h-auto w-14 !rounded-2xl !bg-red-50 dark:!bg-red-900/20 !text-red-500 dark:!text-red-400 !border-red-100 dark:!border-red-900/30 hover:!bg-red-100 dark:hover:!bg-red-900/40" : undefined}
                        />
                    )}
                </div>
            </div>

            {/* Integrated Tool Palette - Simplified Grid */}
            <div className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 md:p-6 mb-8 shadow-lg relative flex flex-col gap-4">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-md">
                    Next Action
                </div>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {TOOLS.filter(t => {
                            if (t.id === tool.id) return false;

                            // Exclude tools that are not yet available (coming soon)
                            if (t.endpoint === '/coming-soon') return false;

                            // Strict Filtering: Exclude 'Others' (converters) unless we are currently in 'Others'
                            if (tool.category !== 'Others' && t.category === 'Others') return false;

                            return isFileCompatibleWithTool(new File([], result.filename || 'file', { type: result.type }), t);
                        })
                            .sort((a, b) => {
                                const suggestions = getSuggestedTools(tool.id);
                                const aIndex = suggestions.indexOf(a.id);
                                const bIndex = suggestions.indexOf(b.id);
                                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                                if (aIndex !== -1) return -1;
                                if (bIndex !== -1) return 1;
                                return 0;
                            })
                            // Logic for Show More
                            .filter((_, i) => showAllTools ? true : i < 6)
                            .map(t => {
                                const isLoading = continuingTo === t.id;
                                const isSuggested = getSuggestedTools(tool.id).includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleContinueToTool(t.id)}
                                        disabled={isLoading}
                                        className={`group flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm active:scale-[0.98] text-left ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                    >
                                        <div className={`w-9 h-9 rounded-md ${t.theme.bgLight} flex items-center justify-center ${t.theme.text} shrink-0 group-hover:scale-110 transition-transform`}>
                                            {isLoading ? (
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={t.iconPath} />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[11px] truncate group-hover:text-primary transition-colors">{t.name}</h4>
                                            {isSuggested && (
                                                <span className="text-[9px] font-semibold text-primary uppercase tracking-wider block -mt-0.5">Suggested</span>
                                            )}
                                        </div>

                                        <div className="text-slate-300 dark:text-slate-700 group-hover:text-primary transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>

                    {/* Toggle Button */}
                    <div className="flex justify-end pr-2">
                        <button
                            onClick={() => setShowAllTools(!showAllTools)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline decoration-slate-300 hover:decoration-slate-500 underline-offset-4 transition-all"
                        >
                            {showAllTools ? "Show less" : "See more"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Cost Info Badge (for Remote jobs) - Kept subtle */}
            {(result.cost !== undefined || result.tier) && (
                <div className="mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full py-1.5 px-3 md:px-4 flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500">
                    <span>Job Cost: ${Number(result.cost_usd || 0).toFixed(4)}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="capitalize">{result.tier || 'Standard'} Tier</span>
                </div>
            )}


            {/* Action Buttons Removed from here (Moved Up) */}

            {isGhostMode && onViewReceipt && result.execution_receipt && (
                <button
                    onClick={onViewReceipt}
                    className="mt-6 md:mt-8 text-[10px] md:text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 md:w-3.5 md:h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Transparency Log
                </button>
            )}
        </div >
    );
}

