"use client";

import React from 'react';

interface GhostModeExplainerModalProps {
    onClose: () => void;
}

export default function GhostModeExplainerModal({ onClose }: GhostModeExplainerModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Green Gradient */}
                <div className="shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 p-5 sm:p-8 pb-5 sm:pb-6 border-b border-green-100 dark:border-green-900/30 flex-none">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">Ghost Mode Active</h3>
                                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium sm:mt-1">Your privacy is guaranteed by code.</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 p-2 -mr-1 sm:-mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                            FileVora uses <strong className="text-slate-900 dark:text-white">WebAssembly</strong> technology to process your files directly inside your browser. This means your data never leaves your device.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                On-Device Processing
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                The heavy lifting happens on your CPU, not our servers. This makes it faster and more secure.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.175a9 9 0 10-1.927 1.912zm-3.827-6.825a3 3 0 11-4.041-4.15 3 3 0 014.041 4.15zm6.825 6.825a3 3 0 11-4.15-4.041 3 3 0 014.15 4.041z" />
                                </svg>
                                Zero Uploads
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Since files aren't uploaded, there is no waiting time for uploads or downloads.
                            </p>
                        </div>
                    </div>

                    {/* Technical Details - Collapsible or small text */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">Technical Verification</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            You can verify this by opening your browser's <strong>Network Tab</strong> (F12). You will see zero file transfer requests when processing documents.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:shadow-lg hover:scale-[1.01] transition-all"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
