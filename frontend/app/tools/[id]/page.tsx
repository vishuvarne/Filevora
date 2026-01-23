import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TOOLS, ToolDef } from "@/config/tools";
import ToolInterface from "@/components/ToolInterface";
import StructuredData from "@/components/StructuredData";

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

    // Map keywords based on category and tool ID
    const baseKeywords = [tool.name, "online", "free", "file converter", "FileVora"];
    let focusKeywords: string[] = [];

    if (tool.category === "PDF & Documents") {
        focusKeywords = ["pdf editor online", "compress pdf", "merge pdf", "split pdf", "pdf converter"];
        if (id === "merge-pdf") focusKeywords.unshift("combine pdf files online");
    } else if (tool.category === "Image") {
        focusKeywords = ["image to pdf", "jpg to png", "png to jpg", "webp to jpg", "image converter online", "compress image online", "image resizer online"];
    } else if (tool.category === "Video & Audio") {
        focusKeywords = ["video converter online", "mp4 to mp3", "video to audio", "audio converter online", "mp3 converter"];
    }

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
            url: `https://filevora.com/tools/${tool.id}`,
            images: [`/og/tools/${tool.id}.png`],
            siteName: "FileVora",
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`/og/tools/${tool.id}.png`], // Fallback to OG image
        },
        alternates: {
            canonical: `https://filevora.com/tools/${tool.id}`,
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
    return TOOLS.map((tool) => ({
        id: tool.id,
    }));
}
