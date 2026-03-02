/**
 * Capability Disclosure Component (Compact Version)
 * 
 * Shows users what capabilities will be granted before processing
 */

import React from 'react';
import { CapabilityBundle, CapabilityType } from '@/lib/cbee/capability-types';

interface CapabilityDisclosureProps {
    bundle: CapabilityBundle;
    onAccept: () => void;
    onReject: () => void;
}

export default function CapabilityDisclosure({
    bundle,
    onAccept,
    onReject,
}: CapabilityDisclosureProps) {
    // Determine if network access is requested
    const hasNetworkAccess = bundle.tokens.some(
        token => token.capability === CapabilityType.NETWORK_FETCH
    );

    // Group capabilities by type
    const capabilityGroups = {
        fileRead: bundle.tokens.filter(t => t.capability === CapabilityType.FILE_READ),
        fileWrite: bundle.tokens.filter(t => t.capability === CapabilityType.FILE_WRITE),
        cpu: bundle.tokens.filter(t => t.capability === CapabilityType.CPU_EXECUTE),
        memory: bundle.tokens.filter(t => t.capability === CapabilityType.MEMORY_ALLOCATE),
        network: bundle.tokens.filter(t => t.capability === CapabilityType.NETWORK_FETCH),
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-[360px] w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Compact Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-100">Privacy Notice</h2>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full uppercase tracking-wider">Secure</span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {capabilityGroups.fileRead.length > 0 && (
                            <CompactCapabilityItem icon="👁️" text={`Read ${capabilityGroups.fileRead.length} file(s)`} />
                        )}
                        {capabilityGroups.fileWrite.length > 0 && (
                            <CompactCapabilityItem icon="💾" text="Save converted output" />
                        )}
                        {capabilityGroups.cpu.length > 0 && (
                            <CompactCapabilityItem icon="⚡" text="Use device CPU" />
                        )}
                        {capabilityGroups.memory.length > 0 && (
                            <CompactCapabilityItem icon="🧠" text={`Use ${formatBytes(capabilityGroups.memory[0].constraints.max_bytes || 0)} RAM`} />
                        )}
                        <CompactCapabilityItem
                            icon="🌐"
                            text="Network access"
                            disabled={!hasNetworkAccess}
                        />
                    </div>

                    {/* Compact Guarantee */}
                    <div className="p-3 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50 rounded-xl flex items-center gap-3">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-[11px] font-medium text-green-800 dark:text-green-300 leading-tight">
                            {hasNetworkAccess
                                ? "Data sent to server for processing."
                                : "Zero-trust: Files stay on your device."
                            }
                        </p>
                    </div>
                </div>

                {/* Compact Footer */}
                <div className="p-4 flex gap-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onReject}
                        className="flex-1 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                        Proceed Securely
                    </button>
                </div>
            </div>
        </div>
    );
}

function CompactCapabilityItem({ icon, text, disabled }: { icon: string, text: string, disabled?: boolean }) {
    return (
        <div className={`flex items-center gap-3 py-1.5 ${disabled ? 'opacity-30 grayscale' : ''}`}>
            <span className="text-base grayscale">{icon}</span>
            <span className={`text-[13px] font-medium ${disabled ? 'line-through' : 'text-slate-700 dark:text-slate-200'}`}>{text}</span>
            {!disabled && <span className="ml-auto text-green-500 font-bold text-[10px]">GRANTED</span>}
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}
