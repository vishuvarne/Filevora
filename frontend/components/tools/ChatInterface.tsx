"use client";

import { useState, useRef, useEffect, Suspense, lazy } from "react";
import Link from "next/link";
import Dropzone from "@/components/Dropzone";
import { processJob, getDownloadUrl } from "@/lib/api";
import { TOOLS, ToolDef } from "@/config/tools";

import ErrorBoundary from "../ErrorBoundary";

// Lazy load interactive tools
const CollageMaker = lazy(() => import("./CollageMaker"));
const ColorPicker = lazy(() => import("./ColorPicker"));
const ImageCompressor = lazy(() => import("./ImageCompressor"));
const ImageCropper = lazy(() => import("./ImageCropper"));
const ImageResizer = lazy(() => import("./ImageResizer"));
const MemeGenerator = lazy(() => import("./MemeGenerator"));
const PhotoEditor = lazy(() => import("./PhotoEditor"));
const QRCodeGenerator = lazy(() => import("./QRCodeGenerator"));
const TimeConverter = lazy(() => import("./TimeConverter"));
const UnitConverter = lazy(() => import("./UnitConverter"));
const VoiceRecorder = lazy(() => import("./VoiceRecorder"));
const PDFChat = lazy(() => import("./PDFChat"));

const TOOL_COMPONENTS: Record<string, any> = {
    "collage-maker": CollageMaker,
    "color-picker": ColorPicker,
    "image-compressor": ImageCompressor,
    "crop-image": ImageCropper,
    "image-resizer": ImageResizer,
    "meme-generator": MemeGenerator,
    "photo-editor": PhotoEditor,
    "qr-code-generator": QRCodeGenerator,
    "time-converter": TimeConverter,
    "unit-converter": UnitConverter,
    "voice-recorder": VoiceRecorder,
    "chat-with-pdf": PDFChat
};

interface Message {
    role: "user" | "assistant";
    content: string;
    attachment?: {
        filename: string;
        url: string;
    };
    cta?: {
        label: string;
        url: string;
    };
}

export default function ChatInterface({ className }: { className?: string }) {
    const [files, setFiles] = useState<File[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [activeToolId, setActiveToolId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleFilesSelected = (selectedFiles: File[]) => {
        if (selectedFiles.length > 0) {
            setFiles(selectedFiles);
            const fileNames = selectedFiles.map(f => `**${f.name}**`).join(", ");
            setMessages([
                { role: "assistant", content: `I've received ${fileNames}. What should I do? (e.g. "Merge them", "Convert to PNG", "Compress")` }
            ]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- UNIVERSAL AGENT LOGIC ---
    const handleCommand = async (command: string, targetFiles: File[]) => {
        const lowerCmd = command.toLowerCase();

        // 1. Special Case Matchers (High Priority)
        let matchedTool: ToolDef | undefined;

        // Merge logic
        if (lowerCmd.includes("merge") || lowerCmd.includes("combine") || lowerCmd.includes("join")) {
            const isVideo = lowerCmd.includes("video") || targetFiles[0]?.type.includes("video");
            matchedTool = TOOLS.find(t => t.id === (isVideo ? "merge-video" : "merge-pdf"));
        }
        // Conversion logic (PDF to/from formats)
        else if (lowerCmd.includes("convert") || lowerCmd.includes("change") || lowerCmd.includes("make it") || lowerCmd.includes("to ")) {
            const formats = ["png", "jpg", "jpeg", "webp", "pdf", "gif", "bmp", "tiff", "docx", "word", "epub", "mp3", "mp4", "gif"];

            let targetFormat = "";
            const toIndex = lowerCmd.lastIndexOf("to ");
            if (toIndex !== -1) {
                const afterTo = lowerCmd.substring(toIndex + 3).trim();
                targetFormat = formats.find(f => afterTo.includes(f)) || "";
            }
            if (!targetFormat) {
                targetFormat = formats.find(f => lowerCmd.includes(f)) || "";
            }

            if (targetFormat) {
                const isPdfSource = targetFiles[0]?.type.includes("pdf") || targetFiles[0]?.name.toLowerCase().endsWith(".pdf");
                const isVideoSource = targetFiles[0]?.type.includes("video");

                if (targetFormat === "pdf") {
                    matchedTool = TOOLS.find(t => t.id === "image-to-pdf"); // Note: docx-to-pdf etc could be here if implemented
                } else if (isPdfSource) {
                    matchedTool = TOOLS.find(t => t.id === (targetFormat === "docx" || targetFormat === "word" ? "pdf-to-word" : "pdf-to-image"));
                } else if (isVideoSource && (targetFormat === "gif" || targetFormat === "mp4")) {
                    matchedTool = TOOLS.find(t => t.id === (targetFormat === "gif" ? "video-to-gif" : "video-to-mp4"));
                } else if (targetFormat === "mp3") {
                    matchedTool = TOOLS.find(t => t.id === "video-to-mp3");
                } else {
                    matchedTool = TOOLS.find(t => t.id === "convert-image");
                }
            }
        }

        // 2. Keyword/Universal Search (Fallback)
        if (!matchedTool) {
            // Rank tools by keyword match in name, description, and id
            const weightedTools = TOOLS.map(tool => {
                let score = 0;
                const toolName = tool.name.toLowerCase();
                const toolDesc = tool.description.toLowerCase();

                if (lowerCmd.includes(tool.id)) score += 5;
                if (lowerCmd.includes(toolName)) score += 10;

                // Splitting command into words for keyword matching
                const words = lowerCmd.split(/\W+/);
                words.forEach(word => {
                    if (word.length < 3) return;
                    if (toolName.includes(word)) score += 2;
                    if (toolDesc.includes(word)) score += 1;
                });

                return { tool, score };
            });

            const bestMatch = weightedTools.sort((a, b) => b.score - a.score)[0];
            if (bestMatch && bestMatch.score > 3) {
                matchedTool = bestMatch.tool;
            }
        }

        if (!matchedTool) {
            return "I'm not sure which tool to use. Try being more specific, like 'merge these PDFs', 'convert image to webp', or 'chat with this PDF'.";
        }

        // 3. Handle Interactive Tools (Embed)
        if (matchedTool.type === "interactive") {
            setActiveToolId(matchedTool.id);
            return `I've opened the **${matchedTool.name}** for you right here.`;
        }

        // 4. Handle Coming Soon
        if (matchedTool.endpoint === "/coming-soon") {
            return `I've identified that you want to use **${matchedTool.name}**, but that feature is currently in development. Stay tuned!`;
        }

        // 5. Build Request
        const formData = new FormData();
        if (matchedTool.multiple) {
            targetFiles.forEach(f => formData.append("files", f));
        } else {
            formData.append("file", targetFiles[0]);
        }

        // Extract parameters (Format/Angle/Quality)
        if (matchedTool.id === "convert-image" || matchedTool.id === "pdf-to-image" || matchedTool.id === "pdf-to-word") {
            const formats = ["png", "jpeg", "webp", "bmp", "tiff", "jpg", "docx"];
            let fmt = formats.find(f => lowerCmd.includes(f)) || "png";
            if (fmt === "jpg") fmt = "jpeg";
            if (fmt === "word") fmt = "docx";
            formData.append(matchedTool.endpoint.includes("pdf-to-image") ? "format" : "target_format", fmt.toUpperCase());
        }

        if (matchedTool.id === "rotate-image") {
            const angles = ["90", "180", "270"];
            const angle = angles.find(a => lowerCmd.includes(a)) || "90";
            formData.append("angle", angle);
        }

        if (lowerCmd.includes("quality") || lowerCmd.includes("compress")) {
            const qualityMatch = lowerCmd.match(/(\d+)%/);
            if (qualityMatch) {
                formData.append("quality", qualityMatch[1]);
            }
        }

        // 6. Execute
        try {
            const res = await processJob(matchedTool.endpoint, formData);
            return {
                text: `✨ Done! I've processed your files using the **${matchedTool.name}** tool. Here is the result:`,
                attachment: {
                    filename: res.filename,
                    url: getDownloadUrl(res.download_url)
                }
            };
        } catch (e: any) {
            return `❌ Ops! I ran into an error while using **${matchedTool.name}**: ${e.message || "Unknown error"}`;
        }
    };

    const handleSend = async () => {
        if (!input.trim() || files.length === 0) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        try {
            const result = await handleCommand(userMsg, files);

            let responseMsg: Message = { role: "assistant", content: "" };

            if (typeof result === "string") {
                responseMsg.content = result;
            } else if (result && typeof result === "object") {
                responseMsg.content = result.text;
                responseMsg.attachment = result.attachment;
                responseMsg.cta = (result as any).cta;
            }

            setMessages(prev => [...prev, responseMsg]);

        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an internal error." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const ToolComponent = activeToolId ? TOOL_COMPONENTS[activeToolId] : null;

    return (
        <div className={className || "bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden h-[750px] flex flex-col max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700"}>

            {activeToolId && ToolComponent && (
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md shrink-0">
                        <div className="flex items-center gap-2 font-bold">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {TOOLS.find(t => t.id === activeToolId)?.name}
                        </div>
                        <button
                            onClick={() => setActiveToolId(null)}
                            className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/10 font-bold"
                        >
                            Back to Chat
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
                        <Suspense fallback={
                            <div className="h-full flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
                                <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
                                <div className="font-bold text-sm tracking-widest uppercase">Initializing Tool...</div>
                            </div>
                        }>
                            <ErrorBoundary>
                                <ToolComponent />
                            </ErrorBoundary>
                        </Suspense>
                    </div>
                </div>
            )}

            {!activeToolId && (
                files.length === 0 ? (
                    <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-purple-600 mb-6 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Smart Action Agent</h2>
                        <p className="text-slate-500 mb-10 max-w-md text-lg font-medium leading-relaxed">
                            Drop your files here and tell me what to do. <br />
                            <span className="text-purple-600">"Merge these PDFs"</span>, <span className="text-purple-600">"Convert to PNG"</span>, etc.
                        </p>
                        <div className="w-full max-w-xl">
                            <Dropzone
                                onFilesSelected={handleFilesSelected}
                                acceptedTypes="*"
                                multiple={true}
                                label="Drop files to start the magic"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shadow-lg shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3 overflow-hidden p-1">
                                    {files.slice(0, 3).map((f, i) => (
                                        <div key={i} className="w-10 h-10 bg-white/20 backdrop-blur-md border-2 border-slate-900 rounded-xl flex items-center justify-center text-[10px] font-bold">
                                            {f.name.split('.').pop()?.toUpperCase()}
                                        </div>
                                    ))}
                                    {files.length > 3 && (
                                        <div className="w-10 h-10 bg-purple-600 border-2 border-slate-900 rounded-xl flex items-center justify-center text-[10px] font-bold">
                                            +{files.length - 3}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-sm tracking-tight">{files.length} File{files.length > 1 ? 's' : ''} Loaded</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                                        AI Agent Active
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setFiles([])}
                                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/5"
                            >
                                Reset
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] rounded-[2rem] p-5 shadow-sm text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-purple-600 text-white rounded-br-none"
                                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                                        }`}>
                                        <div dangerouslySetInnerHTML={{
                                            __html: msg.content
                                                .replace(/&/g, "&amp;")
                                                .replace(/</g, "&lt;")
                                                .replace(/>/g, "&gt;")
                                                .replace(/"/g, "&quot;")
                                                .replace(/'/g, "&#039;")
                                                .replace(/\n/g, '<br/>')
                                                .replace(/\*\*(.*?)\*\*/g, '<b class="font-bold text-inherit">$1</b>')
                                                .replace(/&lt;br\/&gt;/g, '<br/>') // Restore our own br tags
                                                .replace(/&lt;b class=&quot;font-bold text-inherit&quot;&gt;(.*?)&lt;\/b&gt;/g, '<b class="font-bold text-inherit">$1</b>') // Restore our own b tags
                                        }} />

                                        {msg.attachment && (
                                            <a
                                                href={msg.attachment.url}
                                                download={msg.attachment.filename}
                                                className="mt-4 flex items-center gap-4 bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-all group no-underline shadow-xl"
                                            >
                                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold truncate text-sm">{msg.attachment.filename}</div>
                                                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Download Ready</div>
                                                </div>
                                            </a>
                                        )}

                                        {msg.cta && (
                                            <Link
                                                href={msg.cta.url}
                                                className="mt-4 flex items-center justify-center gap-2 bg-purple-600 text-white p-4 rounded-2xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-200 no-underline"
                                            >
                                                {msg.cta.label}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                </svg>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 rounded-bl-none shadow-sm flex gap-1.5 items-center">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                            <div className="flex gap-3 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
                                <input
                                    className="flex-1 bg-transparent px-4 py-3 outline-none font-bold text-slate-700 placeholder:text-slate-400 text-sm"
                                    placeholder="Type a command (e.g. 'Convert to JPG', 'Merge')"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-6 font-black transition-all shadow-lg shadow-purple-200"
                                >
                                    SEND
                                </button>
                            </div>
                        </div>
                    </>
                )
            )}
        </div>
    );
}
