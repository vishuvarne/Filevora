const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OFFICE_DIR = path.join(__dirname, '../public/wasm/libreoffice');
const ZETA_HELPER = path.join(OFFICE_DIR, 'zetaHelper.js');
const WASM_FILE = path.join(OFFICE_DIR, 'soffice.wasm');
const JS_FILE = path.join(OFFICE_DIR, 'soffice.js');

function getHash(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found for hashing: ${filePath}`);
        return 'missing';
    }
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex').substring(0, 8);
}

function updateCacheBuster() {
    console.log('Generating WASM hashes...');

    const wasmHash = getHash(WASM_FILE);
    const jsHash = getHash(JS_FILE);
    const combinedHash = `v=${wasmHash}_${jsHash}`;

    console.log(`Calculated Hash: ${combinedHash}`);

    let content = fs.readFileSync(ZETA_HELPER, 'utf8');

    // Regex to find: const CACHE_BUSTER = '...';
    const regex = /const CACHE_BUSTER = ['"].*['"];/;

    if (regex.test(content)) {
        const newContent = content.replace(regex, `const CACHE_BUSTER = '${combinedHash}';`);
        fs.writeFileSync(ZETA_HELPER, newContent);
        console.log(`Updated zetaHelper.js with new CACHE_BUSTER: ${combinedHash}`);
    } else {
        console.error('Error: Could not find CACHE_BUSTER constant in zetaHelper.js');
        process.exit(1);
    }
}

updateCacheBuster();
