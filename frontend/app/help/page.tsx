import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Help Center | ConvertLocally',
    description: 'Get help with ConvertLocally tools, troubleshoot issues, and find answers to common questions.',
};

export default function HelpPage() {
    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="bg-primary/5 py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-foreground mb-4">How can we help?</h1>
                    <div className="max-w-2xl mx-auto relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search for articles..."
                            className="w-full pl-14 pr-4 py-4 rounded-xl border border-input bg-background shadow-lg focus:ring-2 focus:ring-primary/20 outline-none text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:-translate-y-1 transition-transform cursor-pointer">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Getting Started</h3>
                        <p className="text-muted-foreground">How to use ConvertLocally tools effectively and efficiently.</p>
                    </div>
                    <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:-translate-y-1 transition-transform cursor-pointer">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Troubleshooting</h3>
                        <p className="text-muted-foreground">Solutions for common errors and processing issues.</p>
                    </div>
                    <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:-translate-y-1 transition-transform cursor-pointer">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Privacy & Security</h3>
                        <p className="text-muted-foreground">Learn how we protect your files and data.</p>
                    </div>
                </div>

                <div className="mt-20">
                    <h2 className="text-2xl font-bold mb-8">Popular Articles</h2>
                    <div className="space-y-4">
                        <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center justify-between group cursor-pointer">
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Why is my PDF conversion failing?</h3>
                                <p className="text-muted-foreground mt-1">Common reasons for failures included encrypted files or broken data.</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center justify-between group cursor-pointer">
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">How long do you keep my files?</h3>
                                <p className="text-muted-foreground mt-1">Understanding our 1-hour auto-deletion policy.</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center justify-between group cursor-pointer">
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Can I use ConvertLocally for business?</h3>
                                <p className="text-muted-foreground mt-1">Information about commercial usage and API access.</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="mt-20 bg-secondary/50 rounded-3xl p-12 text-center">
                    <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
                    <p className="text-muted-foreground mb-8 text-lg">Our support team is always ready to assist you.</p>
                    <Link href="/contact" prefetch={false} className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                        Contact Support
                    </Link>
                </div>
            </div>
        </main>
    );
}
