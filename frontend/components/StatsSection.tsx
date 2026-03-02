"use client";

import { useDesignStyle } from "@/context/ThemeStyleContext";

const STATS = [
    { label: "Files Processed", value: "15M+", color: "var(--nb-pink)" },
    { label: "Happy Users", value: "2M+", color: "var(--nb-mint)" },
    { label: "Daily Conversions", value: "50k+", color: "var(--nb-blue)" },
    { label: "Tools Available", value: "60+", color: "var(--nb-yellow)" },
];

export default function StatsSection() {
    const { isNeu } = useDesignStyle();

    if (isNeu) {
        return (
            <section className="py-24 sm:py-32 mb-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none">
                        <div className="text-center mb-16">
                            <p className="nb-label mb-3">By the Numbers</p>
                            <h2
                                className="text-3xl tracking-tight sm:text-4xl font-spaceGrotesk"
                                style={{ fontWeight: 800, color: "var(--nb-text)" }}
                            >
                                Trusted by millions worldwide
                            </h2>
                            <p className="mt-4 text-lg leading-8" style={{ color: "var(--nb-text2)" }}>
                                Processed securely and efficiently. Join our growing community of happy users.
                            </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 nb-stagger">
                            {STATS.map((stat, idx) => (
                                <div
                                    key={idx}
                                    className="nb-card flex flex-col items-center text-center p-8"
                                    style={{ borderTopWidth: "6px", borderTopColor: stat.color }}
                                >
                                    <dd
                                        className="text-4xl tracking-tight font-jetbrains"
                                        style={{ fontWeight: 800, color: "var(--nb-text)" }}
                                    >
                                        {stat.value}
                                    </dd>
                                    <dt
                                        className="text-sm mt-2"
                                        style={{ fontWeight: 700, color: "var(--nb-text2)" }}
                                    >
                                        {stat.label}
                                    </dt>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>
        );
    }

    // CLASSIC stats section
    return (
        <section className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32 rounded-3xl mb-24">
            <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2850&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-20" />
            <div className="absolute inset-0 -z-10 bg-slate-900/90"></div>
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:max-w-none">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-shadow-sm">Trusted by millions worldwide</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-300">
                            Processed securely and efficiently. Join our growing community of happy users.
                        </p>
                    </div>
                    <dl className="mt-16 grid grid-cols-2 gap-8 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
                        {STATS.map((stat, idx) => (
                            <div key={idx} className="flex flex-col bg-white/5 p-8 backdrop-blur-3xl hover:bg-white/10 transition-colors">
                                <dt className="text-sm font-semibold leading-6 text-gray-300">{stat.label}</dt>
                                <dd className="order-first text-3xl font-semibold tracking-tight text-white">{stat.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
