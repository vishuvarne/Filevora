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

    // JSON-LD Structured Data
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
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
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "1250",
                    "bestRating": "5",
                    "worstRating": "1"
                },
                "featureList": [
                    "Fast processing",
                    "Secure auto-deletion",
                    "No signup required",
                    "No watermark"
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Is it safe to use FileVora?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes. We use standard 256-bit SSL encryption for all data transfers. Your files are automatically deleted from our servers permanently after 1 hour."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is there a file size limit?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "FileVora supports files up to 500MB for free users. We handle large files efficiently using advanced cloud processing."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I use this tool on mobile?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Absolutely. FileVora is fully responsive and works perfectly on iPhone, Android, tablets, and desktop computers."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": `How does ${tool.name} work?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Simply upload your file, choose your desired settings (if applicable), and click 'Process'. Your file will be ready for download in seconds.`
                        }
                    }
                ]
            }
        ]
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20 pt-4">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
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
