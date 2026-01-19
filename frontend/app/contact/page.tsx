"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactPage() {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "General",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");

        try {
            await addDoc(collection(db, "messages"), {
                ...formData,
                timestamp: serverTimestamp(),
                read: false
            });
            setStatus("success");
            setFormData({ name: "", email: "", subject: "General", message: "" });
        } catch (error) {
            console.error("Error submitting form:", error);
            setStatus("error");
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 pt-8">
            <div className="max-w-3xl mx-auto px-4">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Contact Us</h1>
                    <p className="text-slate-600 mb-8">
                        Have a question or feedback? Fill out the form below or chat with us.
                    </p>

                    {status === "success" ? (
                        <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 text-center animate-in fade-in zoom-in">
                            <div className="text-4xl mb-3">✨</div>
                            <h3 className="font-bold text-lg">Message Sent!</h3>
                            <p className="text-sm mt-1">Thanks for reaching out. We'll get back to you shortly.</p>
                            <button
                                onClick={() => setStatus("idle")}
                                className="mt-4 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                            >
                                Send Another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        disabled={status === "submitting"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        disabled={status === "submitting"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium bg-white"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    disabled={status === "submitting"}
                                >
                                    <option>General Inquiry</option>
                                    <option>Support Request</option>
                                    <option>Bug Report</option>
                                    <option>Partnership</option>
                                    <option>Dev / API</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium resize-none"
                                    placeholder="How can we help you?"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    disabled={status === "submitting"}
                                />
                            </div>

                            {status === "error" && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    Something went wrong. Please try again later.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "submitting"}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === "submitting" ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    "Send Message"
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-10 pt-8 border-t border-slate-100 grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-slate-800 mb-1">Email us directly</h3>
                            <a href="mailto:support@filevora.com" className="text-slate-500 hover:text-blue-600 transition">support@filevora.com</a>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 mb-1">Live Chat</h3>
                            <p className="text-slate-500">Available 9am - 5pm EST</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
