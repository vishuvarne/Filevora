
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class NodeFontRegistry {
    private tmpDir: string;

    constructor() {
        this.tmpDir = os.tmpdir();
    }

    register(font: { name: string, data: any, style?: string, type?: string }) {
        try {
            // Lazy load canvas to avoid top-level import issues if not installed
            const { registerFont } = require('canvas');

            let buffer: Buffer;
            if (Buffer.isBuffer(font.data)) {
                buffer = font.data;
            } else if (typeof font.data === 'string') {
                const dataStr = font.data as string;
                if (dataStr.startsWith('data:')) {
                    const base64 = dataStr.split(',')[1];
                    buffer = Buffer.from(base64, 'base64');
                } else {
                    buffer = Buffer.from(dataStr, 'base64');
                }
            } else if (font.data && (font.data as any).arrayBuffer) {
                // Handle ArrayBuffer/Blob
                // We can't await here easily if the API is sync, but typically data is loaded.
                // Assuming data is ArrayBuffer or similar.
                // For this script, we know it's ArrayBuffer from Extractor.
                // But wait, Extractor returns `ArrayBuffer` for `data`.
                buffer = Buffer.from(font.data as ArrayBuffer);
            } else {
                console.warn(`[FontRegistry] Unknown data format for font ${font.name}`);
                return;
            }

            const safeName = font.name.replace(/[^a-zA-Z0-9]/g, '_');
            const ext = font.type === 'otf' ? 'otf' : 'ttf'; // Simple mapping
            const filePath = path.join(this.tmpDir, `${safeName}_${Date.now()}.${ext}`);

            // Write to disk (Requirement of node-canvas currently)
            fs.writeFileSync(filePath, buffer);

            // Map style
            // PptxDataExtractor returns 'bold', 'italic', 'bolditalic', 'normal'
            // node-canvas registerFont expects { family, weight, style }
            let weight = 'normal';
            let style = 'normal';

            if (font.style?.includes('bold')) weight = 'bold';
            if (font.style?.includes('italic')) style = 'italic';

            console.log(`[FontRegistry] Registering font: ${font.name} (${weight}/${style}) at ${filePath}`);
            registerFont(filePath, { family: font.name, weight, style });

            // Cleanup? node-canvas needs the file to exist? 
            // Usually yes, it loads it. We rely on OS temp cleanup or manual cleanup later.
            // For a script run, temp is fine.

        } catch (e) {
            console.error(`[FontRegistry] Failed to register font ${font.name}`, e);
        }
    }
}
