import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
    title: "Privacy Policy - FileVora",
    description: "FileVora Privacy Policy. How we collect, use, and protect your data when you use our file tools.",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 pt-8">
            <div className="max-w-3xl mx-auto px-4">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 prose prose-slate max-w-none">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
                    <p className="text-slate-500 text-sm mb-8">Last updated: 2026</p>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">1. Introduction</h2>
                        <p className="text-slate-600 leading-relaxed">
                            FileVora (“we”, “our”, or “us”) is committed to protecting your privacy. This policy describes how we
                            collect, use, and safeguard information when you use our website and tools.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">2. Information We Collect</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            When you use FileVora, we may collect:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li><strong>Files you upload</strong> — Processed only to provide the requested service. Many of our tools run in your browser; in those cases, your files never leave your device.</li>
                            <li><strong>Usage data</strong> — Such as which tools you use, in an aggregated form to improve our service.</li>
                            <li><strong>Technical data</strong> — Browser type, device, and IP address, for security and basic analytics.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">3. How We Use Your Information</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use the information to operate and improve FileVora, to process your requests, to enforce our Terms
                            of Service, and to protect against abuse. We do not sell your personal data or uploaded files to third parties.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">4. File Retention</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Files that are processed on our servers are automatically deleted within a short period (e.g., one hour)
                            after processing. We do not retain copies for longer than necessary to deliver the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">5. Cookies and Similar Technologies</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We may use cookies and similar technologies for essential functionality, analytics, and preferences.
                            You can control cookie settings in your browser.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">6. Third-Party Services</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We may use third-party services (e.g., hosting, analytics). Those providers have their own privacy
                            policies governing how they handle data we share with them.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">7. Your Rights</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Depending on where you live, you may have rights to access, correct, or delete your personal data, or
                            to object to or restrict certain processing. Contact us at support@filevora.com to exercise these rights.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">8. Changes</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will post the updated version on this page and
                            update the “Last updated” date.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">9. Contact</h2>
                        <p className="text-slate-600 leading-relaxed">
                            For privacy-related questions: <a href="mailto:privacy@filevora.com" className="text-blue-600 hover:underline">privacy@filevora.com</a>
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
