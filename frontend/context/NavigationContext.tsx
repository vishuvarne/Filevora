"use client";

import React, { createContext, useContext, useMemo } from 'react';

export interface UnifiedRouter {
    push: (url: string) => void;
    replace: (url: string, as?: string, options?: any) => void;
    prefetch: (url: string) => void;
    back: () => void;
    pathname: string;
    query: Record<string, string | string[] | undefined>;
    searchParams: {
        get: (key: string) => string | null;
        getAll: (key: string) => string[];
        has: (key: string) => boolean;
    };
    isReady: boolean;
    type: 'app' | 'pages' | 'none';
}

export const NavigationContext = createContext<UnifiedRouter | null>(null);

export function useNavigationContext() {
    return useContext(NavigationContext);
}

export function NavigationProvider({
    value,
    children
}: {
    value: UnifiedRouter;
    children: React.ReactNode;
}) {
    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}
