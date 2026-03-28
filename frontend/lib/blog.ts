import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    contentHtml?: string;
    content?: string;
    author: string;
}

export function getSortedPostsData(): BlogPost[] {
    if (!existsSync(postsDirectory)) return [];

    const fileNames = readdirSync(postsDirectory);
    const allPostsData = fileNames
        .filter((fileName: string) => fileName.endsWith('.md'))
        .map((fileName: string) => {
            const slug = fileName.replace(/\.md$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = readFileSync(fullPath, 'utf8');

            const matterResult = matter(fileContents);

            return {
                slug,
                title: matterResult.data.title,
                date: matterResult.data.date,
                excerpt: matterResult.data.excerpt,
                author: matterResult.data.author || 'ConvertLocally Team',
            };
        });

    return allPostsData.sort((a: any, b: any) => {
        if (a.date < b.date) return 1;
        return -1;
    });
}

export function getAllPostSlugs() {
    if (!existsSync(postsDirectory)) return [];

    const fileNames = readdirSync(postsDirectory);
    return fileNames
        .filter((fileName: string) => fileName.endsWith('.md'))
        .map((fileName: string) => {
            return {
                slug: fileName.replace(/\.md$/, ''),
            };
        });
}

export async function getPostData(slug: string): Promise<BlogPost> {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = readFileSync(fullPath, 'utf8');

    const matterResult = matter(fileContents);

    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
        
    const contentHtml = processedContent.toString();

    return {
        slug,
        title: matterResult.data.title,
        date: matterResult.data.date,
        excerpt: matterResult.data.excerpt,
        contentHtml,
        content: matterResult.content,
        author: matterResult.data.author || 'ConvertLocally Team',
    };
}
