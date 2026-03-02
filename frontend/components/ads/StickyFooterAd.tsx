'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdSlot from './AdSlot';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface StickyFooterAdProps {
    adSlotId: string;
}

export default function StickyFooterAd({ adSlotId }: StickyFooterAdProps) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(true); // Default true to prevent flash

    useEffect(() => {
        // Check session storage to see if the user closed the sticky ad recently
        const dismissed = sessionStorage.getItem('stickyAdDismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        } else {
            setIsDismissed(false);

            // Deliberately delay showing the sticky ad to let the user focus on the tool first (UX)
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000); // 3 seconds delay

            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        // Save to session storage so it doesn't bother them again during this session
        sessionStorage.setItem('stickyAdDismissed', 'true');
    };

    if (pathname === '/') return null; // Keep the main page clean without ads per request

    if (isDismissed || !isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center w-full animate-fade-in-up">
            <div className="relative bg-white dark:bg-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 border-slate-900 dark:border-slate-700 w-full flex justify-center py-2">

                {/* The Close Button Requirement */}
                <button
                    onClick={handleDismiss}
                    className="absolute -top-10 right-4 md:right-10 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-t-lg border-x-2 border-t-2 border-slate-900 dark:border-slate-700 shadow-sm transition-colors"
                    aria-label="Close Ad"
                >
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Close Ad</span>
                        <XMarkIcon className="w-5 h-5" />
                    </div>
                </button>

                {/* The Ad Slot - Auto shrinks depending on if mobile or desktop */}
                <div className="hidden md:block">
                    <AdSlot adSlotId={adSlotId} format="leaderboard" isTest={true} />
                </div>
                <div className="block md:hidden">
                    <AdSlot adSlotId={adSlotId} format="mobile-banner" isTest={true} />
                </div>
            </div>
        </div>
    );
}
