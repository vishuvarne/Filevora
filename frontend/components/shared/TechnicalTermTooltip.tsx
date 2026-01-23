"use client";

import Tooltip from "./Tooltip";

interface TechnicalTerm {
    term: string;
    fullName: string;
    description: string;
    useCase: string;
}

const TECHNICAL_TERMS: Record<string, TechnicalTerm> = {
    HEIC: {
        term: "HEIC",
        fullName: "High Efficiency Image Container",
        description: "Apple's modern image format that provides better compression than JPEG while maintaining quality.",
        useCase: "Commonly used on iPhones and iPads for photos"
    },
    JFIF: {
        term: "JFIF",
        fullName: "JPEG File Interchange Format",
        description: "Standard JPEG image file format widely supported across all platforms.",
        useCase: "Universal image format for photos and graphics"
    },
    APNG: {
        term: "APNG",
        fullName: "Animated Portable Network Graphics",
        description: "PNG format supporting animation with better quality than GIF.",
        useCase: "Animated graphics with transparency support"
    },
    WEBM: {
        term: "WEBM",
        fullName: "WebM Video Format",
        description: "Open, royalty-free video format designed for the web.",
        useCase: "Modern web videos with efficient compression"
    },
    EPUB: {
        term: "EPUB",
        fullName: "Electronic Publication",
        description: "Standard ebook format supported by most e-readers.",
        useCase: "Digital books and publications"
    },
    WebP: {
        term: "WebP",
        fullName: "WebP Image Format",
        description: "Modern image format providing superior compression for web images.",
        useCase: "Web graphics with smaller file sizes"
    },
    GIF: {
        term: "GIF",
        fullName: "Graphics Interchange Format",
        description: "Image format supporting animation with limited colors.",
        useCase: "Simple animations and memes"
    },
    SVG: {
        term: "SVG",
        fullName: "Scalable Vector Graphics",
        description: "Vector image format that scales without quality loss.",
        useCase: "Logos, icons, and illustrations"
    }
};

interface TechnicalTermTooltipProps {
    term: string;
    className?: string;
}

export default function TechnicalTermTooltip({ term, className = "" }: TechnicalTermTooltipProps) {
    const termData = TECHNICAL_TERMS[term];

    if (!termData) {
        return <span className={className}>{term}</span>;
    }

    const tooltipContent = (
        <div className="space-y-1">
            <div className="font-bold">{termData.fullName}</div>
            <div className="text-xs opacity-90">{termData.description}</div>
            <div className="text-xs opacity-75 italic">💡 {termData.useCase}</div>
        </div>
    );

    return (
        <Tooltip content={tooltipContent} maxWidth={300}>
            <span className={`inline-flex items-center gap-1 ${className}`}>
                <span>{term}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                </svg>
            </span>
        </Tooltip>
    );
}
