import { Metadata } from "next";
import { TOOLS } from "@/config/tools";
import ToolCard from "@/components/ToolCard";
import ToolsGrid from "@/components/ToolsGrid";
import SecuritySection from "@/components/SecuritySection";

export const metadata: Metadata = {
  title: "FileVora - Free Online File Converter | PDF, Image, Video Tools",
  description: "Free online converter with 60+ tools. Merge PDFs, convert PDF to Word/Excel, compress images, create GIFs from videos. No signup, no watermarks, unlimited use.",
  keywords: [
    // High-volume PDF keywords
    "pdf to word",
    "pdf to excel",
    "merge pdf",
    "compress pdf",
    "pdf to jpg",
    "split pdf",
    "pdf converter free",
    "combine pdf",

    // Image conversion keywords
    "jpg to pdf",
    "png to jpg",
    "webp to png",
    "heic to jpg",
    "image converter",
    "compress image",

    // Video keywords
    "video to gif",
    "mp4 to gif",
    "gif maker online",

    // Competitive advantage keywords
    "free file converter",
    "online converter no registration",
    "file converter no watermark",
    "unlimited file conversion free",
    "best free pdf tools",
    "online file tools",

    // Device/platform keywords
    "file converter for mobile",
    "convert files without software",
    "online converter works on all devices"
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <header className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Every tool you need to process your files.
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Merge, split, compress, convert, and more.
            <br className="hidden sm:block" />
            Simple, secure, and 100% free to use.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span>TLS Encryption</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>Auto-Deletion (1h)</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>Lightning Fast</span>
            </div>
          </div>
        </header>

        {/* Tools Grid */}
        <ToolsGrid />

        <div className="mt-24">
          <SecuritySection />
        </div>
      </div>
    </main>
  );
}
