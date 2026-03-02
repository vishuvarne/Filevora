/**
 * Patch soffice.wasm binary — increase memory maximum from 1GB to 2GB.
 *
 * The WASM binary declares its memory import as:
 *   (import "env" "memory" (memory 16384 16384))  ; shared, initial=1GB, max=1GB
 *
 * The browser's WASM engine enforces this limit, so even if soffice.js
 * creates WebAssembly.Memory with maximum=32768, the binary's own
 * declaration caps it at 16384 pages (1GB).
 *
 * This script finds the memory import in the binary and changes the
 * maximum from 16384 pages (1GB) to 32768 pages (2GB).
 *
 * WASM memory import binary layout:
 *   "env" (03 65 6E 76)
 *   "memory" (06 6D 65 6D 6F 72 79)
 *   import_kind=memory (02)
 *   limits_flags (03 = shared + has_maximum)
 *   initial: LEB128(16384) = 80 80 01
 *   maximum: LEB128(16384) = 80 80 01  <-- patch this to LEB128(32768) = 80 80 02
 */

const fs = require('fs');
const path = require('path');

// Works on both the source and built copy
const wasmPaths = [
    path.join(__dirname, '..', 'out', 'wasm', 'libreoffice', 'soffice.wasm'),
    path.join(__dirname, '..', 'public', 'wasm', 'libreoffice', 'soffice.wasm'),
];

// LEB128 encode a value
function leb128Encode(value) {
    const bytes = [];
    do {
        let byte = value & 0x7F;
        value >>>= 7;
        if (value !== 0) byte |= 0x80;
        bytes.push(byte);
    } while (value !== 0);
    return Buffer.from(bytes);
}

// The byte pattern for the memory import:
// "env" string:  03 65 6E 76
// "memory" str:  06 6D 65 6D 6F 72 79
// kind=memory:   02
// flags=shared:  03
// initial(16384):80 80 01
// maximum(16384):80 80 01
const ENV = Buffer.from([0x03, 0x65, 0x6E, 0x76]); // "\x03env"
const MEMORY = Buffer.from([0x06, 0x6D, 0x65, 0x6D, 0x6F, 0x72, 0x79]); // "\x06memory"
const IMPORT_KIND_MEMORY = 0x02;
const FLAGS_SHARED_MAX = 0x03;
const INITIAL_1GB = leb128Encode(16384); // 80 80 01
const INITIAL_512MB = Buffer.from([0x80, 0xC0, 0x00]); // LEB128(8192) padded to 3 bytes
const MAX_1GB = leb128Encode(16384);     // 80 80 01
const MAX_2GB = leb128Encode(32768);     // 80 80 02

let patchedCount = 0;

for (const wasmPath of wasmPaths) {
    if (!fs.existsSync(wasmPath)) {
        console.log(`[patch-wasm] Skipping (not found): ${wasmPath}`);
        continue;
    }

    console.log(`[patch-wasm] Reading ${wasmPath}`);
    const wasm = fs.readFileSync(wasmPath);

    // Verify WASM magic
    if (wasm[0] !== 0x00 || wasm[1] !== 0x61 || wasm[2] !== 0x73 || wasm[3] !== 0x6D) {
        console.error(`[patch-wasm] ERROR: Not a valid WASM file`);
        continue;
    }

    // Search for the memory import pattern
    // We look for: "env" ... "memory" ... 02 03 80 80 01 80 80 01
    let found = false;
    for (let i = 0; i < wasm.length - 20; i++) {
        // Look for "env" string
        if (wasm[i] !== ENV[0] || wasm[i + 1] !== ENV[1] || wasm[i + 2] !== ENV[2] || wasm[i + 3] !== ENV[3]) {
            continue;
        }

        // Check if "memory" follows
        const memStart = i + 4;
        if (memStart + MEMORY.length >= wasm.length) continue;

        let memMatch = true;
        for (let j = 0; j < MEMORY.length; j++) {
            if (wasm[memStart + j] !== MEMORY[j]) { memMatch = false; break; }
        }
        if (!memMatch) continue;

        // Check import_kind = memory (0x02)
        const kindIdx = memStart + MEMORY.length;
        if (wasm[kindIdx] !== IMPORT_KIND_MEMORY) continue;

        // Check flags = 0x03 (shared + has_maximum)
        const flagsIdx = kindIdx + 1;
        if (wasm[flagsIdx] !== FLAGS_SHARED_MAX) {
            console.log(`[patch-wasm] Found memory import at ${i} but flags=${wasm[flagsIdx].toString(16)} (expected 03)`);
            continue;
        }

        // Check initial = LEB128(16384) = 80 80 01
        const initIdx = flagsIdx + 1;
        if (wasm[initIdx] === INITIAL_512MB[0] && wasm[initIdx + 1] === INITIAL_512MB[1] && wasm[initIdx + 2] === INITIAL_512MB[2]) {
            // Already patched initial
        } else if (wasm[initIdx] !== 0x80 || wasm[initIdx + 1] !== 0x80 || wasm[initIdx + 2] !== 0x01) {
            console.log(`[patch-wasm] Found memory import but initial is not 16384 (got ${wasm[initIdx].toString(16)} ${wasm[initIdx + 1].toString(16)} ${wasm[initIdx + 2].toString(16)})`);
            continue;
        }

        // Check maximum = LEB128(16384) = 80 80 01
        const maxIdx = initIdx + 3;
        // Verify maximum is either 1GB (to patch) or 2GB (already patched)
        const isMax1GB = (wasm[maxIdx] === 0x80 && wasm[maxIdx + 1] === 0x80 && wasm[maxIdx + 2] === 0x01);
        const isMax2GB = (wasm[maxIdx] === MAX_2GB[0] && wasm[maxIdx + 1] === MAX_2GB[1] && wasm[maxIdx + 2] === MAX_2GB[2]);

        if (!isMax1GB && !isMax2GB) {
            console.log(`[patch-wasm] Found memory import but maximum is unexpected: ${wasm[maxIdx].toString(16)}`);
            continue;
        }

        console.log(`[patch-wasm] Found memory import at offset ${i}`);

        // Patch Initial: 1GB -> 512MB
        if (wasm[initIdx] !== INITIAL_512MB[0] || wasm[initIdx + 1] !== INITIAL_512MB[1]) {
            console.log(`[patch-wasm] Patching initial: 16384 pages (1GB) → 8192 pages (512MB)`);
            wasm[initIdx] = INITIAL_512MB[0];
            wasm[initIdx + 1] = INITIAL_512MB[1];
            wasm[initIdx + 2] = INITIAL_512MB[2];
        } else {
            console.log(`[patch-wasm] Initial memory already at 512MB`);
        }

        // Patch Maximum: 1GB -> 2GB
        if (!isMax2GB) {
            console.log(`[patch-wasm] Patching maximum: 16384 pages (1GB) → 32768 pages (2GB)`);
            wasm[maxIdx] = MAX_2GB[0];     // 80
            wasm[maxIdx + 1] = MAX_2GB[1]; // 80
            wasm[maxIdx + 2] = MAX_2GB[2]; // 02
        } else {
            console.log(`[patch-wasm] Maximum memory already at 2GB`);
        }

        found = true;
        break;
    }

    if (!found) {
        console.error(`[patch-wasm] ERROR: Memory import pattern not found in ${wasmPath}`);
        continue;
    }

    // Write patched binary
    fs.writeFileSync(wasmPath, wasm);
    console.log(`[patch-wasm] Patched ${wasmPath} (${(wasm.length / 1024 / 1024).toFixed(1)} MB)`);
    patchedCount++;
}

if (patchedCount > 0) {
    console.log(`[patch-wasm] Done — patched ${patchedCount} file(s)`);
} else {
    console.log(`[patch-wasm] WARNING: No files were patched`);
}
