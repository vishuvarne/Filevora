"use client";

import { usePathname, useRouter, useParams } from 'next/navigation';
import { NavigationProvider, UnifiedRouter } from './NavigationContext';
import React, { useMemo, useCallback, Suspense } from 'react';

/**
 * Inner component that actually consumes the search params and router.
 * This MUST be wrapped in a Suspense boundary because of useSearchParams().
 */
function AppNavigationInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'en';

    const formatUrl = useCallback((url: string) => {
        // Don't prefix absolute URLs, anchors, or already-prefixed paths
        if (url.startsWith('http') || url.startsWith('#')) return url;
        
        // Check if the URL already starts with a locale prefix like /en/ /es/ etc.
        const localePattern = /^\/(en|es|de|fr|hi)(\/|$)/;
        if (localePattern.test(url)) return url;
        
        const formattedPath = url.startsWith('/') ? url : `/${url}`;
        return `/${lang}${formattedPath}`;
    }, [lang]);

    const unifiedRouter: UnifiedRouter = useMemo(() => ({
        push: (url: string) => router.push(formatUrl(url)),
        replace: (url: string) => router.replace(formatUrl(url)),
        prefetch: (url: string) => router.prefetch(formatUrl(url)),
        back: () => router.back(),
        pathname: pathname || '',
        query: {}, // App router uses searchParams
        searchParams: {
            get: (key: string) => null,
            getAll: (key: string) => [],
            has: (key: string) => false,
        },
        isReady: true,
        type: 'app'
    }), [pathname, router, formatUrl]);

    return (
        <NavigationProvider value={unifiedRouter}>
            {children}
        </NavigationProvider>
    );
}

/**
 * Public wrapper that provides the Suspense boundary.
 */
export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <AppNavigationInner>
                {children}
            </AppNavigationInner>
        </Suspense>
    );
}
