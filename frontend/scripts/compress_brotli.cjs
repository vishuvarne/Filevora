const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const pipe = promisify(require('stream').pipeline);

const FILES_TO_COMPRESS = [
    { in: 'public/wasm/libreoffice/soffice.wasm', out: 'public/wasm/libreoffice/soffice.wasm.br' },
    { in: 'public/wasm/libreoffice/soffice_diet.data', out: 'public/wasm/libreoffice/soffice.data.br' },
    { in: 'public/wasm/libreoffice/soffice_diet.data.js.metadata', out: 'public/wasm/libreoffice/soffice.data.js.metadata.br' },
    // { in: 'public/wasm/mupdf/mupdf-wasm.wasm', out: 'public/wasm/mupdf/mupdf-wasm.wasm.br' },
    { in: 'public/wasm/pdfium/pdfium.wasm', out: 'public/wasm/pdfium/pdfium.wasm.br' },
    { in: 'public/wasm/converter_bg.wasm', out: 'public/wasm/converter_bg.wasm.br' },
    { in: 'public/wasm/freetype.wasm', out: 'public/wasm/freetype.wasm.br' }
];

// Note: Ensure paths are relative to project root since we run from root usually.
// Or if run from script, adjust.
// The original script used `path.join(BASE_DIR, file.in)`.
// I will change logic to use absolute paths or relative to script execution.

async function compress() {
    console.log('--- STARTING BROTLI COMPRESSION ---');

    for (const file of FILES_TO_COMPRESS) {
        // Resolve paths relative to CWD if running from root, or adjust.
        // Assuming CWD is project root (frontend/).
        const inputPath = path.resolve(file.in);
        const outputPath = path.resolve(file.out);

        if (!fs.existsSync(inputPath)) {
            console.warn(`Skipping missing file: ${file.in}`);
            continue;
        }

        console.log(`Compressing ${file.in} -> ${file.out}...`);

        await pipe(
            fs.createReadStream(inputPath),
            zlib.createBrotliCompress({
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Max quality
                    [zlib.constants.BROTLI_PARAM_LGWIN]: 24
                }
            }),
            fs.createWriteStream(outputPath)
        );

        const originalSize = fs.statSync(inputPath).size / 1024 / 1024;
        const compressedSize = fs.statSync(outputPath).size / 1024 / 1024;

        console.log(`  Done: ${originalSize.toFixed(2)} MB -> ${compressedSize.toFixed(2)} MB (${((compressedSize / originalSize) * 100).toFixed(1)}%)`);
    }

    console.log('--- BROTLI COMPRESSION COMPLETE ---');
}

compress().catch(err => {
    console.error('Compression failed:', err);
    process.exit(1);
});
