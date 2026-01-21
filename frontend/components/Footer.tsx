"use client";

import Link from "next/link";
import { useState } from "react";
import { FirestoreService } from "@/lib/firestore-service";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        try {
            await FirestoreService.subscribeToNewsletter(email);
            setStatus("success");
            setEmail("");
        } catch (error) {
            setStatus("error");
        }
    };

    return (
        <footer className="bg-secondary/30 border-t border-border pt-16 pb-12 mt-auto font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Newsletter Section */}
                <div className="mb-16 pb-12 border-b border-border/50 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-left">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Subscribe to our newsletter</h2>
                        <p className="text-muted-foreground">Get the latest updates, new tools, and tips directly to your inbox.</p>
                    </div>
                    <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            aria-label="Email address for newsletter"
                            className="flex-1 bg-background border border-input text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-80 placeholder:text-muted-foreground transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === "loading" || status === "success"}
                        />
                        <button
                            type="submit"
                            aria-label="Subscribe"
                            disabled={status === "loading" || status === "success"}
                            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${status === "success" ? "bg-green-600 text-white shadow-green-200" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"}`}
                        >
                            {status === "loading" ? "..." : status === "success" ? "Subscribed!" : "Subscribe"}
                        </button>
                    </form>
                </div>

                {/* Main Grid: 6 Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-10 sm:gap-8 mb-16 text-sm">

                    {/* Col 1: Audio & Video */}
                    <div className="space-y-4">
                        <h3 className="text-foreground font-bold mb-4 uppercase tracking-wider text-xs opacity-70">Audio & Video</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><Link href="#" className="hover:text-primary transition-colors">MP4 Converter</Link></li>
                            <li><Link href="/tools/video-to-gif" className="hover:text-primary transition-colors">Video to GIF</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">MOV to MP4</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">MP3 Converter</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">MP4 to MP3</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Video to MP3</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">AVI Converter</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">WAV Converter</Link></li>
                        </ul>
                    </div>

                    {/* Col 2: Image Tools */}
                    <div className="space-y-4">
                        <h3 className="text-foreground font-bold mb-4 uppercase tracking-wider text-xs opacity-70">Image Tools</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><Link href="/tools/convert-image" className="hover:text-primary transition-colors">Image Converter</Link></li>
                            <li><Link href="/tools/image-compressor" className="hover:text-primary transition-colors">Compress Image</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Resize Image</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Crop Image</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Rotate Image</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">PNG to JPG</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">JPG to PNG</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">HEIC to JPG</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: PDF Tools */}
                    <div className="space-y-4">
                        <h3 className="text-foreground font-bold mb-4 uppercase tracking-wider text-xs opacity-70">PDF Tools</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><Link href="/tools/merge-pdf" className="hover:text-primary transition-colors">Merge PDF</Link></li>
                            <li><Link href="/tools/split-pdf" className="hover:text-primary transition-colors">Split PDF</Link></li>
                            <li><Link href="/tools/compress-pdf" className="hover:text-primary transition-colors">Compress PDF</Link></li>
                            <li><Link href="/tools/pdf-to-word" className="hover:text-primary transition-colors">PDF to Word</Link></li>
                            <li><Link href="/tools/pdf-to-excel" className="hover:text-primary transition-colors">PDF to Excel</Link></li>
                            <li><Link href="/tools/word-to-pdf" className="hover:text-primary transition-colors">Word to PDF</Link></li>
                            <li><Link href="/tools/pdf-to-image" className="hover:text-primary transition-colors">PDF to JPG</Link></li>
                            <li><Link href="/tools/image-to-pdf" className="hover:text-primary transition-colors">JPG to PDF</Link></li>
                        </ul>
                    </div>

                    {/* Col 4: Converters */}
                    <div className="space-y-4">
                        <h3 className="text-foreground font-bold mb-4 uppercase tracking-wider text-xs opacity-70">Converters</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><Link href="/tools/unit-converter" className="hover:text-primary transition-colors">Unit Converter</Link></li>
                            <li><Link href="/tools/length-converter" className="hover:text-primary transition-colors">Length Converter</Link></li>
                            <li><Link href="/tools/weight-converter" className="hover:text-primary transition-colors">Weight Converter</Link></li>
                            <li><Link href="/tools/temperature-converter" className="hover:text-primary transition-colors">Temperature</Link></li>
                            <li><Link href="/tools/time-converter" className="hover:text-primary transition-colors">Time Converter</Link></li>
                            <li><Link href="/tools/speed-converter" className="hover:text-primary transition-colors">Speed Converter</Link></li>
                            <li><Link href="/tools/volume-converter" className="hover:text-primary transition-colors">Volume</Link></li>
                            <li><Link href="/tools/area-converter" className="hover:text-primary transition-colors">Area Converter</Link></li>
                        </ul>
                    </div>

                    {/* Col 5: Company */}
                    <div className="space-y-4">
                        <h3 className="text-foreground font-bold mb-4 uppercase tracking-wider text-xs opacity-70">Company</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/security" className="hover:text-primary transition-colors">Security</Link></li>
                        </ul>
                    </div>

                    {/* Col 6: Support */}
                    <div className="space-y-4">
                        <h3 className="text-foreground font-bold mb-4 uppercase tracking-wider text-xs opacity-70">Support</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                            <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                            <li><Link href="/api" className="hover:text-primary transition-colors">API</Link></li>
                            <li><Link href="/donate" className="hover:text-primary transition-colors">Donate</Link></li>
                            <li><Link href="/status" className="hover:text-primary transition-colors">System Status</Link></li>
                        </ul>
                    </div>

                </div>

                {/* Web Apps & Mobile Apps Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 border-t border-border/50 pt-12">
                    <div>
                        <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                            Web Apps
                        </h3>
                        <div className="flex flex-wrap gap-2 sm:gap-3 text-sm">
                            <Link href="/tools/collage-maker" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">Collage Maker</Link>
                            <Link href="/tools/image-resizer" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">Image Resizer</Link>
                            <Link href="/tools/crop-image" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">Crop Image</Link>
                            <Link href="/tools/color-picker" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">Color Picker</Link>
                            <Link href="/tools/meme-generator" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">Meme Generator</Link>
                            <Link href="/tools/photo-editor" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">Photo Editor</Link>
                            <Link href="/tools/qr-code-generator" className="px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-[11px] sm:text-xs">QR Code Generator</Link>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                            Mobile Apps
                        </h3>
                        <div className="flex flex-col xs:flex-row gap-4">
                            <button aria-label="Download on App Store" className="flex items-center gap-3 bg-foreground hover:bg-foreground/90 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-black/10 w-full xs:w-auto group">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-background group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.523 13.2943 19.2319 12.1818 19.3142 12.1287C18.2728 10.6401 16.6575 10.4357 15.9084 10.4076C14.1955 10.2338 12.562 11.4111 11.751 11.4111C10.9231 11.4111 9.53935 10.4194 8.09452 10.4503C6.20875 10.4771 4.4754 11.5369 3.51356 13.1979C1.56543 16.5593 3.01256 21.5323 4.90835 24.2657C5.8398 25.6015 6.94273 27.0858 8.40698 27.0326C9.80332 26.9749 10.334 26.1384 12.016 26.1384C13.6847 26.1384 14.1507 27.0326 15.6552 27.0045C17.2023 26.9442 18.156 25.4837 19.0667 24.1619C20.1419 22.6074 20.5985 21.0963 20.6385 21.0165C20.6127 21.0024 17.523 19.8252 17.523 15.3414Z" transform="translate(-1 -4)" /></svg>
                                <div className="text-left">
                                    <div className="text-[10px] leading-none text-background/60">Download on the</div>
                                    <div className="text-sm font-bold text-background">App Store</div>
                                </div>
                            </button>
                            <button aria-label="Get it on Google Play" className="flex items-center gap-3 bg-foreground hover:bg-foreground/90 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-black/10 w-full xs:w-auto group">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-background group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.14L13.77,12.07L3.84,22C3.34,21.75 3,21.23 3,20.5M16.81,15.12L6.05,25.88C6.91,25.96 7.83,25.59 8.5,24.93L16.81,16.62L16.81,15.12M21.83,12.91L18.78,14.43L15.65,11.3L21.39,5.56C21.65,5.81 21.88,6.21 21.88,6.72C21.88,6.97 21.81,7.21 21.68,7.43L21.83,12.91M15.42,9.39L18.3,6.5L7.8,1.4C7.3,1.15 6.74,1.09 6.2,1.25L15.42,10.47V9.39Z" /></svg>
                                <div className="text-left">
                                    <div className="text-[10px] leading-none text-background/60">Get it on</div>
                                    <div className="text-sm font-bold text-background">Google Play</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-8 text-sm text-muted-foreground text-center sm:text-left">
                    <div className="flex gap-4">
                        {/* Social Icons */}
                        {[1, 2, 3, 4].map(i => (
                            <Link key={i} href="#" className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm hover:shadow-primary/25 active:scale-95 group">
                                <svg className="w-3.5 h-3.5 sm:w-3 sm:h-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="font-bold text-2xl text-foreground tracking-tight">
                            File<span className="text-primary">Vora</span>
                        </div>
                        <div className="hidden sm:block w-[1px] h-4 bg-border"></div>
                        <div className="flex gap-4 text-xs sm:text-sm">
                            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                        </div>
                        <span className="text-xs sm:text-sm opacity-60">© 2026 All rights reserved</span>
                    </div>
                </div>

            </div>
        </footer>
    );
}
