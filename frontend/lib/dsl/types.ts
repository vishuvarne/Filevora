
/**
 * Privacy-First Conversion DSL System
 * Core Type Definitions
 */

// --- Routing Decisions ---

export enum ExecutionRoute {
    WASM_DIRECT = 'WASM_DIRECT',   // Fit in memory, run typically
    WASM_CHUNKED = 'WASM_CHUNKED', // Large file, stream processing required
    NATIVE_REQUIRED = 'NATIVE_REQUIRED', // Requires native app (not yet implemented)
    SERVER_REQUIRED = 'SERVER_REQUIRED', // Cannot run locally (e.g. requires cloud API)
}

// --- Resource Limits ---

export interface ResourceLimits {
    /** Maximum memory in bytes this plan is allowed to consume */
    maxMemoryBytes: number;
    /** Max execution time in milliseconds before timeout */
    maxExecutionTimeMs: number;
    /** Preferred chunk size for streaming operations */
    chunkSizeBytes?: number;
}

// --- Stream Definitions ---

export enum StreamType {
    BINARY = 'BINARY',
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    PDF = 'PDF',
    ARCHIVE = 'ARCHIVE'
}

export interface InputStream {
    id: string;
    type: StreamType;
    // Optional metadata constraints
    maxSize?: number;
}

export interface OutputStream {
    id: string;
    type: StreamType;
    /** Whether the output size is predictable relative to input (e.g. 1:1, <1:1) */
    sizeHint?: 'COMPRESSED' | 'EXPANDED' | 'UNKNOWN';
}

// --- Operations ---

export interface DSLOperation {
    /** Unique ID for this step in the plan */
    id: string;
    /** Name of the operation to execute (must exist in Registry) */
    opName: string;
    /** IDs of input streams for this operation */
    inputs: string[];
    /** IDs of output streams produced by this operation */
    outputs: string[];
    /** Static parameters for the operation (no dynamic code allowed) */
    params: Record<string, string | number | boolean | null>;
}

// --- The Conversion Plan ---

export interface ConversionPlan {
    version: string; // e.g., "0.1"
    /** Declarative list of inputs required */
    inputs: InputStream[];
    /** Declarative list of outputs produced */
    outputs: OutputStream[];
    /** Ordered list of transformations */
    steps: DSLOperation[];
    /** Hard limits for this entire plan */
    limits: ResourceLimits;
}
