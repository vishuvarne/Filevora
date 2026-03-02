/**
 * Policy Resolver
 * 
 * Analyzes conversion plans and resolves required capabilities.
 * Enforces least-privilege by granting minimal capability sets.
 */

import { ConversionPlan, DSLOperation } from '../dsl/types';
import {
    CapabilityToken,
    CapabilityType,
    CapabilityBundle,
    CapabilityRequest,
    CapabilityGrantResponse,
    ResourceIdentifier,
    CapabilityConstraints,
} from './capability-types';
import {
    getCapabilityTemplate,
    getRequiredCapabilities,
    getDefaultConstraints,
} from './capability-registry';
import { capabilityTokenIssuer } from './capability-token';
import { policyDenialLogger, getUserFriendlyDenialMessage } from './policy-denial-logger';
import { getExplanation } from './ExplanationRegistry';

/**
 * Policy Resolver
 * 
 * Determines what capabilities are required for a given operation
 * and generates signed capability bundles.
 */
export class PolicyResolver {
    /**
     * Initialize the resolver (initializes token issuer)
     */
    async initialize(): Promise<void> {
        await capabilityTokenIssuer.initialize();
    }

    /**
     * Resolve capabilities for a file processing request
     */
    async resolveForFileProcessing(request: CapabilityRequest): Promise<CapabilityGrantResponse> {
        try {
            // Ensure initialized
            await this.initialize();

            const { tool_id, files } = request;

            // Get capability template for this tool
            const template = getCapabilityTemplate(tool_id);
            if (!template) {
                // Log denial
                policyDenialLogger.log({
                    tool_id,
                    denial_reason: `Unknown tool: ${tool_id}. No capability template found.`,
                    violation_type: 'unknown_tool',
                    severity: 'error',
                });

                const explanation = getExplanation('unknown_tool');
                return {
                    granted: false,
                    denial_reason: explanation.description,
                    decision: {
                        action: "resolve_capabilities",
                        target: tool_id,
                        decision: "denied",
                        reason_code: "unknown_tool",
                        human_explanation: explanation.description,
                        suggested_fixes: [explanation.suggestion],
                        alternatives: explanation.alternatives
                    }
                };
            }

            // Calculate total file size
            const totalSize = files.reduce((sum, f) => sum + f.size, 0);

            // Check if files exceed default constraints
            const maxBytes = template.default_constraints.max_bytes || Infinity;
            if (totalSize > maxBytes) {
                // Log denial
                policyDenialLogger.log({
                    tool_id,
                    denial_reason: `Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(maxBytes / 1024 / 1024).toFixed(1)}MB)`,
                    violation_type: 'size_exceeded',
                    severity: 'warning',
                });

                const explanation = getExplanation('size_exceeded');
                return {
                    granted: false,
                    denial_reason: explanation.description,
                    decision: {
                        action: "file_processing",
                        target: tool_id,
                        decision: "denied",
                        reason_code: "size_exceeded",
                        human_explanation: explanation.description,
                        suggested_fixes: [explanation.suggestion],
                        alternatives: explanation.alternatives
                    }
                };
            }

            // Build capability tokens
            const capabilities: Array<{
                capability: CapabilityType;
                resource: ResourceIdentifier;
                constraints: CapabilityConstraints;
            }> = [];

            // File read capabilities (Broad pattern required for worker verification logic)
            if (template.requires.includes(CapabilityType.FILE_READ)) {
                capabilities.push({
                    capability: CapabilityType.FILE_READ,
                    resource: {
                        type: "file",
                        pattern: "*",
                        description: "Read input files",
                    },
                    constraints: {
                        max_bytes: totalSize,
                    },
                });
            }

            // File write capabilities
            if (template.requires.includes(CapabilityType.FILE_WRITE)) {
                const maxFiles = template.default_constraints.max_files || 1;
                capabilities.push({
                    capability: CapabilityType.FILE_WRITE,
                    resource: {
                        type: "file",
                        pattern: "*",
                        description: "Write converted output",
                    },
                    constraints: {
                        max_files: maxFiles,
                        max_bytes: template.default_constraints.max_bytes,
                    },
                });
            }

            // CPU execution capability
            if (template.requires.includes(CapabilityType.CPU_EXECUTE)) {
                capabilities.push({
                    capability: CapabilityType.CPU_EXECUTE,
                    resource: {
                        type: "cpu",
                        pattern: "*",
                        description: "Execute conversion logic",
                    },
                    constraints: {
                        max_instructions: template.default_constraints.max_instructions,
                        max_duration_ms: template.default_constraints.max_duration_ms,
                    },
                });
            }

            // Memory allocation capability
            if (template.requires.includes(CapabilityType.MEMORY_ALLOCATE)) {
                // Estimate memory needs based on file size
                // Rule of thumb: 2x file size for processing
                const estimatedMemory = Math.min(totalSize * 2, 512 * 1024 * 1024); // Max 512MB
                capabilities.push({
                    capability: CapabilityType.MEMORY_ALLOCATE,
                    resource: {
                        type: "memory",
                        pattern: "*",
                        description: "Allocate memory for processing",
                    },
                    constraints: {
                        max_bytes: estimatedMemory,
                    },
                });
            }

            // Network capability (if required)
            if (template.requires.includes(CapabilityType.NETWORK_FETCH)) {
                if (template.no_network) {
                    const explanation = getExplanation('missing_capability_network');
                    return {
                        granted: false,
                        denial_reason: explanation.description,
                        decision: {
                            action: "network_access",
                            target: "*",
                            decision: "denied",
                            reason_code: "missing_capability_network",
                            human_explanation: explanation.description,
                            suggested_fixes: [explanation.suggestion],
                            alternatives: explanation.alternatives
                        }
                    };
                }

                capabilities.push({
                    capability: CapabilityType.NETWORK_FETCH,
                    resource: {
                        type: "url",
                        pattern: "*", // Could be restricted based on tool
                        description: "Network access for remote operations",
                    },
                    constraints: {
                        allowed_methods: template.default_constraints.allowed_methods || ["GET"],
                        max_bytes: template.default_constraints.max_bytes,
                    },
                });
            }

            // Issue capability bundle
            const bundle = await capabilityTokenIssuer.issueBundle(
                tool_id,
                capabilities,
                template.default_constraints.max_duration_ms || 300_000 // Default 5 min
            );

            return {
                granted: true,
                bundle,
            };
        } catch (error: any) {
            console.error("Policy resolution failed:", error);
            return {
                granted: false,
                denial_reason: `Policy resolution error: ${error.message}`,
            };
        }
    }

    /**
     * Resolve capabilities from a DSL ConversionPlan
     */
    async resolveFromPlan(plan: ConversionPlan): Promise<CapabilityBundle | null> {
        try {
            // Extract all operations from plan
            const operations = plan.steps;

            // Aggregate all required capabilities
            const allCapabilities = new Map<CapabilityType, {
                resource: ResourceIdentifier;
                constraints: CapabilityConstraints;
            }>();

            // Process each operation
            for (const op of operations) {
                const template = getCapabilityTemplate(op.opName);
                if (!template) {
                    console.warn(`No template for operation: ${op.opName}`);
                    continue;
                }

                for (const cap of template.requires) {
                    if (!allCapabilities.has(cap)) {
                        allCapabilities.set(cap, {
                            resource: this.mapResourceForCapability(cap, op),
                            constraints: template.default_constraints,
                        });
                    }
                }
            }

            // Convert to capability array
            const capabilities = Array.from(allCapabilities.entries()).map(([cap, data]) => ({
                capability: cap,
                resource: data.resource,
                constraints: data.constraints,
            }));

            // Issue bundle
            const toolId = `dsl-plan-${Date.now()}`;
            const bundle = await capabilityTokenIssuer.issueBundle(
                toolId,
                capabilities,
                plan.limits.maxExecutionTimeMs || 300_000
            );

            return bundle;
        } catch (error) {
            console.error("Failed to resolve capabilities from plan:", error);
            return null;
        }
    }

    /**
     * Map DSL operation to resource identifier for a capability
     */
    private mapResourceForCapability(
        cap: CapabilityType,
        op: DSLOperation
    ): ResourceIdentifier {
        switch (cap) {
            case CapabilityType.FILE_READ:
                return {
                    type: "file",
                    pattern: "*",
                    description: `Read input: ${op.inputs.join(", ")}`,
                };
            case CapabilityType.FILE_WRITE:
                return {
                    type: "file",
                    pattern: op.outputs.join(","),
                    description: `Write output: ${op.outputs.join(", ")}`,
                };
            case CapabilityType.CPU_EXECUTE:
                return {
                    type: "cpu",
                    pattern: "*",
                    description: `Execute operation: ${op.opName}`,
                };
            case CapabilityType.MEMORY_ALLOCATE:
                return {
                    type: "memory",
                    pattern: "*",
                    description: "Allocate memory for operation",
                };
            case CapabilityType.NETWORK_FETCH:
                return {
                    type: "url",
                    pattern: "*",
                    description: "Network access",
                };
            default:
                return {
                    type: "file",
                    pattern: "*",
                    description: "Unknown resource",
                };
        }
    }

    /**
     * Verify a capability bundle is valid
     */
    async verifyBundle(bundle: CapabilityBundle): Promise<boolean> {
        return await capabilityTokenIssuer.verifyBundle(bundle);
    }

    /**
     * Check if a specific capability exists in a bundle
     */
    hasCapability(bundle: CapabilityBundle, capability: CapabilityType, resource?: string): boolean {
        return bundle.tokens.some(token => {
            if (token.capability !== capability) return false;
            if (resource && !this.matchesResource(resource, token.resource.pattern)) {
                return false;
            }
            return Date.now() < token.expires_at;
        });
    }

    /**
     * Match a resource against a pattern (supports glob)
     */
    private matchesResource(resource: string, pattern: string): boolean {
        // Simple glob matching (could be enhanced with a proper glob library)
        if (pattern === "*") return true;
        if (pattern === resource) return true;

        // Wildcard matching
        const regexPattern = pattern
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".");
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(resource);
    }
}

/**
 * Singleton instance
 */
export const policyResolver = new PolicyResolver();
