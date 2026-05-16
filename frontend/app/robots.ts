import { MetadataRoute } from "next";

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/profile",
                    "/profile/",
                    "/api/",
                    "/temp/",
                    "/login",
                    "/login/",
                    "/signup",
                    "/signup/",
                    "/blob-test",
                    "/blob-test/",
                    "/coming-soon",
                    "/coming-soon/",
                    // Block non-English locales from crawling
                    "/es/",
                    "/de/",
                    "/fr/",
                    "/hi/",
                    // Block old individual tool routes (now redirected)
                    "/en/tools/*/",
                ],
            },
            {
                userAgent: "*",
                allow: [
                    "/en/tools/pdf/",
                    "/en/tools/image/",
                    "/en/tools/gif/",
                    "/en/tools/audio-video/",
                    "/en/tools/archive/",
                    "/en/tools/utilities/",
                ],
            },
        ],
        host: "https://convertlocally.com",
        sitemap: "https://convertlocally.com/sitemap.xml",
    };
}
