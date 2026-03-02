/**
 * Runtime Status Utilities
 * 
 * Provides utilities for checking and displaying runtime status.
 * Used by UI components to show the current execution tier.
 */

import { wasmRuntime } from './runtime';
import { detectCapabilities, getCurrentTier, hasThreadSupport, isCrossOriginIsolated } from './capability-detector';
import type { RuntimeTier, BrowserCapabilities } from './runtime-types';

/**
 * Runtime status information
 */
export interface RuntimeStatus {
    tier: RuntimeTier;
    tierLabel: string;
    tierDescription: string;
    isOptimal: boolean;
    capabilities: BrowserCapabilities | null;
    performance: {
        estimatedSpeedup: string;
        memoryLimit: string;
    };
    warnings: string[];
}

/**
 * Get a human-readable label for the tier
 */
function getTierLabel(tier: RuntimeTier): string {
    switch (tier) {
        case 'fast':
            return '⚡ Fast Mode';
        case 'safe':
            return '🛡️ Safe Mode';
        default:
            return 'Unknown';
    }
}

/**
 * Get a description for the tier
 */
function getTierDescription(tier: RuntimeTier): string {
    switch (tier) {
        case 'fast':
            return 'Multi-threaded WASM with SharedArrayBuffer enabled. Maximum performance.';
        case 'safe':
            return 'Single-threaded WASM. Compatible with all browsers.';
        default:
            return '';
    }
}

/**
 * Get estimated speedup for the tier
 */
function getEstimatedSpeedup(tier: RuntimeTier, cores: number): string {
    switch (tier) {
        case 'fast':
            return `Up to ${Math.min(cores, 8)}x faster (${cores} cores available)`;
        case 'safe':
            return 'Baseline speed (1x)';
        default:
            return 'Unknown';
    }
}

/**
 * Get current runtime status
 */
export async function getRuntimeStatus(): Promise<RuntimeStatus> {
    const capabilities = await detectCapabilities();
    const tier = capabilities.tier;
    const warnings: string[] = [];

    // Check for common issues
    if (!isCrossOriginIsolated()) {
        warnings.push('Cross-origin isolation not enabled. Add COOP/COEP headers for faster processing.');
    }

    if (!capabilities.wasmSIMD) {
        warnings.push('SIMD not available. Some operations may be slower.');
    }

    if (capabilities.deviceMemoryGB && capabilities.deviceMemoryGB < 4) {
        warnings.push(`Low device memory (${capabilities.deviceMemoryGB}GB). Large files may cause issues.`);
    }

    return {
        tier,
        tierLabel: getTierLabel(tier),
        tierDescription: getTierDescription(tier),
        isOptimal: tier === 'fast' && capabilities.wasmSIMD,
        capabilities,
        performance: {
            estimatedSpeedup: getEstimatedSpeedup(tier, capabilities.hardwareConcurrency),
            memoryLimit: capabilities.deviceMemoryGB
                ? `~${Math.floor(capabilities.deviceMemoryGB * 0.5)}GB available for processing`
                : 'Unknown'
        },
        warnings
    };
}

/**
 * Get a quick tier check (synchronous)
 */
export function getQuickTier(): { tier: RuntimeTier; label: string } {
    const tier = getCurrentTier();
    return {
        tier,
        label: getTierLabel(tier)
    };
}

/**
 * Check if currently running in optimal mode
 */
export function isOptimalMode(): boolean {
    return getCurrentTier() === 'fast';
}

/**
 * Get runtime statistics summary
 */
export function getRuntimeStats(): {
    workers: { active: number; idle: number; max: number };
    memory: { used: string; limit: string };
    cache: { modules: number; size: string };
} {
    const stats = wasmRuntime.getStats();

    return {
        workers: {
            active: stats.pool.busyWorkers,
            idle: stats.pool.idleWorkers,
            max: stats.pool.maxWorkers
        },
        memory: {
            used: stats.memory ? `${Math.round(stats.memory.usedMB)}MB` : 'N/A',
            limit: stats.memory ? `${Math.round(stats.memory.limitMB)}MB` : 'N/A'
        },
        cache: {
            modules: stats.cache.moduleCount,
            size: `${Math.round(stats.cache.totalSizeBytes / 1024 / 1024)}MB`
        }
    };
}
