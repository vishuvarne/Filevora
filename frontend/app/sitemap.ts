import { MetadataRoute } from "next";
import { CATEGORY_META, CategorySlug } from "@/config/tools";
import { getAllPostSlugs } from "@/lib/blog";

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://convertlocally.com";
    const lastModified = new Date();
    const prefix = "/en";

    const entries: MetadataRoute.Sitemap = [];
    
    // Blog posts
    const blogPosts = getAllPostSlugs();

    // Homepage
    entries.push({
        url: `${baseUrl}${prefix}/`,
        lastModified,
        changeFrequency: "daily",
        priority: 1.0,
    });

    // Category tool pages (6 total)
    const categories: { slug: CategorySlug; priority: number }[] = [
        { slug: "pdf", priority: 1.0 },
        { slug: "image", priority: 1.0 },
        { slug: "gif", priority: 0.9 },
        { slug: "audio-video", priority: 0.9 },
        { slug: "archive", priority: 0.8 },
        { slug: "utilities", priority: 0.8 },
    ];

    for (const cat of categories) {
        entries.push({
            url: `${baseUrl}${prefix}/tools/${cat.slug}/`,
            lastModified,
            changeFrequency: "weekly",
            priority: cat.priority,
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
            priority: page.pri,
        });
    }
    
    // Blog Posts
    for (const post of blogPosts) {
        entries.push({
            url: `${baseUrl}${prefix}/blog/${post.slug}/`,
            lastModified,
            changeFrequency: "monthly",
            priority: 0.7,
        });
    }

    return entries;
}
