"use client";

import Script from "next/script";

interface AdSenseProps {
    pId: string;
}

export default function GoogleAdsense({ pId }: AdSenseProps) {
    if (!pId) return null;

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
