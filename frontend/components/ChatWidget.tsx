"use client";

import { useState, useEffect, useRef } from "react";
import ChatInterface from "./tools/ChatInterface";

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={widgetRef} className="hidden sm:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-2">

            {/* Popover Window */}
            {isOpen && (
                <div className="w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200 flex flex-col">
                    <div className="p-4 bg-purple-600 text-white flex justify-between items-center shadow-sm">
                        <div className="font-bold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                            Smart Action Bot
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-purple-700 p-1 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* Reuse ChatInterface with custom class to fit height */}
                    <ChatInterface className="flex-1 flex flex-col overflow-hidden bg-slate-50" />
                </div>
            )}

            {/* Info Bubble (Shown when closed) */}
            {!isOpen && (
                <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 mb-2 animate-bounce cursor-pointer items-center gap-2 hidden md:flex" onClick={() => setIsOpen(true)}>
                    <span className="text-sm font-bold text-slate-700">Let me do it for you 🤖</span>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-105 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
