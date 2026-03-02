"use client";

import React from 'react';

import CostPreview, { PricingTier } from './CostPreview';
import { useState } from 'react';

interface ConsentModalProps {
    fileName: string;
    fileSize: string;
    fileSizeMb: number;
    onConfirm: (tier: PricingTier) => void;
    onCancel: () => void;
}

export default function ConsentModal({ fileName, fileSize, fileSizeMb, onConfirm, onCancel }: ConsentModalProps) {
    const [selectedTier, setSelectedTier] = useState<PricingTier>('standard');

    const handleConfirm = () => {
        onConfirm(selectedTier);
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onCancel}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Amber Warning/Caution Theme or Blue/Purple for "Cloud" - Choosing Blue/Purple for "Remote Mode" */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 p-8 pb-6 border-b border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
                                    <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Remote Processing Required</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                                        Ephemeral
                                    </span>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mt-1">
                                    {fileName} ({fileSize})
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                            This specific file format is too complex to be converted directly in your browser.
                            To proceed, we need to create a <strong className="text-slate-900 dark:text-white">secure, temporary worker</strong> just for this job.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                Ephemeral & Private
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Your file is processed in RAM (memory) only. It is <strong>never written to a hard drive</strong>.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                            <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Auto-Destruction
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                The worker is completely destroyed the moment your file finishes processing.
                            </p>
                        </div>
                    </div>

                    {/* Cost Estimation Section */}
                    <CostPreview
                        fileSizeMb={fileSizeMb}
                        fileType={fileName} // Passing filename closely acts as type string for our simple logic
                        onTierChange={setSelectedTier}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center gap-2"
                        >
                            Start Secure Job
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
