export function isSimdSupported(): boolean {
    try {
        // Test for WebAssembly SIMD support using a minimal 128-bit SIMD opcode
        return WebAssembly.validate(new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
        ]));
    } catch (e) {
        return false;
    }
}

export async function loadOptimalModule(baseName: string): Promise<string> {
    const supportsSimd = isSimdSupported();
    const moduleName = supportsSimd ? `${baseName}.simd.wasm` : `${baseName}.wasm`;

    console.log(`[WasmLoader] Loading ${moduleName} (SIMD: ${supportsSimd})`);

    // In a real scenario, correct path resolution logic is needed.
    // Assuming modules are in /wasm/ or similar.
    return `/wasm/${moduleName}`;
}
