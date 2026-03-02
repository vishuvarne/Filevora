import { ToolDef } from "@/config/tools";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import GhostModeBadge from "@/components/GhostModeBadge";
import { getProcessingVisual, getProcessingTitle } from "@/components/ProcessingVisuals";
import Dropzone from "@/components/SmartDropzone";
import AdSlot from "@/components/ads/AdSlot";
import dynamic from "next/dynamic";

const ConversionSuccessModal = dynamic(() => import("@/components/ConversionSuccessModal"), { ssr: false });
const ConsentModal = dynamic(() => import("@/components/ConsentModal"), { ssr: false });

interface ToolLayoutProps {
    tool: ToolDef;
    state: any; // Type from useToolState
    actions: any; // Type from useToolState
    children?: React.ReactNode;
    addMoreInputRef: React.RefObject<HTMLInputElement | null>;
    progressRef: React.RefObject<HTMLDivElement | null>;
    onFilesSelected: (files: File[]) => void;
    onRemoteConfirm: (tier: any) => void;
    onCancel: () => void;
    onShowInfo: () => void;
    onShowGhostExplainer: () => void;
    onShowReceipt: () => void;
}

export default function ToolLayout({
    tool, state, actions, children,
    addMoreInputRef, progressRef,
    onFilesSelected, onRemoteConfirm, onCancel,
    onShowInfo, onShowGhostExplainer, onShowReceipt
}: ToolLayoutProps) {

    // Destructure state for easier access
    const {
        files, status, result, errorMsg, uploadProgress, progressMessage,
        isTransferLoading, retentionTimestamp, continuedFromTool,
        isGhostMode, executionDecision
    } = state;

    const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
            e.target.value = "";
        }
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col w-full mx-auto px-4 pb-16 relative isolate">

            {/* Header */}
            <div className="shrink-0 pt-1 pb-2">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: tool.name }]} />

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${tool.theme.bgLight} rounded-2xl flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5 shrink-0`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${tool.theme.text}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                            </svg>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h1 className="text-2xl font-extrabold text-foreground leading-tight">{tool.name}</h1>
                            <div className="flex items-center gap-2">
                                <GhostModeBadge
                                    mode={isGhostMode ? "local" : "cloud"}
                                    onClick={isGhostMode ? onShowGhostExplainer : undefined}
                                />
                                {continuedFromTool && (
                                    <div className="px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-primary">Continued</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="w-full bg-card rounded-[2rem] shadow-sm border border-border/60 flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full p-4 sm:p-6 lg:p-8 pb-16 md:pb-20" ref={progressRef}>

                    {/* Success State */}
                    {status === "success" && result && (
                        <ConversionSuccessModal
                            tool={tool}
                            result={result}
                            onReset={actions.hardReset}
                            isGhostMode={isGhostMode}
                            onViewReceipt={onShowReceipt}
                            retention={retentionTimestamp ? {
                                continuationKey: 'session',
                                timestamp: retentionTimestamp,
                                onExpireOrDelete: actions.handleRetentionExpire
                            } : null}
                        />
                    )}

                    {/* Error State */}
                    {status === "error" && (
                        <div className="w-full max-w-lg mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center">
                                <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Conversion Failed</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-6">{errorMsg}</p>
                                <button onClick={actions.hardReset} className="bg-red-600 hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:shadow-none active:scale-95 text-white px-6 py-2 rounded-full border-[3px] border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-black uppercase tracking-wider transition-all duration-200">Try Again</button>
                            </div>
                        </div>
                    )}

                    {/* Main Tool UI */}
                    {(status !== 'success' && status !== 'error') && (
                        <div className={`w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>

                            {/* Processing/Upload View */}
                            {(status === "uploading" || status === "converting" || status === "processing") && (
                                <div className="w-full max-w-lg mx-auto mb-4" ref={progressRef}>
                                    <div className="bg-card/50 border border-border/50 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden text-center">
                                        <div className="relative z-10 mb-6">
                                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                                                {getProcessingTitle(tool.id)}
                                                <div className="scale-75 md:scale-100">{getProcessingVisual(tool.id)}</div>
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Preparing your files...</p>
                                        </div>
                                        <div className="relative z-10 mb-6 max-w-xs mx-auto">
                                            <div className="flex items-end justify-center gap-0.5 mb-4">
                                                <span className="text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{Math.round(uploadProgress)}</span>
                                                <span className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-2">%</span>
                                            </div>
                                            {progressMessage && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                                                    {progressMessage}
                                                </div>
                                            )}
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full relative ring-1 ring-black/5 dark:ring-white/5 p-0.5">
                                                <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </div>
                                        <button onClick={onCancel} className="relative z-10 text-slate-400 hover:text-red-500 text-sm font-black uppercase tracking-wider hover:underline transition-colors mt-2">Cancel</button>
                                    </div>
                                </div>
                            )}

                            {/* Idle / Input State */}
                            {status === 'idle' && (
                                <>
                                    <div className="w-full">
                                        {isTransferLoading ? (
                                            <div className="min-h-[200px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 animate-pulse">
                                                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
                                                <p className="font-bold text-slate-500 dark:text-slate-400">Loading file...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Mobile Ad (Above Dropzone) */}
                                                {!files.length && (
                                                    <div className="block md:hidden w-full max-w-[320px] mx-auto mb-2 mt-4">
                                                        <AdSlot adSlotId="mobile-top-layout" format="mobile-banner" isTest={true} />
                                                    </div>
                                                )}

                                                <Dropzone
                                                    onFilesSelected={onFilesSelected}
                                                    acceptedTypes={tool.acceptedTypes}
                                                    multiple={tool.multiple}
                                                    compact={files.length > 0}
                                                    label={files.length > 0 ? "Add more files" : `Drag & Drop ${tool.name.split(' ')[0]} files here`}
                                                />

                                                {/* Mobile Ad (Below Dropzone) */}
                                                {!files.length && (
                                                    <div className="block md:hidden w-full max-w-[320px] mx-auto mt-2 mb-4">
                                                        <AdSlot adSlotId="mobile-bottom-layout" format="mobile-banner" isTest={true} />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-muted-foreground bg-secondary/60 backdrop-blur-sm rounded-full px-4 py-2 w-fit mx-auto border border-border/40 shadow-sm">
                                        <span>{isGhostMode ? "Processed entirely on your device • No upload" : "SSL Encrypted • Max 500MB"}</span>
                                    </div>
                                </>
                            )}

                            {/* Children (Options & File List) - Only show when idle and files exist */}
                            {files.length > 0 && status === "idle" && children}

                        </div>
                    )}
                    <input type="file" ref={addMoreInputRef} className="hidden" multiple={tool.multiple} accept={tool.acceptedTypes} onChange={handleAddMoreFiles} />

                </div>
            </div>
        </div>
    );
}
