
import { ConversionPlan } from './types';

/**
 * Standard interface that any WASM execution module must implement
 * to support the Chunked Execution Model.
 */
export interface WasmModuleInterface {
    /** Initialize the converter with configuration */
    init(configJson: string): number; // Returns context handle or error code

    /** Accept a chunk of data for a specific input stream */
    write(contextHandle: number, streamId: string, chunk: Uint8Array): number;

    /** Signal that a specific input stream has ended */
    endStream(contextHandle: number, streamId: string): number;

    /** 
     * Attempt to process current buffers.
     * Returns a pointer to output data or status code. 
     * In a real implementation, this would likely use a callback or shared memory 
     * to avoid copying large buffers across the boundary repeatedly.
     */
    process(contextHandle: number): Uint8Array | null;

    /** Clean up resources */
    free(contextHandle: number): void;
}

/**
 * High-level Runner that manages the WASM module lifecycle.
 * (Skeleton implementation)
 */
export class ConversionRunner {

    async execute(plan: ConversionPlan, inputFiles: Map<string, File>) {
        // 1. Load generic WASM runtime or specific Op module
        // 2. Send Plan to module via init()
        // 3. Iterate over inputFiles
        //    - If Chunks allowed: Read TransformStream -> pipeTo -> Wasm.write()
        //    - If Direct: Read full -> Wasm.write()

        console.log("Starting execution for plan inputs:", plan.inputs.map(i => i.id));

        // This is where we would instantiate the Web Worker
        // and postMessage the payload.

        return { success: true, dummyOutput: "blob_url_here" };
    }
}
