/**
 * Session Store – DNE EPIC 2
 * 
 * Persistent session engine using IndexedDB.
 * Each upload/processing operation gets a unique session ID.
 * Sessions survive page refreshes and can be restored deterministically.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ── Types ────────────────────────────────────────────────────────────────────

export type ToolSessionState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface ToolSession {
    /** UUID v4 */
    sessionId: string;
    /** Tool identifier, e.g. "pdf-to-word" */
    toolId: string;
    /** Current lifecycle state */
    state: ToolSessionState;
    /** Original file names (we don't store the File objects – just metadata) */
    originalFileNames: string[];
    /** Total size of original files in bytes */
    originalFileSizeBytes: number;
    /** The processing result (download_url, filename, job_id, etc.) */
    result: any | null;
    /** Was this processed locally (Ghost Mode)? */
    isGhostMode: boolean;
    /** Tab ID that owns this session (EPIC 5.1 multi-tab) */
    ownerTabId: string;
    /** Timestamp of session creation */
    createdAt: number;
    /** Timestamp of last state change */
    updatedAt: number;
    /** Expiration timestamp (createdAt + TTL) */
    expiresAt: number;
}

// ── IndexedDB Schema ─────────────────────────────────────────────────────────

interface SessionDB extends DBSchema {
    sessions: {
        key: string; // sessionId
        value: ToolSession;
        indexes: {
            'by-tool': string;
            'by-updated': number;
            'by-expires': number;
        };
    };
}

const DB_NAME = 'convertlocally-sessions';
const DB_VERSION = 1;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ── Multi-tab: unique tab identifier (EPIC 5.1) ─────────────────────────────

const TAB_ID = typeof crypto !== 'undefined'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/** Get the current tab's unique ID. */
export function getTabId(): string {
    return TAB_ID;
}

// ── Singleton DB ─────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<SessionDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SessionDB>> {
    if (typeof window === 'undefined') {
        throw new Error('SessionStore is only available in the browser');
    }

    if (!dbPromise) {
        dbPromise = openDB<SessionDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('sessions', { keyPath: 'sessionId' });
                store.createIndex('by-tool', 'toolId');
                store.createIndex('by-updated', 'updatedAt');
                store.createIndex('by-expires', 'expiresAt');
            },
        });
    }

    return dbPromise;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a new session ID (UUID v4).
 */
export function generateSessionId(): string {
    return crypto.randomUUID();
}

/**
 * Create a new session and persist it.
 */
export async function createSession(
    toolId: string,
    files: File[],
    isGhostMode: boolean = false,
): Promise<ToolSession> {
    const now = Date.now();
    const session: ToolSession = {
        sessionId: generateSessionId(),
        toolId,
        state: 'idle',
        originalFileNames: files.map(f => f.name),
        originalFileSizeBytes: files.reduce((sum, f) => sum + f.size, 0),
        result: null,
        isGhostMode,
        ownerTabId: TAB_ID,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + SESSION_TTL_MS,
    };

    const db = await getDB();
    await db.put('sessions', session);
    return session;
}

/**
 * Update session state and optional result.
 */
export async function updateSession(
    sessionId: string,
    patch: Partial<Pick<ToolSession, 'state' | 'result' | 'isGhostMode'>>,
): Promise<ToolSession | null> {
    const db = await getDB();
    const session = await db.get('sessions', sessionId);
    if (!session) return null;

    const updated: ToolSession = {
        ...session,
        ...patch,
        updatedAt: Date.now(),
    };

    await db.put('sessions', updated);
    return updated;
}

/**
 * Load a session by ID. Returns null if expired or not found.
 */
export async function getSession(sessionId: string): Promise<ToolSession | null> {
    try {
        const db = await getDB();
        const session = await db.get('sessions', sessionId);
        if (!session) return null;

        // Check expiration
        if (Date.now() > session.expiresAt) {
            await db.delete('sessions', sessionId);
            return null;
        }

        return session;
    } catch (e) {
        console.error('[SessionStore] Failed to get session:', e);
        return null;
    }
}

/**
 * Get the most recent session for a given tool (useful for "restore last session").
 */
export async function getLatestSessionForTool(toolId: string): Promise<ToolSession | null> {
    try {
        const db = await getDB();
        const allForTool = await db.getAllFromIndex('sessions', 'by-tool', toolId);
        if (allForTool.length === 0) return null;

        // Sort by updatedAt descending
        allForTool.sort((a, b) => b.updatedAt - a.updatedAt);

        const latest = allForTool[0];

        // Check expiration
        if (Date.now() > latest.expiresAt) {
            await db.delete('sessions', latest.sessionId);
            return null;
        }

        return latest;
    } catch (e) {
        console.error('[SessionStore] Failed to get latest session:', e);
        return null;
    }
}

/**
 * Delete a session.
 */
export async function deleteSession(sessionId: string): Promise<void> {
    const db = await getDB();
    await db.delete('sessions', sessionId);
}

/**
 * Prune expired sessions.
 */
export async function pruneExpiredSessions(): Promise<number> {
    try {
        const db = await getDB();
        const now = Date.now();

        const tx = db.transaction('sessions', 'readwrite');
        const index = tx.store.index('by-expires');
        let cursor = await index.openCursor(IDBKeyRange.upperBound(now));

        let pruned = 0;
        while (cursor) {
            cursor.delete();
            pruned++;
            cursor = await cursor.continue();
        }
        await tx.done;

        if (pruned > 0) {
            console.log(`[SessionStore] Pruned ${pruned} expired session(s)`);
        }
        return pruned;
    } catch (e) {
        console.error('[SessionStore] Prune failed:', e);
        return 0;
    }
}

/**
 * Validate that a session belongs to a specific tool.
 * Returns the session if valid, null otherwise.
 */
export async function validateSession(
    sessionId: string,
    expectedToolId: string,
): Promise<ToolSession | null> {
    const session = await getSession(sessionId);
    if (!session) return null;
    if (session.toolId !== expectedToolId) return null;
    return session;
}

// ── EPIC 5.1: Multi-tab ownership ───────────────────────────────────────────

/**
 * Check if this tab owns the session.
 * A session created in Tab A should not be mutated by Tab B.
 */
export function isSessionOwnedByCurrentTab(session: ToolSession): boolean {
    return session.ownerTabId === TAB_ID;
}

/**
 * Claim ownership of a session for the current tab.
 * Used when restoring a session from a refresh (same tab logically).
 */
export async function claimSession(sessionId: string): Promise<ToolSession | null> {
    return updateSession(sessionId, {} as any).then(async () => {
        // Directly stamp the tabId
        const db = await getDB();
        const session = await db.get('sessions', sessionId);
        if (!session) return null;
        session.ownerTabId = TAB_ID;
        session.updatedAt = Date.now();
        await db.put('sessions', session);
        return session;
    });
}

// ── EPIC 5.3: URL Tampering Guards ──────────────────────────────────────────

/**
 * Validate that a URL-requested state is consistent with the session data.
 * Blocks tampering like manually typing ?state=success without a result.
 */
export function isStateTampered(
    session: ToolSession,
    requestedState: ToolSessionState,
): boolean {
    // Can't be in success without a result
    if (requestedState === 'success' && !session.result) return true;
    // Can't be in processing/uploading if session already finished
    if (
        (requestedState === 'processing' || requestedState === 'uploading') &&
        (session.state === 'success' || session.state === 'error')
    ) return true;
    return false;
}
