
// scripts/extract_pptx.ts
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, Image } from 'canvas';

// --- Global Polyfills Implementation (Scoped) ---
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: "http://localhost/",
    pretendToBeVisual: true,
    resources: "usable"
});
const win = dom.window;

// Patch createElement to return node-canvas
const origCreateElement = win.document.createElement;
win.document.createElement = (tagName: string) => {
    if (tagName.toLowerCase() === 'canvas') {
        const c = createCanvas(1, 1); // Dynamic sizing: Renderer will autoresize
        (c as any).style = {};
        (c as any).addEventListener = () => { };
        return c as any;
    }
    if (tagName.toLowerCase() === 'img') {
        const img = new Image();
        return img as any;
    }
    return origCreateElement.call(win.document, tagName);
};

// Blob Polyfill
class BlobPolyfill {
    parts: any[];
    type: string;
    size: number;
    constructor(parts: any[], options: any = {}) {
        this.parts = parts;
        this.type = options.type || '';
        this.size = parts.reduce((acc, p) => acc + (p.length || p.byteLength || 0), 0);
    }
    async arrayBuffer() {
        const buffers = this.parts.map(p => {
            if (p instanceof Buffer) return p;
            if (typeof p === 'string') return Buffer.from(p);
            if (p instanceof Uint8Array) return Buffer.from(p);
            return Buffer.from(p);
        });
        const buf = Buffer.concat(buffers);
        return buf as unknown as ArrayBuffer;
    }
    slice(start: number = 0, end: number = this.size, type: string = this.type) {
        const buffers = this.parts.map(p => {
            if (Buffer.isBuffer(p)) return p;
            if (typeof p === 'string') return Buffer.from(p);
            if (p instanceof Uint8Array) return Buffer.from(p);
            return Buffer.from(p);
        });
        const full = Buffer.concat(buffers);

        // Normalize indices
        let s = start < 0 ? Math.max(full.length + start, 0) : Math.min(start, full.length);
        let e = end < 0 ? Math.max(full.length + end, 0) : Math.min(end, full.length);

        return new BlobPolyfill([full.subarray(s, e)], { type });
    }
    async text() {
        const buf = await this.arrayBuffer();
        if (Buffer.isBuffer(buf)) return (buf as any).toString('utf-8');
        return new TextDecoder().decode(buf);
    }
    stream() { return null as any; }
    async bytes() {
        const buf = await this.arrayBuffer();
        return new Uint8Array(buf);
    }
}

// File Polyfill
class FilePolyfill extends BlobPolyfill {
    name: string;
    lastModified: number;
    webkitRelativePath: string = "";
    constructor(parts: any[], name: string, options: any = {}) {
        super(parts, options);
        this.name = name;
        this.lastModified = options.lastModified || Date.now();
    }
}

// OffscreenCanvas Polyfill
class OffscreenCanvasPolyfill {
    width: number;
    height: number;
    _canvas: any;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this._canvas = createCanvas(width, height);
    }
    getContext(type: string) {
        return this._canvas.getContext(type);
    }
    async convertToBlob(options: any) {
        const type = options ? options.type : 'image/png';
        const quality = options ? options.quality : undefined;
        const mime = type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const buf = this._canvas.toBuffer(mime, { quality, compressionLevel: 6, filters: 0 });
        return new BlobPolyfill([buf], { type: mime });
    }
    toBuffer(type: string = 'image/png', args?: any) {
        return this._canvas.toBuffer(type, args);
    }
}

// FontFace Polyfill
class FontFacePolyfill {
    name: string;
    constructor(name: string, data: any) { this.name = name; }
    async load() { return this; }
}

// Patch FileReader to handle custom Blob
const origReadAsDataURL = win.FileReader.prototype.readAsDataURL;
win.FileReader.prototype.readAsDataURL = function (blob: any) {
    if (blob && (blob instanceof BlobPolyfill || blob.parts)) {
        const parts = blob.parts || [blob];
        const buffers = parts.map((p: any) => {
            if (Buffer.isBuffer(p)) return p;
            if (typeof p === 'string') return Buffer.from(p);
            return Buffer.from(p);
        });
        const buffer = Buffer.concat(buffers);
        const base64 = buffer.toString('base64');
        const mime = blob.type || 'application/octet-stream';
        const dataUrl = `data:${mime};base64,${base64}`;

        // Emulate async behavior
        setTimeout(() => {
            Object.defineProperty(this, 'readyState', { value: 2, writable: true }); // DONE
            Object.defineProperty(this, 'result', { value: dataUrl, writable: true });

            // @ts-ignore
            if (this.onload) this.onload({ target: this } as any);
            // @ts-ignore
            if (this.onloadend) this.onloadend({ target: this } as any);
        }, 1);
        return;
    }
    return (origReadAsDataURL as any).apply(this, arguments as any);
};

// Define Browser Globals Collection
const browserGlobals: any = {
    window: win,
    document: win.document,
    DOMParser: win.DOMParser,
    XMLSerializer: win.XMLSerializer,
    FileReader: win.FileReader,
    navigator: win.navigator || { userAgent: 'node' },
    HTMLElement: win.HTMLElement,
    Node: win.Node,
    Element: win.Element,
    Document: win.Document,
    Blob: BlobPolyfill,
    File: FilePolyfill,
    HTMLCanvasElement: win.HTMLCanvasElement,
    Image: Image,
    OffscreenCanvas: OffscreenCanvasPolyfill,
    FontFace: FontFacePolyfill,
    devicePixelRatio: 1 // Fix text positioning drift
};

// --- Scoped Environment Wrapper ---
// --- Scoped Environment Wrapper ---
async function withBrowserEnv<T>(fn: () => Promise<T>): Promise<T> {
    const prevGlobals: any = {};
    const keys = Object.keys(browserGlobals);

    // Snapshot and inject
    for (const key of keys) {
        prevGlobals[key] = (global as any)[key];
        try {
            (global as any)[key] = browserGlobals[key];
        } catch (e) {
            // Fallback for read-only properties
            try {
                Object.defineProperty(global, key, {
                    value: browserGlobals[key],
                    writable: true,
                    configurable: true
                });
            } catch (e2) {
                console.warn(`[Warning] Failed to inject global '${key}':`, e2);
            }
        }
    }

    // Patch document fonts specifically (as document is on global now)
    const doc = (global as any).document;
    const prevFonts = doc?.fonts;
    if (doc) {
        doc.fonts = {
            add: () => { },
            load: async () => [],
            ready: Promise.resolve(),
            forEach: () => { },
            check: () => true, // Often used
        };
    }

    try {
        return await fn();
    } finally {
        // Restore
        for (const key of keys) {
            const prevVal = prevGlobals[key];
            if (prevVal === undefined) {
                try {
                    delete (global as any)[key];
                } catch (e) { }
            } else {
                try {
                    (global as any)[key] = prevVal;
                } catch (e) {
                    try {
                        Object.defineProperty(global, key, {
                            value: prevVal,
                            writable: true,
                            configurable: true
                        });
                    } catch (e2) { }
                }
            }
        }
        if (doc) {
            doc.fonts = prevFonts;
        }
    }
}

// --- Execution ---
import { PptxDataExtractor } from '../lib/pptx-data-extractor.js';
import { PptxToPdfConverterCanvas } from '../lib/pptx-converter-canvas.js';
import { PptxToPdfConverterVector } from '../lib/pptx-converter-vector.js';

async function run() {
    const filesToProcess = [
        String.raw`C:\Users\dear_\Downloads\Method Overloading.pptx`
    ];

    console.log(`Starting Batch PPTX Extraction for ${filesToProcess.length} files...`);

    for (const filePath of filesToProcess) {
        console.log(`\n========================================`);
        console.log(`Processing: ${path.basename(filePath)}`);
        console.log(`Path: ${filePath}`);
        console.log(`========================================`);

        if (!fs.existsSync(filePath)) {
            console.error(`ERROR: File not found at ${filePath}. Skipping.`);
            continue;
        }

        try {
            await withBrowserEnv(async () => {
                const fileBuffer = fs.readFileSync(filePath);
                // @ts-ignore
                const file = new File([fileBuffer], path.basename(filePath));
                console.log(`Loaded file: ${file.name} (${file.size} bytes)`);

                // 1. Extract Data
                console.log("--> Step 1: Extracting raw data...");
                const extractor = new PptxDataExtractor();
                // @ts-ignore
                const extractionResult = await extractor.extractSlides(file);
                console.log(`Extraction successful. Found ${extractionResult.slides.length} slides.`);

                // --- Font Registration Fix ---
                if (extractionResult.fonts && extractionResult.fonts.length > 0) {
                    console.log(`Found ${extractionResult.fonts.length} embedded fonts. Registering...`);
                    const { NodeFontRegistry } = require('./node-font-registry.js');
                    const registry = new NodeFontRegistry();

                    for (const font of extractionResult.fonts) {
                        registry.register(font);
                    }
                }

                // Save JSON for this file
                const safeBaseName = path.basename(filePath, '.pptx').replace(/[^a-zA-Z0-9]/g, '_');
                const jsonOutput = JSON.stringify(extractionResult, (key, value) => {
                    if (key === 'data' && (value instanceof ArrayBuffer || (value && value.type === 'Buffer'))) {
                        return `<Buffer len=${value.byteLength || value.length}>`;
                    }
                    if (key === 'fonts' && Array.isArray(value)) {
                        return value.map(f => ({ ...f, data: `[DATA ${f.data?.length || 0} bytes]` }));
                    }
                    return value;
                }, 2);

                const jsonPath = path.resolve(`${safeBaseName}_data.json`);
                fs.writeFileSync(jsonPath, jsonOutput);
                console.log(`Saved extraction data to: ${jsonPath}`);

                // 2. Convert to PDF
                console.log("--> Step 2: Converting to PDF (Vector Mode)...");
                const converter = new PptxToPdfConverterVector();
                // @ts-ignore
                const pdfBlob = await converter.convert(file);

                // @ts-ignore
                const pdfBuffer = await pdfBlob.arrayBuffer();
                const pdfPath = path.resolve(`${safeBaseName}.pdf`);
                fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
                console.log(`Saved PDF to: ${pdfPath}`);
            });

        } catch (err: any) {
            console.error(`CRASH processing ${path.basename(filePath)}!`);
            console.error(err);
        }
    }
}

run().catch(e => {
    console.error("Unhandled Error:", e);
    process.exit(1);
});
