"use client";
import { ToolMetadata, getProcessingTimeColor } from "@/config/toolMetadata";

interface HoverTooltipProps {
    metadata: ToolMetadata;
}

export default function HoverTooltip({ metadata }: HoverTooltipProps) {
    const timeColor = getProcessingTimeColor(metadata.processingTime);

    return (
        <div className="absolute top-16 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500 pointer-events-none z-10">
            <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-3 min-w-[200px] border border-gray-700">
                {/* Processing Time */}
                <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 mt-0.5 flex-shrink-0 ${timeColor}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                        <div className="text-xs font-semibold capitalize text-gray-200">{metadata.processingTime}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{metadata.processingTimeDescription}</div>
                    </div>
                </div>

                {/* Batch Support */}
                {metadata.batchSupport && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-purple-400 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                        <span className="text-xs text-gray-300">Batch processing</span>
                    </div>
                )}
            </div>
        </div>
    );
}
