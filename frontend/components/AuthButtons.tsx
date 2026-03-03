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

    return null;
}
