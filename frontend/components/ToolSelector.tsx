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
        <div className="relative mb-2">
            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-2 -mx-2 sm:px-1 sm:mx-0"
            >
                {tools.map((tool) => {
                    const isActive = tool.id === activeToolId;
                    return (
                        <button
                            key={tool.id}
                            ref={isActive ? activeRef : undefined}
                            onClick={() => handleToolSelect(tool.id)}
                            className={`
                                shrink-0 px-5 py-2.5 rounded-[14px] text-sm font-black tracking-wide
                                transition-all duration-300 ease-out whitespace-nowrap
                                border-[2px] sm:border-[3px] select-none outline-none
                                focus-visible:ring-4 focus-visible:ring-primary/20
                                ${isActive
                                    ? "bg-[var(--nb-yellow,#FFE88A)] border-slate-900 dark:border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:dark:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                                    : "bg-white dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] sm:dark:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-1 hover:bg-[var(--nb-mint,#AFF8D8)] hover:text-slate-900 hover:border-slate-900 dark:hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sm:hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:shadow-none"
                                }
                            `}
                        >
                            {tool.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
