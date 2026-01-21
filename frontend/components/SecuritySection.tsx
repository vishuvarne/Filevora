
export default function SecuritySection() {
    return (
        <section className="bg-card rounded-3xl p-6 sm:p-10 border border-border shadow-sm flex flex-col md:flex-row items-center gap-10 md:gap-16 my-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <div className="flex-1 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    Bank-Grade Security
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">Your Data, <span className="text-primary">Our Priority</span></h2>
                <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                    At FileVora, we go beyond just converting files—we protect them. Our robust security framework ensures that your data is always safe, whether you're converting an image, video, or document. Files are automatically deleted after 1 hour.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95">
                        Read Security Policy
                    </button>
                    <button className="text-foreground font-bold border border-border hover:bg-secondary px-6 py-3 rounded-xl transition-colors">
                        Learn more
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-4 w-full relative z-10">
                {[
                    { icon: "lock", title: "SSL/TLS Encryption", desc: "All data transfers are encrypted via HTTPS." },
                    { icon: "server", title: "Secured Data Centers", desc: "ISO 27001 certified infrastructure." },
                    { icon: "shield", title: "Access Control", desc: "Strict authentication protocols." }
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50">
                        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
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
                            <h4 className="font-bold text-foreground text-lg">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
