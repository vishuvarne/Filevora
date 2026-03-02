const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = 'public/wasm/libreoffice';
const METADATA_FILE = path.join(BASE_DIR, 'soffice.data.js.metadata');
const DATA_FILE = path.join(BASE_DIR, 'soffice.data');
const OUT_DATA_FILE = path.join(BASE_DIR, 'soffice_diet.data');
const OUT_METADATA_FILE = path.join(BASE_DIR, 'soffice_diet.data.js.metadata');

console.log('--- STARTING FOCUSED ASSET MINIFICATION ---');

if (!fs.existsSync(METADATA_FILE)) {
    console.error('Metadata file not found!');
    process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
const dataBuffer = fs.readFileSync(DATA_FILE);

// Define allowed patterns for Word, Calc, PPT and core functionality
const ALLOWED_PATTERNS = [
    '/instdir/share/config/soffice.cfg/modules/swriter/', // Word
    '/instdir/share/config/soffice.cfg/modules/scalc/',  // Calc
    '/instdir/share/config/soffice.cfg/modules/simpress/', // PPT
    '/instdir/share/registry/',                          // Core Registry
    '/instdir/program/',                                 // Core Program files
    '/instdir/share/filter/',                            // Required filters
    '/instdir/share/liblangtag/',                        // Language support
    '/instdir/share/fontconfig/',                        // Font config
    'LiberationSans-Regular',                            // Essential Font
    'LiberationSerif-Regular',                           // Essential Font
    'opens___.ttf',                                      // Symbols
    'standard_fonts'
];

// Explicitly exclude
const EXCLUDED_PATTERNS = [
    '/sdraw/',     // Draw
    '/smath/',     // Math
    '/sbase/',     // Base
    '/sglobal/',   // Global
    '/sweb/',      // Web
    '/gallery/',   // Clipart (too large)
    '/icons/',     // UI Icons (not needed for headless)
    '.ui'          // XML UI definitions (not needed for headless)
];

const filteredFiles = metadata.files.filter(file => {
    const isAllowed = ALLOWED_PATTERNS.some(p => file.filename.includes(p));
    const isExcluded = EXCLUDED_PATTERNS.some(p => file.filename.includes(p));

    // Special case for fonts: only keep matches
    if (file.filename.includes('/fonts/')) {
        return ALLOWED_PATTERNS.filter(p => p.endsWith('.ttf') || p.endsWith('.otf')).some(p => file.filename.includes(p));
    }

    return isAllowed && !isExcluded;
});

console.log(`Original Files: ${metadata.files.length}`);
console.log(`Filtered Files: ${filteredFiles.length}`);

// Reconstruct DATA
let currentPos = 0;
const chunks = [];
const newFiles = [];

for (const file of filteredFiles) {
    const length = file.end - file.start;
    const chunk = dataBuffer.slice(file.start, file.end);

    chunks.push(chunk);
    newFiles.push({
        filename: file.filename,
        start: currentPos,
        end: currentPos + length,
        audio: 0
    });

    currentPos += length;
}

const newBuffer = Buffer.concat(chunks);
const newMetadata = {
    ...metadata,
    files: newFiles,
    remote_package_size: newBuffer.length
};

fs.writeFileSync(OUT_DATA_FILE, newBuffer);
fs.writeFileSync(OUT_METADATA_FILE, JSON.stringify(newMetadata));

const oldSize = (dataBuffer.length / 1024 / 1024).toFixed(2);
const newSize = (newBuffer.length / 1024 / 1024).toFixed(2);

console.log(`--- SUCCESS ---`);
console.log(`Original Size: ${oldSize} MB`);
console.log(`Diet Size: ${newSize} MB`);
console.log(`Reduction: ${((1 - newBuffer.length / dataBuffer.length) * 100).toFixed(1)}%`);
console.log(`Saved to: ${OUT_DATA_FILE}`);
console.log(`Metadata saved to: ${OUT_METADATA_FILE}`);
