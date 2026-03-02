/**
 * Post-build patch for soffice.js — enables WASM memory growth.
 * 
 * The ZetaOffice WASM binary is compiled with ALLOW_MEMORY_GROWTH=0
 * and INITIAL_MEMORY=1GB. This hard-caps memory at 1GB which causes 
 * OOM for complex documents.
 * 
 * This script patches soffice.js after build to:
 * 1. Replace `abortOnCannotGrowMemory` with actual memory growth logic
 * 2. Create WebAssembly.Memory with maximum=2GB (32768 pages)
 * 
 * The WASM binary itself only references the Memory import — it doesn't 
 * enforce a maximum. The limit is in the JS glue code only.
 */

const fs = require('fs');
const path = require('path');

const sofficeJsPath = path.join(__dirname, '..', 'out', 'wasm', 'libreoffice', 'soffice.js');

if (!fs.existsSync(sofficeJsPath)) {
    console.log('[patch-soffice] soffice.js not found at', sofficeJsPath);
    console.log('[patch-soffice] Run after "next build" to patch the output.');
    process.exit(0);
}

let code = fs.readFileSync(sofficeJsPath, 'utf8');
const originalSize = code.length;

// Patch 1: Replace abortOnCannotGrowMemory with growMemory implementation
const abortFn = 'var abortOnCannotGrowMemory=requestedSize=>{abort(';
if (code.includes(abortFn)) {
    // Find the full abort function (ends with })
    const start = code.indexOf(abortFn);
    // Find the matching closing brace and semicolon
    let depth = 0;
    let end = start;
    let inString = false;
    let stringChar = '';
    for (let i = start; i < code.length; i++) {
        const c = code[i];
        if (inString) {
            if (c === stringChar && code[i - 1] !== '\\') inString = false;
            continue;
        }
        if (c === '`' || c === '"' || c === "'") { inString = true; stringChar = c; continue; }
        if (c === '{') depth++;
        if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    // Skip the trailing semicolon if present
    if (code[end] === ';') end++;

    const abortFnCode = code.substring(start, end);

    // Replacement: actual memory growth function
    const growFn = `var abortOnCannotGrowMemory=requestedSize=>{var pages=requestedSize-wasmMemory.buffer.byteLength+65535>>>16;try{wasmMemory.grow(pages);updateMemoryViews();return 1}catch(e){err("Cannot grow memory to "+requestedSize+" bytes: "+e);return 0}};`;

    code = code.substring(0, start) + growFn + code.substring(end);
    console.log('[patch-soffice] Replaced abortOnCannotGrowMemory with growMemory');
} else {
    console.log('[patch-soffice] WARNING: abortOnCannotGrowMemory not found — may already be patched');
}

// Patch 2: Ensure WebAssembly.Memory has maximum=32768 (2GB)
// The original has maximum:INITIAL_MEMORY/65536 which caps at 1GB
const memPattern = 'wasmMemory=new WebAssembly.Memory({';
const memIdx = code.indexOf(memPattern);
if (memIdx >= 0) {
    const afterBrace = memIdx + memPattern.length;
    const closeBrace = code.indexOf('})', afterBrace);
    if (closeBrace >= 0) {
        const memConfig = code.substring(afterBrace, closeBrace);
        if (memConfig.includes('maximum:INITIAL_MEMORY/65536')) {
            // Replace the 1GB maximum with 2GB (32768 pages)
            let newMemConfig = memConfig.replace('maximum:INITIAL_MEMORY/65536', 'maximum:32768');
            // Patch 2.5: Also reduce initial memory if possible to 512MB
            if (newMemConfig.includes('initial:INITIAL_MEMORY/65536')) {
                newMemConfig = newMemConfig.replace('initial:INITIAL_MEMORY/65536', 'initial:8192');
            }
            code = code.substring(0, afterBrace) + newMemConfig + code.substring(closeBrace);
            console.log('[patch-soffice] Explicitly set WebAssembly.Memory maximum to 2GB');
        } else if (!memConfig.includes('maximum')) {
            // Add maximum:32768 (2GB = 32768 * 64KB pages)
            let newMemConfig = memConfig + ',maximum:32768';
            if (newMemConfig.includes('initial:INITIAL_MEMORY/65536')) {
                newMemConfig = newMemConfig.replace('initial:INITIAL_MEMORY/65536', 'initial:8192');
            }
            code = code.substring(0, afterBrace) + newMemConfig + code.substring(closeBrace);
            console.log('[patch-soffice] Added maximum:32768 (2GB) to WebAssembly.Memory');
        } else {
            console.log('[patch-soffice] WebAssembly.Memory maximum already patched');
        }
    }
} else {
    console.log('[patch-soffice] WARNING: WebAssembly.Memory creation not found');
}

// Patch 3: Also ensure _emscripten_resize_heap uses the grow function
// Some builds assign: _emscripten_resize_heap = abortOnCannotGrowMemory
// This should already be fixed by Patch 1, but let's verify
const resizeAssign = '_emscripten_resize_heap=abortOnCannotGrowMemory';
if (code.includes(resizeAssign)) {
    console.log('[patch-soffice] _emscripten_resize_heap correctly points to (now-patched) abortOnCannotGrowMemory');
}

fs.writeFileSync(sofficeJsPath, code, 'utf8');
const newSize = code.length;
console.log(`[patch-soffice] Done. Size: ${originalSize} → ${newSize} bytes (${newSize - originalSize > 0 ? '+' : ''}${newSize - originalSize})`);
