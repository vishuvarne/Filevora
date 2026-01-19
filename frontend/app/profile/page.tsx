"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/auth-api";

interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "history" | "settings">("overview");

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (!authAPI.isAuthenticated()) {
                    router.push("/login");
                    return;
                }

                const userData = authAPI.getStoredUser();
                if (userData) {
                    setUser(userData);
                }
            } catch (error) {
                console.error("Error loading user:", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [router]);

    const handleLogout = async () => {
        await authAPI.logout();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl">
                                F
                            </div>
                            <span className="text-xl font-bold text-slate-900">
                                File<span className="text-blue-600">Vora</span>
                            </span>
                        </Link>
                        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {user.name.charAt(0).toUpperCase()}
                            </div>

                            {/* User Info */}
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-1">{user.name}</h1>
                                <p className="text-slate-600 mb-3">{user.email}</p>
                                <p className="text-sm text-slate-500">
                                    Member since {new Date(user.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="border-b border-slate-200 px-6">
                        <nav className="flex gap-8">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === "overview"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === "history"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Conversion History
                            </button>
                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === "settings"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Settings
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-blue-900">Total Conversions</h3>
                                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-3xl font-bold text-blue-900">0</p>
                                        <p className="text-xs text-blue-700 mt-1">All time</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-green-900">This Month</h3>
                                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                        <p className="text-3xl font-bold text-green-900">0</p>
                                        <p className="text-xs text-green-700 mt-1">Conversions</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-purple-900">Account Type</h3>
                                            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-3xl font-bold text-purple-900">Free</p>
                                        <p className="text-xs text-purple-700 mt-1">100 conversions/hour</p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <Link href="/tools/merge-pdf" className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                            <div className="text-3xl mb-2">📄</div>
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">Merge PDF</h3>
                                            <p className="text-xs text-slate-500 mt-1">Combine PDFs</p>
                                        </Link>

                                        <Link href="/tools/convert-image" className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                            <div className="text-3xl mb-2">🖼️</div>
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">Convert Image</h3>
                                            <p className="text-xs text-slate-500 mt-1">Change formats</p>
                                        </Link>

                                        <Link href="/tools/compress-pdf" className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                            <div className="text-3xl mb-2">📦</div>
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">Compress PDF</h3>
                                            <p className="text-xs text-slate-500 mt-1">Reduce size</p>
                                        </Link>

                                        <Link href="/tools/image-compressor" className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                                            <div className="text-3xl mb-2">🗜️</div>
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">Image Compressor</h3>
                                            <p className="text-xs text-slate-500 mt-1">Optimize images</p>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No conversion history yet</h3>
                                <p className="text-slate-500 mb-6">Start using FileVora to see your conversion history here</p>
                                <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                                    Browse Tools
                                </Link>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                {/* Account Settings */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Account Settings</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">Email Address</h4>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                            <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                Change
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">Password</h4>
                                                <p className="text-sm text-slate-500">••••••••</p>
                                            </div>
                                            <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                Change
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">Display Name</h4>
                                                <p className="text-sm text-slate-500">{user.name}</p>
                                            </div>
                                            <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                        <h4 className="font-semibold text-red-900 mb-2">Delete Account</h4>
                                        <p className="text-sm text-red-700 mb-4">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        <button className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
