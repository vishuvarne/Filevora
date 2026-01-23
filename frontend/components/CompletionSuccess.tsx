import { ToolDef, TOOLS } from "@/config/tools"; // Import tools list
import { getDownloadUrl, ProcessResponse, sendEmail } from "@/lib/api";
import { useState } from "react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { getSuggestedTools } from "@/config/toolSuggestions"; // Import suggestions
import Link from "next/link";

interface CompletionSuccessProps {
    tool: ToolDef;
    result: any;
    onReset: () => void;
}

export default function CompletionSuccess({ tool, result, onReset }: CompletionSuccessProps) {
    const [email, setEmail] = useState("");
    const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    // Trigger Confetti on Mount (Peak-End Rule: Positive End)
    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']
        });
    }, []);

    const isCompression = tool.id === "compress-pdf" || tool.id === "image-compressor";
    const savedBytes = result.original_size && result.compressed_size ? result.original_size - result.compressed_size : 0;
    const savedMB = (savedBytes / 1024 / 1024).toFixed(2);
    const reductionPercent = result.reduction_percent || 0;

    return (
        <div className="bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-slate-900 p-8 sm:p-12 rounded-3xl border border-green-100 dark:border-green-800/50 text-center animate-in fade-in zoom-in-95 duration-500">

            {/* Success Icon with Pulse */}
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-24 h-24 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
            </div>

            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                Processing Complete!
            </h3>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto">
                Your file is ready. {tool.id.includes('compress') ? "We've optimized it for you." : "Download it below."}
            </p>

            {/* PEAK MOMENT: Visualization of Benefit (Loss Aversion / Gain) */}
            {isCompression && result.original_size && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-10 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 max-w-lg mx-auto transform hover:scale-[1.02] transition-transform duration-300">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Optimization Result</h4>

                    <div className="flex items-center justify-center gap-8 mb-6">
                        {/* Before */}
                        <div className="text-center opacity-60 grayscale blur-[0.5px]">
                            <div className="text-xs font-semibold mb-1">Original</div>
                            <div className="w-16 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                <span className="font-bold text-slate-400">PDF</span>
                            </div>
                            <div className="font-mono text-sm">{(result.original_size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>

                        {/* Arrow */}
                        <div className="text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8 animate-pulse">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>

                        {/* After (The Peak) */}
                        <div className="text-center transform scale-110">
                            <div className="text-xs font-bold text-green-600 mb-1">Optimized</div>
                            <div className="w-16 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/20 text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="font-mono font-bold text-green-600 dark:text-green-400 text-lg">
                                {((result.compressed_size || 0) / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 flex items-center justify-center gap-2 text-green-800 dark:text-green-200 font-bold border border-green-100 dark:border-green-800">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        You saved {savedMB} MB ({reductionPercent}%)!
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                <a
                    href={getDownloadUrl(result.download_url)}
                    download={result.filename}
                    className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:-translate-y-1 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg ${tool.theme.gradient}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download File
                </a>
                <button
                    onClick={() => {
                        // Reset logic
                        onReset();
                    }}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                >
                    Start Over
                </button>
            </div>

            {/* Email Section (Secondary Action) */}
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 max-w-sm mx-auto">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Send download link to email</p>
                {emailStatus === "sent" ? (
                    <div className="text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sent! Check your inbox.
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-900"
                        />
                        <button
                            onClick={async () => {
                                if (!email) return;
                                setEmailStatus("sending");
                                try {
                                    await sendEmail(email, getDownloadUrl(result.download_url), result.filename);
                                    setEmailStatus("sent");
                                } catch (e) {
                                    console.error(e);
                                    setEmailStatus("error");
                                }
                            }}
                            disabled={emailStatus === "sending" || !email}
                            className="px-4 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all"
                        >
                            {emailStatus === "sending" ? "..." : "Send"}
                        </button>
                    </div>
                )}
            </div>

            {/* Smart Suggestions (Habit Formation: Next Action) */}
            <div className="mt-12">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">What would you like to do next?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                    {getSuggestedTools(tool.id).slice(0, 3).map(suggestedId => {
                        const suggestedTool = TOOLS.find(t => t.id === suggestedId);
                        if (!suggestedTool) return null;

                        return (
                            <Link
                                key={suggestedId}
                                href={`/tools/${suggestedTool.id}`}
                                className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${suggestedTool.theme.bgLight} flex items-center justify-center ${suggestedTool.theme.text} group-hover:scale-110 transition-transform`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={suggestedTool.iconPath} />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                            {suggestedTool.name}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                            Suggested for you
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
