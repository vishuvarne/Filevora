/**
 * Prebuild script: copies WASM assets from node_modules to public/
 * so they're available at runtime as static files.
 *
 * This runs before `next build` and ensures the WASM files are present
 * even though they're git-ignored (too large to track in Git).
 */
const fs = require('fs');
const path = require('path');

const copies = [
  // MuPDF WASM (PDF merge engine)
  {
    src: 'node_modules/mupdf/dist/mupdf.js',
    dest: 'public/wasm/mupdf/mupdf.js',
  },
  {
    src: 'node_modules/mupdf/dist/mupdf-wasm.js',
    dest: 'public/wasm/mupdf/mupdf-wasm.js',
  },
  {
    src: 'node_modules/mupdf/dist/mupdf-wasm.wasm',
    dest: 'public/wasm/mupdf/mupdf-wasm.wasm',
  },
];

let copied = 0;
let skipped = 0;

for (const { src, dest } of copies) {
  const srcPath = path.resolve(__dirname, '..', src);
  const destPath = path.resolve(__dirname, '..', dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`[copy-wasm] WARNING: Source not found: ${src}`);
    continue;
  }

  // Create destination directory if it doesn't exist
  const destDir = path.dirname(destPath);
  fs.mkdirSync(destDir, { recursive: true });

  // Only copy if dest doesn't exist or is outdated
  if (fs.existsSync(destPath)) {
    const srcStat = fs.statSync(srcPath);
    const destStat = fs.statSync(destPath);
    if (srcStat.size === destStat.size) {
      skipped++;
      continue;
    }
  }

  fs.copyFileSync(srcPath, destPath);
  copied++;
  console.log(`[copy-wasm] Copied: ${src} → ${dest}`);
}

console.log(`[copy-wasm] Done. ${copied} copied, ${skipped} skipped (already up-to-date).`);
