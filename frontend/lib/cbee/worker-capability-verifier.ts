/**
 * Worker Capability Verifier
 * 
 * TypeScript-based capability verification for web workers
 * This provides enforcement until Rust WASM kernel is compiled
 */

import { CapabilityBundle, CapabilityType, CapabilityToken } from './capability-types';

export interface CapabilityCheckResult {
    allowed: boolean;
    violation?: string;
}

/**
 * Verify a capability exists in the bundle
 */
export function verifyCapability(
    bundle: CapabilityBundle | undefined,
    capability: CapabilityType,
    resource: string,
    details?: { bytes?: number }
): CapabilityCheckResult {
    // If no bundle, allow (legacy compatibility mode)
    if (!bundle) {
        console.warn('[Worker CBEE] No capability bundle provided - legacy mode');
        return { allowed: true };
    }

    // Check bundle expiration
    if (Date.now() > bundle.expires_at) {
        return {
            allowed: false,
            violation: `Capability bundle expired at ${new Date(bundle.expires_at).toISOString()}`
        };
    }

    // Find matching capability token
    const token = bundle.tokens.find((t: CapabilityToken) => {
        if (t.capability !== capability) return false;
        if (Date.now() > t.expires_at) return false;

        // Check resource pattern match
        if (resource && !matchesPattern(resource, t.resource.pattern)) {
            return false;
        }

        return true;
    });

    if (!token) {
        return {
            allowed: false,
            violation: `Missing capability: ${capability} for resource "${resource}"`
        };
    }

    // Verify constraints
    if (details?.bytes && token.constraints.max_bytes) {
        if (details.bytes > token.constraints.max_bytes) {
            return {
                allowed: false,
                violation: `Size constraint exceeded: ${details.bytes} > ${token.constraints.max_bytes}`
            };
        }
    }

    return { allowed: true };
}

/**
 * Simple pattern matching (supports *)
 */
function matchesPattern(resource: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === resource) return true;

    // Convert glob to regex
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(resource);
}

/**
 * Verify file read capability
 */
export function verifyFileRead(
    bundle: CapabilityBundle | undefined,
    filename: string,
    bytes: number
): CapabilityCheckResult {
    return verifyCapability(bundle, CapabilityType.FILE_READ, filename, { bytes });
}

/**
 * Verify file write capability
 */
export function verifyFileWrite(
    bundle: CapabilityBundle | undefined,
    filename: string,
    bytes: number
): CapabilityCheckResult {
    return verifyCapability(bundle, CapabilityType.FILE_WRITE, filename, { bytes });
}

/**
 * Verify CPU execution capability
 */
export function verifyCpuExecute(bundle: CapabilityBundle | undefined): CapabilityCheckResult {
    return verifyCapability(bundle, CapabilityType.CPU_EXECUTE, '*');
}

/**
 * Verify memory allocation capability
 */
export function verifyMemoryAllocate(
    bundle: CapabilityBundle | undefined,
    bytes: number
): CapabilityCheckResult {
    return verifyCapability(bundle, CapabilityType.MEMORY_ALLOCATE, '*', { bytes });
}
