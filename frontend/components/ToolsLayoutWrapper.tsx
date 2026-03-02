"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function ToolsLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={`w-full mx-auto flex flex-col px-0 pt-0 pb-0 relative`}>
            {/* Live Stats Removed */}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 bg-background lg:bg-card lg:border-r lg:border-border shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isSidebarOpen
                    ? "translate-x-0 w-80 opacity-100" // Open state
                    : "-translate-x-full w-80 opacity-0 overflow-hidden" // Closed state
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

            {/* Overlay (Mobile & Desktop) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-in fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={`flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] mx-auto w-full flex flex-col min-h-0`}>


                {children}
            </main>
        </div>
    );
}
