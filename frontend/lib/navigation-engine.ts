/**
 * Navigation Engine – DNE EPIC 3
 * 
 * Central, deterministic navigation utility.
 * All navigation in the tool flow MUST go through this module.
 * No direct router.push() / router.back() outside of this file.
 */

import type { ToolSessionState } from './session-store';

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
 * Build a deterministic tool URL.
 * 
 * Examples:
 *   buildToolUrl({ toolId: "pdf-to-word" })
 *     → "/tools/pdf-to-word"
 * 
 *   buildToolUrl({ toolId: "pdf-to-word", sessionId: "abc123" })
 *     → "/tools/pdf-to-word?session=abc123"
 * 
 *   buildToolUrl({ toolId: "pdf-to-word", sessionId: "abc123", state: "success" })
 *     → "/tools/pdf-to-word?session=abc123&state=success"
 */
export function buildToolUrl(opts: Omit<NavigateOptions, 'replace'>): string {
    // MUST include trailing slash to match next.config.js trailingSlash: true
    // Without it, static export serves 301 redirects that break navigation flow
    const base = `/tools/${opts.toolId}/`;
    const params = new URLSearchParams();

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
