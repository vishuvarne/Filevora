import { Metadata } from "next";
import { CATEGORY_META } from "@/config/tools";
import CategoryPageClient from "@/components/CategoryPageClient";

export const metadata: Metadata = {
    title: CATEGORY_META.archive.seoTitle,
    description: CATEGORY_META.archive.seoDescription,
    alternates: { canonical: "https://convertlocally.com/en/tools/archive/" },
};

export default function ArchiveToolsPage() {
    return <CategoryPageClient categorySlug="archive" categoryName={CATEGORY_META.archive.name} />;
}
