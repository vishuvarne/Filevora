import { ToolDef } from "@/config/tools";

interface StructuredDataProps {
    tool: ToolDef;
    rating?: number;
    reviewCount?: number;
}

export default function StructuredData({ tool, rating = 4.8, reviewCount = 1250 }: StructuredDataProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": tool.name,
                "description": tool.description,
                "applicationCategory": "UtilitiesApplication",
                "operatingSystem": "Any",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": rating.toString(),
                    "ratingCount": reviewCount.toString(),
                    "bestRating": "5",
                    "worstRating": "1"
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://filevora.web.app/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": tool.category,
                        "item": `https://filevora.web.app/#${tool.category.toLowerCase().replace(/ /g, '-')}`
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": tool.name,
                        "item": `https://filevora.web.app/tools/${tool.id}`
                    }
                ]
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
