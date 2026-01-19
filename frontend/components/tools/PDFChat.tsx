"use client";

import { useState } from "react";
import Dropzone from "@/components/Dropzone";

interface ChatMessage {
    role: "user" | "ai";
    content: string;
}

export default function PDFChat() {
    const [file, setFile] = useState<File | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFile = async (files: File[]) => {
        if (files[0]) {
            setFile(files[0]);
            setIsProcessing(true);

            // Initial upload to get text context
            const formData = new FormData();
            formData.append("file", files[0]);

            try {
                const res = await fetch("https://filevora.onrender.com/process/chat-pdf-init", {
                    method: "POST",
                    body: formData
                });

                if (res.ok) {
                    setMessages([{ role: "ai", content: `I've analyzed **${files[0].name}**. You can now ask me questions about it!` }]);
                } else {
                    setMessages([{ role: "ai", content: "Failed to analyze PDF. Please try again." }]);
                }
            } catch (e) {
                setMessages([{ role: "ai", content: "Error connecting to server." }]);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !file) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            // In a real app, we'd send the session ID or file hash + query
            // Here we re-send file or use a lightweight approach for demo
            // Ideally backend caches the text content based on filename/hash
            const formData = new FormData();
            formData.append("file", file); // Sending file again for stateless demo simplicity
            formData.append("query", userMsg);

            const res = await fetch("https://filevora.onrender.com/process/chat-pdf-query", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            setMessages(prev => [...prev, { role: "ai", content: data.answer || "I couldn't find an answer." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: "ai", content: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {!file ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H18m0-4.5h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Chat with PDF</h3>
                    <p className="text-slate-500 mb-8">Upload a document to start analyzing.</p>
                    <div className="w-full max-w-lg">
                        <Dropzone onFilesSelected={handleFile} acceptedTypes=".pdf" multiple={false} label="Drop PDF here" />
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div className="font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {file.name}
                        </div>
                        <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:text-red-600 font-bold px-3 py-1 rounded bg-white border border-slate-200">
                            Change File
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
                        {isProcessing && (
                            <div className="flex justify-center p-4">
                                <span className="loading loading-dots loading-md text-purple-600">Analyzing...</span>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-purple-600 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"
                                    }`}>
                                    {/* eslint-disable-next-line react/no-danger */}
                                    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all text-slate-700"
                                placeholder="Ask a question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                disabled={isLoading || isProcessing}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading || isProcessing}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
