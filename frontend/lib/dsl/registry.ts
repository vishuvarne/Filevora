
import { StreamType } from './types';

/**
 * definition of a valid operation in the system.
 * This is metadata, not the implementation.
 */
export interface OperationDefinition {
    name: string;
    description: string;
    allowedInputs: StreamType[];
    producedOutput: StreamType;
    /** Can this operation process data in chunks without full file access? */
    isStreamable: boolean;
    /** Does this operation require random access to the entire file? */
    requiresFullContext: boolean;
    /** Estimated memory multiplier (e.g. 2.0 = 2x input size) */
    memoryMultiplier: number;
    /** Fixed memory overhead in bytes */
    baseMemoryOverhead: number;
}

export class OperationRegistry {
    private static instance: OperationRegistry;
    private readonly operations: Map<string, OperationDefinition> = new Map();

    private constructor() {
        // Register core operations
        this.registerDefaults();
    }

    static getInstance(): OperationRegistry {
        if (!OperationRegistry.instance) {
            OperationRegistry.instance = new OperationRegistry();
        }
        return OperationRegistry.instance;
    }

    register(op: OperationDefinition) {
        if (this.operations.has(op.name)) {
            console.warn(`[OperationRegistry] Overwriting existing operation: ${op.name}`);
        }
        this.operations.set(op.name, op);
    }

    get(name: string): OperationDefinition | undefined {
        return this.operations.get(name);
    }

    getAll(): OperationDefinition[] {
        return Array.from(this.operations.values());
    }

    private registerDefaults() {
        // 1. PDF Merge
        this.register({
            name: 'pdf_merge',
            description: 'Merge multiple PDF streams into one',
            allowedInputs: [StreamType.PDF],
            producedOutput: StreamType.PDF,
            isStreamable: false, // Usually requires modifying cross-ref table at end, hard to stream purely 1-pass without buffering some parts or seeking
            requiresFullContext: false, // Can be done with partial reads if smart, but for safety often treated as non-streamable in simple implementations. Let's say v1 is WASM memory bound.
            memoryMultiplier: 1.5,
            baseMemoryOverhead: 1024 * 1024 * 5 // 5MB reserved
        });

        // 2. Image Resize
        this.register({
            name: 'image_resize',
            description: 'Resize an image to specific dimensions',
            allowedInputs: [StreamType.IMAGE],
            producedOutput: StreamType.IMAGE,
            isStreamable: true, // Possible with row-based processing for some formats, generally chunkable
            requiresFullContext: false,
            memoryMultiplier: 1.2, // Need buffer for rows
            baseMemoryOverhead: 1024 * 1024 * 2
        });

        // 3. PDF Compress
        this.register({
            name: 'pdf_compress',
            description: 'Reduce PDF file size',
            allowedInputs: [StreamType.PDF],
            producedOutput: StreamType.PDF,
            isStreamable: false,
            requiresFullContext: true, // Often needs full analysis
            memoryMultiplier: 2.0,
            baseMemoryOverhead: 1024 * 1024 * 10
        });

        // 4. Zip Create
        this.register({
            name: 'archive_zip',
            description: 'Create a ZIP archive from inputs',
            allowedInputs: [StreamType.BINARY, StreamType.TEXT, StreamType.IMAGE, StreamType.PDF],
            producedOutput: StreamType.ARCHIVE,
            isStreamable: true, // ZIP is very streamable
            requiresFullContext: false,
            memoryMultiplier: 0.1, // Very low overhead, just buffering small chunks
            baseMemoryOverhead: 1024 * 512
        });
    }
}
