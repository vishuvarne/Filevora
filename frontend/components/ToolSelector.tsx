"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ToolDef } from "@/config/tools";
import { useCallback, useRef, useEffect } from "react";

interface ToolSelectorProps {
    tools: ToolDef[];
    activeToolId: string;
    categorySlug: string;
}

export default function ToolSelector({ tools, activeToolId, categorySlug }: ToolSelectorProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Scroll active pill into view on mount
    useEffect(() => {
        if (activeRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const pill = activeRef.current;
            const scrollLeft = pill.offsetLeft - container.offsetWidth / 2 + pill.offsetWidth / 2;
            container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
        }
    }, [activeToolId]);

    const handleToolSelect = useCallback((toolId: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set("tool", toolId);
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [router]);

    return (
        <div className="relative mb-6">
            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1"
            >
                {tools.map((tool) => {
                    const isActive = tool.id === activeToolId;
                    return (
                        <button
                            key={tool.id}
                            ref={isActive ? activeRef : undefined}
                            onClick={() => handleToolSelect(tool.id)}
                            className={`
                                shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold
                                transition-all duration-200 whitespace-nowrap
                                border-2 select-none
                                ${isActive
                                    ? "bg-[var(--nb-yellow,#FFE88A)] border-[var(--nb-border,#1A1A1A)] text-[#1A1A1A] shadow-[var(--nb-shadow,3px_3px_0px_0px_#1A1A1A)]"
                                    : "bg-[var(--nb-card,#FFFFFF)] border-[var(--nb-border,#1A1A1A)] text-[var(--nb-text,#1A1A1A)] shadow-[var(--nb-shadow-sm,2px_2px_0px_0px_#1A1A1A)] hover:translate-y-[-2px] hover:shadow-[var(--nb-shadow-hover,4px_4px_0px_0px_#1A1A1A)] active:translate-y-[1px] active:shadow-[var(--nb-shadow-active,1px_1px_0px_0px_#1A1A1A)]"
                                }
                            `}
                        >
                            {tool.name}
                        </button>
                    );
                })}
            </div>

            {/* Fade edges */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-[var(--nb-bg,#F4F4F0)] to-transparent pointer-events-none dark:from-[#111111]" />
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[var(--nb-bg,#F4F4F0)] to-transparent pointer-events-none dark:from-[#111111]" />
        </div>
    );
}
