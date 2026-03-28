import { MetadataRoute } from "next";
import { TOOLS } from "@/config/tools";
import { getAllPostSlugs } from "@/lib/blog";

export const dynamic = 'force-static';

const locales = ['en', 'es', 'de', 'fr', 'hi'];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://convertlocally.com";
    const lastModified = new Date();

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

    const entries: MetadataRoute.Sitemap = [];
    
    // Dynamically insert blog slugs at build time
    const blogPosts = getAllPostSlugs();

    // Generate URLs for each locale
    for (const locale of locales) {
        // Since we explicitly route all users to /[lang]/, we index the /[lang]/ paths, not root to avoid duplicate/redirect content
        const prefix = `/${locale}`;
        const localePriority = locale === 'en' ? 1.0 : 0.7;

        // Homepage
        entries.push({
            url: `${baseUrl}${prefix}/`,
            lastModified,
            changeFrequency: "daily",
            priority: localePriority,
        });

        // Tool pages
        for (const tool of TOOLS) {
            const isHigh = highPriorityTools.has(tool.id);
            const isMed = medPriorityTools.has(tool.id);
            const basePriority = isHigh ? 1.0 : isMed ? 0.9 : 0.8;
            entries.push({
                url: `${baseUrl}${prefix}/tools/${tool.id}/`,
                lastModified,
                changeFrequency: isHigh ? "daily" : "weekly",
                priority: locale === 'en' ? basePriority : basePriority * 0.7,
            });
        }

        // Static pages
        const staticPages = [
            { path: '/about/', freq: 'monthly' as const, pri: 0.5 },
            { path: '/help/', freq: 'monthly' as const, pri: 0.4 },
            { path: '/privacy/', freq: 'monthly' as const, pri: 0.2 },
            { path: '/terms/', freq: 'monthly' as const, pri: 0.2 },
            { path: '/contact/', freq: 'monthly' as const, pri: 0.3 },
            { path: '/donate/', freq: 'monthly' as const, pri: 0.3 },
            { path: '/blog/', freq: 'weekly' as const, pri: 0.6 },
        ];

        for (const page of staticPages) {
            entries.push({
                url: `${baseUrl}${prefix}${page.path}`,
                lastModified,
                changeFrequency: page.freq,
                priority: locale === 'en' ? page.pri : page.pri * 0.7,
            });
        }
        
        // Blog Posts
        for (const post of blogPosts) {
            entries.push({
                url: `${baseUrl}${prefix}/blog/${post.slug}/`,
                lastModified,
                changeFrequency: "monthly",
                priority: locale === 'en' ? 0.7 : 0.5,
            });
        }
    }

    return entries;
}
