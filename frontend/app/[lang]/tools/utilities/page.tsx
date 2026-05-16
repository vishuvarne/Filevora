import { Metadata } from "next";
import { CATEGORY_META } from "@/config/tools";
import CategoryPageClient from "@/components/CategoryPageClient";

export const metadata: Metadata = {
    title: CATEGORY_META.utilities.seoTitle,
    description: CATEGORY_META.utilities.seoDescription,
    alternates: { canonical: "https://convertlocally.com/en/tools/utilities/" },
};

export default function UtilitiesPage() {
    return <CategoryPageClient categorySlug="utilities" categoryName={CATEGORY_META.utilities.name} />;
}
