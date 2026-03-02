"use client";

import React, { useState, useRef, useEffect } from "react";

export interface FormatOption {
    value: string;
    label: string;
}

export interface FormatSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: FormatOption[];
    theme?: "dark" | "light";
}

export default function FormatSelector({ value, onChange, options, theme = "light" }: FormatSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search query
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Theme styles
    const baseColors = theme === "dark"
        ? {
            btnBg: "bg-[#111318]",
            btnBorder: "border-slate-700/50",
            btnText: "text-white",
            ddBg: "bg-[#1A1D24]",
            ddBorder: "border-slate-700",
            inputBg: "bg-[#111318]",
            inputText: "text-white",
            inputBorder: "border-slate-700",
            itemHover: "hover:bg-indigo-500/20",
            itemSelected: "bg-indigo-500/40 text-white font-bold",
            itemText: "text-slate-300",
            placeholder: "placeholder-slate-500"
        }
        : {
            btnBg: "bg-slate-50 dark:bg-slate-800",
            btnBorder: "border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            btnText: "text-foreground",
            ddBg: "bg-white dark:bg-slate-800",
            ddBorder: "border-slate-200 dark:border-slate-700",
            inputBg: "bg-slate-50 dark:bg-slate-900",
            inputText: "text-foreground",
            inputBorder: "border-slate-200 dark:border-slate-700",
            itemHover: "hover:bg-slate-100 dark:hover:bg-slate-700",
            itemSelected: "bg-primary/10 text-primary font-bold dark:bg-primary/20",
            itemText: "text-foreground",
            placeholder: "placeholder-slate-400"
        };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearchQuery(""); // Reset search on open
                }}
                className={`w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl text-sm font-bold ${baseColors.btnBg} border ${baseColors.btnBorder} ${baseColors.btnText} outline-none focus:ring-2 focus:ring-primary/30 transition-colors`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : value}</span>
                <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} text-muted-foreground ml-2 flex-shrink-0`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className={`absolute z-50 w-full mt-2 rounded-xl border ${baseColors.ddBorder} ${baseColors.ddBg} shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top`}>
                    {/* Search Input */}
                    <div className="p-2 border-b border-inherit">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${baseColors.inputBg} border ${baseColors.inputBorder} ${baseColors.inputText} ${baseColors.placeholder} outline-none focus:ring-2 focus:ring-primary/50 transition-shadow`}
                                placeholder="Search format..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-40 md:max-h-60 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                        {filteredOptions.length > 0 ? (
                            <div className="p-1">
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${value === option.value
                                            ? baseColors.itemSelected
                                            : `${baseColors.itemText} ${baseColors.itemHover}`
                                            }`}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className={`p-4 text-center text-sm text-slate-500`}>
                                No formats found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
