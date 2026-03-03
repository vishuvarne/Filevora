"use client";

import Link from "next/link";
import {
    CloudArrowUpIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { importCloudFile, getDownloadUrl } from "../../lib/api";
import { useRouter } from "next/navigation";
import { useSharedPathname } from "@/lib/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TOOLS } from "@/config/tools";
import AuthButtons from "../AuthButtons";

// Lazy load Mega Menu for performance
const MegaMenu = dynamic(() => import("./MegaMenu"), {
    loading: () => <div className="h-64 w-full bg-background animate-pulse" />,
    ssr: false
});
import ThemeToggle from "../ui/ThemeToggle";
import DesignStyleToggle from "../ui/DesignStyleToggle";
import GlobalSearch from "../GlobalSearch";
import { useFavorites } from "../../hooks/useFavorites";
import { useFileHistory } from "../../hooks/useFileHistory";
import { useDesignStyle } from "@/context/ThemeStyleContext";

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
    const pathname = useSharedPathname();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
    const [favoritesOpen, setFavoritesOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Web Apps"]));
    const [showAllTools, setShowAllTools] = useState(false);
    const { favorites } = useFavorites();
    const { history, clearHistory } = useFileHistory();
    const { isNeu } = useDesignStyle();

    // Unified Global Event Listeners (Click Outside + Keyboard Shortcuts)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Close favorites (Library) if open and not clicking inside
            if (favoritesOpen && !target.closest('[data-favorites-dropdown]')) {
                setFavoritesOpen(false);
            }
            // Close mega menu if open and not clicking inside a category
            if (activeCategory && !target.closest('.navbar-category') && !target.closest('.mega-menu-content')) {
                setActiveCategory(null);
                setShowAllTools(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setDesktopSearchOpen(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [favoritesOpen, activeCategory]);

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
            className={isNeu
                ? "sticky top-0 z-50 transition-all font-spaceGrotesk duration-300"
                : "border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all font-sans duration-300"
            }
            style={isNeu ? {
                background: "var(--nb-card)",
            } : undefined}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link
                        href="/"
                        prefetch={false}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 z-[60] shrink-0 group"
                    >
                        <div className={isNeu
                            ? "w-10 h-10 flex items-center justify-center text-xl font-black rounded-[var(--nb-r-md)] transition-all"
                            : "w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105"
                        }
                            style={isNeu ? {
                                background: "var(--nb-pink)",
                                border: "3px solid var(--nb-border)",
                                boxShadow: "var(--nb-shadow-sm)",
                                color: "var(--nb-text)",
                            } : undefined}
                        >
                            C
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            Convert<span className="text-primary">Locally</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0 px-2 lg:px-4">
                        {CATEGORIES.map((category) => {
                            const labelMap: Record<string, string> = {
                                "Video & Audio": "Video",
                                "Image": "Image",
                                "PDF & Documents": "PDF",
                                "GIF": "GIF",
                                "Others": "More",
                                "Web Apps": "Apps"
                            };
                            return (
                                <div
                                    key={category}
                                    className="navbar-category relative group px-2 xl:px-4 py-8 cursor-pointer shrink-0"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (activeCategory !== category) setShowAllTools(false);
                                        setActiveCategory(activeCategory === category ? null : category);
                                    }}
                                    onMouseEnter={() => {
                                        if (activeCategory && activeCategory !== category) {
                                            setShowAllTools(false);
                                            setActiveCategory(category);
                                        }
                                    }}
                                >
                                    <div className={`flex items-center gap-1.5 text-[15px] font-semibold transition-all duration-200 ${activeCategory === category ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                                        {category === "Web Apps" && (
                                            <span className={`w-2 h-2 rounded-full transition-colors ${activeCategory === category ? "bg-green-500 animate-pulse" : "bg-green-500/70"}`} aria-hidden />
                                        )}
                                        <span className="truncate tracking-wide">{labelMap[category] || category}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-300 ${activeCategory === category ? "rotate-180 text-primary" : "text-muted-foreground/50 group-hover:text-primary"}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                    {/* Highlight Bar */}
                                    <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 origin-left ${activeCategory === category ? "scale-x-100" : "scale-x-0"}`} />
                                </div>
                            )
                        })}
                    </div>

                    <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
                        {/* Library Dropdown (Combined Favorites & History) */}
                        <div className="relative" data-favorites-dropdown>
                            <button
                                onClick={() => setFavoritesOpen(!favoritesOpen)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all relative"
                                aria-label="My Library"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                                {(favorites.length > 0 || history.length > 0) && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] min-w-[1.125rem] h-4.5 px-0.5 rounded-full flex items-center justify-center font-bold shadow-sm ring-2 ring-background">
                                        {favorites.length + history.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Content */}
                            {favoritesOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-[250] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                    {/* Tabs */}
                                    <div className="flex border-b border-border bg-secondary/30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setHistoryOpen(false);
                                            }}
                                            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${!historyOpen ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                                        >
                                            Favorites ({favorites.length})
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setHistoryOpen(true);
                                            }}
                                            className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${historyOpen ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                                        >
                                            History ({history.length})
                                        </button>
                                    </div>

                                    {/* Content Area */}
                                    <div className="max-h-96 overflow-y-auto bg-background">
                                        {!historyOpen ? (
                                            // Favorites View
                                            <div className="p-1">
                                                {favorites.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                        </svg>
                                                        <p className="text-xs text-muted-foreground">Star tools to save them</p>
                                                    </div>
                                                ) : (
                                                    favorites.map(toolId => {
                                                        const tool = TOOLS.find(t => t.id === toolId);
                                                        if (!tool) return null;
                                                        return (
                                                            <Link
                                                                key={tool.id}
                                                                href={`/tools/${tool.id}/`}
                                                                prefetch={false}
                                                                onClick={() => setFavoritesOpen(false)}
                                                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors m-1"
                                                            >
                                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-bold text-foreground truncate">{tool.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground truncate">{tool.category}</div>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        ) : (
                                            // History View
                                            <div className="p-1">
                                                {history.length > 0 && (
                                                    <div className="px-3 py-2 border-b border-border flex justify-end">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                                                            className="text-[10px] text-red-500 hover:text-red-600 font-medium"
                                                        >
                                                            Clear History
                                                        </button>
                                                    </div>
                                                )}
                                                {history.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <p className="text-xs text-muted-foreground">Processed files appear here</p>
                                                    </div>
                                                ) : (
                                                    history.map(item => (
                                                        <a
                                                            key={item.id}
                                                            href={item.downloadUrl}
                                                            download
                                                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors m-1 group/item"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-primary/10 text-primary">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-bold text-foreground truncate">{item.fileName}</div>
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    <span>•</span>
                                                                    <span>{item.size || 'Done'}</span>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Icon - Opens Overlay */}
                        <button
                            onClick={() => setDesktopSearchOpen(true)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all"
                            aria-label="Search tools"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </button>
                        <ThemeToggle />
                        <DesignStyleToggle />
                        <div className="h-5 w-[1px] bg-border mx-1"></div>
                        <AuthButtons />
                    </div>

                    <div className="lg:hidden flex items-center gap-2 z-[60] shrink-0">
                        <ThemeToggle />
                        <DesignStyleToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={isNeu
                                ? `p-2.5 -mr-2 rounded-[var(--nb-r-md)] transition-all duration-200 ${mobileMenuOpen ? 'bg-secondary' : 'bg-background hover:-translate-y-0.5'} border-[3px] border-slate-900 shadow-[var(--nb-shadow-sm)] hover:shadow-[var(--nb-shadow-md)] active:shadow-none active:translate-y-0 text-slate-800 dark:text-slate-200`
                                : "p-2.5 -mr-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-110 active:scale-95"
                            }
                            aria-expanded={mobileMenuOpen}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            <span className="sr-only">{mobileMenuOpen ? "Close" : "Menu"}</span>
                            {mobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isNeu ? 3 : 2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isNeu ? 3 : 2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Mega Menu Dropdown */}
            <div
                className={`hidden lg:block absolute left-0 w-full bg-background border-b border-border shadow-xl shadow-black/5 transition-all duration-300 ease-out origin-top z-[45] ${activeCategory ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 pointer-events-none invisible"}`}
                style={{ contentVisibility: activeCategory ? 'visible' : 'auto' } as any}
            >
                {activeCategory && (
                    <MegaMenu
                        activeCategory={activeCategory}
                        showAllTools={showAllTools}
                        setShowAllTools={setShowAllTools}
                        setActiveCategory={setActiveCategory}
                    />
                )}
            </div>

            {/* Desktop Search Overlay */}
            {desktopSearchOpen && (
                <>
                    <div
                        className="hidden lg:block fixed inset-0 bg-black/40 z-[200] animate-in fade-in duration-200"
                        onClick={() => setDesktopSearchOpen(false)}
                    />
                    <div className="hidden lg:block fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[201] px-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-background rounded-2xl shadow-2xl border border-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground">Search Tools</h3>
                                <button
                                    onClick={() => setDesktopSearchOpen(false)}
                                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                    aria-label="Close search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <GlobalSearch className="w-full" />
                        </div>
                    </div>
                </>
            )}

            {/* Mobile: Backdrop */}
            {mobileMenuOpen && (
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/40 z-[100] animate-in fade-in duration-300"
                    aria-label="Close menu"
                />
            )}

            {/* Mobile: Drawer */}
            <div
                className={`lg:hidden fixed top-0 right-0 h-[100dvh] w-[90vw] max-w-sm bg-background border-l border-border shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none invisible"}`}
                {...({ inert: !mobileMenuOpen ? true : undefined } as any)}
            >
                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                    <span className="font-bold text-lg">Menu</span>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:bg-secondary/80 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
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
                                                href={`/tools/${tool.id}/`}
                                                prefetch={false}
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

                        {/* My Favorites (mobile) */}
                        {!searchQuery && favorites.length > 0 && (
                            <div className="bg-secondary rounded-2xl p-4 border border-border">
                                <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-yellow-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                    My Favorites
                                    <span className="text-xs font-normal text-muted-foreground ml-auto">{favorites.length} / 10</span>
                                </h3>
                                <div className="space-y-1">
                                    {favorites.map(toolId => {
                                        const tool = TOOLS.find(t => t.id === toolId);
                                        if (!tool) return null;
                                        return (
                                            <Link
                                                key={tool.id}
                                                href={`/tools/${tool.id}/`}
                                                prefetch={false}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background active:bg-secondary transition-colors border border-border/50 hover:border-border shadow-sm"
                                            >
                                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tool.theme.bgLight} ${tool.theme.text}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-foreground truncate">{tool.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{tool.category}</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Recent History (mobile) */}
                        {!searchQuery && history.length > 0 && (
                            <div className="bg-secondary rounded-2xl p-4 border border-border">
                                <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Recent Files
                                    <button
                                        onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                                        className="ml-auto text-xs text-red-500 hover:text-red-700"
                                    >
                                        Clear
                                    </button>
                                </h3>
                                <div className="space-y-1">
                                    {history.map(item => (
                                        <a
                                            key={item.id}
                                            href={item.downloadUrl}
                                            download
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background active:bg-secondary transition-colors border border-border/50 hover:border-border shadow-sm"
                                        >
                                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-primary/10 text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-foreground truncate">{item.fileName}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.size || 'Done'}
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
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
                                                href={`/tools/${tool.id}/`}
                                                prefetch={false}
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
                                    <Link
                                        href="/#tools"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between font-bold text-foreground px-1 py-3 text-sm uppercase tracking-wider hover:text-primary transition-colors"
                                    >
                                        <span>All Tools</span>
                                        <div className="flex items-center gap-1.5 text-xs text-primary normal-case tracking-normal font-semibold bg-primary/10 px-2 py-1 rounded-full">
                                            <span>View Grid</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                            </svg>
                                        </div>
                                    </Link>

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
                                                        href={`/tools/${tool.id}/`}
                                                        prefetch={false}
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
                                                                href={`/tools/${tool.id}/`}
                                                                prefetch={false}
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
                        prefetch={false}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3.5 text-center rounded-xl border border-input font-bold text-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/signup"
                        prefetch={false}
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
