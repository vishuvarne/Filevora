"use client";

import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useGoogleDrivePicker } from "../../hooks/useGoogleDrive";
import { useDropboxChooser } from "../../hooks/useDropbox";
import { useOneDrivePicker } from "../../hooks/useOneDrive";
import { importCloudFile, getDownloadUrl } from "../../lib/api";

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
