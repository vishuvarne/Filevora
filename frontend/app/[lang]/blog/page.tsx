import Link from '@/components/LocalizedLink';
import { getSortedPostsData } from '@/lib/blog';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ConvertLocally Blog - Guides, Tips & Tutorials',
    description: 'Learn how to easily convert, compress, and edit files online for free. Privacy-first tutorials from the ConvertLocally team.',
    alternates: {
        canonical: "https://convertlocally.com/blog",
    }
};

export default function BlogIndex() {
    const allPostsData = getSortedPostsData();

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20 pt-8 sm:pt-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                <header className="mb-12 text-center">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">
                        Resource Center
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Guides, tips, and tutorials on how to manage, convert, and compress your files without sacrificing privacy.
                    </p>
                </header>

                <div className="grid gap-8">
                    {allPostsData.map(({ slug, title, date, excerpt, author }) => (
                        <article 
                            key={slug} 
                            className="bg-card rounded-[2rem] p-6 sm:p-8 border-[3px] border-slate-900 dark:border-slate-800 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] dark:shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all duration-200"
                        >
                            <Link href={`/blog/${slug}`} prefetch={false} className="block group">
                                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                                    {title}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium mb-4">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25m-9 5.25v-1.5m3 1.5v-1.5m-6 1.5v-1.5" /></svg>
                                        <time dateTime={date}>{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                        {author}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
                                    {excerpt}
                                </p>
                                <div className="text-primary font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-wider text-sm">
                                    Read Article
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                </div>
                            </Link>
                        </article>
                    ))}
                    
                    {allPostsData.length === 0 && (
                        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                            <h3 className="text-xl font-bold text-foreground">Coming Soon</h3>
                            <p className="text-muted-foreground">We are working on bringing you the best tutorials.</p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
