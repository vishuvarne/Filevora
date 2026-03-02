/**
 * Capability-Based Execution Engine (CBEE)
 * Core Type Definitions
 * 
 * These types define the capability model for zero-trust execution.
 * Every operation requires an explicit, unforgeable capability token.
 */

/**
 * Capability Types - Enumeration of all possible capabilities
 */
export enum CapabilityType {
    /** Permission to read file data */
    FILE_READ = "file.read",
    /** Permission to write file data (including creating new files) */
    FILE_WRITE = "file.write",
    /** Permission to make network requests */
    NETWORK_FETCH = "network.fetch",
    /** Permission to execute CPU-intensive operations */
    CPU_EXECUTE = "cpu.execute",
    /** Permission to allocate memory */
    MEMORY_ALLOCATE = "memory.allocate",
    /** Permission to write to clipboard (future) */
    CLIPBOARD_WRITE = "clipboard.write",
}

/**
 * Resource Identifier - Specifies what resource a capability applies to
 */
export interface ResourceIdentifier {
    /** Resource type (file path, URL, memory region, etc.) */
    type: "file" | "url" | "memory" | "cpu" | "clipboard";
    /** 
     * Resource pattern with glob support
     * Examples:
     * - "input.pdf" (specific file)
     * - "/output/*.jpg" (any JPEG in output)
     * - "https://api.example.com/*" (any endpoint on domain)
     */
    pattern: string;
    /** Optional human-readable description */
    description?: string;
}

/**
 * Capability Constraints - Fine-grained limits on capability usage
 */
export interface CapabilityConstraints {
    /** Maximum bytes that can be read/written/allocated */
    max_bytes?: number;
    /** Maximum number of files (for file.write) */
    max_files?: number;
    /** Maximum CPU instructions allowed */
    max_instructions?: number;
    /** Maximum execution duration in milliseconds */
    max_duration_ms?: number;
    /** Allowed HTTP methods (for network.fetch) */
    allowed_methods?: ("GET" | "POST" | "PUT" | "DELETE")[];
    /** Custom constraints (extensible) */
    custom?: Record<string, string | number | boolean>;
}

/**
 * Capability Token - Unforgeable permission grant
 * 
 * This is the core security primitive. Tokens are:
 * - Cryptographically signed (non-forgeable)
 * - Time-bound (expire automatically)
 * - Resource-scoped (limited to specific resources)
 * - Single-use (nonce prevents replay)
 */
export interface CapabilityToken {
    /** Version of the capability token schema */
    version: string;
    /** Type of capability being granted */
    capability: CapabilityType;
    /** Resource this capability applies to */
    resource: ResourceIdentifier;
    /** Constraints on how this capability can be used */
    constraints: CapabilityConstraints;
    /** Who issued this capability token */
    issued_by: "policy-engine" | "user-consent" | "system";
    /** Unique identifier for this token (prevents replay) */
    nonce: string;
    /** Cryptographic signature (verifies authenticity) */
    signature: string;
    /** Unix timestamp (ms) when this token expires */
    expires_at: number;
    /** Unix timestamp (ms) when this token was issued */
    issued_at: number;
    /** Execution ID this token is bound to */
    execution_id: string;
}

/**
 * Capability Bundle - Collection of tokens for an execution
 */
export interface CapabilityBundle {
    /** Unique execution identifier */
    execution_id: string;
    /** Tool/operation being executed */
    tool_id: string;
    /** All capability tokens granted for this execution */
    tokens: CapabilityToken[];
    /** When this bundle was created */
    created_at: number;
    /** When this bundle expires (minimum of all token expirations) */
    expires_at: number;
    /** Signature covering the entire bundle */
    bundle_signature: string;
}

/**
 * Capability Violation - Reported when capability check fails
 */
export interface CapabilityViolation {
    /** Type of violation */
    type:
    | "missing_capability"
    | "expired_capability"
    | "constraint_exceeded"
    | "invalid_signature"
    | "replay_attack";
    /** Which capability was violated */
    capability: CapabilityType;
    /** Resource that was attempted */
    resource: string;
    /** Details about the violation */
    message: string;
    /** When the violation occurred */
    timestamp: number;
    /** Stack trace or context (for debugging) */
    context?: string;
}

/**
 * Capability Request - Used to request capabilities from the policy engine
 */
export interface CapabilityRequest {
    /** Tool requesting capabilities */
    tool_id: string;
    /** Files being processed */
    files: {
        name: string;
        size: number;
        type: string;
    }[];
    /** Additional operation parameters */
    operation_params?: Record<string, any>;
    /** User who initiated the request */
    user_id?: string;
}

/**
 * Execution Decision - Structured explanation of why an action was allowed or denied
 */
export interface ExecutionDecision {
    action: string;
    target: string;
    decision: "allowed" | "denied" | "modified";
    reason_code: string;
    human_explanation: string;
    rule_id?: string;
    suggested_fixes?: string[];
    alternatives?: string[];
}

/**
 * Capability Grant Response - Result of capability resolution
 */
export interface CapabilityGrantResponse {
    /** Whether capabilities were granted */
    granted: boolean;
    /** The capability bundle if granted */
    bundle?: CapabilityBundle;
    /** Reason if denied */
    denial_reason?: string;
    /** Structured explanation (Epic 7) */
    decision?: ExecutionDecision;
    /** Required user consent (if any) */
    requires_consent?: {
        capabilities: CapabilityType[];
        reason: string;
    };
}

/**
 * Provenance Record - Cryptographic hashes for deterministic verification
 */
export interface ProvenanceRecord {
    /** SHA256 hash of input bytes */
    input_hash?: string;
    /** SHA256 hash of the frozen execution plan */
    plan_hash?: string;
    /** SHA256 hash of the WASM runtime/binary */
    runtime_hash?: string;
    /** SHA256 hash of the final output */
    output_hash?: string;
}

/**
 * Execution Receipt - Post-execution audit summary
 */
export interface ExecutionReceipt {
    /** Execution identifier */
    execution_id: string;
    /** Tool that was executed */
    tool_id: string;
    /** Provenance record for determinism (Epic: Deterministic Pipelines) */
    provenance?: ProvenanceRecord;
    /** Capabilities that were granted */
    capabilities_granted: CapabilityUsageSummary[];
    /** Capabilities that were actually used */
    capabilities_used: CapabilityUsageSummary[];
    /** Any violations that occurred */
    violations: CapabilityViolation[];
    /** Hidden actions (should always be empty in CBEE!) */
    hidden_actions: string[];
    /** Final execution status */
    status: "success" | "failure" | "violation";
    /** When execution started */
    started_at: number;
    /** When execution completed */
    completed_at: number;
    /** Duration in milliseconds */
    duration_ms: number;
}

/**
 * Capability Usage Summary - Human-readable summary of capability usage
 */
export interface CapabilityUsageSummary {
    /** Capability type */
    capability: CapabilityType;
    /** What was accessed */
    resource: string;
    /** How much was used */
    usage: {
        /** Bytes read/written/allocated */
        bytes?: number;
        /** Number of files */
        file_count?: number;
        /** CPU instructions executed */
        instructions?: number;
        /** Execution duration */
        duration_ms?: number;
    };
    /** Human-readable description */
    description: string;
}

/**
 * Capability Registry Entry - Maps operations to required capabilities
 */
export interface CapabilityTemplate {
    /** Operation name */
    operation: string;
    /** Required capability types */
    requires: CapabilityType[];
    /** Default constraints for this operation */
    default_constraints: CapabilityConstraints;
    /** Whether network access is explicitly forbidden */
    no_network: boolean;
    /** Human-readable description of what this operation does */
    description: string;
}
