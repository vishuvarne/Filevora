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

        {/* How It Works */}
        <section className="mt-32 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              How it Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Simple, fast, and secure file processing in 3 easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload File",
                desc: "Drag & drop your file or tap to select. We support 100+ formats.",
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Process Instantly",
                desc: "Our powerful cloud servers process your files in seconds.",
                icon: (
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Download Securely",
                desc: "Get your result immediately. Files are auto-deleted after 1 hour.",
                icon: (
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((item, idx) => (
              <div key={idx} className="relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                <div className="absolute -top-6 left-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                  {item.icon}
                </div>
                <div className="mt-8">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2 block">Step {item.step}</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats & Trust */}
        <section className="py-20 border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Files Processed", value: "15M+" },
                { label: "Happy Users", value: "2M+" },
                { label: "Daily Conversions", value: "50k+" },
                { label: "Tools Available", value: "60+" }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-3xl md:text-5xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-24">
          <SecuritySection />
        </div>
      </div>
    </main>
  );
}
