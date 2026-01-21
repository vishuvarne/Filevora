import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdUnitProps {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    responsive?: boolean;
    className?: string; // Allow custom styling for the container
    style?: React.CSSProperties; // Allow inline styles
}

export default function AdUnit({ slotId, format = 'auto', responsive = true, className = "", style = {} }: AdUnitProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (adRef.current && !initialized.current) {
            // Check if ad was already pushed to this slot to avoid duplicates in strict mode
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                initialized.current = true;
            } catch (e: any) {
                console.error("AdSense Error: ", e);
            }
        }
    }, [slotId]); // Only re-run if slotId changes

    return (
        <div className={`ad-container ${className}`} style={{ minHeight: '100px', ...style }}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            ></ins>
        </div>
    );
}
