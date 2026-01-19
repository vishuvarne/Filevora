"use client";

import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from "react";

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
        // Basic type filtering checks could go here if needed, 
        // but input accept attribute handles most.
        onFilesSelected(files);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={handleKeyDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload file dropzone"
            className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDragging
                    ? "border-blue-500 bg-blue-50/10 text-blue-500"
                    : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-400"
                }
      `}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={acceptedTypes}
                className="hidden"
                onChange={handleFileInput}
            />
            <div className="flex flex-col items-center justify-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10 mb-2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                </svg>
                <p className="text-lg font-medium text-center">
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">Tap to Select File</span>
                </p>
                <p className="text-xs text-gray-400 text-center px-4 mb-4">
                    {acceptedTypes ? `Accepts: ${acceptedTypes}` : "All files accepted"} <span className="mx-1">•</span> Max 500MB
                </p>

                {/* Cloud Imports */}
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 font-medium">Or import from:</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("Google Drive integration coming soon!");
                        }}
                        className="p-2 bg-white rounded-full shadow-sm border border-slate-200 hover:scale-110 active:scale-95 transition-all"
                        aria-label="Import from Google Drive"
                        title="Import from Google Drive"
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
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("Dropbox integration coming soon!");
                        }}
                        className="p-2 bg-[#0061FE] rounded-full shadow-sm border border-[#0061FE] hover:scale-110 active:scale-95 transition-all group"
                        aria-label="Import from Dropbox"
                        title="Import from Dropbox"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                            <path d="M7 3.5 2 6.641l5 3.141 5-3.141L7 3.5zm10 0-5 3.141 5 3.141 5-3.141L17 3.5zM2 11.859l5 3.141 5-3.141-5-3.141-5 3.141zm15 0 5-3.141-5-3.141-5 3.141 5 3.141zM7 16l5 3.141L17 16l-5-3.141L7 16z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("OneDrive integration coming soon!");
                        }}
                        className="p-2 bg-[#0078D4] rounded-full shadow-sm border border-[#0078D4] hover:scale-110 active:scale-95 transition-all"
                        aria-label="Import from OneDrive"
                        title="Import from OneDrive"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                            <path d="M13.636 9.176c-.958-1.584-2.884-2.22-4.577-1.472a1.889 1.889 0 0 0-.25.132C8.36 4.985 5.56 4.865 3.738 6.78c-2.317 2.435-2.037 6.43 0 8.196L17.5 15l4.331-2.923c1.789-1.579 1.543-4.329-.396-5.467-1.464-.86-3.178-.344-4.814 1.25.143-2.936-1.531-4.867-2.985-5.322z" />
                            <path d="M10.975 16s-2.006 1.882-3.177 1.882c-1.127 0-3.327-1.114-3.327-1.114s-.542 2.083.829 2.872c.866.498 3.518.598 4.675-.125 1.573-.984 4.544-3.515 4.544-3.515H10.975z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
