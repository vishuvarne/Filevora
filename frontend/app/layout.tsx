import type { Metadata, Viewport } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FooterWrapper from "@/components/FooterWrapper";
import GoogleAdsense from "@/components/GoogleAdsense";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { AppNavigationProvider } from "@/context/AppNavigationProvider";
import { Suspense } from "react";
import { ThemeStyleProvider } from "@/context/ThemeStyleContext";
import StickyFooterAd from "@/components/ads/StickyFooterAd";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://filevora.web.app"),
  title: "FileVora – Free Online File Converter for PDF, Images, Video & Audio",
  description: "FileVora is a free online file converter for PDF, images, video, audio, and documents. Fast, secure, and no signup required.",
  keywords: [
    // Core converter keywords
    "online file converter",
    "free file converter",
    "convert files online free",
    "file conversion tool",

    // PDF keywords (competing with ilovepdf, smallpdf)
    "pdf converter",
    "pdf to word converter",
    "merge pdf files",
    "compress pdf online",
    "pdf to jpg converter",
    "pdf editor online free",
    "split pdf online",
    "pdf to excel converter",
    "combine pdf files",
    "pdf merger",

    // Image keywords (competing with convertio, online-convert)
    "image converter",
    "jpg to png converter",
    "webp to jpg",
    "heic to jpg converter",
    "image compressor",
    "resize image online",
    "convert image format",
    "png to jpg converter",

    // Video/GIF keywords
    "video to gif converter",
    "mp4 to gif",
    "gif maker",
    "video converter online",
    "convert video format",

    // Trust & quality keywords
    "free online converter no signup",
    "no watermark converter",
    "unlimited file conversion",
    "secure file converter",
    "fast file converter",
    "best free file converter",

    // Long-tail keywords
    "convert pdf to word online free without email",
    "merge multiple pdf files into one",
    "compress large pdf file",
    "how to convert jpg to pdf",
    "free online tools for pdf",
    "all in one file converter"
  ],
  authors: [{ name: "FileVora Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://filevora.web.app",
    siteName: "FileVora",
    title: "FileVora – Free Online File Converter",
    description: "Convert, Edit, and Compress files online for free.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FileVora - Free Online File Converter Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FileVora - Free Online File Converter",
    description: "60+ free tools to convert, merge, compress files. PDF, Image, Video converter with no signup required.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { inter, poppins, spaceGrotesk, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";
import { SpeculationRules } from "@/components/SpeculationRules";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical CSS — inlined for instant LCP paint before external CSS loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body{margin:0;background:#f8fafc;color:#020617}
              .dark body,.dark{background:#030712;color:#f8fafc}
              h1{font-size:clamp(1.875rem,5vw,4.5rem);font-weight:900;letter-spacing:-0.025em;line-height:1.1;color:inherit}
              h1 .text-primary{color:hsl(221.2,83.2%,53.3%)}
              .dark h1 .text-primary{color:hsl(217,91%,60%)}
            `.replace(/\s+/g, ' ').trim()
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "FileVora",
                "url": "https://filevora.web.app",
                "logo": "https://filevora.web.app/logo.png",
                "sameAs": []
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "FileVora",
                "url": "https://filevora.web.app",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://filevora.web.app/?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ])
          }}
        />
        {/* Anti-Blocker Safety Layer - Ensures analytics don't break JS execution if blocked */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};gtag('js',new Date());`
          }}
        />
        {/* Force-unregister broken next-pwa Service Workers that intercept Next.js RSC router requests */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
               if ('serviceWorker' in navigator) {
                 navigator.serviceWorker.getRegistrations().then(function(regs) {
                   for (var i = 0; i < regs.length; i++) {
                     regs[i].unregister();
                   }
                 });
               }
             `
          }}
        />
        {/* MUST be first script - prevents dark mode flash on ALL builds including static */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('design-style');if(s==='neubrutalist'){document.documentElement.setAttribute('data-design','neubrutalist')}}catch(e){}})();`,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('[SW] Service Worker registered');
                  }).catch(err => {
                    console.error('[SW] Service Worker registration failed:', err);
                  });
                });
              }
            `
          }}
        />
        <SpeculationRules />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-slate-50 dark:bg-slate-950 flex flex-col min-h-screen font-sans overflow-x-clip`}
      >
        <AppNavigationProvider>
          <ThemeStyleProvider>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
            <Navbar />
            {/* AdSense Script - Global */}
            <GoogleAdsense pId={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "ca-pub-0000000000000000"} />
            <div className="flex-1 flex flex-col min-h-0">
              <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                {children}
              </Suspense>
            </div>
            <FooterWrapper>
              <Footer />
            </FooterWrapper>

            {/* Global Session-Persistent Sticky Ad */}
            <StickyFooterAd adSlotId="YOUR_STICKY_AD_SLOT_ID" />

          </ThemeStyleProvider>
        </AppNavigationProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
