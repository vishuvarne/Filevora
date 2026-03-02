"use client";

import Link from "next/link";
import { TOOLS } from "@/config/tools";

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

interface MegaMenuProps {
    activeCategory: string;
    showAllTools: boolean;
    setShowAllTools: (show: boolean) => void;
    setActiveCategory: (cat: string | null) => void;
}

export default function MegaMenu({ activeCategory, showAllTools, setShowAllTools, setActiveCategory }: MegaMenuProps) {
    if (!activeCategory) return null;

    return (
        <div className="max-w-7xl mx-auto px-8 py-10 mega-menu-content">
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                    {getToolsForCategory(activeCategory).slice(0, showAllTools ? undefined : 12).map((tool) => (
                        <Link
                            key={tool.id}
                            href={`/tools/${tool.id}/`}
                            prefetch={false}
                            onClick={() => setActiveCategory(null)}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/60 active:bg-secondary transition-all group border border-transparent hover:border-border/50"
                        >
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{tool.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed group-hover:text-foreground/80 transition-colors">{tool.description}</div>
                            </div>
                        </Link>
                    ))}
                </div>
                {/* View All Button if more than 6 tools */}
                {!showAllTools && getToolsForCategory(activeCategory).length > 12 && (
                    <div className="mt-6 flex justify-end border-t border-border pt-4">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowAllTools(true);
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors group"
                        >
                            View All {activeCategory} Tools
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
