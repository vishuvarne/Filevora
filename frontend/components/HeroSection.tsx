"use client";

import { useDesignStyle } from "@/context/ThemeStyleContext";
import Link from "next/link";

export default function HeroSection() {
    const { isNeu } = useDesignStyle();

    if (isNeu) {
        return (
            <div className="relative pt-4 sm:pt-6" style={{ background: "var(--nb-bg)" }}>
                <div className="py-2 sm:py-4">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl text-center">
                            <h1
                                className="font-spaceGrotesk text-3xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 leading-tight sm:leading-[1.1]"
                                style={{
                                    fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                    color: "var(--nb-text)",
                                }}
                            >
                                Process Files{" "}
                                <span
                                    className="inline-block"
                                    style={{
                                        background: "var(--nb-yellow)",
                                        padding: "0 12px",
                                        border: "3px solid var(--nb-border)",
                                        borderRadius: "var(--nb-r-sm)",
                                        boxShadow: "var(--nb-shadow-sm)",
                                        transform: "rotate(-1deg)",
                                    }}
                                >
                                    Locally.
                                </span>{" "}
                                <br className="hidden sm:block" />
                                No Limits. No Watermarks.
                            </h1>
                            <p
                                className="mt-2 sm:mt-3 text-base sm:text-lg leading-6 sm:leading-7 max-w-2xl mx-auto px-4 sm:px-0"
                                style={{ color: "var(--nb-text2)", fontWeight: 500 }}
                            >
                                60+ tools. Bank-grade encryption. Free forever.
                            </p>

                            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-4 px-4 sm:px-0">
                                <a href="#tools" className="nb-btn w-full sm:w-auto text-center !py-3 !px-8 !text-base">
                                    EXPLORE TOOLS
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CLASSIC HERO — Existing design unchanged
    return (
        <div className="relative isolate pt-14 dark:bg-slate-900">
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-primary/20 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] will-change-transform" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>

            <div className="py-16 sm:py-20 lg:pb-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-7xl mb-6 sm:mb-8 leading-tight sm:leading-[1.1]">
                            Process Files <span className="text-primary">Locally.</span> <br className="hidden sm:block" /> No Limits. No Watermarks.
                        </h1>
                        <p className="mt-4 sm:mt-6 text-lg sm:text-xl leading-7 sm:leading-8 text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                            60+ tools. Bank-grade encryption. Free forever.
                        </p>
                        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
                            <a href="#tools" className="w-full sm:w-auto rounded-xl bg-primary px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 ease-out hover:scale-[1.05] hover:-translate-y-1 hover:shadow-xl hover:brightness-110 active:scale-[0.98] active:translate-y-0 active:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:animate-pulse-subtle text-center">
                                Explore Tools
                            </a>
                            <Link href="/about" prefetch={false} className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors">
                                Learn more <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                        <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-muted-foreground px-4 sm:px-0">
                            <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-border/50">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <span>TLS Encryption</span>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-border/50">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Auto-Deletion (1h)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-border/50">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <span>Lightning Fast</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
                <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-primary/20 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] will-change-transform" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>
        </div>
    );
}
