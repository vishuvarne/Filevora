import { MetadataRoute } from "next";
import { TOOLS } from "@/config/tools";

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://convertlocally.com";

    // High-priority tools
    const highPriorityTools = new Set([
        'image-to-pdf', 'jpg-to-pdf', 'merge-pdf', 'compress-pdf',
        'pdf-to-word', 'word-to-pdf', 'pdf-to-jpg', 'heic-to-jpg',
        'png-to-jpg', 'jpg-to-png', 'mp4-to-mp3', 'webp-to-jpg',
        'pdf-to-ppt', 'excel-to-pdf', 'ppt-to-pdf'
    ]);
    const medPriorityTools = new Set([
        'image-compressor', 'convert-image', 'compress-video', 'merge-video',
        'video-to-mp4', 'video-to-mp3', 'convert-audio', 'compress-audio'
    ]);

    // Tool pages with tiered priority
    const toolUrls = TOOLS.map((tool) => {
        const isHigh = highPriorityTools.has(tool.id);
        const isMed = medPriorityTools.has(tool.id);
        return {
            url: `${baseUrl}/tools/${tool.id}`,
            lastModified: new Date(),
            changeFrequency: (isHigh ? "daily" : "weekly") as "daily" | "weekly",
            priority: isHigh ? 1.0 : isMed ? 0.9 : 0.8,
        };
    });

    // Static pages
    const staticUrls = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.2,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.2,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/donate`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
    ];

    return [...staticUrls, ...toolUrls];
}
