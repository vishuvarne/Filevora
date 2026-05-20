/**
 * Navigation Engine – DNE EPIC 3
 * 
 * Central, deterministic navigation utility.
 * All navigation in the tool flow MUST go through this module.
 * No direct router.push() / router.back() outside of this file.
 */

import type { ToolSessionState } from './session-store';
import { getCategoryForTool } from '@/config/tools';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NavigateOptions {
    /** Tool identifier, e.g. "pdf-to-word" */
    toolId: string;
    /** Session ID (UUID). If omitted, navigates to tool landing (idle). */
    sessionId?: string;
    /** Desired state. Only used when sessionId is provided. */
    state?: ToolSessionState;
    /** If true, uses replaceState instead of pushState (no new history entry). */
    replace?: boolean;
}

/** Minimal router interface so this module is framework-agnostic. */
export interface MinimalRouter {
    push: (url: string) => void;
    replace: (url: string, options?: any) => void;
}

// ── URL Builders ─────────────────────────────────────────────────────────────

/**
 * Build a deterministic tool URL using category-based routing.
 * 
 * After the single-page migration, tools live under their category:
 *   /tools/{categorySlug}/?tool={toolId}&session=...&state=...
 * 
 * Examples:
 *   buildToolUrl({ toolId: "merge-pdf" })
 *     → "/tools/pdf/?tool=merge-pdf"
 * 
 *   buildToolUrl({ toolId: "merge-pdf", sessionId: "abc123", state: "success" })
 *     → "/tools/pdf/?tool=merge-pdf&session=abc123&state=success"
 */
export function buildToolUrl(opts: Omit<NavigateOptions, 'replace'>): string {
    // Resolve the category slug for this tool
    const categorySlug = getCategoryForTool(opts.toolId);
    // MUST include trailing slash to match next.config.js trailingSlash: true
    const base = categorySlug ? `/tools/${categorySlug}/` : `/tools/${opts.toolId}/`;
    const params = new URLSearchParams();

    // Always include the tool ID as a query param for category-based routing
    if (categorySlug) {
        params.set('tool', opts.toolId);
    }

    if (opts.sessionId) {
        params.set('session', opts.sessionId);
    }

    if (opts.state && opts.state !== 'idle') {
        params.set('state', opts.state);
    }

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

// ── State Transition Validation ──────────────────────────────────────────────

/**
 * Legal state transitions. If a transition is not in this map, it's illegal.
 */
const VALID_TRANSITIONS: Record<ToolSessionState, ToolSessionState[]> = {
    idle: ['uploading', 'processing'],              // processing = Ghost Mode (no upload)
    uploading: ['processing', 'success', 'error', 'idle'],  // success = fast completion
    processing: ['success', 'error', 'idle'],       // idle = cancel
    success: ['idle'],                               // reset / convert another
    error: ['idle', 'uploading'],                    // retry
};

/**
 * Validate whether a state transition is allowed.
 */
export function isValidTransition(from: ToolSessionState, to: ToolSessionState): boolean {
    if (from === to) return true; // no-op
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Core Navigation ──────────────────────────────────────────────────────────

/**
 * The primary navigation function. 
 * ALL tool-flow navigation MUST use this.
 * 
 * Uses Next.js router (not raw pushState) so the framework tracks all
 * history entries and Back/Forward navigation re-renders correctly.
 */
export function navigateToTool(router: MinimalRouter, opts: NavigateOptions): void {
    const url = buildToolUrl(opts);

    if (opts.replace) {
        router.replace(url);
    } else {
        router.push(url);
    }
}

/**
 * Silent navigation: updates the URL without triggering Next.js router,
 * preventing Suspense boundary re-renders that would unmount the component tree.
 * 
 * MUST be used during active processing (startSession → transition) to avoid
 * losing React state when useSearchParams() causes re-suspension.
 * 
 * Automatically detects and preserves the locale prefix from the current URL.
 */
export function silentNavigate(opts: NavigateOptions): void {
    if (typeof window === 'undefined') return;

    const url = buildToolUrl(opts);
    
    // Detect locale prefix from current URL (e.g., /en, /es, /de, /fr, /hi)
    const localeMatch = window.location.pathname.match(/^\/(en|es|de|fr|hi)(?=\/|$)/);
    const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
    const fullUrl = `${localePrefix}${url}`;

    if (opts.replace) {
        window.history.replaceState(window.history.state, '', fullUrl);
    } else {
        window.history.pushState(window.history.state, '', fullUrl);
    }
}

/**
 * Navigate back to the tool's idle state (clear session from URL).
 * This replaces router.back() — deterministic, never goes to Home.
 */
export function navigateToToolIdle(router: MinimalRouter, toolId: string): void {
    navigateToTool(router, {
        toolId,
        replace: true,
    });
}

/**
 * Navigate to success state for a session.
 */
export function navigateToToolSuccess(
    router: MinimalRouter,
    toolId: string,
    sessionId: string,
): void {
    navigateToTool(router, {
        toolId,
        sessionId,
        state: 'success',
        replace: true,  // replace so "back" doesn't go to "processing"
    });
}

/**
 * Navigate to error state for a session.
 */
export function navigateToToolError(
    router: MinimalRouter,
    toolId: string,
    sessionId: string,
): void {
    navigateToTool(router, {
        toolId,
        sessionId,
        state: 'error',
        replace: true,
    });
}

// ── URL Parsing ──────────────────────────────────────────────────────────────

export interface ParsedToolUrl {
    toolId: string;
    sessionId: string | null;
    state: ToolSessionState;
    /** Transfer key for tool continuation */
    transferKey: string | null;
}

/**
 * Parse the current URL search params into structured data.
 */
export function parseToolSearchParams(searchParams: {
    get: (key: string) => string | null;
}): Omit<ParsedToolUrl, 'toolId'> {
    const sessionId = searchParams.get('session');
    const rawState = searchParams.get('state');
    const transferKey = searchParams.get('transfer');

    // Validate state
    const validStates: ToolSessionState[] = ['idle', 'uploading', 'processing', 'success', 'error'];
    const state: ToolSessionState = (rawState && validStates.includes(rawState as ToolSessionState))
        ? (rawState as ToolSessionState)
        : 'idle';

    return { sessionId, state, transferKey };
}
