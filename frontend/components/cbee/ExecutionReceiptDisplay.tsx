/**
 * Execution Receipt Display Component
 * 
 * Shows audit receipt after file processing
 */

import React from 'react';
import { ExecutionReceipt } from '@/lib/cbee/capability-types';

interface ExecutionReceiptDisplayProps {
    receipt: ExecutionReceipt;
    onClose: () => void;
}

export default function ExecutionReceiptDisplay({
    receipt,
    onClose,
}: ExecutionReceiptDisplayProps) {
    const duration = (receipt.duration_ms / 1000).toFixed(2);
    const hasViolations = receipt.violations.length > 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className={`p-6 ${hasViolations ? 'bg-red-500' : 'bg-green-500'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            {hasViolations ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Execution Receipt</h2>
                            <p className="text-white/80 text-sm">
                                {hasViolations ? 'Violations Detected' : 'Completed Successfully'} • {duration}s
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Execution Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                            Execution Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Tool:</span>
                                <span className="ml-2 font-mono text-slate-900 dark:text-white">{receipt.tool_id}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                                <span className={`ml-2 font-semibold ${hasViolations ? 'text-red-600' : 'text-green-600'}`}>
                                    {receipt.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Provenance Record (Deterministic Pipelines) */}
                    {receipt.provenance && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
                                Provenance Record (Audit Gold)
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Input Hash', value: receipt.provenance.input_hash, icon: '📥' },
                                    { label: 'Plan Hash', value: receipt.provenance.plan_hash, icon: '📜' },
                                    { label: 'Runtime Hash', value: receipt.provenance.runtime_hash, icon: '🏗️' },
                                    { label: 'Output Hash', value: receipt.provenance.output_hash, icon: '📤' }
                                ].map((item, i) => (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between text-[11px] mb-1">
                                            <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                                <span>{item.icon}</span>
                                                {item.label}
                                            </span>
                                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full">
                                                Verified
                                            </span>
                                        </div>
                                        <div className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-300 break-all select-all group-hover:border-blue-400/50 transition-colors">
                                            {item.value || 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Capabilities Granted */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                            Capabilities Granted
                        </h3>
                        <div className="space-y-2">
                            {receipt.capabilities_granted.map((cap, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="text-blue-500">✓</span>
                                    <span className="text-slate-700 dark:text-slate-300">{cap.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Capabilities Used */}
                    {receipt.capabilities_used.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                                Capabilities Used
                            </h3>
                            <div className="space-y-2">
                                {receipt.capabilities_used.map((cap, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="text-green-500">●</span>
                                        <span className="text-slate-700 dark:text-slate-300">{cap.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hidden Actions (Should Always Be Empty!) */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                            Hidden Actions
                        </h3>
                        {receipt.hidden_actions.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                    No hidden actions detected
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {receipt.hidden_actions.map((action, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <span className="text-red-500">⚠</span>
                                        <span className="text-sm text-red-700 dark:text-red-300">{action}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Violations */}
                    {hasViolations && (
                        <div>
                            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 uppercase tracking-wide mb-3">
                                Violations
                            </h3>
                            <div className="space-y-2">
                                {receipt.violations.map((violation, idx) => (
                                    <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <div className="text-sm font-semibold text-red-900 dark:text-red-100">
                                            {violation.type}
                                        </div>
                                        <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                                            {violation.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
