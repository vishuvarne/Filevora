'use client';

import { useEffect, useRef, useState } from 'react';

// Common AdSense formats mapped to specific minimum dimensions to prevent CLS
export type AdFormat = 'auto' | 'fluid' | 'rectangle' | 'leaderboard' | 'large-leaderboard' | 'mobile-banner' | 'skyscraper' | 'half-page';

interface AdSlotProps {
    adSlotId: string;
    format?: AdFormat;
    className?: string; // Optional generic class overrides
    isTest?: boolean;   // To show a placeholder during dev
}

export default function AdSlot({ adSlotId, format = 'auto', className = '', isTest = false }: AdSlotProps) {
    const adRef = useRef<HTMLModElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (isTest) return; // Don't try to load AdSense script in test mode

        try {
            // Push the ad to the global adsbygoogle array once the component mounts
            const adsbygoogle = (window as any).adsbygoogle || [];
            if (adRef.current && !adRef.current.hasChildNodes()) {
                adsbygoogle.push({});
                setIsLoaded(true);
            }
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, [isTest]);

    // Map formats to fixed minimum dimensions to absolutely prevent CLS 
    const formatClasses: Record<AdFormat, string> = {
        'leaderboard': 'w-full max-w-[728px] h-[90px] mx-auto',
        'large-leaderboard': 'w-full max-w-[970px] h-[90px] mx-auto',
        'rectangle': 'w-[300px] h-[250px] mx-auto',
        'skyscraper': 'w-[300px] h-[600px] mx-auto',
        'half-page': 'w-[300px] h-[600px] mx-auto',
        'mobile-banner': 'w-full max-w-[320px] h-[50px] mx-auto',
        'fluid': 'w-full h-auto min-h-[100px]',
        'auto': 'w-full h-full min-h-[100px]'
    };

    const baseClasses = `flex items-center justify-center bg-transparent overflow-hidden ${formatClasses[format] || formatClasses.auto}`;

    if (isTest || process.env.NODE_ENV === 'development') {
        return (
            <div className={`${baseClasses} border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg ${className}`}>
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                    AD PLACEHOLDER ({format.toUpperCase()})
                </span>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} ${className}`}>
            <ins
                ref={adRef}
                className="adsbygoogle block"
                data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "ca-pub-0000000000000000"}
                data-ad-slot={adSlotId}
                data-ad-format={format === 'auto' ? "auto" : undefined}
                data-full-width-responsive="true"
            />
        </div>
    );
}
