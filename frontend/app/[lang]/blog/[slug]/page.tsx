import { getPostData, getAllPostSlugs } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';

export async function generateStaticParams() {
    const paths = getAllPostSlugs();
    const locales = ['en', 'es', 'de', 'fr', 'hi'];
    const combinedPaths: { lang: string; slug: string }[] = [];

    for (const lang of locales) {
        for (const post of paths) {
            combinedPaths.push({ lang, slug: post.slug });
        }
    }
    return combinedPaths;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
    const { lang, slug } = await params;
    try {
        const post = await getPostData(slug);
        const baseUrl = `https://convertlocally.com/${lang}/blog/${slug}/`;
        return {
            title: `${post.title} | ConvertLocally Blog`,
            description: post.excerpt,
            alternates: {
                canonical: baseUrl,
            },
            openGraph: {
                title: post.title,
                description: post.excerpt,
                url: baseUrl,
                type: 'article',
                publishedTime: post.date,
            }
        };
    } catch (e) {
        return {
            title: 'Post Not Found'
        }
    }
}

export default async function BlogPost({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { slug } = await params;
    let postData;
    try {
        postData = await getPostData(slug);
    } catch (error) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 pt-8 sm:pt-16">
            <article className="max-w-3xl mx-auto px-4 sm:px-6">
                
                <header className="mb-12">
                    <div className="flex items-center justify-center gap-4 text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-6">
                        <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                            Guide
                        </span>
                        <time dateTime={postData.date} className="flex flex-col sm:flex-row gap-1">
                            {new Date(postData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </time>
                    </div>
                    
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-6">
                        {postData.title}
                    </h1>

                    {/* Author block */}
                    <div className="flex items-center gap-4 mt-8">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border-2 border-slate-900 dark:border-slate-800 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            CL
                        </div>
                        <div>
                            <div className="font-bold text-primary">{postData.author}</div>
                            <div className="text-sm text-muted-foreground font-medium">Expert Technical Writer</div>
                        </div>
                    </div>
                </header>

                {/* Markdown Content rendered as HTML */}
                <section 
                    className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 prose-img:rounded-3xl prose-img:border-[3px] prose-img:border-slate-900 prose-img:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] prose-li:marker:text-primary max-w-none"
                    dangerouslySetInnerHTML={{ __html: postData.contentHtml || "" }} 
                />

            </article>
        </main>
    );
}
