import { ToolDef } from "@/config/tools";

interface StructuredDataProps {
    tool: ToolDef;
    rating?: number;
    reviewCount?: number;
}

import { getToolSEOContent } from "@/config/seo-content";

export default function StructuredData({ tool }: StructuredDataProps) {
    const seoContent = getToolSEOContent(tool.id);
    const faqs = seoContent.faqs;
    const steps = seoContent.howToSteps;

    const graph: any[] = [
        {
            "@type": "SoftwareApplication",
            "name": tool.seoTitle || tool.name,
            "description": tool.seoDescription || tool.description,
            "url": `https://convertlocally.web.app/tools/${tool.id}`,
            "applicationCategory": "UtilitiesApplication",
            "applicationSubCategory": "File Converter",
            "operatingSystem": "Any",
            "browserRequirements": "Requires a modern web browser with WebAssembly support",
            "permissions": "none",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "Free to use",
                "No signup required",
                "No watermark",
                "No file upload - processes locally in browser",
                "Unlimited conversions",
                "Works on mobile and desktop"
            ]
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://convertlocally.web.app/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": tool.category,
                    "item": `https://convertlocally.web.app/#${tool.category.toLowerCase().replace(/ /g, '-')}`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": tool.name,
                    "item": `https://convertlocally.web.app/tools/${tool.id}`
                }
            ]
        },
        {
            "@type": "WebPage",
            "name": tool.seoTitle || `${tool.name} Online - Free | ConvertLocally`,
            "description": tool.seoDescription || tool.description,
            "url": `https://convertlocally.web.app/tools/${tool.id}`,
            "isPartOf": {
                "@type": "WebSite",
                "name": "ConvertLocally",
                "url": "https://convertlocally.web.app"
            },
            "inLanguage": "en",
            "dateModified": new Date().toISOString().split('T')[0]
        },
        {
            "@type": "HowTo",
            "name": `How to use the ${tool.name} tool`,
            "description": `Step by step guide on using the ${tool.name} tool on ConvertLocally.`,
            "step": [
                {
                    "@type": "HowToStep",
                    "url": `https://convertlocally.web.app/tools/${tool.id}#step1`,
                    "name": steps.step1.title,
                    "itemListElement": [{
                        "@type": "HowToDirection",
                        "text": steps.step1.description
                    }]
                },
                {
                    "@type": "HowToStep",
                    "url": `https://convertlocally.web.app/tools/${tool.id}#step2`,
                    "name": steps.step2.title,
                    "itemListElement": [{
                        "@type": "HowToDirection",
                        "text": steps.step2.description
                    }]
                },
                {
                    "@type": "HowToStep",
                    "url": `https://convertlocally.web.app/tools/${tool.id}#step3`,
                    "name": steps.step3.title,
                    "itemListElement": [{
                        "@type": "HowToDirection",
                        "text": steps.step3.description
                    }]
                }
            ]
        }
    ];

    // Add FAQPage if there are FAQs for this tool
    if (faqs.length > 0) {
        graph.push({
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        });
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": graph
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
