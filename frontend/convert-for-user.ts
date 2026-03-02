
import { JSDOM } from 'jsdom';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { TextEncoder, TextDecoder } from 'util';

// --- MOCK BROWSER ENVIRONMENT ---
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).DOMParser = dom.window.DOMParser;
(global as any).XMLSerializer = dom.window.XMLSerializer;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;
(global as any).HTMLImageElement = dom.window.HTMLImageElement;
(global as any).Element = dom.window.Element;
(global as any).Document = dom.window.Document;
(global as any).Node = dom.window.Node;

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// --- BLOB & URL MOCKS ---
const blobStore = new Map<string, Buffer>();

(global as any).Blob = class Blob {
    _buffer: Buffer;
    type: string;
    constructor(chunks: any[], options: any = {}) {
        this._buffer = Buffer.concat(chunks.map(c =>
            c instanceof Buffer ? c : Buffer.from(c)
        ));
        this.type = options.type || '';
    }
    async arrayBuffer() { return this._buffer; }
};

(global as any).URL = {
    createObjectURL: (blob: any) => {
        const id = `blob:mock-${Math.random().toString(36).substr(2, 9)}`;
        blobStore.set(id, blob._buffer);
        return id;
    },
    revokeObjectURL: (url: string) => {
        blobStore.delete(url);
    }
};

// Mock FileReader
(global as any).FileReader = class FileReader {
    onloadend: (() => void) | null = null;
    result: string | null = null;
    readAsDataURL(blob: Blob) {
        const buffer = (blob as any)._buffer;
        const base64 = buffer.toString('base64');
        this.result = `data:${blob.type};base64,${base64}`;
        if (this.onloadend) this.onloadend();
    }
};

// Mock OffscreenCanvas
(global as any).OffscreenCanvas = class OffscreenCanvas {
    width: number;
    height: number;
    private _canvas: any;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this._canvas = createCanvas(width, height);
    }
    getContext(type: string, options?: any) {
        return this._canvas.getContext(type, options);
    }
    convertToBlob(options?: any) {
        return Promise.resolve(new (global as any).Blob([this._canvas.toBuffer('image/png')]));
    }
};

// Patch Canvas 2D Context to accept our MockImage
// We perform this patch on the node-canvas Context prototype
const dummyCanvas = createCanvas(1, 1);
const dummyCtx = dummyCanvas.getContext('2d');
const ContextProto = Object.getPrototypeOf(dummyCtx);
const _drawImage = ContextProto.drawImage;

ContextProto.drawImage = function (image: any, ...args: any[]) {
    if (image instanceof (global as any).Image && image._img) {
        // Unwrap the underlying canvas Image
        return _drawImage.apply(this, [image._img, ...args]);
    }
    return _drawImage.apply(this, [image, ...args]);
};

// Mock Image
(global as any).Image = class Image {
    width: number = 0;
    height: number = 0;
    naturalWidth: number = 0;
    naturalHeight: number = 0;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    public _img: any = null;
    private _src: string = '';

    constructor() { }

    set src(value: string) {
        this._src = value;
        const processLoad = async () => {
            try {
                let loadable: string | Buffer = value;
                if (value.startsWith('blob:mock-')) {
                    const buf = blobStore.get(value);
                    if (buf) loadable = buf;
                    else throw new Error(`Blob URL not found: ${value}`);
                }
                const img = await loadImage(loadable);
                this._img = img;
                this.width = img.width;
                this.height = img.height;
                this.naturalWidth = img.width;
                this.naturalHeight = img.height;
                (this as any).complete = true;
                if (this.onload) this.onload();
            } catch (err) {
                console.warn(`[MockImage] Load error:`, err);
                if (this.onerror) this.onerror();
            }
        };
        processLoad();
    }
    get src() { return this._src; }
};

import { PptxToPdfConverterCanvas } from './lib/pptx-converter-canvas';

async function runConversion() {
    const inputPath = "C:\\Users\\dear_\\Downloads\\Blue White Modern Illustration Workspace Project Presentation_20251112_132351_0000.pptx";
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(process.cwd(), `${baseName}.pdf`);

    console.log(`Converting: ${inputPath}`);

    if (!fs.existsSync(inputPath)) {
        console.error("Input file not found!");
        return;
    }

    const buffer = fs.readFileSync(inputPath);
    const file = new File([buffer], path.basename(inputPath), {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    });

    const converter = new PptxToPdfConverterCanvas();

    try {
        const pdfBlob = await converter.convert(file);
        const outputBuffer = Buffer.from((pdfBlob as any)._buffer);

        fs.writeFileSync(outputPath, outputBuffer);
        console.log(`Success! Saved to: ${outputPath}`);
        console.log(`Size: ${outputBuffer.length} bytes`);
    } catch (e) {
        console.error("Conversion failed:", e);
    }
}

runConversion();
