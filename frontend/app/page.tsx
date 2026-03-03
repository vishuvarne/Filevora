import { Metadata } from "next";
import dynamic from "next/dynamic";
import { TOOLS } from "@/config/tools";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
// Dynamically import heavy grid components
const ToolsGrid = dynamic(() => import("@/components/ToolsGrid"));
const RecentlyUsed = dynamic(() => import("@/components/RecentlyUsed"));
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import StatsSection from "@/components/StatsSection";

// Lazy load heavy below-fold components for better performance
const SecuritySection = dynamic(() => import("@/components/SecuritySection"));
const ProcessingFAQ = dynamic(() => import("@/components/ProcessingFAQ"));

export const metadata: Metadata = {
  title: "FileVora - Premium Online File Converter | PDF, Image, Video Tools",
  description: "Free online converter with 60+ tools. Merge PDFs, convert PDF to Word/Excel, compress images, create GIFs from videos. No signup, no watermarks, unlimited use.",
  keywords: [
    "pdf to word", "pdf to excel", "merge pdf", "compress pdf", "pdf to jpg", "split pdf", "pdf converter free", "combine pdf",
    "jpg to pdf", "png to jpg", "webp to png", "heic to jpg", "image converter", "compress image",
    "video to gif", "mp4 to gif", "gif maker online",
    "free file converter", "online converter no registration", "file converter no watermark",
    "unlimited file conversion free", "best free pdf tools", "online file tools",
    "file converter for mobile", "convert files without software", "online converter works on all devices"
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">

      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-0 sm:mt-1">

        {/* Tools Grid Section */}
        <div className="relative z-30">
          <ToolsGrid />
        </div>

        {/* Recently Used Tools - Moved below ToolsGrid to prevent layout shifts (CLS) on initial load */}
        <div className="relative z-30">
          <RecentlyUsed />
        </div>

        <HowItWorks />

        <StatsSection />

        {/* FAQ Section */}
        <ProcessingFAQ />

        <div className="mb-24">
          <SecuritySection />
        </div>
      </div>
    </main>
  );
}
