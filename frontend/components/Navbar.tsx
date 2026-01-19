"use client";

import Link from "next/link";
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

const COMPANY_LINKS = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Donate", href: "/donate" },
    { label: "API", href: "/api" },
];

function getToolsForCategory(cat: string) {
    if (cat === "Web Apps") {
        return TOOLS.filter((t) => WEB_APP_IDS.includes(t.id));
    }
    return TOOLS.filter((t) => t.category === cat);
}

export default function Navbar() {
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

    return (
        <nav
            className="border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-all font-sans"
            onMouseLeave={() => setActiveCategory(null)}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 z-[60] shrink-0"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl sm:text-2xl shadow-blue-200 shadow-lg shrink-0">
                            F
                        </div>
                        <span className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                            File<span className="text-blue-600 dark:text-blue-400">Vora</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-1 min-w-0">
                        {CATEGORIES.map((category) => (
                            <div
                                key={category}
                                className="relative group px-2 lg:px-3 xl:px-4 py-8 cursor-pointer shrink-0"
                                onMouseEnter={() => setActiveCategory(category)}
                                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                            >
                                <div className={`flex items-center gap-1.5 text-[15px] lg:text-[17px] font-bold transition-colors ${activeCategory === category ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"}`}>
                                    {category === "Web Apps" && (
                                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden />
                                    )}
                                    <span className="truncate tracking-wide">{category}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform shrink-0 ${activeCategory === category ? "rotate-180" : ""}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
                        <ThemeToggle />
                        <AuthButtons />
                    </div>

                    <div className="md:hidden flex items-center gap-2 z-[60] shrink-0">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2.5 -mr-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
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
                className={`hidden md:block absolute left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 shadow-xl transition-all duration-300 ease-out origin-top z-40 ${activeCategory ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 pointer-events-none invisible"}`}
            >
                <div className="max-w-7xl mx-auto px-8 py-10">
                    {activeCategory && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                            {getToolsForCategory(activeCategory).map((tool) => (
                                <Link
                                    key={tool.id}
                                    href={`/tools/${tool.id}`}
                                    onClick={() => setActiveCategory(null)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                                >
                                    <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text} group-hover:scale-105 transition-transform`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{tool.name}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{tool.description}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile: Backdrop - Bumped Z-Index to avoid blocking by sticky footers */}
            {mobileMenuOpen && (
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="md:hidden fixed inset-0 top-20 bg-black/20 backdrop-blur-[2px] z-[100] animate-in fade-in duration-200"
                    aria-label="Close menu"
                />
            )}

            {/* Mobile: Drawer - Bumped Z-Index */}
            <div
                className={`md:hidden fixed top-20 right-0 h-[calc(100vh-5rem)] w-[85vw] max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
                aria-hidden={!mobileMenuOpen}
            >
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-4 pb-6 space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search tools..."
                                aria-label="Search tools"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all text-sm placeholder:text-slate-400"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>

                        {/* Search Results */}
                        {searchQuery && (
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-white px-3 py-2 text-sm">Search Results ({filteredTools.length})</h3>
                                {filteredTools.length > 0 ? (
                                    <div className="space-y-0.5">
                                        {filteredTools.map((tool) => (
                                            <Link
                                                key={tool.id}
                                                href={`/tools/${tool.id}`}
                                                onClick={() => { setMobileMenuOpen(false); setSearchQuery(""); }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                            >
                                                <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{tool.name}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{tool.category}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 px-3 py-4 text-center">No tools found</p>
                                )}
                            </div>
                        )}

                        {/* Categories (shown when not searching) */}
                        {!searchQuery && (
                            <>
                                {/* Quick Access */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100">
                                    <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                        </svg>
                                        Quick Access
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TOOLS.filter(t => ["merge-pdf", "convert-image", "image-compressor", "compress-pdf"].includes(t.id)).map((tool) => (
                                            <Link
                                                key={tool.id}
                                                href={`/tools/${tool.id}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white active:bg-blue-100 transition-colors border border-transparent hover:border-blue-200"
                                            >
                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                    </svg>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-700 text-center leading-tight">{tool.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* All Categories */}
                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white px-3 py-2 text-sm">All Tools</h3>

                                    {/* Web Apps — first, highlighted */}
                                    <div>
                                        <button
                                            onClick={() => toggleCategory("Web Apps")}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 font-bold text-slate-900">
                                                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                                Web Apps
                                                <span className="text-xs font-normal text-slate-400">({getToolsForCategory("Web Apps").length})</span>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategories.has("Web Apps") ? "rotate-180" : ""}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                        {expandedCategories.has("Web Apps") && (
                                            <div className="space-y-0.5 mt-1 ml-3">
                                                {getToolsForCategory("Web Apps").map((tool) => (
                                                    <Link
                                                        key={tool.id}
                                                        href={`/tools/${tool.id}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                                    >
                                                        <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                            </svg>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{tool.name}</span>
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
                                            <div key={cat}>
                                                <button
                                                    onClick={() => toggleCategory(cat)}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 font-bold text-slate-900">
                                                        {cat}
                                                        <span className="text-xs font-normal text-slate-400">({tools.length})</span>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategories.has(cat) ? "rotate-180" : ""}`}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                    </svg>
                                                </button>
                                                {expandedCategories.has(cat) && (
                                                    <div className="space-y-0.5 mt-1 ml-3">
                                                        {tools.map((tool) => (
                                                            <Link
                                                                key={tool.id}
                                                                href={`/tools/${tool.id}`}
                                                                onClick={() => setMobileMenuOpen(false)}
                                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                                            >
                                                                <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700">{tool.name}</span>
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
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 space-y-3 shrink-0">
                    <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-center rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-center rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/50 transition-colors"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>
    );
}
