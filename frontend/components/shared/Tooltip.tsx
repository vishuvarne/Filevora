"use client";

import { useState, useEffect, useRef } from "react";

interface TooltipProps {
    content: string | React.ReactNode;
    children: React.ReactNode;
    maxWidth?: number;
    className?: string;
}

export default function Tooltip({
    content,
    children,
    maxWidth = 280,
    className = ""
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<"top" | "bottom">("top");
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            // Check if tooltip would go off top of screen
            if (triggerRect.top - tooltipRect.height < 10) {
                setPosition("bottom");
            } else {
                setPosition("top");
            }
        }
    }, [isVisible]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsVisible(false);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current &&
                tooltipRef.current &&
                !triggerRef.current.contains(e.target as Node) &&
                !tooltipRef.current.contains(e.target as Node)
            ) {
                setIsVisible(false);
            }
        };

        if (isVisible) {
            document.addEventListener("keydown", handleEscape);
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("keydown", handleEscape);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isVisible]);

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                ref={triggerRef}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className="cursor-help"
            >
                {children}
            </div>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg animate-in fade-in duration-150 ${position === "top"
                            ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
                            : "top-full left-1/2 -translate-x-1/2 mt-2"
                        }`}
                    style={{ maxWidth: `${maxWidth}px` }}
                >
                    {content}
                    <div
                        className={`absolute w-2 h-2 bg-gray-900 rotate-45 left-1/2 -translate-x-1/2 ${position === "top" ? "bottom-[-4px]" : "top-[-4px]"
                            }`}
                    />
                </div>
            )}
        </div>
    );
}
