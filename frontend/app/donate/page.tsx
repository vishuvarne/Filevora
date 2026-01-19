import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
    title: "Donate - FileVora",
    description: "Support FileVora. Help us keep our file tools free for everyone.",
};

export default function DonatePage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 pt-8">
            <div className="max-w-3xl mx-auto px-4">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Donate" }]} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">Support FileVora</h1>

                    <p className="text-slate-600 leading-relaxed mb-8">
                        FileVora is free to use. Donations help us pay for servers, development, and keep adding new tools
                        without ads or paywalls. Every contribution counts.
                    </p>

                    <div className="grid gap-6 md:grid-cols-2 mb-10">
                        <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-100">
                            <h2 className="font-bold text-slate-800 mb-2">One-time donation</h2>
                            <p className="text-slate-600 text-sm mb-4">Support us with a single gift. No recurring commitment.</p>
                            <a
                                href="https://www.paypal.com/donate?hosted_button_id=EXAMPLE"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                            >
                                Donate via PayPal
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                            <h2 className="font-bold text-slate-800 mb-2">Other ways to help</h2>
                            <ul className="text-slate-600 text-sm space-y-2">
                                <li>• Share FileVora with friends and colleagues</li>
                                <li>• Tell us what tools you’d like to see</li>
                                <li>• Use our <Link href="/api" className="text-blue-600 hover:underline">API</Link> and give feedback</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <p className="text-slate-600 text-sm">
                            <strong>Note:</strong> Replace the PayPal link above with your own donation URL (e.g., PayPal, Ko-fi, or
                            Open Collective) when you’re ready to accept donations.
                        </p>
                    </div>

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
