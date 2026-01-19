import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://filevora.com"),
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
    url: "https://filevora.com",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950 flex flex-col min-h-screen`}
      >
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
