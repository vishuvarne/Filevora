"use client";

import { useState } from "react";

interface FormatRecommendation {
    format: string;
    useCase: string;
    pros: string[];
    cons: string[];
}

interface FormatInfoProps {
    currentFormat?: string;
    supportedFormats: string[];
    recommendations?: FormatRecommendation[];
    className?: string;
}

const DEFAULT_IMAGE_RECOMMENDATIONS: FormatRecommendation[] = [
    {
        format: "JPEG",
        useCase: "Photos & complex images",
        pros: ["Smallest file size", "Universal support", "Good for photos"],
        cons: ["Lossy compression", "No transparency"]
    },
    {
        format: "PNG",
        useCase: "Graphics & logos",
        pros: ["Lossless quality", "Supports transparency", "Sharp edges"],
        cons: ["Larger file size", "Not ideal for photos"]
    },
    {
        format: "WebP",
        useCase: "Modern web",
        pros: ["Better compression", "Supports transparency", "Modern standard"],
        cons: ["Limited old browser support"]
    }
];

export default function FormatInfo({
    currentFormat,
    supportedFormats,
    recommendations = DEFAULT_IMAGE_RECOMMENDATIONS,
    className = ""
}: FormatInfoProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`bg-muted/30 rounded-2xl border border-border overflow-hidden ${className}`}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-primary"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                    </svg>
                    <span className="text-sm font-bold text-foreground">Format Guide</span>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border">
                    {currentFormat && (
                        <div className="pt-3">
                            <p className="text-xs text-muted-foreground">
                                Current format: <span className="font-bold text-foreground">{currentFormat.toUpperCase()}</span>
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Supported Formats</p>
                        <div className="flex flex-wrap gap-2">
                            {supportedFormats.map((format) => (
                                <span
                                    key={format}
                                    className="px-2 py-1 bg-secondary text-foreground text-xs font-medium rounded-lg"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommendations</p>
                        <div className="space-y-2">
                            {recommendations.map((rec) => (
                                <div
                                    key={rec.format}
                                    className="p-3 bg-background rounded-lg border border-border"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-foreground">{rec.format}</span>
                                        <span className="text-xs text-muted-foreground italic">{rec.useCase}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                        <div>
                                            <p className="text-green-600 font-medium mb-1">✓ Pros:</p>
                                            <ul className="text-muted-foreground space-y-0.5">
                                                {rec.pros.map((pro, i) => (
                                                    <li key={i}>• {pro}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-amber-600 font-medium mb-1">⚠ Cons:</p>
                                            <ul className="text-muted-foreground space-y-0.5">
                                                {rec.cons.map((con, i) => (
                                                    <li key={i}>• {con}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
