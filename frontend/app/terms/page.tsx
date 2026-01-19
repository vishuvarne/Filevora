import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
    title: "Terms of Service - FileVora",
    description: "FileVora Terms of Service. Rules and conditions for using our file conversion and processing tools.",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 pt-8">
            <div className="max-w-3xl mx-auto px-4">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 prose prose-slate max-w-none">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
                    <p className="text-slate-500 text-sm mb-8">Last updated: 2026</p>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">1. Acceptance</h2>
                        <p className="text-slate-600 leading-relaxed">
                            By using FileVora’s website and services, you agree to these Terms of Service (“Terms”). If you do not
                            agree, do not use our services.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">2. Use of the Service</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            FileVora provides file conversion, compression, and related tools. You agree to:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>Use the service only for lawful purposes and in compliance with applicable laws.</li>
                            <li>Not upload content that infringes others’ rights, is illegal, harmful, or that you do not have the right to use.</li>
                            <li>Not attempt to circumvent security, abuse the service, or use it in a way that disrupts other users or our systems.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">3. Intellectual Property</h2>
                        <p className="text-slate-600 leading-relaxed">
                            FileVora’s brand, design, and code are owned by us or our licensors. You retain ownership of the files
                            you upload. By uploading, you grant us a limited license to process them solely to provide the requested service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">4. Disclaimer of Warranties</h2>
                        <p className="text-slate-600 leading-relaxed">
                            The service is provided “as is” and “as available.” We do not warrant that it will be error-free,
                            uninterrupted, or secure. Use it at your own risk.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">5. Limitation of Liability</h2>
                        <p className="text-slate-600 leading-relaxed">
                            To the fullest extent permitted by law, FileVora and its affiliates shall not be liable for any
                            indirect, incidental, special, or consequential damages, or for loss of data or profits, arising from your
                            use of the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">6. Termination</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We may suspend or terminate your access to the service at any time, without notice, for conduct that
                            violates these Terms or for any other reason we consider appropriate.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">7. Changes</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We may update these Terms from time to time. Continued use of the service after changes constitutes
                            acceptance of the new Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">8. Contact</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Questions about these Terms: <a href="mailto:legal@filevora.com" className="text-blue-600 hover:underline">legal@filevora.com</a>
                        </p>
                    </section>

                    <div className="mt-10 pt-6 border-t border-slate-200">
                        <Link href="/" className="text-blue-600 font-semibold hover:underline">
                            ← Back to tools
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
