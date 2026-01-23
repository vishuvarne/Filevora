"use client";

import { useState, useRef, useEffect } from "react";

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
    className?: string;
}

export default function BeforeAfterSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Before",
    afterLabel = "After",
    className = ""
}: BeforeAfterSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging || !e.touches[0]) return;
        handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleTouchMove);
            window.addEventListener("touchend", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
                window.removeEventListener("touchmove", handleTouchMove);
                window.removeEventListener("touchend", handleMouseUp);
            };
        }
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-2xl border border-border bg-muted/30 select-none ${className}`}
            style={{ minHeight: "300px" }}
        >
            {/* Before Image (Full) */}
            <div className="absolute inset-0">
                <img
                    src={beforeImage}
                    alt={beforeLabel}
                    className="w-full h-full object-contain"
                    draggable={false}
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-full">
                    {beforeLabel}
                </div>
            </div>

            {/* After Image (Clipped) */}
            <div
                className="absolute inset-0"
                style={{
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                }}
            >
                <img
                    src={afterImage}
                    alt={afterLabel}
                    className="w-full h-full object-contain"
                    draggable={false}
                />
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-full">
                    {afterLabel}
                </div>
            </div>

            {/* Slider Divider */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={() => setIsDragging(true)}
            >
                {/* Handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl border-2 border-primary flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6 text-primary"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l-7.5 7.5 7.5 7.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
