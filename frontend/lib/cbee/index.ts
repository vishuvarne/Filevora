/**
 * Index file for CBEE module
 * Exports all public interfaces and utilities
 */

// Core types
export type {
    CapabilityToken,
    CapabilityType,
    CapabilityBundle,
    CapabilityConstraints,
    CapabilityViolation,
    CapabilityRequest,
    CapabilityGrantResponse,
    ExecutionReceipt,
    CapabilityUsageSummary,
    ResourceIdentifier,
    CapabilityTemplate,
} from './capability-types';

export { CapabilityType as CapabilityTypeEnum } from './capability-types';

// Token issuer
export { capabilityTokenIssuer, CapabilityTokenIssuer } from './capability-token';

// Policy resolver
export { policyResolver, PolicyResolver } from './policy-resolver';

// Capability registry
export {
    CAPABILITY_REGISTRY,
    getCapabilityTemplate,
    requiresNetwork,
    getRequiredCapabilities,
    getDefaultConstraints,
} from './capability-registry';

// Policy denial logger
export {
    policyDenialLogger,
    getUserFriendlyDenialMessage,
    getDeveloperDenialMessage,
} from './policy-denial-logger';

export type { PolicyDenialLog } from './policy-denial-logger';

// Execution receipt
export { createExecutionTracker, ExecutionTracker } from './execution-receipt';

/**
 * Initialize the CBEE system
 * Call this once on application startup
 */
export async function initializeCBEE(): Promise<void> {
    const { policyResolver } = await import('./policy-resolver');
    await policyResolver.initialize();
    console.log("[CBEE] Capability-Based Execution Engine initialized");
}
