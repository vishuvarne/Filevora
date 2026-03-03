"use client";

import { usePathname, useRouter } from 'next/navigation';
import { NavigationProvider, UnifiedRouter } from './NavigationContext';
import React, { useMemo, Suspense } from 'react';

/**
 * Inner component that actually consumes the search params and router.
 * This MUST be wrapped in a Suspense boundary because of useSearchParams().
 */
function AppNavigationInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const unifiedRouter: UnifiedRouter = useMemo(() => ({
        push: (url: string) => router.push(url),
        replace: (url: string) => router.replace(url),
        prefetch: (url: string) => router.prefetch(url),
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
    }), [pathname, router]);

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
