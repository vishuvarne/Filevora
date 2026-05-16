import { Metadata } from "next";
import { CATEGORY_META } from "@/config/tools";
import CategoryPageClient from "@/components/CategoryPageClient";

export const metadata: Metadata = {
    title: CATEGORY_META["audio-video"].seoTitle,
    description: CATEGORY_META["audio-video"].seoDescription,
    alternates: { canonical: "https://convertlocally.com/en/tools/audio-video/" },
};

export default function AudioVideoToolsPage() {
    return <CategoryPageClient categorySlug="audio-video" categoryName={CATEGORY_META["audio-video"].name} />;
}
