const fs = require('fs');
const path = require('path');

const srcBase = path.join(__dirname, 'frontend', 'node_modules', 'pdfjs-dist');
const destBase = path.join(__dirname, 'frontend', 'public', 'workers', 'libs');

const copyRecursiveSync = function (src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName),
                path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

console.log('Copying cmaps...');
copyRecursiveSync(path.join(srcBase, 'cmaps'), path.join(destBase, 'cmaps'));

console.log('Copying standard_fonts...');
copyRecursiveSync(path.join(srcBase, 'standard_fonts'), path.join(destBase, 'standard_fonts'));

console.log('Done copying PDF assets.');
