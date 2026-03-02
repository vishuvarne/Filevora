"use client";

import { useContext, useMemo } from 'react';
import { NavigationContext, UnifiedRouter } from '@/context/NavigationContext';

/**
 * A universal router hook that consumes the NavigationContext.
 */
export function useSharedRouter(): UnifiedRouter {
    const context = useContext(NavigationContext);

    if (!context) {
        // Fallback or development warning
        return {
            push: () => { },
            replace: () => { },
            prefetch: () => { },
            back: () => { },
            pathname: '',
            query: {},
            searchParams: {
                get: () => null,
                getAll: () => [],
                has: () => false
            },
            isReady: false,
            type: 'none'
        };
    }

    return context;
}

/**
 * A universal pathname hook.
 */
export function useSharedPathname() {
    const router = useSharedRouter();
    return router.pathname;
}

/**
 * A universal search params hook.
 */
export function useSharedSearchParams() {
    const router = useSharedRouter();
    return router.searchParams;
}

/**
 * Normalizes a path with a trailing slash as per next.config.js
 */
export function normalizePath(path: string): string {
    if (!path) return "/";

    // Split into path and query/hash
    const [urlPath, ...rest] = path.split(/([?#])/);
    const queryAndHash = rest.join("");

    let normalized = urlPath;
    if (!normalized.endsWith("/")) {
        normalized += "/";
    }

    return normalized + queryAndHash;
}

export type { UnifiedRouter as UniversalRouter };
