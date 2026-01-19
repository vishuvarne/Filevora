"use client";

import { ToolDef, TOOLS } from "@/config/tools";
import Link from "next/link";

export default function ToolInfoSection({ tool }: { tool: ToolDef }) {

    // Helper to find related tools
    const relatedTools = TOOLS
        .filter(t => t.category === tool.category && t.id !== tool.id)
        .slice(0, 8);

    // Dynamic data based on tool type (In a real app, this might come from a CMS or config)
    const useCases = [
        {
            title: "For Professionals",
            desc: "Ensure your documents meet industry standards. Perfect for contracts, reports, and presentations.",
            icon: "briefcase"
        },
        {
            title: "For Students",
            desc: "Submit assignments in the correct format. Easily handle PDFs, research papers, and images.",
            icon: "academic"
        },
        {
            title: "Save Storage",
            desc: "Compress files without losing quality to free up space on your device or cloud storage.",
            icon: "database"
        }
    ];

    return (
        <div className="mt-16 space-y-20 max-w-5xl mx-auto px-4 font-sans text-slate-800">

            {/* 1. Instructions & Highlights Block */}
            <section className="bg-white rounded-3xl p-5 sm:p-8 md:p-12 shadow-sm border border-slate-100">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-center text-slate-900">How to convert {tool.name.toLowerCase()} files?</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center mb-8 md:mb-16">
                    {/* Text Instructions */}
                    <div className="order-2 lg:order-1">
                        <ol className="relative border-l-2 border-slate-200 ml-4 space-y-6 sm:space-y-8">
                            <li className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white text-blue-600 font-bold">1</span>
                                <h3 className="flex items-center mb-1 text-lg font-bold text-slate-900">Click the "Choose Files" button</h3>
                                <p className="mb-4 text-base font-normal text-slate-500">Select your files from your computer, Google Drive, Dropbox or URL.</p>
                            </li>
                            <li className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white text-blue-600 font-bold">2</span>
                                <h3 className="flex items-center mb-1 text-lg font-bold text-slate-900">Choose Output Format</h3>
                                <p className="mb-4 text-base font-normal text-slate-500">Select target format from the "Convert To" dropdown list.</p>
                            </li>
                            <li className="ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white text-blue-600 font-bold">3</span>
                                <h3 className="flex items-center mb-1 text-lg font-bold text-slate-900">Download Your File</h3>
                                <p className="mb-4 text-base font-normal text-slate-500">
                                    Click the blue "Convert" button to start processing, then download your file.
                                </p>
                            </li>
                        </ol>
                    </div>

                    {/* Feature Icons (Right side or top on mobile) */}
                    <div className="order-1 lg:order-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 md:gap-6 text-center">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-purple-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Convert Any File</h3>
                            <p className="text-slate-500 text-sm">Supports 200+ formats for all your needs.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Best Quality</h3>
                            <p className="text-slate-500 text-sm">High fidelity conversion with advanced algorithms.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-12.25v10m-3.75 3.25H6a2.25 2.25 0 00-2.25 2.25V21h13.5V6.75a2.25 2.25 0 00-2.25-2.25H15M10.5 4.5h3m-3-2.25h3" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Free & Secure</h3>
                            <p className="text-slate-500 text-sm">Files deleted after 1 hour. 256-bit SSL encryption.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Supported Formats (NEW) */}
            <section className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Supported Formats</h2>
                <div className="inline-grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {["PDF", "DOCX", "JPG", "PNG", "XLS", "PPT", "EPUB", "MP4", "GIF", "WEBP", "SVG", "TXT"].map((fmt) => (
                        <div key={fmt} className="bg-white border border-slate-200 rounded-lg py-3 px-6 text-sm font-bold text-slate-600 shadow-sm hover:border-blue-400 hover:text-blue-600 cursor-default transition-colors">
                            {fmt}
                        </div>
                    ))}
                </div>
                <p className="mt-6 text-slate-500 text-sm">And many more! We support over 200+ file formats.</p>
            </section>

            {/* 3. Use Cases (NEW) */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {useCases.map((useCase, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                {useCase.icon === "briefcase" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.066v1.75m-4.5 0v1.75m0-1.75a48.11 48.11 0 01-3.413.387m-4.5-8.006c0-1.116.775-2.034 1.846-2.193 1.503-.21 3.037-.342 4.591-.342 1.554 0 3.088.132 4.591.342 1.071.159 1.846 1.077 1.846 2.193v.448m-16.5 0a2.18 2.18 0 00-1.624 3.791m1.624-3.343a48.12 48.12 0 013.413-.387m-4.5 3.86a48.115 48.115 0 013.413-.387m4.5 0c1.064-.144 1.836-1.08 1.836-2.157V8.706c0-1.065-.758-2.012-1.815-2.17A48.122 48.122 0 0012 6.372c-1.35 0-2.68.04-3.993.118-1.057.158-1.815 1.105-1.815 2.17v.448c0 1.076.772 2.013 1.836 2.157m0 0a48.112 48.112 0 013.413.387m-4.5 0A2.18 2.18 0 003.75 12.81m16.5 0a2.18 2.18 0 01-2.18 2.18H5.93A2.18 2.18 0 013.75 12.81" /></svg>
                                )}
                                {useCase.icon === "academic" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
                                )}
                                {useCase.icon === "database" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{useCase.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{useCase.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Security Section (Your Data, Our Priority) */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center gap-10 md:gap-12">
                <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4">Your Data, Our Priority</h2>
                    <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base">
                        At FileVora, we go beyond just converting files—we protect them. Our robust security framework ensures that your data is always safe, whether you're converting an image, video, or document. With advanced encryption, secure data centers, and vigilant monitoring, we've covered every aspect of your data's safety.
                    </p>
                    <button className="text-blue-600 font-bold border border-blue-100 hover:bg-blue-50 px-6 py-3 rounded-xl transition-colors text-sm">
                        Learn more about our security
                    </button>
                </div>
                <div className="flex-1 w-full space-y-5 sm:space-y-6">
                    {[
                        { icon: "lock", title: "SSL/TLS Encryption", desc: "All data transfers are encrypted via HTTPS." },
                        { icon: "server", title: "Secured Data Centers", desc: "ISO 27001 certified infrastructure." },
                        { icon: "shield", title: "Access Control", desc: "Strict authentication protocols." }
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 shrink-0">
                                {item.icon === "lock" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                )}
                                {item.icon === "server" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.25A4.5 4.5 0 015.25 6h13.5A4.5 4.5 0 0121 8.25m-19.5 0v.15" /></svg>
                                )}
                                {item.icon === "shield" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{item.title}</h4>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. Upgrade Banner */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-lg shadow-blue-200/50">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Want to convert large files without a queue or Ads?</h2>
                <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-base sm:text-lg">
                    Upgrade to Pro for unlimited file size, concurrent conversions, and priority support.
                </p>
                <button className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-3.5 rounded-xl text-base sm:text-lg transition-transform hover:scale-105 shadow-xl active:scale-95">
                    Sign Up Now
                </button>
            </section>

            {/* 6. Specific Converters List */}
            {relatedTools.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-8 cursor-pointer group">
                        <h2 className="text-2xl font-bold text-slate-800">Specific {tool.category} converters</h2>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8">
                        {relatedTools.map(t => (
                            <Link key={t.id} href={`/tools/${t.id}`} className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors">
                                {t.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 7. FAQ */}
            <section className="max-w-4xl mx-auto border-t border-slate-200 pt-16">
                <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {[
                        { q: "Is it safe to use?", a: "Yes. Use HTTPS encryption and delete all files automatically after 1 hour." },
                        { q: "Is there a file size limit?", a: "Currently we support files up to 50MB for free users." },
                        { q: "Can I use it on mobile?", a: "Absolutely. Our website is fully responsive and works on all devices." },
                        { q: "How long does it take?", a: "Most conversions finish in under 10 seconds thanks to our high-performance cloud servers." }
                    ].map((faq, i) => (
                        <div key={i} className="border-b border-slate-200 pb-6 mb-2">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 cursor-pointer">{faq.q}</h3>
                            <p className="text-slate-600">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="h-12" />
        </div>
    );
}
