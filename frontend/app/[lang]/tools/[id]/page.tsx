import { redirect } from "next/navigation";
import { TOOLS } from "@/config/tools";
import { getCategoryForTool } from "@/config/tools";

interface Props {
    params: Promise<{ lang: string; id: string }>;
}

export default async function ToolRedirectPage({ params }: Props) {
    const { lang, id } = await params;
    
    // Look up which category this tool belongs to
    const categorySlug = getCategoryForTool(id);
    
    if (categorySlug) {
        // Redirect to the new category page with the tool pre-selected
        redirect(`/${lang}/tools/${categorySlug}/?tool=${id}`);
    }
    
    // If tool not found, redirect to homepage
    redirect(`/${lang}/`);
}

// Only generate params for English locale to minimize page count
export async function generateStaticParams() {
    const paths: { lang: string; id: string }[] = [];
    
    for (const tool of TOOLS) {
        paths.push({ lang: "en", id: tool.id });
    }
    
    return paths;
}
