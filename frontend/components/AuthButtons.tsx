"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/auth-api";

interface NavButton {
    label: string;
    href: string;
    isPrimary?: boolean;
}

export default function AuthButtons() {
    const router = useRouter();
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
        // Check auth status every second in case it changes
        const interval = setInterval(checkAuth, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await authAPI.logout();
        setIsAuthenticated(false);
        router.push("/");
    };

    if (isAuthenticated) {
        return (
            <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
                <Link href="/profile" className="text-[13px] lg:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
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
            <Link href="/login" className="text-[13px] lg:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                Log In
            </Link>
            <Link href="/signup" className="px-4 lg:px-5 py-2 lg:py-2.5 bg-blue-600 text-white text-[13px] lg:text-sm font-bold rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                Sign Up
            </Link>
        </div>
    );
}
