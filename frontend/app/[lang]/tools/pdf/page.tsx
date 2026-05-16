import { Metadata } from "next";
import { CATEGORY_META } from "@/config/tools";
import CategoryPageClient from "@/components/CategoryPageClient";

export const metadata: Metadata = {
    title: CATEGORY_META.pdf.seoTitle,
    description: CATEGORY_META.pdf.seoDescription,
    alternates: { canonical: "https://convertlocally.com/en/tools/pdf/" },
};

export default function PDFToolsPage() {
    return <CategoryPageClient categorySlug="pdf" categoryName={CATEGORY_META.pdf.name} />;
}
