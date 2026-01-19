import Link from "next/link";
import { Metadata } from "next";
import { TOOLS } from "@/config/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import ApiSection from "@/components/api/ApiSection";

export const metadata: Metadata = {
    title: "Developer API Marketplace - FileVora",
    description: "Rent professional file processing APIs. Integrate PDF merging, image conversion, and video compression into your apps with FileVora API.",
};

export default function ApiPage() {
    const pdfTools = TOOLS.filter(t => t.category === "PDF & Documents").slice(0, 6);
    const imageTools = TOOLS.filter(t => t.category === "Image").slice(0, 6);
    const mediaTools = TOOLS.filter(t => t.category === "Video & Audio" || t.category === "GIF").slice(0, 6);

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white pt-20 pb-32 px-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-1/4 h-full bg-purple-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto">
                    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "API Marketplace" }]} dark />

                    <div className="max-w-3xl mt-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Now Renting Tool Endpoints
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                            Build with the <br />
                            <span className="text-blue-500">FileVora Engine</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium">
                            Don't waste months building complex file processing logic.
                            Rent our high-performance endpoints and scale your app in minutes.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <a href="#documentation" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40">
                                Explore Documentation
                            </a>
                            <a href="#pricing" className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 backdrop-blur-sm transition-all border border-white/10">
                                Pricing Plans
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                    {[
                        { label: "Uptime", val: "99.9%" },
                        { label: "Latency", val: "<200ms" },
                        { label: "Security", val: "AES-256" },
                        { label: "Rate Limit", val: "10k/min" }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center">
                            <div className="text-2xl font-bold text-slate-900">{s.val}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div id="documentation">
                    <ApiSection category="PDF & Document" tools={pdfTools} />
                    <ApiSection category="Image Processing" tools={imageTools} />
                    <ApiSection category="Media & Video" tools={mediaTools} />
                </div>

                {/* Pricing Section */}
                <section id="pricing" className="mt-20 pt-20 border-t border-slate-200">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Transparent Pricing</h2>
                        <p className="text-slate-500 font-medium">Rent single endpoints or subscribe for global access.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Free Tier */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 hover:shadow-2xl transition-all h-fit">
                            <h3 className="text-xl font-bold mb-2">Free / Sandbox</h3>
                            <div className="text-4xl font-extrabold mb-6">$0<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                            <ul className="space-y-4 mb-8 text-slate-500 font-medium">
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    100 Requests / day
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Community Support
                                </li>
                                <li className="flex items-center gap-2 opacity-50">
                                    <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                    Rate Limited
                                </li>
                            </ul>
                            <Link href="/signup" className="block w-full text-center py-4 bg-slate-100 text-slate-800 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                Get Started
                            </Link>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-slate-900 p-8 rounded-[40px] border-4 border-blue-500 shadow-2xl shadow-blue-500/20 relative -mt-4 transform hover:scale-[1.02] transition-all">
                            <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Most Popular</div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro / Rental</h3>
                            <div className="text-4xl font-extrabold text-white mb-6">$49<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                            <ul className="space-y-4 mb-8 text-slate-400 font-medium">
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    50,000 Requests / day
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Priority Queue
                                </li>
                                <li className="flex items-center gap-2 text-slate-200">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Commercial Use
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    24/7 Slack Support
                                </li>
                            </ul>
                            <Link href="/signup" className="block w-full text-center py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/40">
                                Rent Now
                            </Link>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 hover:shadow-2xl transition-all h-fit">
                            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                            <div className="text-4xl font-extrabold mb-6">Custom</div>
                            <ul className="space-y-4 mb-8 text-slate-500 font-medium">
                                <li className="flex items-center gap-2 text-slate-900 font-bold">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Unlimited Requests
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Dedicated Infrastructure
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Custom Endpoints
                                </li>
                            </ul>
                            <Link href="/contact" className="block w-full text-center py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                                Talk to Sales
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mt-40 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">API Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {[
                            { q: "How do I rent a specific endpoint?", a: "Once you have a Pro account, simply generate an API key and call the endpoint using your key. Billing is monthly and covers all tools." },
                            { q: "What's the data retention policy?", a: "We value privacy. All files processed via API are strictly auto-deleted within 60 minutes. We never store your data longer than needed." },
                            { q: "Can I get a custom endpoint?", a: "Yes, for Enterprise customers we can build and deploy custom file processing logic tailored to your needs." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-2">{faq.q}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
