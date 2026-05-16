import { Metadata } from "next";
import { CATEGORY_META } from "@/config/tools";
import CategoryPageClient from "@/components/CategoryPageClient";

export const metadata: Metadata = {
    title: CATEGORY_META.image.seoTitle,
    description: CATEGORY_META.image.seoDescription,
    alternates: { canonical: "https://convertlocally.com/en/tools/image/" },
};

export default function ImageToolsPage() {
    return <CategoryPageClient categorySlug="image" categoryName={CATEGORY_META.image.name} />;
}
