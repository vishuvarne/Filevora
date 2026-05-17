"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFileHistory, HistoryItem } from "@/hooks/useFileHistory";
import { TOOLS } from "@/config/tools";
import { isFileCompatibleWithTool, navigateToToolWithFile } from "@/lib/toolContinuation";
import { useSharedRouter as useRouter } from "@/lib/navigation";
import { useDesignStyle } from "@/context/ThemeStyleContext";
import { fileDB } from "@/lib/db";

const TTL = 60 * 60 * 1000;
function tr(ts: number) {
    const ms = Math.max(0, ts + TTL - Date.now()), pct = Math.min(100, (ms / TTL) * 100);
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return { ms, pct, label: ms <= 0 ? "Expired" : m > 0 ? `${m}m` : `${s}s` };
}
function fIcon(n: string) {
    const e = n.split(".").pop()?.toLowerCase() || "";
    if (e === "pdf") return "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";
    if (["jpg","jpeg","png","webp","gif","svg","avif","heic"].includes(e)) return "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 21h10.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12.75A2.25 2.25 0 006.75 21z";
    if (["mp3","wav","m4a","ogg","flac"].includes(e)) return "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z";
    return "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";
}
const VI = "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z";

function Ring({ pct, size = 20 }: { pct: number; size?: number }) {
    const r = (size - 4) / 2, c = 2 * Math.PI * r;
    const color = pct > 50 ? "#22c55e" : pct > 20 ? "#eab308" : "#ef4444";
    return (<svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={2} className="text-border opacity-20" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>);
}

function ToolPicker({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
    const router = useRouter();
    const { isNeu } = useDesignStyle();
    const ext = item.fileName.split(".").pop()?.toLowerCase() || "";
    const mime: Record<string,string> = { pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif",mp3:"audio/mpeg",mp4:"video/mp4",wav:"audio/wav",svg:"image/svg+xml",zip:"application/zip" };
    const mock = new File([""], item.fileName, { type: mime[ext] || "application/octet-stream" });
    const compat = TOOLS.filter(t => isFileCompatibleWithTool(mock, t) && t.id !== item.toolId).slice(0, 8);

    const handlePick = async (toolId: string) => {
        try {
            // Fetch blob directly from IDB (blob URLs may be revoked)
            const record = await fileDB.getFile(item.id);
            if (!record) { console.error("File not found in IDB"); return; }
            const file = new File([record.blob], item.fileName, { type: record.type });
            onClose();
            navigateToToolWithFile(router, toolId, file, item.toolId);
        } catch (e) { console.error("Continue failed:", e); }
    };

    return createPortal(
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div onClick={e => e.stopPropagation()}
                className={`relative z-10 w-full sm:w-[360px] sm:max-h-[60vh] animate-in slide-in-from-bottom-4 duration-300
                    ${isNeu
                        ? "rounded-t-[var(--nb-r-lg)] sm:rounded-[var(--nb-r-lg)] border-[3px] border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900"
                        : "rounded-t-2xl sm:rounded-2xl border border-border bg-white dark:bg-slate-950 shadow-2xl"
                    }`}
                style={isNeu ? { boxShadow: "var(--nb-shadow-lg)" } : undefined}
            >
                {/* Handle bar mobile */}
                <div className="sm:hidden flex justify-center pt-2 pb-1"><div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" /></div>
                <div className={`px-4 py-3 ${isNeu ? "border-b-[3px] border-slate-900 dark:border-slate-100" : "border-b border-border"}`}>
                    <p className={`text-sm ${isNeu ? "font-black uppercase tracking-wide" : "font-bold"} text-foreground`}>Continue with another tool</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.fileName}</p>
                </div>
                <div className="max-h-[50vh] overflow-y-auto p-2">
                    {compat.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-6 text-center font-medium">No compatible tools for this file type</p>
                    ) : compat.map(tool => (
                        <button key={tool.id} onClick={() => handlePick(tool.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-150
                                ${isNeu ? "rounded-[var(--nb-r-md)] hover:bg-yellow-100 dark:hover:bg-slate-800 hover:-translate-y-[1px]" : "rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                            <div className={`w-9 h-9 shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}
                                ${isNeu ? "rounded-[var(--nb-r-sm)] border-2 border-slate-900 dark:border-slate-100" : "rounded-lg"}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className={`text-sm text-foreground ${isNeu ? "font-bold" : "font-medium"}`}>{tool.name}</span>
                                <p className="text-[10px] text-muted-foreground truncate">{tool.description?.slice(0, 50)}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-2 border-t border-border/50">
                    <button onClick={onClose}
                        className={`w-full py-2.5 text-sm font-bold text-muted-foreground transition-colors
                            ${isNeu ? "rounded-[var(--nb-r-md)] hover:bg-slate-200 dark:hover:bg-slate-800" : "rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function FileVault() {
    const { history, removeFromHistory, clearHistory } = useFileHistory();
    const { isNeu } = useDesignStyle();
    const [open, setOpen] = useState(false);
    const [tick, setTick] = useState(0);
    const [pickerItem, setPickerItem] = useState<HistoryItem | null>(null);
    const [pulse, setPulse] = useState(false);
    const [processBarVisible, setProcessBarVisible] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const prev = useRef(history.length);

    useEffect(() => { const iv = setInterval(() => setTick(k => k + 1), 10000); return () => clearInterval(iv); }, []);
    useEffect(() => {
        if (history.length > prev.current) { setPulse(true); setTimeout(() => setPulse(false), 2000); }
        prev.current = history.length;
    }, [history.length]);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) { setOpen(false); } };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, [open]);

    // Watch for process bar visibility signal from ToolInterface
    useEffect(() => {
        const check = () => setProcessBarVisible(document.body.hasAttribute('data-process-bar'));
        check(); // initial check
        const observer = new MutationObserver(check);
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-process-bar'] });
        return () => observer.disconnect();
    }, []);

    const active = history.filter(i => tr(i.timestamp).ms > 0);

    // FAB bottom position: shift up when process bar is visible at the bottom
    const fabBottom = processBarVisible ? 'bottom-[7rem]' : 'bottom-6';

    return (
        <>
            {/* FAB */}
            <button onClick={() => setOpen(!open)} aria-label="File Vault"
                className={`fixed ${fabBottom} right-5 z-[300] flex items-center justify-center group transition-all duration-300
                    ${isNeu
                        ? `w-[56px] h-[56px] rounded-[var(--nb-r-md)] border-[3px] border-slate-900 dark:border-slate-100 hover:-translate-y-1 active:translate-y-0 active:shadow-none ${pulse ? "animate-bounce" : ""}`
                        : `w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:scale-105 active:scale-95 ${pulse ? "animate-bounce" : ""}`
                    }`}
                style={isNeu ? { background: "var(--nb-yellow)", boxShadow: "var(--nb-shadow-md)", color: "var(--nb-text)" } : undefined}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isNeu ? 2.5 : 1.8} stroke="currentColor"
                    className={`${isNeu ? "w-6 h-6" : "w-6 h-6"} group-hover:scale-110 transition-transform duration-200`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={VI} />
                </svg>
                {active.length > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 text-[10px] min-w-[20px] h-5 px-1 flex items-center justify-center font-black
                        ${isNeu ? "rounded-[var(--nb-r-sm)] border-[2px] border-slate-900 bg-red-400 text-slate-900" : "rounded-full bg-red-500 text-white ring-2 ring-white dark:ring-slate-950"}`}>
                        {active.length}
                    </span>
                )}
            </button>

            {/* Backdrop */}
            {open && <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[299] animate-in fade-in duration-200" onClick={() => setOpen(false)} />}

            {/* Panel — full bottom sheet on mobile, side drawer on desktop */}
            <div ref={panelRef}
                className={`fixed z-[301] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                    inset-x-0 bottom-0 sm:inset-x-auto ${processBarVisible ? 'sm:bottom-[9rem]' : 'sm:bottom-[5.5rem]'} sm:right-5
                    w-full sm:w-[380px] flex flex-col overflow-hidden
                    ${isNeu
                        ? `rounded-t-[var(--nb-r-lg)] sm:rounded-[var(--nb-r-lg)] border-t-[3px] sm:border-[3px] border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900`
                        : `rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-white dark:bg-slate-950 shadow-2xl`
                    }
                    ${open ? "translate-y-0 opacity-100 visible" : "translate-y-full sm:translate-y-8 opacity-0 invisible pointer-events-none"}
                `}
                style={{ maxHeight: "min(75vh, 560px)", ...(isNeu ? { boxShadow: "var(--nb-shadow-lg)" } : {}) }}
            >
                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-2"><div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" /></div>

                {/* Header */}
                <div className={`shrink-0 flex items-center justify-between px-4 py-3
                    ${isNeu ? "border-b-[3px] border-slate-900 dark:border-slate-100" : "border-b border-border"}`}
                    style={isNeu ? { background: "var(--nb-yellow)" } : undefined}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 flex items-center justify-center shrink-0
                            ${isNeu ? "rounded-[var(--nb-r-sm)] border-[2px] border-slate-900 dark:border-slate-100" : "rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm"}`}
                            style={isNeu ? { background: "var(--nb-green)" } : undefined}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isNeu ? 2.5 : 2} stroke={isNeu ? "var(--nb-text)" : "white"} className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d={VI} />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-sm text-foreground ${isNeu ? "font-black uppercase tracking-wide" : "font-bold"}`}>File Vault</h3>
                            <p className={`text-[10px] text-muted-foreground ${isNeu ? "font-bold" : ""}`}>{active.length} file{active.length !== 1 ? "s" : ""} • 60 min retention</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {active.length > 0 && (
                            <button onClick={() => { if (confirm("Clear all files?")) clearHistory(); }}
                                className={`text-[10px] font-bold px-2 py-1 text-red-500 transition-colors ${isNeu ? "rounded-[var(--nb-r-sm)] hover:bg-red-200" : "rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"}`}>
                                Clear All
                            </button>
                        )}
                        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isNeu ? 3 : 2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
                    {active.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 px-6">
                            <div className={`w-14 h-14 flex items-center justify-center mb-3 ${isNeu ? "rounded-[var(--nb-r-md)] border-2 border-slate-300 dark:border-slate-600" : "rounded-2xl bg-secondary/50"}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7 text-muted-foreground/30">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={VI} />
                                </svg>
                            </div>
                            <p className={`text-sm text-muted-foreground ${isNeu ? "font-black uppercase" : "font-medium"}`}>Vault is empty</p>
                            <p className="text-xs text-muted-foreground/50 mt-1">Processed files appear here</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-0.5">
                            {active.map(item => <FileCard key={item.id} item={item} isNeu={isNeu} onContinue={() => { setPickerItem(item); }} onDelete={() => removeFromHistory(item.id)} />)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {active.length > 0 && (
                    <div className={`shrink-0 px-4 py-2 ${isNeu ? "border-t-[3px] border-slate-900 dark:border-slate-100 bg-secondary/30" : "border-t border-border bg-secondary/10"}`}>
                        <p className={`text-[10px] text-muted-foreground text-center ${isNeu ? "font-bold" : ""}`}>Files auto-delete after 60 min • Stored locally</p>
                    </div>
                )}
            </div>

            {/* Tool picker modal */}
            {pickerItem && <ToolPicker item={pickerItem} onClose={() => setPickerItem(null)} />}
        </>
    );
}

function FileCard({ item, isNeu, onContinue, onDelete }: {
    item: HistoryItem; isNeu: boolean; onContinue: () => void; onDelete: () => void;
}) {
    const t = tr(item.timestamp);
    const tool = TOOLS.find(td => td.id === item.toolId);

    /** Download via IDB for reliability — blob URLs can be revoked */
    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const record = await fileDB.getFile(item.id);
            if (!record) { console.error("File not found in IDB for download"); return; }
            const url = URL.createObjectURL(record.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = item.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
            // Fallback to the blob URL we have in state
            const a = document.createElement("a");
            a.href = item.downloadUrl;
            a.download = item.fileName;
            a.click();
        }
    };

    return (
        <div className={`group flex items-center gap-3 p-3 transition-all duration-200 ease-out
            ${isNeu
                ? "rounded-[var(--nb-r-md)] border-[2px] border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-100 hover:bg-yellow-50/60 dark:hover:bg-slate-800"
                : "rounded-xl border border-transparent hover:border-border/50 hover:bg-slate-50 dark:hover:bg-slate-900/50"
            }`}
        >
            <div className="relative shrink-0">
                <div className={`w-10 h-10 flex items-center justify-center
                    ${isNeu ? "rounded-[var(--nb-r-sm)] border-[2px] border-slate-900 dark:border-slate-100" : "rounded-lg bg-primary/10"}`}
                    style={isNeu ? { background: "var(--nb-blue)" } : undefined}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isNeu ? 2.5 : 1.5} stroke="currentColor"
                        className={`w-5 h-5 ${isNeu ? "text-slate-900 dark:text-slate-100" : "text-primary"}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={fIcon(item.fileName)} />
                    </svg>
                </div>
                <div className="absolute -bottom-1 -right-1"><Ring pct={t.pct} /></div>
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-[13px] text-foreground truncate ${isNeu ? "font-black" : "font-semibold"}`}>{item.fileName}</p>
                <div className={`flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 ${isNeu ? "font-bold" : ""}`}>
                    <span>{item.size || "—"}</span><span>•</span>
                    <span className={t.pct < 20 ? "text-red-500 font-black" : ""}>{t.label}</span>
                    {tool && <><span>•</span><span className="truncate max-w-[80px]">{tool.name}</span></>}
                </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={handleDownload} title="Download"
                    className={`p-2 transition-all duration-150 ${isNeu ? "rounded-[var(--nb-r-sm)] hover:bg-blue-200 text-blue-600" : "rounded-lg hover:bg-primary/10 text-primary hover:scale-110"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
                <button onClick={onContinue} title="Use in another tool"
                    className={`p-2 transition-all duration-150 ${isNeu ? "rounded-[var(--nb-r-sm)] hover:bg-green-200 text-green-700" : "rounded-lg hover:bg-green-100 dark:hover:bg-green-500/10 text-green-600 dark:text-green-400 hover:scale-110"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.69z" />
                    </svg>
                </button>
                <button onClick={onDelete} title="Delete"
                    className={`p-2 transition-all duration-150 ${isNeu ? "rounded-[var(--nb-r-sm)] hover:bg-red-200 text-red-500" : "rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-red-500 hover:scale-110"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

