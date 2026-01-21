"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import LiveStats from "@/components/LiveStats";

export default function ToolsLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={`max-w-7xl mx-auto flex flex-col lg:flex-row px-4 sm:px-6 lg:px-8 pt-4 pb-12 relative min-h-[80vh] ${isSidebarOpen ? "gap-8" : "gap-0"}`}>
            {/* Live Stats Widget */}
            <LiveStats />

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 bg-background lg:bg-card lg:border lg:border-border lg:rounded-3xl shadow-2xl lg:shadow-sm transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                lg:static lg:overflow-hidden lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24
                ${isSidebarOpen
                    ? "translate-x-0 w-80 lg:w-72 opacity-100" // Open state (mobile & desktop)
                    : "-translate-x-full w-80 lg:w-0 lg:border-none lg:p-0 opacity-0 overflow-hidden" // Closed state
                }
            `}>
                <div className="h-full flex flex-col min-w-[18rem]">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary">
                                <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                            Tools Menu
                        </h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-all active:scale-95"
                            aria-label="Close Sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden animate-in fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={`flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] mx-auto w-full ${isSidebarOpen ? "" : "max-w-5xl"}`}>

                {/* Toggle Button (Visible when sidebar is closed) */}
                <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${!isSidebarOpen ? 'max-h-20 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-border rounded-2xl shadow-sm hover:shadow-md hover:bg-secondary/50 text-sm font-semibold text-foreground transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        Show All Tools
                    </button>
                </div>

                {children}
            </main>
        </div>
    );
}
