"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSharedRouter } from "@/lib/navigation";
import { authAPI } from "@/lib/auth-api";

interface NavButton {
    label: string;
    href: string;
    isPrimary?: boolean;
}

export default function AuthButtons() {
    const router = useSharedRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const checkAuth = () => {
            const authenticated = authAPI.isAuthenticated();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const user = authAPI.getStoredUser();
                if (user) {
                    setUserName(user.name);
                }
            }
        };

        checkAuth();

        // Use 'storage' event for cross-tab sync instead of polling
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === 'user') {
                checkAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleLogout = async () => {
        await authAPI.logout();
        setIsAuthenticated(false);
        router.push("/");
    };

    if (isAuthenticated) {
        return (
            <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
                <Link href="/profile" prefetch={false} className="text-[13px] lg:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                    {userName}
                </Link>
                <button
                    onClick={handleLogout}
                    className="px-4 lg:px-5 py-2 lg:py-2.5 border-2 border-slate-200 text-slate-700 text-[13px] lg:text-sm font-bold rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            <Link href="/login" prefetch={false} className="text-[13px] lg:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                Log In
            </Link>
            <Link href="/signup" prefetch={false} className="px-4 lg:px-5 py-2 lg:py-2.5 bg-primary text-primary-foreground text-[13px] lg:text-sm font-bold rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                Sign Up
            </Link>
        </div>
    );
}
