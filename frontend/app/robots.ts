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
                ],
            },
        ],
        host: "https://convertlocally.com",
        sitemap: "https://convertlocally.com/sitemap.xml",
    };
}
