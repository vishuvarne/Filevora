"use client";
import { useState } from "react";
import { TOOLS } from "@/config/tools";
import ToolCard from "@/components/ToolCard";

const CATEGORIES = ["All", "PDF & Documents", "Image", "Video & Audio", "GIF", "Web Apps", "Others"];

export default function ToolsGrid() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredTools = TOOLS.filter((tool) => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" ||
            (activeCategory === "Web Apps" ? ["collage-maker", "image-resizer", "crop-image", "color-picker", "meme-generator", "photo-editor", "qr-code-generator"].includes(tool.id) : tool.category === activeCategory);

        return matchesSearch && matchesCategory;
    });

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

            {/* Results Grid */}
            {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                    {filteredTools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
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
