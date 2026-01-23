"use client";

import { useState, useEffect, useRef } from "react";
import { TOOLS, type ToolDef } from "@/config/tools";
import Link from "next/link";

interface GlobalSearchProps {
    className?: string;
}

export default function GlobalSearch({ className = "" }: GlobalSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ToolDef[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                const filtered = TOOLS.filter(tool =>
                    tool.name.toLowerCase().includes(query.toLowerCase()) ||
                    tool.description.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 8); // Max 8 results
                setResults(filtered);
                setIsOpen(true);
                setSelectedIndex(0);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 200); // 200ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
                break;
            case "Enter":
                e.preventDefault();
                if (results[selectedIndex]) {
                    window.location.href = `/tools/${results[selectedIndex].id}`;
                }
                break;
            case "Escape":
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, "gi"));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200 text-foreground font-semibold">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search tools..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground placeholder:text-muted-foreground transition-all"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                </svg>
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.map((tool, index) => (
                        <Link
                            key={tool.id}
                            href={`/tools/${tool.id}`}
                            onClick={() => {
                                setIsOpen(false);
                                setQuery("");
                            }}
                            className={`block px-4 py-3 hover:bg-secondary transition-colors ${index === selectedIndex ? "bg-secondary" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-semibold text-foreground">
                                        {highlightMatch(tool.name, query)}
                                    </div>
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                        {highlightMatch(tool.description, query)}
                                    </div>
                                </div>
                                <span className="ml-3 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                                    {tool.category}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {isOpen && results.length === 0 && query && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 p-4 text-center text-muted-foreground animate-in fade-in duration-200">
                    No tools found for "{query}"
                </div>
            )}
        </div>
    );
}
