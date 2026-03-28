import { MetadataRoute } from "next";
import { TOOLS } from "@/config/tools";

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://convertlocally.com";

    // Use a stable last-modified date (update when you actually change content)
    // Google penalizes constantly-changing lastModified as manipulation
    const lastModified = new Date("2026-03-28");

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
    // IMPORTANT: trailing slash MUST match next.config.js trailingSlash: true
    const toolUrls = TOOLS.map((tool) => {
        const isHigh = highPriorityTools.has(tool.id);
        const isMed = medPriorityTools.has(tool.id);
        return {
            url: `${baseUrl}/tools/${tool.id}/`,
            lastModified,
            changeFrequency: (isHigh ? "daily" : "weekly") as "daily" | "weekly",
            priority: isHigh ? 1.0 : isMed ? 0.9 : 0.8,
        };
    });

    // Static pages
    const staticUrls = [
        {
            url: `${baseUrl}/`,
            lastModified,
            changeFrequency: "daily" as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/about/`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        },
        {
            url: `${baseUrl}/help/`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.4,
        },
        {
            url: `${baseUrl}/privacy/`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.2,
        },
        {
            url: `${baseUrl}/terms/`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.2,
        },
        {
            url: `${baseUrl}/contact/`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/donate/`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
    ];

    return [...staticUrls, ...toolUrls];
}
