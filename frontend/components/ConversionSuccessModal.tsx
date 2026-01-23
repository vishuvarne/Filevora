"use client";

import { ToolDef } from "@/config/tools";
import { getDownloadUrl } from "@/lib/api";

interface ConversionSuccessModalProps {
    result: any;
    tool: ToolDef;
    isGhostMode: boolean;
    onReset: () => void;
}

export default function ConversionSuccessModal({ result, tool, isGhostMode, onReset }: ConversionSuccessModalProps) {

    // Calculate stats if available
    const originalSize = result.original_size;
    const compressedSize = result.compressed_size;
    const savedBytes = originalSize && compressedSize ? originalSize - compressedSize : 0;
    const savedPercent = originalSize && compressedSize ? Math.round((savedBytes / originalSize) * 100) : 0;
    const downloadUrl = (result.download_url.startsWith("http") || result.download_url.startsWith("blob:")) ? result.download_url : getDownloadUrl(result.download_url);

    return (
        <div className="flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300 h-full">

            {/* Success Icon with Cyber Lime Glow */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(163,230,53,0.3)] bg-[#a3e635]/10 text-[#a3e635]`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>

            <h2 className="text-3xl font-black text-foreground mb-2 text-center tracking-tight">Success!</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-sm">
                {isGhostMode ? "Your files were processed securely on this device." : "Your files are ready for download."}
            </p>

            {/* Stats Card (if compression) */}
            {savedBytes > 0 && (
                <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-sm">
                    <div className="text-left">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Saved</p>
                        <p className="text-xl font-black text-green-600 dark:text-[#a3e635]">{savedPercent}%</p>
                    </div>
                    <div className="h-8 w-px bg-border"></div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Size Reduction</p>
                        <p className="text-xl font-black text-foreground">{(savedBytes / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                </div>
            )}

            {/* Privacy Shield */}
            {isGhostMode && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-[#a3e635] rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-green-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <span>Privacy Verified: Local</span>
                </div>
            )}

            {/* Actions Grid */}
            <div className="grid gap-4 w-full max-w-sm">
                <a
                    href={downloadUrl}
                    download={result.filename}
                    target="_self"
                    className="flex w-full py-4 bg-[#a3e635] text-slate-900 rounded-xl font-bold hover:bg-[#84cc16] shadow-lg shadow-lime-500/20 transition-all items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-7.5-7.5M12 12.75l7.5-7.5M12 12.75V3" />
                    </svg>
                    Download File
                </a>

                <button
                    onClick={onReset}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    Process Another File
                </button>
            </div>

        </div>
    );
}
