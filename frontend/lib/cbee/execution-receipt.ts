/**
 * Execution Receipt Generator
 * 
 * Creates human-readable audit receipts after file processing
 */

import {
    ExecutionReceipt,
    CapabilityBundle,
    CapabilityUsageSummary,
    CapabilityType,
    CapabilityViolation,
} from './capability-types';

/**
 * Execution tracking for generating receipts
 */
export class ExecutionTracker {
    private executionId: string;
    private toolId: string;
    private startTime: number;
    private bundle: CapabilityBundle;
    private usedCapabilities: Map<string, { bytes: number; count: number }>;
    private violations: CapabilityViolation[];
    private provenance: {
        input_hash?: string;
        plan_hash?: string;
        runtime_hash?: string;
        output_hash?: string;
    };

    constructor(bundle: CapabilityBundle, toolId: string) {
        this.executionId = bundle.execution_id;
        this.toolId = toolId;
        this.bundle = bundle;
        this.startTime = Date.now();
        this.usedCapabilities = new Map();
        this.violations = [];
        this.provenance = {};
    }

    /**
     * Record provenance hashes for deterministic verification
     */
    recordProvenance(type: 'input' | 'plan' | 'runtime' | 'output', hash: string): void {
        switch (type) {
            case 'input': this.provenance.input_hash = hash; break;
            case 'plan': this.provenance.plan_hash = hash; break;
            case 'runtime': this.provenance.runtime_hash = hash; break;
            case 'output': this.provenance.output_hash = hash; break;
        }
    }

    /**
     * Record capability usage
     */
    recordUsage(
        capability: CapabilityType,
        resource: string,
        usage: { bytes?: number; file_count?: number }
    ): void {
        const key = `${capability}:${resource}`;
        const existing = this.usedCapabilities.get(key) || { bytes: 0, count: 0 };

        this.usedCapabilities.set(key, {
            bytes: existing.bytes + (usage.bytes || 0),
            count: existing.count + (usage.file_count || 0),
        });
    }

    /**
     * Record a violation
     */
    recordViolation(violation: CapabilityViolation): void {
        this.violations.push(violation);
    }

    /**
     * Generate execution receipt
     */
    generateReceipt(): ExecutionReceipt {
        const now = Date.now();
        const duration = now - this.startTime;

        // Convert granted capabilities to summaries
        const grantedSummaries = this.bundle.tokens.map(token =>
            this.tokenToSummary(token, false)
        );

        // Convert used capabilities to summaries
        const usedSummaries = Array.from(this.usedCapabilities.entries()).map(
            ([key, usage]) => {
                const [capType, resource] = key.split(':');
                return {
                    capability: capType as CapabilityType,
                    resource,
                    usage: {
                        bytes: usage.bytes,
                        file_count: usage.count,
                    },
                    description: this.formatUsageDescription(
                        capType as CapabilityType,
                        resource,
                        usage
                    ),
                };
            }
        );

        return {
            execution_id: this.executionId,
            tool_id: this.toolId,
            provenance: this.provenance,
            capabilities_granted: grantedSummaries,
            capabilities_used: usedSummaries,
            violations: this.violations,
            hidden_actions: [], // Should always be empty in CBEE!
            status: this.violations.length > 0 ? 'violation' : 'success',
            started_at: this.startTime,
            completed_at: now,
            duration_ms: duration,
        };
    }

    /**
     * Convert capability token to usage summary
     */
    private tokenToSummary(
        token: any,
        isUsed: boolean
    ): CapabilityUsageSummary {
        const constraints = token.constraints;
        let description = '';

        switch (token.capability) {
            case CapabilityType.FILE_READ:
                description = `Read ${token.resource.pattern}`;
                if (constraints.max_bytes) {
                    description += ` (max ${this.formatBytes(constraints.max_bytes)})`;
                }
                break;
            case CapabilityType.FILE_WRITE:
                description = `Write to ${token.resource.pattern}`;
                if (constraints.max_files) {
                    description += ` (max ${constraints.max_files} file${constraints.max_files > 1 ? 's' : ''})`;
                }
                break;
            case CapabilityType.CPU_EXECUTE:
                description = 'Execute conversion logic';
                if (constraints.max_instructions) {
                    description += ` (max ${(constraints.max_instructions / 1_000_000).toFixed(1)}M instructions)`;
                }
                break;
            case CapabilityType.MEMORY_ALLOCATE:
                description = 'Allocate memory';
                if (constraints.max_bytes) {
                    description += ` (max ${this.formatBytes(constraints.max_bytes)})`;
                }
                break;
            case CapabilityType.NETWORK_FETCH:
                description = `Network access to ${token.resource.pattern}`;
                break;
            default:
                description = token.capability;
        }

        return {
            capability: token.capability,
            resource: token.resource.pattern,
            usage: {
                bytes: constraints.max_bytes,
                file_count: constraints.max_files,
                instructions: constraints.max_instructions,
            },
            description,
        };
    }

    /**
     * Format usage description
     */
    private formatUsageDescription(
        capability: CapabilityType,
        resource: string,
        usage: { bytes: number; count: number }
    ): string {
        switch (capability) {
            case CapabilityType.FILE_READ:
                return `Read ${resource} (${this.formatBytes(usage.bytes)})`;
            case CapabilityType.FILE_WRITE:
                return `Wrote ${usage.count} file(s) (${this.formatBytes(usage.bytes)})`;
            case CapabilityType.MEMORY_ALLOCATE:
                return `Allocated ${this.formatBytes(usage.bytes)} memory`;
            default:
                return `Used ${capability} on ${resource}`;
        }
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
    }
}

/**
 * Create an execution tracker for a capability bundle
 */
export function createExecutionTracker(
    bundle: CapabilityBundle,
    toolId: string
): ExecutionTracker {
    return new ExecutionTracker(bundle, toolId);
}
