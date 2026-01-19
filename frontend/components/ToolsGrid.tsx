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
        <section id="tools" className="scroll-mt-24">
            {/* Search & Filter Header */}
            <div className="mb-10 space-y-6">
                {/* Search Bar */}
                <div className="relative max-w-xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search for tools (e.g. merge pdf, crop image)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-500 transition-all text-lg placeholder:text-slate-400"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {filteredTools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No tools found</h3>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filter</p>
                    <button
                        onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </section>
    );
}
