// Node 18+ required (for fetch)
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');

const URL = 'https://cdn.zetaoffice.net/zetaoffice_latest/soffice.wasm';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'wasm', 'libreoffice', 'soffice.wasm');

(async () => {
    try {
        console.log(`Checking Node version... ${process.version}`);
        console.log(`Downloading ${URL} to ${OUTPUT_PATH}...`);

        const response = await fetch(URL, {
            headers: {
                'Accept': 'application/wasm'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
        }

        console.log(`Headers: content-encoding=${response.headers.get('content-encoding')}, content-type=${response.headers.get('content-type')}`);

        if (!response.body) throw new Error('Response body is empty');

        const fileStream = fs.createWriteStream(OUTPUT_PATH);
        await pipeline(response.body, fileStream);

        console.log('Download complete.');
        const stats = fs.statSync(OUTPUT_PATH);
        console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // Verify magic
        const fd = fs.openSync(OUTPUT_PATH, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);
        console.log(`Magic: ${buffer.toString('hex')}`);

        if (buffer.toString('hex') !== '0061736d') {
            console.error('ERROR: Invalid WASM magic!');
            process.exit(1);
        } else {
            console.log('WASM verified.');
        }

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
