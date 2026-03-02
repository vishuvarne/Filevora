
import fs from 'fs';
import path from 'path';
import { PptxToPdfConverterVector } from '../lib/pptx-converter-vector';

// Polyfills for Node.js environment
import { JSDOM } from 'jsdom';
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
global.document = dom.window.document;
// Additional globals required for instanceof checks
global.Document = dom.window.Document;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;

global.Blob = class Blob {
    parts: Buffer[];
    options: any;
    constructor(parts: any[] = [], options: any = {}) {
        this.parts = parts.map(p => {
            if (Buffer.isBuffer(p)) return p;
            if (typeof p === 'string') return Buffer.from(p);
            return Buffer.from(p);
        });
        this.options = options;
    }
    async arrayBuffer() {
        return Buffer.concat(this.parts);
    }
    get size() {
        return this.parts.reduce((acc, p) => acc + p.length, 0);
    }
    get type() {
        return this.options.type || '';
    }
} as any;

global.File = class File extends global.Blob {
    name: string;
    lastModified: number;
    constructor(parts: any[], name: string, options: any = {}) {
        super(parts, options);
        this.name = name;
        this.lastModified = options.lastModified || Date.now();
    }
} as any;

// Mock window/document for jsPDF if needed (though basic vector rendering might not need full DOM)
// If PptxVectorRenderer needs it, we might need basic mocks, but let's try without first if it worked in extract_pptx.

async function run() {
    const conversions = [
        /*
        {
            input: String.raw`C:\Users\dear_\Downloads\Blue White Modern Illustration Workspace Project Presentation_20251112_132351_0000.pptx`,
            outputName: '1.pdf'
        },
        */
        /*
        {
            input: String.raw`C:\Users\dear_\Downloads\UNIT-IV(QUEUE).pptx`,
            outputName: '2.pdf'
        },
        */
        {
            input: String.raw`C:\Users\dear_\Downloads\Method Overloading (1).pptx`,
            outputName: 'method_overloading.pdf'
        }
    ];

    const downloadsDir = String.raw`C:\Users\dear_\OneDrive\Desktop\filevora\frontend`;
    const converter = new PptxToPdfConverterVector();

    console.log("Starting Batch Conversion using Vector Renderer...");

    for (const task of conversions) {
        console.log(`\nProcessing: ${path.basename(task.input)} -> ${task.outputName}`);

        if (!fs.existsSync(task.input)) {
            console.error(`ERROR: Input file not found: ${task.input}`);
            continue;
        }

        try {
            const fileBuffer = fs.readFileSync(task.input);
            const file = new File([fileBuffer], path.basename(task.input));

            console.log(`Converting...`);
            const pdfBlob = await converter.convert(file);
            const pdfBuffer = await pdfBlob.arrayBuffer();

            const outputPath = path.join(downloadsDir, task.outputName);
            fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));

            console.log(`SUCCESS: Saved to ${outputPath}`);

            // Verify file size to ensure it's not empty
            const stats = fs.statSync(outputPath);
            console.log(`Output Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        } catch (e) {
            console.error(`FAILED to convert ${task.input}:`, e);
        }
    }
}

run().catch(e => {
    console.error("Unhandled Error:", e);
    process.exit(1);
});
