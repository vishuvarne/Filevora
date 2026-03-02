"use client";

import { useDesignStyle } from "@/context/ThemeStyleContext";

const STEPS = [
    {
        step: "01",
        title: "Upload File",
        desc: "Drag & drop your file or tap to select. We support 100+ formats.",
        color: "var(--nb-mint)",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        ),
        classicIconColor: "text-blue-500",
    },
    {
        step: "02",
        title: "Process Instantly",
        desc: "Our powerful cloud servers process your files in seconds.",
        color: "var(--nb-lilac)",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
        classicIconColor: "text-purple-500",
    },
    {
        step: "03",
        title: "Download Securely",
        desc: "Get your result immediately. Files are auto-deleted after 1 hour.",
        color: "var(--nb-blue)",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        classicIconColor: "text-green-500",
    },
];

export default function HowItWorks() {
    const { isNeu } = useDesignStyle();

    return (
        <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-2xl text-center mb-16">
                {isNeu && <p className="nb-label mb-3">How It Works</p>}
                <h2
                    className={isNeu
                        ? "text-3xl tracking-tight sm:text-4xl font-spaceGrotesk"
                        : "text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                    }
                    style={isNeu ? { fontWeight: 800, color: "var(--nb-text)" } : undefined}
                >
                    {isNeu ? "Simple & Fast" : "How it Works"}
                </h2>
                <p
                    className={isNeu
                        ? "mt-4 text-lg leading-8"
                        : "mt-4 text-lg leading-8 text-muted-foreground"
                    }
                    style={isNeu ? { color: "var(--nb-text2)" } : undefined}
                >
                    Simple, fast, and secure file processing in 3 easy steps.
                </p>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className={`grid max-w-2xl grid-cols-1 gap-8 mx-auto lg:max-w-none lg:grid-cols-3 ${isNeu ? "nb-stagger" : ""}`}>
                    {STEPS.map((item, idx) => (
                        <div
                            key={idx}
                            className={isNeu
                                ? "flex flex-col items-center text-center p-8 nb-card relative group"
                                : "flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300 relative group"
                            }
                            style={isNeu ? { overflow: "hidden" } : undefined}
                        >
                            {/* Step Number Watermark */}
                            <div
                                className="absolute top-0 right-0 p-8 select-none pointer-events-none"
                                style={isNeu
                                    ? { opacity: 0.08, fontSize: "6rem", fontWeight: 900, color: "var(--nb-text)", fontFamily: "var(--font-jetbrains)" }
                                    : { opacity: 0.03, fontSize: "6rem", fontWeight: 900 }
                                }
                            >
                                {item.step}
                            </div>

                            {/* Icon */}
                            <div
                                className={isNeu
                                    ? "mb-6 p-4 rounded-[var(--nb-r-lg)] transition-all"
                                    : "mb-6 p-4 rounded-2xl bg-secondary group-hover:bg-background group-hover:shadow-md transition-colors"
                                }
                                style={isNeu ? {
                                    background: item.color,
                                    border: "3px solid var(--nb-border)",
                                    boxShadow: "var(--nb-shadow-sm)",
                                } : undefined}
                            >
                                <div className={isNeu ? "" : item.classicIconColor}>
                                    {item.icon}
                                </div>
                            </div>

                            <h3
                                className={isNeu
                                    ? "text-xl mb-3 font-spaceGrotesk"
                                    : "text-xl font-bold text-foreground mb-3"
                                }
                                style={isNeu ? { fontWeight: 800, color: "var(--nb-text)" } : undefined}
                            >
                                {item.title}
                            </h3>
                            <p
                                className={isNeu ? "leading-relaxed" : "text-muted-foreground leading-relaxed"}
                                style={isNeu ? { color: "var(--nb-text2)" } : undefined}
                            >
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
