"use client";

import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from "react";
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

export default function Dropzone({
    onFilesSelected,
    acceptedTypes,
    multiple = false,
    label = "Drag & Drop files here, or click to select",
}: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (files: File[]) => {
        onFilesSelected(files);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

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

    const [isImporting, setIsImporting] = useState(false);

    const handleCloudImport = async (provider: 'google' | 'dropbox' | 'onedrive') => {
        try {
            let importData: { url: string; name: string; token?: string; id?: string } | null = null;

            if (provider === 'google') {
                const docs = await openGoogleRequest();
                if (docs && docs[0]) {
                    const doc = docs[0];
                    // google drive file handling...
                    importData = {
                        url: doc.url,
                        name: doc.name,
                        token: window.gapi?.auth?.getToken()?.access_token || doc.auth_token || "",
                        id: doc.id
                    };
                }
            } else if (provider === 'dropbox') {
                const file = await openDropboxRequest();
                if (file) {
                    importData = { url: file.link, name: file.name };
                }
            } else if (provider === 'onedrive') {
                const file = await openOneDriveRequest();
                if (file) {
                    importData = { url: file["@microsoft.graph.downloadUrl"], name: file.name };
                }
            }

            if (importData) {
                setIsImporting(true);
                const job = await importCloudFile(
                    provider,
                    importData.url,
                    importData.name,
                    importData.token,
                    importData.id
                );
                const res = await fetch(getDownloadUrl(job.download_url));
                const blob = await res.blob();
                const file = new File([blob], job.filename, { type: blob.type });

                onFilesSelected([file]);
            }

        } catch (e: unknown) {
            console.error("Cloud import error:", e);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((e as any) !== "Cancelled") {
                const msg = (e instanceof Error) ? e.message : String(e);
                alert("Failed to import file: " + msg);
            }
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div
            onClick={() => !isImporting && fileInputRef.current?.click()}
            onKeyDown={handleKeyDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload file dropzone"
            className={`
                relative group overflow-hidden border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 outline-none
                ${isDragging
                    ? "border-primary bg-primary/5 scale-[1.01] shadow-xl shadow-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-secondary/30"
                }
            `}
        >
            {/* Background pattern/effect */}


            {isImporting && (
                <div className="absolute inset-0 bg-background/95 z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-bold text-primary animate-pulse">Importing from Cloud...</p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={acceptedTypes}
                className="hidden"
                onChange={handleFileInput}
            />

            <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                <div className={`w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${isDragging ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                </div>

                <div className="space-y-1">
                    <p className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">Tap to Select File</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {acceptedTypes ? `Accepts: ${acceptedTypes}` : "All files accepted"} <span className="mx-2 opacity-50">•</span> Max 500MB
                    </p>
                </div>

                {/* Cloud Imports */}
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50 w-full max-w-xs justify-center">
                    <span className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wider">Import from:</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCloudImport('google'); }}
                            className="p-2.5 bg-background rounded-xl border border-border shadow-sm hover:scale-110 hover:border-primary/30 active:scale-95 transition-all"
                            title="Google Drive"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                <path d="M12.01 1.485c-1.082 0-1.928.513-2.486 1.408L3.295 14.12l-.004.008-1.557 2.705a1.295 1.295 0 0 0 .005 1.295c.375.645 1.066 1.042 1.815 1.042h4.59l4.897-8.487 4.095-7.093c-.636-.615-1.46-1.005-2.288-1.005h-2.838z" fill="#0066DA" />
                                <path d="M13.67 8.65 9.177 16.438H4.55l-.004.006-.007.012c-.933.003-1.666.368-2.072 1.01a1.295 1.295 0 0 0-.168.667c0 .066.006.13.015.195l5.594-9.69a.747.747 0 0 1 .012-.019l2.843-4.928 2.907-5.04z" fill="#00AC47" />
                                <path d="M21.168 12.632 17.65 6.556 13.9 13.052l-4.5 7.78h9.8a2.53 2.53 0 0 0 2.29-1.39l1.558-2.698a1.29 1.29 0 0 0 .005-1.29l-1.885-2.822z" fill="#EA4335" />
                                <path d="M13.67 8.65h7.64c.22 0 .432.022.637.062l-2.73-4.726a2.532 2.532 0 0 0-2.203-1.258h-7.66l4.316 5.922z" fill="#FFBA00" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCloudImport('dropbox'); }}
                            className="p-2.5 bg-background rounded-xl border border-border shadow-sm hover:scale-110 hover:border-blue-400/30 active:scale-95 transition-all"
                            title="Dropbox"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-[#0061FE]">
                                <path d="M7 3.5 2 6.641l5 3.141 5-3.141L7 3.5zm10 0-5 3.141 5 3.141 5-3.141L17 3.5zM2 11.859l5 3.141 5-3.141-5-3.141-5 3.141zm15 0 5-3.141-5-3.141-5 3.141 5 3.141zM7 16l5 3.141L17 16l-5-3.141L7 16z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCloudImport('onedrive'); }}
                            className="p-2.5 bg-background rounded-xl border border-border shadow-sm hover:scale-110 hover:border-blue-500/30 active:scale-95 transition-all"
                            title="OneDrive"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-[#0078D4]">
                                <path d="M13.636 9.176c-.958-1.584-2.884-2.22-4.577-1.472a1.889 1.889 0 0 0-.25.132C8.36 4.985 5.56 4.865 3.738 6.78c-2.317 2.435-2.037 6.43 0 8.196L17.5 15l4.331-2.923c1.789-1.579 1.543-4.329-.396-5.467-1.464-.86-3.178-.344-4.814 1.25.143-2.936-1.531-4.867-2.985-5.322z" />
                                <path d="M10.975 16s-2.006 1.882-3.177 1.882c-1.127 0-3.327-1.114-3.327-1.114s-.542 2.083.829 2.872c.866.498 3.518.598 4.675-.125 1.573-.984 4.544-3.515 4.544-3.515H10.975z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Google Picker Close Button Portal logic remains same */}
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
