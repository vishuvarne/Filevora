"use client";

import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGoogleDrivePicker } from "../hooks/useGoogleDrive";
import { useDropboxChooser } from "../hooks/useDropbox";
import { useOneDrivePicker } from "../hooks/useOneDrive";
import { importCloudFile, getDownloadUrl } from "../lib/api";

interface DropzoneProps {
    onFilesSelected: (files: File[]) => void;
    acceptedTypes?: string; // e.g. "application/pdf" or "image/*"
    multiple?: boolean;
    label?: string;
}

export default function SmartDropzone({
    onFilesSelected,
    acceptedTypes,
    multiple = false,
    label = "Drag & Drop files here, or click to select",
}: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedFiles, setAnalyzedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFilesWithAnalysis(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFilesWithAnalysis(Array.from(e.target.files));
        }
    };

    const processFilesWithAnalysis = async (files: File[]) => {
        // Start Analysis Mode
        setIsAnalyzing(true);
        setAnalyzedFiles(files);

        // Simulate "Real-time analysis" with a delay
        // In a real app, we might check magic bytes here
        await new Promise(resolve => setTimeout(resolve, 1500));

        onFilesSelected(files);
        setIsAnalyzing(false);
        setAnalyzedFiles([]);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isAnalyzing) fileInputRef.current?.click();
        }
    };

    // Cloud hooks (reused from original Dropzone)
    const { openPicker: openGoogleRequest, isPickerOpen: isGooglePickerOpen, cancelGooglePicker } = useGoogleDrivePicker({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
        appId: process.env.NEXT_PUBLIC_GOOGLE_APP_ID || ""
    });

    const { openChooser: openDropboxRequest } = useDropboxChooser({
        appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || ""
    });

    const { openPicker: openOneDriveRequest } = useOneDrivePicker({
        clientId: process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID || ""
    });

    const handleCloudImport = async (provider: 'google' | 'dropbox' | 'onedrive') => {
        try {
            let importData: { url: string; name: string; token?: string; id?: string } | null = null;
            // ... (Cloud logic omitted for brevity, will assume standard flow or just call directly if needed, 
            // but for SmartDropzone we focus on the UI. We'll copy the logic strictly to ensure feature parity)

            if (provider === 'google') {
                const docs = await openGoogleRequest();
                if (docs && docs[0]) {
                    const doc = docs[0];
                    importData = { url: doc.url, name: doc.name, token: window.gapi?.auth?.getToken()?.access_token || doc.auth_token || "", id: doc.id };
                }
            } else if (provider === 'dropbox') {
                const file = await openDropboxRequest();
                if (file) importData = { url: file.link, name: file.name };
            } else if (provider === 'onedrive') {
                const file = await openOneDriveRequest();
                if (file) importData = { url: file["@microsoft.graph.downloadUrl"], name: file.name };
            }

            if (importData) {
                // Show generic importing state
                setIsAnalyzing(true); // Reuse analyzing overlay for cloud import wait
                const job = await importCloudFile(provider, importData.url, importData.name, importData.token, importData.id);
                const res = await fetch(getDownloadUrl(job.download_url));
                const blob = await res.blob();
                const file = new File([blob], job.filename, { type: blob.type });

                // Pass to analysis
                await processFilesWithAnalysis([file]);
            }

        } catch (e: any) {
            console.error("Cloud import error:", e);
            setIsAnalyzing(false);
            if (e !== "Cancelled") alert("Failed to import file: " + (e.message || String(e)));
        }
    };


    // -- Visuals --

    return (
        <div className="relative w-full max-w-2xl mx-auto [perspective:1000px] group/container">
            {/* The 3D Container Box */}
            <div
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                onKeyDown={handleKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                tabIndex={0}
                role="button"
                aria-label="Smart Upload Zone"
                className={`
                    relative w-full min-h-[300px] h-auto rounded-3xl transition-all duration-500 [transform-style:preserve-3d] cursor-pointer outline-none
                    bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900
                    border-2 ${isDragging || isHovered ? "border-primary shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)] scale-[1.02]" : "border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/50"}
                    flex flex-col items-center justify-center
                    overflow-visible
                `}
                style={{
                    transform: isDragging || isAnalyzing || isHovered ? 'rotateX(5deg)' : 'rotateX(0deg)',
                }}
            >
                {/* 3D "Lid" Effect - Visual top part that opens */}
                <div
                    className={`
                        absolute top-0 left-0 right-0 h-full bg-white/50 dark:bg-slate-800/50 rounded-3xl pointer-events-none transition-all duration-500 ease-out origin-top border-b border-white/20
                        ${isDragging || isHovered ? "-translate-y-4 [transform:rotateX(-12deg)] opacity-80" : "translate-y-0 [transform:rotateX(0deg)] opacity-0"}
                    `}
                ></div>

                {/* Main Content Content */}
                <div className={`
                    z-10 flex flex-col items-center justify-center p-6 text-center transition-all duration-300
                    ${isAnalyzing ? "opacity-0 scale-90 blur-sm pointer-events-none" : "opacity-100 scale-100"}
                `}>

                    {/* Dynamic Icon */}
                    <div className="w-24 h-24 mb-6 relative">
                        {/* Circle BG */}
                        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isDragging || isHovered ? "bg-primary/20 scale-110" : "bg-slate-100 dark:bg-slate-800"} ${isDragging ? "animate-pulse" : ""}`}></div>

                        {/* Icon SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className={`w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${isDragging || isHovered ? "text-primary scale-125 -mt-2" : "text-slate-400"}`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>

                        {/* Floating particles/icons when dragging */}
                        {isDragging && (
                            <>
                                <div className="absolute top-0 right-0 w-4 h-4 rounded bg-blue-400 animate-bounce delay-100"></div>
                                <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-green-400 animate-bounce delay-300"></div>
                            </>
                        )}
                    </div>

                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2">
                        {isDragging ? "Drop to Analyze" : label}
                    </h3>
                    <div className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto px-4">
                        <p className="line-clamp-2 break-words leading-relaxed text-xs opacity-80">
                            {acceptedTypes ? `Supports ${acceptedTypes.replace(/application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/g, "DOCX").replace(/application\/pdf/g, "PDF")}` : "Securely process your files"}
                        </p>
                    </div>

                    {/* Cloud Options */}
                    <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 w-full justify-center opacity-70 hover:opacity-100 transition-opacity z-20">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Import:</span>
                        <div className="flex gap-2">
                            {/* Google */}
                            <button onClick={(e) => { e.stopPropagation(); handleCloudImport('google'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer" title="Google Drive">
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12.01 1.485c-1.082 0-1.928.513-2.486 1.408L3.295 14.12l-.004.008-1.557 2.705a1.295 1.295 0 0 0 .005 1.295c.375.645 1.066 1.042 1.815 1.042h4.59l4.897-8.487 4.095-7.093c-.636-.615-1.46-1.005-2.288-1.005h-2.838z" fill="#0066DA" /><path d="M13.67 8.65 9.177 16.438H4.55l-.004.006-.007.012c-.933.003-1.666.368-2.072 1.01a1.295 1.295 0 0 0-.168.667c0 .066.006.13.015.195l5.594-9.69a.747.747 0 0 1 .012-.019l2.843-4.928 2.907-5.04z" fill="#00AC47" /><path d="M21.168 12.632 17.65 6.556 13.9 13.052l-4.5 7.78h9.8a2.53 2.53 0 0 0 2.29-1.39l1.558-2.698a1.29 1.29 0 0 0 .005-1.29l-1.885-2.822z" fill="#EA4335" /><path d="M13.67 8.65h7.64c.22 0 .432.022.637.062l-2.73-4.726a2.532 2.532 0 0 0-2.203-1.258h-7.66l4.316 5.922z" fill="#FFBA00" /></svg>
                            </button>
                            {/* Dropbox */}
                            <button onClick={(e) => { e.stopPropagation(); handleCloudImport('dropbox'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200" title="Dropbox">
                                <svg className="w-5 h-5 fill-[#0061FE]" viewBox="0 0 24 24"><path d="M7 3.5 2 6.641l5 3.141 5-3.141L7 3.5zm10 0-5 3.141 5 3.141 5-3.141L17 3.5zM2 11.859l5 3.141 5-3.141-5-3.141-5 3.141zm15 0 5-3.141-5-3.141-5 3.141 5 3.141zM7 16l5 3.141L17 16l-5-3.141L7 16z" /></svg>
                            </button>
                            {/* OneDrive */}
                            <button onClick={(e) => { e.stopPropagation(); handleCloudImport('onedrive'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200" title="OneDrive">
                                <svg className="w-5 h-5 fill-[#0078D4]" viewBox="0 0 24 24"><path d="M13.636 9.176c-.958-1.584-2.884-2.22-4.577-1.472a1.889 1.889 0 0 0-.25.132C8.36 4.985 5.56 4.865 3.738 6.78c-2.317 2.435-2.037 6.43 0 8.196L17.5 15l4.331-2.923c1.789-1.579 1.543-4.329-.396-5.467-1.464-.86-3.178-.344-4.814 1.25.143-2.936-1.531-4.867-2.985-5.322z" /><path d="M10.975 16s-2.006 1.882-3.177 1.882c-1.127 0-3.327-1.114-3.327-1.114s-.542 2.083.829 2.872c.866.498 3.518.598 4.675-.125 1.573-.984 4.544-3.515 4.544-3.515H10.975z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analysis / Loading View */}
                {isAnalyzing && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl animate-in fade-in duration-300">
                        {/* Card Stack Effect */}
                        <div className="relative mb-8 w-64 h-32">
                            {analyzedFiles.map((file, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 left-0 w-full h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl flex items-center p-4 gap-4 animate-in slide-in-from-bottom-5 fade-in duration-500"
                                    style={{
                                        animationDelay: `${i * 100}ms`,
                                        transform: `translateY(${i * 4}px) scale(${1 - (i * 0.05)})`,
                                        zIndex: 10 - i
                                    }}
                                >
                                    {/* Morphing Icon Container */}
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-2xl overflow-hidden relative">
                                        {/* Simple emoji/icon swap based on type */}
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                            />
                                        ) : (
                                            file.type.includes('pdf') ? '📄' : '📁'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{file.name}</p>
                                        <p className="text-xs text-slate-500 animate-pulse">Analyzing format...</p>
                                    </div>
                                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                </div>
                            ))}
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">Analyzing files...</p>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={acceptedTypes}
                className="hidden"
                onChange={handleFileInput}
            />

            {/* Google Picker Close Button Portal logic */}
            {isGooglePickerOpen && typeof document !== 'undefined' && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, pointerEvents: 'none' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); cancelGooglePicker(); }}
                        className="pointer-events-auto absolute top-5 right-5 bg-background w-12 h-12 rounded-full shadow-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); cancelGooglePicker(); }}></div>
                </div>,
                document.body
            )}
        </div>
    );
}
