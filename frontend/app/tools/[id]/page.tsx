import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TOOLS, ToolDef } from "@/config/tools";
import ToolInterface from "@/components/ToolInterface";
import StructuredData from "@/components/StructuredData";
import { getToolSEOContent } from "@/config/seo-content";
interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id;
    const tool = TOOLS.find((t) => t.id === id);

    if (!tool) {
        return {
            title: "Tool Not Found | FileVora",
        };
    }

    const seoContent = getToolSEOContent(id);
    const baseKeywords = [tool.name, "online", "free", "file converter", "FileVora", "no signup", "no watermark"];
    const focusKeywords = seoContent.keywords;

    // Enhanced Title & Description
    const title = tool.seoTitle || `${tool.name} Online - Free, Fast & Secure | FileVora`;
    const description = tool.seoDescription || `The best free online ${tool.name.toLowerCase()} tool. Fast, secure, and no installation required. Convert, compress, or edit your files in seconds with FileVora.`;

    return {
        title,
        description,
        keywords: [...baseKeywords, ...focusKeywords],
        openGraph: {
            title,
            description,
            url: `https://filevora.web.app/tools/${tool.id}`,
            images: [`/og/tools/${tool.id}.png`],
            siteName: "FileVora",
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`/og/tools/${tool.id}.png`],
        },
        alternates: {
            canonical: `https://filevora.web.app/tools/${tool.id}`,
        }
    };
}

export default async function ToolPage({ params }: Props) {
    const id = (await params).id;
    const tool = TOOLS.find((t) => t.id === id);

    if (!tool) {
        notFound();
    }

    if (tool.endpoint === "/coming-soon") {
        redirect("/coming-soon");
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20 pt-4">
            <StructuredData tool={tool} />
            <ToolInterface tool={tool} key={tool.id} />
        </main>
    );
}

// Generate static params for faster at-edge delivery and SEO
export async function generateStaticParams() {
    return TOOLS
        .filter(tool => tool.endpoint !== "/coming-soon")
        .map((tool) => ({
            id: tool.id,
        }));
}
