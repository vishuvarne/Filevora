import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TOOLS, ToolDef } from "@/config/tools";
import ToolInterface from "@/components/ToolInterface";

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

    return {
        title: `${tool.name} - ${tool.description.split('.')[0]} | Free Online Tool`,
        description: `${tool.description} FileVora provides fast, secure, and free ${tool.name.toLowerCase()} without watermarks or installation.`,
        keywords: [...baseKeywords, ...focusKeywords],
        openGraph: {
            title: `${tool.name} - Free Online Tool | FileVora`,
            description: tool.description,
            url: `https://filevora.com/tools/${tool.id}`,
            images: [`/og/tools/${tool.id}.png`],
        },
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

    // JSON-LD Structured Data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.name,
        "description": tool.description,
        "applicationCategory": tool.category,
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "featureList": [
            "Fast processing",
            "Secure auto-deletion",
            "No signup required",
            "No watermark"
        ]
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-20 pt-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ToolInterface tool={tool} />
        </main>
    );
}

// Generate static params for faster at-edge delivery and SEO
export async function generateStaticParams() {
    return TOOLS.map((tool) => ({
        id: tool.id,
    }));
}
