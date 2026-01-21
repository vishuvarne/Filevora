import { Metadata } from "next";
import { TOOLS } from "@/config/tools";
import ToolCard from "@/components/ToolCard";
import ToolsGrid from "@/components/ToolsGrid";
import SecuritySection from "@/components/SecuritySection";

export const metadata: Metadata = {
  title: "FileVora - Premium Online File Converter | PDF, Image, Video Tools",
  description: "Free online converter with 60+ tools. Merge PDFs, convert PDF to Word/Excel, compress images, create GIFs from videos. No signup, no watermarks, unlimited use.",
  keywords: [
    "pdf to word", "pdf to excel", "merge pdf", "compress pdf", "pdf to jpg", "split pdf", "pdf converter free", "combine pdf",
    "jpg to pdf", "png to jpg", "webp to png", "heic to jpg", "image converter", "compress image",
    "video to gif", "mp4 to gif", "gif maker online",
    "free file converter", "online converter no registration", "file converter no watermark",
    "unlimited file conversion free", "best free pdf tools", "online file tools",
    "file converter for mobile", "convert files without software", "online converter works on all devices"
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">

      {/* Hero Section */}
      <div className="relative isolate pt-14 dark:bg-slate-900">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-7xl mb-8 leading-[1.1]">
                Every tool you need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">process your files.</span>
              </h1>
              <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
                Merge, split, compress, convert, and more. Simple, secure, and 100% free to use. No limits, no watermarks.
              </p>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a href="#tools" className="rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 active:scale-[0.98] active:translate-y-0 active:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Explore Tools
                </a>
                <a href="/about" className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span>TLS Encryption</span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Auto-Deletion (1h)</span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span>Lightning Fast</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Tools Grid Section */}
        <div className="relative -mt-20 z-30">
          <ToolsGrid />
        </div>

        {/* How It Works */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How it Works</h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Simple, fast, and secure file processing in 3 easy steps.
            </p>
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid max-w-2xl grid-cols-1 gap-8 mx-auto lg:max-w-none lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Upload File",
                  desc: "Drag & drop your file or tap to select. We support 100+ formats.",
                  icon: (
                    <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )
                },
                {
                  step: "02",
                  title: "Process Instantly",
                  desc: "Our powerful cloud servers process your files in seconds.",
                  icon: (
                    <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )
                },
                {
                  step: "03",
                  title: "Download Securely",
                  desc: "Get your result immediately. Files are auto-deleted after 1 hour.",
                  icon: (
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300 relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl font-black select-none pointer-events-none text-foreground">
                    {item.step}
                  </div>
                  <div className="mb-6 p-4 rounded-2xl bg-secondary group-hover:bg-background group-hover:shadow-md transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32 rounded-3xl mb-24">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2850&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-900 via-slate-900/40"></div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-shadow-sm">Trusted by millions worldwide</h2>
                <p className="mt-4 text-lg leading-8 text-gray-300">
                  Processed securely and efficiently. Join our growing community of happy users.
                </p>
              </div>
              <dl className="mt-16 grid grid-cols-2 gap-8 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Files Processed", value: "15M+" },
                  { label: "Happy Users", value: "2M+" },
                  { label: "Daily Conversions", value: "50k+" },
                  { label: "Tools Available", value: "60+" }
                ].map((stat, idx) => (
                  <div key={idx} className="flex flex-col bg-white/5 p-8 backdrop-blur-3xl hover:bg-white/10 transition-colors">
                    <dt className="text-sm font-semibold leading-6 text-gray-300">{stat.label}</dt>
                    <dd className="order-first text-3xl font-semibold tracking-tight text-white">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <div className="mb-24">
          <SecuritySection />
        </div>
      </div>
    </main>
  );
}
