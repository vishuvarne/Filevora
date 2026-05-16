import { Metadata } from "next";
import { CATEGORY_META } from "@/config/tools";
import CategoryPageClient from "@/components/CategoryPageClient";

export const metadata: Metadata = {
    title: CATEGORY_META.gif.seoTitle,
    description: CATEGORY_META.gif.seoDescription,
    alternates: { canonical: "https://convertlocally.com/en/tools/gif/" },
};

export default function GIFToolsPage() {
    return <CategoryPageClient categorySlug="gif" categoryName={CATEGORY_META.gif.name} />;
}
