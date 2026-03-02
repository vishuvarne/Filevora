export interface AppCapabilities {
    wasm: boolean;
    sharedArrayBuffer: boolean;
    simd: boolean;
    webgl: boolean;
    fileSystemAccess: boolean;
    ghostMode: boolean; // True if local processing is fully supported
    turboMode: boolean; // True if advanced perf features (SAB/SIMD) are supported
}

let cachedCapabilities: AppCapabilities | null = null;

export const detectCapabilities = async (): Promise<AppCapabilities> => {
    if (cachedCapabilities) return cachedCapabilities;

    // 1. WASM Support
    const wasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

    // 2. SharedArrayBuffer (Cross-Origin Isolation Check)
    // Note: SAB requires COOP/COEP headers to be set on the server
    const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

    // 3. SIMD Support (WASM SIMD)
    let simd = false;
    if (wasm) {
        try {
            // Minimal WASM module with SIMD instruction
            // This is a standard check byte sequence
            const simdCheck = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
            const module = await WebAssembly.instantiate(simdCheck);
            simd = module.instance instanceof WebAssembly.Instance;
        } catch (e) {
            simd = false;
        }
    }

    // 4. WebGL
    let webgl = false;
    try {
        const canvas = document.createElement('canvas');
        webgl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        webgl = false;
    }

    // 5. File System Access API (for saving without re-downloading)
    const fileSystemAccess = 'showSaveFilePicker' in window;

    // Capabilities Logic
    // Ghost Mode requires robust WASM support.
    // Turbo Mode requires SharedArrayBuffer (threading) and preferably SIMD.
    const ghostMode = wasm;
    const turboMode = ghostMode && sharedArrayBuffer;

    cachedCapabilities = {
        wasm,
        sharedArrayBuffer,
        simd,
        webgl,
        fileSystemAccess,
        ghostMode,
        turboMode
    };

    console.log("[Capabilities] Detection complete:", cachedCapabilities);
    return cachedCapabilities;
};

// Hook for React components
import { useState, useEffect } from 'react';

export const useCapabilities = () => {
    const [capabilities, setCapabilities] = useState<AppCapabilities | null>(null);

    useEffect(() => {
        detectCapabilities().then(setCapabilities);
    }, []);

    return capabilities;
};
