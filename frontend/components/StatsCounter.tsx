"use client";
import { useEffect, useState } from "react";
import React from "react";

interface Stat {
    value: number;
    label: string;
    suffix: string;
    icon: React.ReactElement;
}

export default function StatsCounter() {
    const [counts, setCounts] = useState({
        files: 0,
        users: 0,
        tools: 0,
        deletion: 0
    });

    const stats: Stat[] = [
        {
            value: 1234567,
            label: "Files Processed",
            suffix: "+",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            )
        },
        {
            value: 50000,
            label: "Active Users",
            suffix: "+",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            )
        },
        {
            value: 60,
            label: "Free Tools",
            suffix: "+",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
            )
        },
        {
            value: 99.9,
            label: "Auto-Delete Rate",
            suffix: "%",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            )
        }
    ];

    // CountUp animation
    useEffect(() => {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;

            setCounts({
                files: Math.floor(stats[0].value * progress),
                users: Math.floor(stats[1].value * progress),
                tools: Math.floor(stats[2].value * progress),
                deletion: parseFloat((stats[3].value * progress).toFixed(1))
            });

            if (step >= steps) {
                clearInterval(timer);
                // Set final values
                setCounts({
                    files: stats[0].value,
                    users: stats[1].value,
                    tools: stats[2].value,
                    deletion: stats[3].value
                });
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + "K";
        }
        return num.toString();
    };

    return (
        <section className="py-12 -mt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {stats.map((stat, index) => {
                    const currentValue = index === 0 ? counts.files : index === 1 ? counts.users : index === 2 ? counts.tools : counts.deletion;

                    return (
                        <div
                            key={stat.label}
                            className="bg-secondary/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="text-primary/80">
                                    {stat.icon}
                                </div>
                                <div>
                                    <div className="text-3xl md:text-4xl font-black text-foreground tabular-nums">
                                        {index === 3 ? currentValue.toFixed(1) : formatNumber(currentValue)}
                                        <span className="text-primary">{stat.suffix}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
