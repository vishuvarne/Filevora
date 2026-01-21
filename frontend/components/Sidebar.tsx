"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TOOLS } from "@/config/tools";

const CATEGORIES = [
    "PDF & Documents",
    "Image",
    "Video & Audio",
    "GIF",
    "Web Apps",
    "Others"
];

const WEB_APP_IDS = [
    "collage-maker", "image-resizer", "crop-image", "color-picker",
    "meme-generator", "photo-editor", "qr-code-generator"
];

function getToolsForCategory(cat: string) {
    if (cat === "Web Apps") {
        return TOOLS.filter((t) => WEB_APP_IDS.includes(t.id));
    }
    return TOOLS.filter((t) => t.category === cat);
}

interface SidebarProps {
    onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
    const pathname = usePathname();
    // Default all open for desktop sidebar usage
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    return (
        <div className="w-full space-y-1">
            {CATEGORIES.map((category) => {
                const tools = getToolsForCategory(category);
                if (tools.length === 0) return null;
                const isExpanded = expandedCategories.has(category);

                return (
                    <div key={category} className="rounded-xl overflow-hidden">
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/50 transition-colors text-sm font-semibold text-foreground rounded-xl"
                        >
                            <span className="flex items-center gap-2">
                                {category}
                                <span className="text-xs font-normal text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                                    {tools.length}
                                </span>
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {isExpanded && (
                            <div className="space-y-0.5 pb-2 animate-in slide-in-from-top-1 duration-200">
                                {tools.map((tool) => {
                                    const isActive = pathname === `/tools/${tool.id}`;
                                    return (
                                        <Link
                                            key={tool.id}
                                            href={`/tools/${tool.id}`}
                                            onClick={onNavigate}
                                            className={`flex items-center gap-3 px-3 py-2 ml-2 rounded-xl text-sm transition-all duration-200 border-l-2 ${isActive
                                                ? "bg-primary/10 text-primary border-primary font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary border-transparent"
                                                }`}
                                        >
                                            <span className="truncate">{tool.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
