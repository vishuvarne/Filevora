import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TOOLS, ToolDef } from "@/config/tools";
import ToolInterface from "@/components/ToolInterface";
import StructuredData from "@/components/StructuredData";
import { getToolSEOContent } from "@/config/seo-content";
interface Props {
    params: Promise<{ lang: string; id: string }>;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { lang, id } = await params;
    const tool = TOOLS.find((t) => t.id === id);

    if (!tool) {
        return {
            title: "Tool Not Found | ConvertLocally",
        };
    }

    const seoContent = getToolSEOContent(id);
    const baseKeywords = [tool.name, "online", "free", "file converter", "ConvertLocally", "no signup", "no watermark"];
    const focusKeywords = seoContent.keywords;

    // Enhanced Title & Description
    const title = tool.seoTitle || `${tool.name} Online - Free, Fast & Secure | ConvertLocally`;
    const description = tool.seoDescription || `The best free online ${tool.name.toLowerCase()} tool. Fast, secure, and no installation required. Convert, compress, or edit your files in seconds with ConvertLocally.`;

    const baseUrl = `https://convertlocally.com/${lang}/tools/${tool.id}`;

    return {
        title,
        description,
        keywords: [...baseKeywords, ...focusKeywords],
        openGraph: {
            title,
            description,
            url: baseUrl,
            images: [`/og/tools/${tool.id}.png`],
            siteName: "ConvertLocally",
            locale: lang === 'en' ? 'en_US' : lang, // Map to standard if possible
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`/og/tools/${tool.id}.png`],
        },
        alternates: {
            canonical: baseUrl,
        }
    };
}

export default async function ToolPage({ params }: Props) {
    const id = (await params).id;
    const tool = TOOLS.find((t) => t.id === id);

    if (!tool) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20 pt-4">
            <StructuredData tool={tool} />
            <ToolInterface tool={tool} key={tool.id} />
        </main>
    );
}

// Generate static params for all combinations of language and tool ID
export async function generateStaticParams() {
    const paths: { lang: string; id: string }[] = [];
    
    // We import from i18n directly
    const locales = ['en', 'es', 'de', 'fr', 'hi']; 
    
    for (const lang of locales) {
        for (const tool of TOOLS) {
            paths.push({ lang, id: tool.id });
        }
    }
    
    return paths;
}
