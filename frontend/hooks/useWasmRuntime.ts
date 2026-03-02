'use client';

/**
 * useWasmRuntime Hook
 * 
 * React hook for accessing WASM runtime status and capabilities.
 * Provides reactive updates when runtime state changes.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    wasmRuntime,
    getRuntimeStatus,
    getQuickTier,
    type RuntimeStatus,
    type RuntimeTier
} from '@/lib/wasm';

interface UseWasmRuntimeReturn {
    /** Current execution tier */
    tier: RuntimeTier;
    /** Human-readable tier label */
    label: string;
    /** Whether running in fast (threaded) mode */
    isFast: boolean;
    /** Full runtime status (async loaded) */
    status: RuntimeStatus | null;
    /** Whether status is still loading */
    loading: boolean;
    /** Runtime statistics */
    stats: ReturnType<typeof wasmRuntime.getStats> | null;
    /** Refresh status */
    refresh: () => Promise<void>;
}

/**
 * Hook for WASM runtime status
 */
export function useWasmRuntime(): UseWasmRuntimeReturn {
    const quickTier = getQuickTier();

    const [status, setStatus] = useState<RuntimeStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReturnType<typeof wasmRuntime.getStats> | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const newStatus = await getRuntimeStatus();
            setStatus(newStatus);

            // Only get stats if runtime is initialized
            if (wasmRuntime.isInitialized()) {
                setStats(wasmRuntime.getStats());
            }
        } catch (error) {
            console.error('Failed to get runtime status:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();

        // Refresh stats periodically while active
        const interval = setInterval(() => {
            if (wasmRuntime.isInitialized()) {
                setStats(wasmRuntime.getStats());
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [refresh]);

    return {
        tier: status?.tier ?? quickTier.tier,
        label: status?.tierLabel ?? quickTier.label,
        isFast: (status?.tier ?? quickTier.tier) === 'fast',
        status,
        loading,
        stats,
        refresh
    };
}

/**
 * Simple hook for just tier info (no async loading)
 */
export function useQuickTier(): { tier: RuntimeTier; label: string; isFast: boolean } {
    const { tier, label } = getQuickTier();
    return {
        tier,
        label,
        isFast: tier === 'fast'
    };
}
