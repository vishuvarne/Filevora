/**
 * useToolSession – DNE Integration Hook
 * 
 * Wires session-store.ts + navigation-engine.ts into React.
 * This hook is consumed by ToolInterface.tsx and replaces
 * the raw useState("idle") pattern with URL-driven state.
 * 
 * IMPORTANT: Uses a ref (sessionRef) to avoid React stale closure issues.
 * The transition() callback always reads the latest session from the ref,
 * not from the closure-captured state.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    createSession,
    updateSession,
    getSession,
    validateSession,
    pruneExpiredSessions,
    claimSession,
    isSessionOwnedByCurrentTab,
    isStateTampered,
    type ToolSession,
    type ToolSessionState,
} from '@/lib/session-store';
import {
    navigateToTool,
    navigateToToolIdle,
    navigateToToolSuccess,
    navigateToToolError,
    parseToolSearchParams,
    isValidTransition,
} from '@/lib/navigation-engine';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseToolSessionReturn {
    /** Current session (null if no active session) */
    session: ToolSession | null;
    /** Derived state from URL + session (always defined, defaults to 'idle') */
    state: ToolSessionState;
    /** Whether session is being restored from IndexedDB */
    isRestoring: boolean;
    /** Message to show if session was expired/invalid */
    expiredMessage: string | null;

    /**
     * Start a new session. Call this when files are selected and user clicks "Process".
     * Returns the new session ID.
     */
    startSession: (files: File[], isGhostMode: boolean, initialState?: ToolSessionState) => Promise<string>;

    /**
     * Transition the session to a new state.
     * Validates the transition and updates both IndexedDB and URL.
     * Uses a ref internally — safe to call immediately after startSession().
     */
    transition: (newState: ToolSessionState, result?: any) => Promise<void>;

    /**
     * Reset: clear the session from URL, go back to idle.
     * Does NOT delete the session from IndexedDB (for history).
     */
    reset: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToolSession(toolId: string): UseToolSessionReturn {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [session, setSession] = useState<ToolSession | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [expiredMessage, setExpiredMessage] = useState<string | null>(null);

    // ═══════════════════════════════════════════════════════════════════════
    // REF: Always holds the latest session. Solves React stale closure issue.
    // The transition() callback reads from this ref, NOT from state.
    // ═══════════════════════════════════════════════════════════════════════
    const sessionRef = useRef<ToolSession | null>(null);

    // Helper to update BOTH state (for re-render) and ref (for callbacks)
    const setSessionBoth = useCallback((s: ToolSession | null) => {
        sessionRef.current = s;
        setSession(s);
    }, []);

    // Parse URL params
    const parsed = parseToolSearchParams(searchParams);
    const urlSessionId = parsed.sessionId;
    const urlState = parsed.state;

    // Derived state: prefer URL state, fall back to session state, default to idle
    // This is critical for Back/Forward navigation: if the URL says we're 'idle' (no state param) 
    // but we have a session, we should still use the session's internal state.
    // However, if the URL EXPLICITLY sets a state, we must honor it for history travel.
    const state: ToolSessionState = urlState !== 'idle'
        ? urlState
        : (session?.state ?? 'idle');

    // Track if we've already attempted restoration for this session ID
    const restoredRef = useRef<string | null>(null);

    // ── Restore session on mount / URL change ────────────────────────────────

    useEffect(() => {
        if (!urlSessionId) {
            // No session in URL → idle state (handles Browser Back to /tools/id)
            setSessionBoth(null);
            setExpiredMessage(null);
            restoredRef.current = null; // Reset so it can restore again if needed
            return;
        }

        // Don't re-restore the same session
        if (restoredRef.current === urlSessionId) {
            // URL changed to a different state for the SAME session (e.g., Browser Back from success to processing)
            // We should ensure the local state reflects the URL state if they diverged
            // But we don't need to re-fetch from IDB.
            return;
        }
        restoredRef.current = urlSessionId;

        let cancelled = false;

        async function restore() {
            setIsRestoring(true);
            setExpiredMessage(null);

            try {
                const restored = await validateSession(urlSessionId!, toolId);

                if (cancelled) return;

                if (!restored) {
                    // Session expired or doesn't belong to this tool
                    setSessionBoth(null);
                    setExpiredMessage('Session expired or not found. Please start a new conversion.');
                    navigateToToolIdle(router, toolId);
                    return;
                }

                // EPIC 5.3: URL Tampering Guard
                if (isStateTampered(restored, urlState)) {
                    console.warn('[useToolSession] URL state tampered, reverting to session truth');
                    if (restored.state === 'success' && restored.result) {
                        navigateToToolSuccess(router, toolId, restored.sessionId);
                    } else {
                        navigateToToolIdle(router, toolId);
                    }
                    setSessionBoth(restored);
                    return;
                }

                // EPIC 5.1: On refresh, claim ownership of the session for this tab
                const claimed = await claimSession(restored.sessionId);
                setSessionBoth(claimed || restored);
            } catch (e) {
                console.error('[useToolSession] Restore failed:', e);
                if (!cancelled) {
                    setExpiredMessage('Failed to restore session.');
                    navigateToToolIdle(router, toolId);
                }
            } finally {
                if (!cancelled) setIsRestoring(false);
            }
        }

        restore();

        return () => { cancelled = true; };
    }, [urlSessionId, urlState, toolId, router, setSessionBoth]);

    // ── Prune expired sessions on mount ──────────────────────────────────────

    useEffect(() => {
        pruneExpiredSessions();
    }, []);

    // ── startSession ─────────────────────────────────────────────────────────

    const startSession = useCallback(async (
        files: File[],
        isGhostMode: boolean,
        initialState: ToolSessionState = 'uploading'
    ): Promise<string> => {
        const newSession = await createSession(toolId, files, isGhostMode);
        newSession.state = initialState; // Set the initial state immediately

        // Update IndexedDB with the initial state as well
        await updateSession(newSession.sessionId, { state: initialState });

        // Update BOTH ref and state so transition() sees the session immediately
        setSessionBoth(newSession);
        setExpiredMessage(null);

        // Use push (NOT replace) so the clean tool URL stays in browser history.
        // Doing the state transition here directly avoids Next.js router batching issues 
        // that happen if we push then replace immediately after.
        navigateToTool(router, {
            toolId,
            sessionId: newSession.sessionId,
            state: initialState,
            replace: false,
        });

        return newSession.sessionId;
    }, [toolId, router, setSessionBoth]);

    // ── transition ───────────────────────────────────────────────────────────
    // Reads from sessionRef.current — always has the latest session,
    // even when called synchronously after startSession().

    const transition = useCallback(async (newState: ToolSessionState, result?: any) => {
        const currentSession = sessionRef.current;

        if (!currentSession) {
            console.warn('[useToolSession] Cannot transition without a session');
            return;
        }

        // Validate transition
        const currentState = currentSession.state;
        if (!isValidTransition(currentState, newState)) {
            console.warn(
                `[useToolSession] Invalid transition: ${currentState} → ${newState}`
            );
            return;
        }

        // EPIC 5.1: Only the owning tab can mutate a session
        if (!isSessionOwnedByCurrentTab(currentSession)) {
            console.warn('[useToolSession] This tab does not own the session. Mutation blocked.');
            return;
        }

        // Update IndexedDB
        const patch: any = { state: newState };
        if (result !== undefined) patch.result = result;

        const updated = await updateSession(currentSession.sessionId, patch);
        if (updated) {
            setSessionBoth(updated);
        }

        // Update URL
        if (newState === 'success') {
            navigateToToolSuccess(router, toolId, currentSession.sessionId);
        } else if (newState === 'error') {
            navigateToToolError(router, toolId, currentSession.sessionId);
        } else if (newState === 'idle') {
            navigateToToolIdle(router, toolId);
        } else {
            // uploading / processing — update URL to reflect state
            navigateToTool(router, {
                toolId,
                sessionId: currentSession.sessionId,
                state: newState,
                replace: true,
            });
        }
    }, [router, toolId, setSessionBoth]);

    // ── reset ────────────────────────────────────────────────────────────────

    const reset = useCallback(() => {
        setSessionBoth(null);
        setExpiredMessage(null);
        restoredRef.current = null;
        navigateToToolIdle(router, toolId);
    }, [router, toolId, setSessionBoth]);

    return {
        session,
        state,
        isRestoring,
        expiredMessage,
        startSession,
        transition,
        reset,
    };
}
