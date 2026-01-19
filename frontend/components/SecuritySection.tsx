export default function SecuritySection() {
    return (
        <section className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12 my-12">
            <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Your Data, Our Priority</h2>
                <p className="text-slate-600 leading-relaxed mb-6">
                    At FileVora, we go beyond just converting files—we protect them. Our robust security framework ensures that your data is always safe, whether you're converting an image, video, or document. With advanced encryption, secure data centers, and vigilant monitoring, we've covered every aspect of your data's safety.
                </p>
                <button className="text-blue-600 font-bold border border-blue-200 hover:bg-blue-50 px-6 py-3 rounded-xl transition-colors">
                    Learn more about our security
                </button>
            </div>
            <div className="flex-1 space-y-6">
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
    );
}
