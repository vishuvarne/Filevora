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
                <p className="text-xs text-gray-400 text-center px-4">
                    {acceptedTypes ? `Accepts: ${acceptedTypes}` : "All files accepted"}
                </p>
            </div>
        </div>
    );
}
