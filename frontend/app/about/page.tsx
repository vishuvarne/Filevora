import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
    title: "About FileVora - Professional File Tools",
    description: "Learn about FileVora: our mission, values, and commitment to free, secure file conversion and processing tools.",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 pt-8">
            <div className="max-w-3xl mx-auto px-4">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About FileVora" }]} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">About FileVora</h1>

                    <p className="text-slate-600 leading-relaxed mb-6">
                        FileVora is a free, fast, and secure suite of file tools. We help you merge, split, compress, and convert
                        PDFs, images, videos, and more—without complicated software or hidden fees.
                    </p>

                    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-3">Our Mission</h2>
                    <p className="text-slate-600 leading-relaxed mb-6">
                        We believe everyone deserves access to reliable file tools. Whether you need to convert a document for work,
                        resize an image for the web, or create a QR code—FileVora is here to help, 100% free.
                    </p>

                    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-3">What We Offer</h2>
                    <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
                        <li>PDF tools: merge, split, compress, convert to and from Word, JPG, EPUB</li>
                        <li>Image tools: convert, resize, crop, compress, collage, meme generator, QR codes</li>
                        <li>Video & audio: convert and process common formats</li>
                        <li>Utilities: unit converter, time zones, archive conversion</li>
                    </ul>

                    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-3">Security & Privacy</h2>
                    <p className="text-slate-600 leading-relaxed mb-6">
                        Your files are processed with care. We use TLS encryption, and many tools run entirely in your browser.
                        Processed files are automatically deleted from our servers within a short retention window.
                    </p>

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
