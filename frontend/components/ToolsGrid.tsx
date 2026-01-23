"use client";
import { useState, useEffect, useRef } from "react";
import { TOOLS } from "@/config/tools";
import ToolCard from "@/components/ToolCard";
import SkeletonLoader from "@/components/SkeletonLoader";

const CATEGORIES = ["All", "PDF & Documents", "Image", "Video & Audio", "GIF", "Web Apps", "Others"];
const INITIAL_LOAD = 12; // 3 rows of 4 on xl screens (Neuro-UX: Progressive Disclosure)
const LOAD_MORE = 12; // Load 12 more at a time

export default function ToolsGrid() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    const filteredTools = TOOLS.filter((tool) => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" ||
            (activeCategory === "Web Apps" ? ["collage-maker", "image-resizer", "crop-image", "color-picker", "meme-generator", "photo-editor", "qr-code-generator"].includes(tool.id) : tool.category === activeCategory);

        return matchesSearch && matchesCategory;
    });

    const visibleTools = filteredTools.slice(0, visibleCount);
    const hasMore = visibleCount < filteredTools.length;

    // Load more tools (Manual trigger for Progressive Disclosure)
    const loadMore = () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        // Simulate slight delay for smooth loading
        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE, filteredTools.length));
            setIsLoading(false);
        }, 300);
    };

    // Removed automatically triggered Infinite Scroll to give user autonomy (Neuro-UX 3.2.3)

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(INITIAL_LOAD);
    }, [searchQuery, activeCategory]);

    return (
        <section id="tools" className="scroll-mt-24 py-8">
            {/* Search & Filter Header */}
            <div className="mb-12 space-y-8">
                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto group">

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for tools (e.g. merge pdf, crop image)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 rounded-2xl border border-border bg-background shadow-lg shadow-black/5 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-lg placeholder:text-muted-foreground/60 text-foreground"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-muted-foreground absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-2.5">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === cat
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent hover:border-border/50 hover:scale-105 active:scale-95"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid - Visual Chunking: Increased gap to 8 (Neuro-UX 3.1.1.C) */}
            {filteredTools.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                        {visibleTools.map((tool) => (
                            <ToolCard key={tool.id} tool={tool} />
                        ))}

                        {/* Show skeleton loaders while loading more */}
                        {isLoading && Array.from({ length: Math.min(LOAD_MORE, filteredTools.length - visibleCount) }).map((_, i) => (
                            <SkeletonLoader key={`skeleton-${i}`} />
                        ))}
                    </div>

                    {/* Show More Button (Progressive Disclosure) */}
                    {hasMore && (
                        <div className="flex flex-col items-center justify-center mt-12 space-y-4">
                            {!isLoading && (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Showing {visibleCount} of {filteredTools.length} tools
                                    </p>
                                    <button
                                        onClick={loadMore}
                                        className="rounded-xl bg-secondary px-8 py-3 text-sm font-semibold text-foreground border border-border/50 hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Show More Tools
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-24 bg-secondary/20 rounded-3xl border border-dashed border-border/60 animate-in fade-in zoom-in-95 duration-300">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-muted-foreground">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No tools found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-6">We couldn't find any tools matching your search. Try different keywords.</p>
                    <button
                        onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                        className="px-6 py-2.5 rounded-xl bg-background border border-border font-semibold text-primary hover:bg-secondary transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </section>
    );
}
