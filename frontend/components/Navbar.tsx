"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TOOLS } from "@/config/tools";
import AuthButtons from "./AuthButtons";
import ThemeToggle from "./ThemeToggle";

const CATEGORIES = [
    "Video & Audio",
    "Image",
    "PDF & Documents",
    "GIF",
    "Others",
    "Web Apps"
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

export default function Navbar() {
    const pathname = usePathname();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Web Apps"]));

    // Filter tools based on search query
    const filteredTools = searchQuery
        ? TOOLS.filter(tool =>
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
            setSearchQuery(""); // Reset search when opening menu
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    return (
        <nav
            className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all font-sans duration-300"
            onMouseLeave={() => setActiveCategory(null)}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 z-[60] shrink-0 group"
                    >
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                            F
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground transition-all">
                            File<span className="text-primary">Vora</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-1 min-w-0">
                        {CATEGORIES.map((category) => (
                            <div
                                key={category}
                                className="relative group px-3 lg:px-4 py-8 cursor-pointer shrink-0"
                                onMouseEnter={() => setActiveCategory(category)}
                                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                            >
                                <div className={`flex items-center gap-1.5 text-[15px] font-semibold transition-all duration-200 ${activeCategory === category ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                                    {category === "Web Apps" && (
                                        <span className={`w-2 h-2 rounded-full transition-colors ${activeCategory === category ? "bg-green-500 animate-pulse" : "bg-green-500/70"}`} aria-hidden />
                                    )}
                                    <span className="truncate tracking-wide">{category}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-300 ${activeCategory === category ? "rotate-180 text-primary" : "text-muted-foreground/50 group-hover:text-primary"}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                                {/* Highlight Bar */}
                                <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 origin-left ${activeCategory === category ? "scale-x-100" : "scale-x-0"}`} />
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-4 shrink-0">
                        <ThemeToggle />
                        <div className="h-6 w-[1px] bg-border mx-2"></div>
                        <AuthButtons />
                    </div>

                    <div className="md:hidden flex items-center gap-2 z-[60] shrink-0">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2.5 -mr-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-110 active:scale-95"
                            aria-expanded={mobileMenuOpen}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            <span className="sr-only">{mobileMenuOpen ? "Close" : "Menu"}</span>
                            {mobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Mega Menu Dropdown */}
            <div
                className={`hidden md:block absolute left-0 w-full bg-background border-b border-border shadow-xl shadow-black/5 transition-all duration-300 ease-out origin-top z-40 ${activeCategory ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 pointer-events-none invisible"}`}
            >
                <div className="max-w-7xl mx-auto px-8 py-10">
                    {activeCategory && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {getToolsForCategory(activeCategory).map((tool) => (
                                <Link
                                    key={tool.id}
                                    href={`/tools/${tool.id}`}
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
                    )}
                </div>
            </div>

            {/* Mobile: Backdrop */}
            {mobileMenuOpen && (
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="md:hidden fixed inset-0 top-20 bg-black/40 z-[100] animate-in fade-in duration-300"
                    aria-label="Close menu"
                />
            )}

            {/* Mobile: Drawer */}
            <div
                className={`md:hidden fixed top-20 right-0 h-[calc(100vh-5rem)] w-[90vw] max-w-sm bg-background border-l border-border shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
                aria-hidden={!mobileMenuOpen}
            >
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-4 pb-6 space-y-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search tools..."
                                aria-label="Search tools"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-secondary/50 text-foreground focus:bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>

                        {/* Search Results */}
                        {searchQuery && (
                            <div className="space-y-2 animate-in fade-in duration-200">
                                <h3 className="font-bold text-foreground px-1 py-2 text-sm">Search Results ({filteredTools.length})</h3>
                                {filteredTools.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredTools.map((tool) => (
                                            <Link
                                                key={tool.id}
                                                href={`/tools/${tool.id}`}
                                                onClick={() => { setMobileMenuOpen(false); setSearchQuery(""); }}
                                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/80 active:bg-secondary transition-colors"
                                            >
                                                <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-foreground truncate">{tool.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{tool.category}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground px-3 py-4 text-center">No tools found</p>
                                )}
                            </div>
                        )}

                        {/* Categories (shown when not searching) */}
                        {!searchQuery && (
                            <>
                                {/* Quick Access */}
                                <div className="bg-secondary rounded-2xl p-4 border border-border">
                                    <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                        </svg>
                                        Quick Access
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {TOOLS.filter(t => ["merge-pdf", "convert-image", "image-compressor", "compress-pdf"].includes(t.id)).map((tool) => (
                                            <Link
                                                key={tool.id}
                                                href={`/tools/${tool.id}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background/50 hover:bg-background active:bg-secondary transition-all border border-border/50 hover:border-border shadow-sm"
                                            >
                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                    </svg>
                                                </div>
                                                <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{tool.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* All Categories */}
                                <div className="space-y-1">
                                    <h3 className="font-bold text-foreground px-1 py-2 text-sm uppercase tracking-wider opacity-70">All Tools</h3>

                                    {/* Web Apps — first, highlighted */}
                                    <div className="border border-border/50 rounded-xl overflow-hidden bg-secondary/10">
                                        <button
                                            onClick={() => toggleCategory("Web Apps")}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 font-bold text-foreground">
                                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                Web Apps
                                                <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full ml-1">
                                                    {getToolsForCategory("Web Apps").length}
                                                </span>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedCategories.has("Web Apps") ? "rotate-180" : ""}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                        {expandedCategories.has("Web Apps") && (
                                            <div className="space-y-1 px-3 pb-3 border-t border-border/50 pt-2 animate-in slide-in-from-top-1 duration-200">
                                                {getToolsForCategory("Web Apps").map((tool) => (
                                                    <Link
                                                        key={tool.id}
                                                        href={`/tools/${tool.id}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 active:bg-secondary transition-colors"
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                            </svg>
                                                        </div>
                                                        <span className="text-sm font-medium text-foreground">{tool.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Other categories */}
                                    {CATEGORIES.filter((c) => c !== "Web Apps").map((cat) => {
                                        const tools = getToolsForCategory(cat);
                                        if (tools.length === 0) return null;
                                        return (
                                            <div key={cat} className="border-b border-border/40 last:border-0">
                                                <button
                                                    onClick={() => toggleCategory(cat)}
                                                    className="w-full flex items-center justify-between px-3 py-3.5 hover:text-primary transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                                        {cat}
                                                        <span className="text-xs font-normal text-muted-foreground ml-1 opacity-70">
                                                            ({tools.length})
                                                        </span>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedCategories.has(cat) ? "rotate-180" : ""}`}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                    </svg>
                                                </button>
                                                {expandedCategories.has(cat) && (
                                                    <div className="space-y-1 pb-3 pl-2 animate-in slide-in-from-top-1 duration-200">
                                                        {tools.map((tool) => (
                                                            <Link
                                                                key={tool.id}
                                                                href={`/tools/${tool.id}`}
                                                                onClick={() => setMobileMenuOpen(false)}
                                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 active:bg-secondary transition-colors"
                                                            >
                                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text} opacity-80`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-sm font-medium text-foreground">{tool.name}</span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                            </>
                        )}
                    </div>
                </div>

                {/* Mobile: Auth buttons */}
                <div className="p-4 border-t border-border bg-secondary space-y-3 shrink-0">
                    <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3.5 text-center rounded-xl border border-input font-bold text-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3.5 text-center rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/25 transition-all"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>
    );
}
