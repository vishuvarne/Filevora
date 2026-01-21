"use client";

import { useState, useEffect } from "react";
import { ToolDef } from "@/config/tools";

interface AIAssistantProps {
    tool: ToolDef;
    files: File[];
    currentFormat?: string;
    compressionLevel?: string;
    quality?: number;
    onApply: (suggestion: { type: 'format' | 'compression' | 'batch' | 'quality', value: string, autoRun?: boolean }) => void;
}

type SuggestionType = 'batch' | 'format' | 'compression' | 'quality';

export default function AIAssistant({ tool, files, currentFormat, compressionLevel, quality = 85, onApply }: AIAssistantProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [suggestion, setSuggestion] = useState<{
        title: string;
        message: string;
        action: string;
        type: 'format' | 'compression' | 'batch' | 'quality';
        value: string;
        autoRun?: boolean;
        explanation?: string;
        benefit?: string;
    } | null>(null);

    // Session-based dismissal tracking
    const getDismissedSuggestions = (): Record<string, boolean> => {
        if (typeof window === 'undefined') return {};
        const stored = sessionStorage.getItem('ai_dismissed_suggestions');
        return stored ? JSON.parse(stored) : {};
    };

    const markAsDismissed = (type: SuggestionType) => {
        if (typeof window === 'undefined') return;
        const dismissed = getDismissedSuggestions();
        dismissed[type] = true;
        sessionStorage.setItem('ai_dismissed_suggestions', JSON.stringify(dismissed));
    };

    const isDismissed = (type: SuggestionType): boolean => {
        return getDismissedSuggestions()[type] === true;
    };

    useEffect(() => {
        // Reset visibility when tool or files change
        setIsVisible(false);
        setSuggestion(null);
        setShowExplanation(false);

        if (files.length === 0) return;

        // Priority 1: Batch Processing for PDFs
        if (tool.endpoint.includes("pdf-to-image") && files.length > 1 && !isDismissed('batch')) {
            setSuggestion({
                title: "Batch Processing Available",
                message: `You have ${files.length} PDFs selected. Convert them all at once to save time.`,
                action: "Convert All Files",
                type: 'batch',
                value: 'batch',
                autoRun: true,
                explanation: "Batch processing converts all PDFs in a single operation, rather than one at a time. This saves you from repeating the same action manually.",
                benefit: `${files.length}x faster workflow`
            });
            setIsVisible(true);
            return;
        }

        // Priority 2: Quality Optimization (Web Target)
        if ((tool.id === "convert-image" || tool.id === "compress-pdf") && quality > 90 && !isDismissed('quality')) {
            setSuggestion({
                title: "Quality Optimization",
                message: `Quality set to ${quality}% is higher than needed for most web uses. You can reduce it without visible quality loss.`,
                action: "Optimize to 82%",
                type: 'quality',
                value: '82',
                autoRun: false, // User click required
                explanation: "Most web browsers and displays can't show differences above 82% quality. Higher settings only increase file size without visible benefit.",
                benefit: "~30% smaller files, faster loading"
            });
            setIsVisible(true);
            return;
        }

        // Priority 3: Format Optimization (WebP)
        if ((tool.id === "convert-image" || tool.endpoint.includes("pdf-to-image")) &&
            currentFormat && ["JPEG", "PNG"].includes(currentFormat.toUpperCase()) &&
            !isDismissed('format')) {
            setSuggestion({
                title: "Optimization Tip",
                message: `For web use, WebP offers ~30% better compression than ${currentFormat} with the same quality.`,
                action: "Switch to WebP & Convert",
                type: 'format',
                value: 'WEBP',
                autoRun: true,
                explanation: "WebP is a modern image format developed by Google. It provides superior compression while maintaining visual quality, making it ideal for websites and apps.",
                benefit: "30% smaller, same quality"
            });
            setIsVisible(true);
            return;
        }

        // Priority 4: PDF Compression for Large Files
        if (tool.id === "compress-pdf" && !isDismissed('compression')) {
            const totalSizeMb = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
            if (totalSizeMb > 5 && compressionLevel === "basic") {
                setSuggestion({
                    title: "Large File Detected",
                    message: "Your file is over 5MB. 'Strong' compression is recommended for email sharing (most have 10-25MB limits).",
                    action: "Use Strong & Compress",
                    type: 'compression',
                    value: 'strong',
                    autoRun: true,
                    explanation: "Strong compression reduces file size significantly by optimizing images and removing metadata. It's perfect for email attachments while keeping documents readable.",
                    benefit: "~50% size reduction"
                });
                setIsVisible(true);
            }
        }

    }, [tool.id, tool.endpoint, files, currentFormat, compressionLevel, quality]);

    const handleDismiss = () => {
        if (suggestion) {
            markAsDismissed(suggestion.type as SuggestionType);
        }
        setIsVisible(false);
    };

    if (!isVisible || !suggestion) return null;

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-4 shadow-sm relative overflow-hidden">
                {/* AI Icon */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                </div>

                <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{suggestion.title}</h4>
                        {suggestion.benefit && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {suggestion.benefit}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3 leading-relaxed">
                        {suggestion.message}
                    </p>

                    {/* Why This? Expandable */}
                    {suggestion.explanation && (
                        <div className="mb-3">
                            <button
                                onClick={() => setShowExplanation(!showExplanation)}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${showExplanation ? 'rotate-90' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                                Why this?
                            </button>
                            {showExplanation && (
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
                                    {suggestion.explanation}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                onApply(suggestion);
                                setIsVisible(false);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            {suggestion.action}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 px-2 py-2"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
