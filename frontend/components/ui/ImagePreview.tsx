"use client";

import { useState, useEffect } from "react";

interface ImagePreviewProps {
    file: File;
    rotation?: number;
    className?: string;
}

export default function ImagePreview({ file, rotation = 0, className = "" }: ImagePreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            return () => {
                isActive = false;
                URL.revokeObjectURL(url);
            };
        }

        return () => {
            isActive = false;
        };
    }, [file]);

    if (!previewUrl) return null;

    return (
        <img
            draggable={false}
            src={previewUrl}
            alt=""
            className={className}
            style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
        />
    );
}
