const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const brotliDecompress = promisify(zlib.brotliDecompress);

const BASE_DIR = 'public/wasm/libreoffice';
const FILES_TO_VERIFY = [
    { name: 'soffice.wasm.br', expectedMinSize: 40 * 1024 * 1024 },
    { name: 'soffice.data.br', expectedMinSize: 0.5 * 1024 * 1024 }
];

async function verify() {
    console.log('--- VERIFYING BROTLI FILES ---');

    for (const file of FILES_TO_VERIFY) {
        const filePath = path.join(BASE_DIR, file.name);

        if (!fs.existsSync(filePath)) {
            console.error(`FAIL: File not found: ${file.name}`);
            continue;
        }

        const size = fs.statSync(filePath).size;
        console.log(`Checking ${file.name} (Size: ${(size / 1024 / 1024).toFixed(2)} MB)`);

        if (size < file.expectedMinSize) {
            console.error(`FAIL: File ${file.name} is too small (${size} bytes)`);
            continue;
        }

        try {
            const compressed = fs.readFileSync(filePath);
            // Decompress the whole thing to verify integrity
            // Use a try-catch for memory limits
            const buffer = zlib.brotliDecompressSync(compressed);
            console.log(`  PASS: Full decompression successful for ${file.name} (Uncompressed: ${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
        } catch (err) {
            console.error(`FAIL: Decompression failed for ${file.name}:`, err.message);
        }
    }

    console.log('--- VERIFICATION COMPLETE ---');
}

verify();
