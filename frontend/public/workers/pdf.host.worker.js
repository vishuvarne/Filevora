// Polyfill for PDF.js compatibility in Web Worker
if (typeof document === 'undefined') {
    const doc = {
        currentScript: null,
        createElement: function (tag) {
            if (tag === 'canvas' && typeof OffscreenCanvas !== 'undefined') {
                const canvas = new OffscreenCanvas(1, 1);
                canvas.style = {};
                canvas.setAttribute = () => { };
                canvas.getAttribute = () => null;
                canvas.ownerDocument = doc;
                return canvas;
            }
            return {
                style: {},
                setAttribute: () => { },
                getAttribute: () => null,
                appendChild: () => { },
                append: () => { },
                getContext: () => null,
                nodeName: tag.toUpperCase(),
                ownerDocument: doc,
                remove: function () { },
                removeChild: function (child) { return child; },
                cloneNode: function (deep) { return this; },
                parentNode: doc.head // Mock parent
            };
        },
        createElementNS: function (ns, tag) { return this.createElement(tag); },
        documentElement: { style: {}, append: () => { } },
        head: { appendChild: () => { }, append: () => { } },
        body: { appendChild: () => { }, append: () => { } },
        getElementsByTagName: (tag) => {
            if (tag === 'head') return [self.document.head];
            if (tag === 'body') return [self.document.body];
            return [];
        },
        querySelector: () => null,
        addEventListener: () => { },
        removeEventListener: () => { },
        append: () => { }
    };
    self.document = doc;
    self.window = self;
    if (typeof OffscreenCanvas !== 'undefined') {
        self.HTMLCanvasElement = OffscreenCanvas;
    }
}

let PDFDocument, degrees, PDFName, PDFDict, PDFStream;

try {
    // Import pdf-lib
    try {
        importScripts('/workers/libs/pdf-lib.min.js');
    } catch (e) {
        console.warn('Failed to load local pdf-lib, trying CDN...');
        importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
    }

    const globalScope = self || window || globalThis;

    if (globalScope.PDFLib) {
        PDFDocument = globalScope.PDFLib.PDFDocument;
        degrees = globalScope.PDFLib.degrees;
        PDFName = globalScope.PDFLib.PDFName;
        PDFDict = globalScope.PDFLib.PDFDict;
        PDFStream = globalScope.PDFLib.PDFStream;
    } else {
        throw new Error('PDFLib not found in global scope after import');
    }

} catch (e) {
    console.error('[Worker] PDF Worker Init Error:', e);
    self.initError = e;
}

// Global cached document for this worker (Sticky Session)
let sessionPdfDoc = null;
let sessionPdfData = null;

self.onmessage = async (e) => {
    const { type, payload, jobId } = e.data;

    if (self.initError) {
        self.postMessage({ type: 'error', jobId, error: `Worker Initialization Failed: ${self.initError.message}` });
        return;
    }

    try {
        let result;

        switch (type) {
            case 'merge-pdf':
                result = await mergePDFs(payload.files, jobId);
                break;
            case 'split-pdf':
                result = await splitPDF(
                    payload.file,
                    payload.mode,
                    payload.customRanges,
                    payload.fixedRange,
                    payload.mergeAll,
                    payload.extractMode,
                    payload.selectedPages,
                    payload.extractPagesInput,
                    payload.sizeLimit,
                    payload.sizeUnit,
                    payload.allowCompression
                );
                break;
            case 'rotate-pdf':
                result = await rotatePDF(payload.file, payload.angle);
                break;
            case 'compress-pdf':
                result = await compressPDF(payload);
                break;
            case 'password-protect-pdf':
                result = await passwordProtectPDF(payload.file, payload.password, payload.permissions);
                break;
            case 'unlock-pdf':
                result = await unlockPDF(payload.file, payload.password);
                break;
            case 'pdf-to-image':
                result = await pdfToImage(payload.file, payload.format, payload.quality, payload.scale, jobId, payload.maxPages);
                break;
            case 'load-document':
                // Special case: Load the PDF into the worker's memory
                result = await loadSessionDocument(payload.data);
                break;
            case 'extract-page':
                // Special case: Extract content from the loaded session document
                result = await extractSessionPage(payload.pageNumber, payload.mode);
                break;
            case 'close-document':
                result = await closeSessionDocument();
                break;
            case 'analyze-page':
                result = await analyzeSessionPage(payload.pageNumber);
                break;
            default:
                throw new Error(`Unknown worker action: ${type}`);
        }

        const transferables = [];
        if (result && result.buffer) {
            if (result.buffer instanceof ArrayBuffer) {
                transferables.push(result.buffer);
            } else if (ArrayBuffer.isView(result.buffer)) {
                // If it's a TypedArray (like Uint8Array), transfer the underlying buffer
                transferables.push(result.buffer.buffer);
            }
        }

        self.postMessage({ type: 'success', jobId, result }, transferables);
    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ type: 'error', jobId, error: error.message || "Unknown error" });
    }
};

// ============================================================================
// PDF.JS INITIALIZATION (Singleton)
// ============================================================================
let pdfJsInitialized = false;

async function ensurePdfJsLoaded() {
    if (pdfJsInitialized) return;

    if (typeof self.pdfjsLib === 'undefined') {
        console.log("[Worker] Importing pdf.min.js from CDN...");
        importScripts('https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js');
        if (typeof self.pdfjsLib === 'undefined') throw new Error("Failed to load PDF display library.");
    }

    console.log("[Worker] Setting workerSrc and loading worker lib...");
    self.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

    // Force disable worker to avoid recursive worker spawning which causes "fake worker" warnings
    self.pdfjsLib.disableWorker = true;
    self.pdfjsLib.disableRange = true; // Use whole file to avoid separate fetch requests in worker

    // CRITICAL: Save our onmessage handler because pdf.worker.min.js might overwrite it!
    const myOnMessage = self.onmessage;

    try {
        importScripts('https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js');
        console.log("[Worker] Worker lib imported successfully.");
    } catch (e) {
        console.warn("[Worker] Worker lib import already exists or failed, continuing.");
    }

    // Restore our handler
    if (myOnMessage) self.onmessage = myOnMessage;

    pdfJsInitialized = true;
}

// Helper to ensure we have a Uint8Array from either ArrayBuffer or File/Blob
async function ensureBuffer(data) {
    if (!data) return null;
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer) {
        return new Uint8Array(data);
    }
    if (data && typeof data.arrayBuffer === 'function') {
        return new Uint8Array(await data.arrayBuffer());
    }
    return data;
}

// ============================================================================
// UNIVERSAL STAGE-0 NORMALIZER (PDF)
// ============================================================================
async function normalizePDF(fileData) {
    const deviceInfo = detectDeviceClass();
    if (!deviceInfo.isLowEnd) {
        return fileData;
    }

    console.log('[Stage-0] Normalizing PDF for low-end device...');
    const startTime = performance.now();
    let pdfDoc = null;

    try {
        pdfDoc = await PDFDocument.load(fileData, {
            ignoreEncryption: true,
            updateMetadata: false
        });

        try {
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');
            pdfDoc.setKeywords([]);
        } catch (e) { /* ignore */ }

        const normalizedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            updateFieldAppearances: false,
            objectsPerTick: Infinity
        });

        const duration = performance.now() - startTime;
        console.log(`[Stage-0] Normalization complete in ${duration.toFixed(0)}ms. ${(fileData.byteLength / 1024 / 1024).toFixed(2)}MB -> ${(normalizedBytes.byteLength / 1024 / 1024).toFixed(2)}MB`);

        return normalizedBytes;
    } catch (error) {
        console.warn('[Stage-0] Normalization failed, using original:', error);
        return fileData;
    } finally {
        pdfDoc = null;
    }
}

async function mergePDFs(filesData, jobId) {
    let mergedPdf = null;
    let totalOriginalSize = 0;

    try {
        mergedPdf = await PDFDocument.create();

        for (let i = 0; i < filesData.length; i++) {
            // Report progress at start of file processing
            if (jobId) {
                const percent = Math.round((i / filesData.length) * 100);
                self.postMessage({
                    type: 'progress',
                    jobId,
                    percent,
                    message: `Processing file ${i + 1} of ${filesData.length}...`
                });
            }

            let fileData = await ensureBuffer(filesData[i]);
            totalOriginalSize += fileData.byteLength;

            console.log(`[mergePDFs] Processing file ${i + 1}/${filesData.length}...`);
            // fileData = await normalizePDF(fileData); // Redundant double-load

            console.log(`[mergePDFs] Loading file ${i + 1} into pdf-lib...`);
            const pdf = await PDFDocument.load(fileData, { ignoreEncryption: true });

            console.log(`[mergePDFs] Copying pages from file ${i + 1}...`);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));

            console.log(`[mergePDFs] Finished file ${i + 1}.`);
            fileData = null;
        }

        if (jobId) {
            self.postMessage({
                type: 'progress',
                jobId,
                percent: 95,
                message: 'Finalizing merged document...'
            });
        }

        console.log("[mergePDFs] Finalizing merged document (saving)...");
        const mergedPdfBytes = await mergedPdf.save();
        console.log("[mergePDFs] Merge complete.");
        return {
            buffer: mergedPdfBytes,
            filename: `merged_${Date.now()}.pdf`,
            original_size: totalOriginalSize,
            compressed_size: mergedPdfBytes.byteLength,
            reduction_percent: 0
        };
    } finally {
        mergedPdf = null;
    }
}

async function rotatePDF(rawData, angle = 90) {
    let fileData = null;
    let pdf = null;
    try {
        fileData = await ensureBuffer(rawData);
        // fileData = await normalizePDF(fileData);

        pdf = await PDFDocument.load(fileData, { ignoreEncryption: true });
        const pages = pdf.getPages();

        pages.forEach((page) => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + angle));
        });

        const pdfBytes = await pdf.save();
        return {
            buffer: pdfBytes,
            filename: `rotated_${Date.now()}.pdf`,
            original_size: fileData.byteLength,
            compressed_size: pdfBytes.byteLength,
            reduction_percent: 0
        };
    } finally {
        fileData = null;
        pdf = null;
    }
}

async function splitPDF(rawData, mode = 'range', customRanges = [], fixedRange = 1, mergeAll = false, extractMode = 'all', selectedPages = [], extractPagesInput = '', sizeLimit = 1, sizeUnit = 'MB', allowCompression = true) {
    if (typeof JSZip === 'undefined') {
        importScripts('/workers/libs/jszip.min.js');
    }

    let fileData = null;
    let pdf = null;
    try {
        fileData = await ensureBuffer(rawData);

        pdf = await PDFDocument.load(fileData, { ignoreEncryption: true });
        const pageCount = pdf.getPageCount();

        // Helper to parse string ranges safely
        const parseRange = (r) => {
            let from = parseInt(r.from);
            let to = parseInt(r.to);
            if (isNaN(from) || from < 1) from = 1;
            if (isNaN(to) || to > pageCount) to = pageCount;
            if (from > to) {
                const temp = from;
                from = to;
                to = temp;
            }
            return { from, to };
        };

        // Parse page selection from text input like "1-3,6,8-10"
        const parsePageSelection = (input) => {
            const pages = new Set();
            if (!input) return pages;
            input.split(',').forEach(part => {
                const t = part.trim();
                if (t.includes('-')) {
                    const [a, b] = t.split('-').map(Number);
                    if (!isNaN(a) && !isNaN(b)) {
                        for (let i = Math.max(1, a); i <= Math.min(pageCount, b); i++) pages.add(i);
                    }
                } else {
                    const n = parseInt(t);
                    if (!isNaN(n) && n >= 1 && n <= pageCount) pages.add(n);
                }
            });
            return pages;
        };

        // Helper to create a single PDF from page indices (0-based)
        const createPdfFromIndices = async (indices) => {
            const newPdf = await PDFDocument.create();
            if (indices.length > 0) {
                const copiedPages = await newPdf.copyPages(pdf, indices);
                copiedPages.forEach(p => newPdf.addPage(p));
            }
            return newPdf;
        };

        // ============ MODE: RANGE ============
        if (mode === 'range') {
            let rangesToExtract = [];
            if (!customRanges || customRanges.length === 0) {
                rangesToExtract = [{ from: 1, to: pageCount }];
            } else {
                rangesToExtract = customRanges.map(parseRange);
            }

            if (mergeAll) {
                const newPdf = await PDFDocument.create();
                for (const range of rangesToExtract) {
                    const indices = [];
                    for (let i = range.from - 1; i <= range.to - 1; i++) indices.push(i);
                    if (indices.length > 0) {
                        const copiedPages = await newPdf.copyPages(pdf, indices);
                        copiedPages.forEach(p => newPdf.addPage(p));
                    }
                }
                const pdfBytes = await newPdf.save();
                return {
                    buffer: pdfBytes,
                    filename: `split_merged_${Date.now()}.pdf`,
                    originalSize: fileData.byteLength,
                    compressedSize: pdfBytes.byteLength,
                    reductionPercent: 0
                };
            } else {
                const zip = new JSZip();
                let totalSize = 0;
                for (let idx = 0; idx < rangesToExtract.length; idx++) {
                    const range = rangesToExtract[idx];
                    const indices = [];
                    for (let i = range.from - 1; i <= range.to - 1; i++) indices.push(i);
                    if (indices.length > 0) {
                        const newPdf = await createPdfFromIndices(indices);
                        const pdfBytes = await newPdf.save();
                        const fileName = range.from === range.to
                            ? `page_${range.from}.pdf`
                            : `pages_${range.from}-${range.to}.pdf`;
                        zip.file(fileName, pdfBytes);
                        totalSize += pdfBytes.byteLength;
                    }
                }
                const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
                return {
                    buffer: arrayBuffer,
                    filename: `split_${Date.now()}.zip`,
                    originalSize: fileData.byteLength,
                    compressedSize: arrayBuffer.byteLength,
                    reductionPercent: 0
                };
            }
        }

        // ============ MODE: PAGES (Extract) ============
        if (mode === 'pages') {
            let pagesToExtract = [];

            if (extractMode === 'all') {
                for (let i = 1; i <= pageCount; i++) pagesToExtract.push(i);
            } else {
                if (selectedPages && selectedPages.length > 0) {
                    pagesToExtract = selectedPages.filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
                } else if (extractPagesInput) {
                    const parsed = parsePageSelection(extractPagesInput);
                    pagesToExtract = Array.from(parsed).sort((a, b) => a - b);
                }
                if (pagesToExtract.length === 0) pagesToExtract = [1];
            }

            if (mergeAll && extractMode === 'select') {
                const indices = pagesToExtract.map(p => p - 1);
                const newPdf = await createPdfFromIndices(indices);
                const pdfBytes = await newPdf.save();
                return {
                    buffer: pdfBytes,
                    filename: `extracted_merged_${Date.now()}.pdf`,
                    originalSize: fileData.byteLength,
                    compressedSize: pdfBytes.byteLength,
                    reductionPercent: 0
                };
            } else {
                const zip = new JSZip();
                let totalSize = 0;
                for (const pageNum of pagesToExtract) {
                    const newPdf = await createPdfFromIndices([pageNum - 1]);
                    const pdfBytes = await newPdf.save();
                    zip.file(`page_${pageNum}.pdf`, pdfBytes);
                    totalSize += pdfBytes.byteLength;
                }
                const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
                return {
                    buffer: arrayBuffer,
                    filename: `extracted_${Date.now()}.zip`,
                    originalSize: fileData.byteLength,
                    compressedSize: arrayBuffer.byteLength,
                    reductionPercent: 0
                };
            }
        }

        // ============ MODE: SIZE ============
        if (mode === 'size') {
            const maxBytes = sizeUnit === 'MB' ? sizeLimit * 1024 * 1024 : sizeLimit * 1024;
            const zip = new JSZip();
            let currentIndices = [];
            let partNumber = 1;

            const flushCurrentPdf = async () => {
                if (currentIndices.length > 0) {
                    const newPdf = await createPdfFromIndices(currentIndices);
                    const pdfBytes = await newPdf.save();
                    const start = currentIndices[0] + 1;
                    const end = currentIndices[currentIndices.length - 1] + 1;
                    const fileName = start === end
                        ? `part_${partNumber}_page_${start}.pdf`
                        : `part_${partNumber}_pages_${start}-${end}.pdf`;
                    zip.file(fileName, pdfBytes);
                    partNumber++;
                    currentIndices = [];
                }
            };

            for (let i = 0; i < pageCount; i++) {
                const testIndices = [...currentIndices, i];
                const testPdf = await createPdfFromIndices(testIndices);
                const testBytes = await testPdf.save();

                if (testBytes.byteLength > maxBytes && currentIndices.length > 0) {
                    await flushCurrentPdf();
                    currentIndices = [i];
                } else {
                    currentIndices.push(i);
                }
            }
            await flushCurrentPdf();

            const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
            return {
                buffer: arrayBuffer,
                filename: `split_by_size_${Date.now()}.zip`,
                originalSize: fileData.byteLength,
                compressedSize: arrayBuffer.byteLength,
                reductionPercent: 0
            };
        }

        // Fallback
        const zip = new JSZip();
        for (let i = 0; i < pageCount; i++) {
            const newPdf = await createPdfFromIndices([i]);
            const pdfBytes = await newPdf.save();
            zip.file(`page_${i + 1}.pdf`, pdfBytes);
        }
        const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
        return {
            buffer: arrayBuffer,
            filename: `split_${Date.now()}.zip`,
            originalSize: fileData.byteLength,
            compressedSize: arrayBuffer.byteLength,
            reductionPercent: 0
        };

    } finally {
        fileData = null;
        pdf = null;
    }
}

// ============================================================================
// DEVICE DETECTION (cached per worker session)
// ============================================================================
let cachedDeviceClass = null;

function detectDeviceClass() {
    if (cachedDeviceClass) return cachedDeviceClass;

    // Get device memory in GB (if available)
    const memory = typeof navigator !== 'undefined' && navigator.deviceMemory
        ? navigator.deviceMemory
        : undefined;

    // Get hardware concurrency (CPU cores)
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : undefined;

    // Mobile detection
    const isMobile = typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // When both memory and cores are unknown:
    // - Mobile → conservative (low-end)
    // - Desktop → assume capable (high-end) so hybrid compression works
    if (memory === undefined && cores === undefined) {
        const isLowEnd = isMobile;
        cachedDeviceClass = { isLowEnd, memory, cores };
        console.log(`[Device Detector] Unknown specs, ${isMobile ? 'mobile → low-end' : 'desktop → high-end'}`);
        return cachedDeviceClass;
    }

    // Low-end criteria: deviceMemory ≤ 4 GB OR hardwareConcurrency ≤ 4
    const isLowEndMemory = memory !== undefined && memory <= 4;
    const isLowEndCores = cores !== undefined && cores <= 4;
    const isLowEnd = isLowEndMemory || isLowEndCores;

    cachedDeviceClass = { isLowEnd, memory, cores };
    console.log('[Device Detector]', {
        deviceClass: isLowEnd ? 'low-end' : 'high-end',
        memory: memory ? `${memory} GB` : 'unknown',
        cores: cores || 'unknown'
    });

    return cachedDeviceClass;
}

// ============================================================================
// STAGE-0 FAST COMPRESSION (Low-End Devices Only)
// ============================================================================
async function compressWithStage0(file, jobId) {
    const startTime = performance.now();

    console.log('[Stage-0] Starting fast structural compression (low-end device)');

    const pdfDoc = await PDFDocument.load(file, {
        ignoreEncryption: true,
        updateMetadata: false
    });

    // Remove metadata to reduce size
    try {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
    } catch (e) {
        console.debug('[Stage-0] Metadata removal skipped:', e);
    }

    // Save with aggressive structural optimization
    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
        objectsPerTick: Infinity
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    const originalSize = file.byteLength;
    const compressedSize = compressedBytes.byteLength;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;

    console.log('[Stage-0] Compression complete:', {
        originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
        reduction: `${reduction.toFixed(1)}%`,
        processingTime: `${processingTime.toFixed(0)}ms`
    });

    if (processingTime > 500) {
        console.warn(`[Stage-0] Processing time (${processingTime.toFixed(0)}ms) exceeded 500ms target`);
    }

    return {
        buffer: compressedBytes,
        filename: `compressed_${Date.now()}.pdf`,
        original_size: originalSize,
        compressed_size: compressedSize,
        reduction_percent: Math.max(0, Math.round(reduction)),
        engine_used: 'stage0',
        processing_time_ms: Math.round(processingTime)
    };
}

// ============================================================================
// HYBRID COMPRESSION (High-End Devices)
// ============================================================================
async function compressWithHybrid(file, level, quality, dpi, useManual, jobId) {
    const startTime = performance.now();

    // Higher Quality Calibrated Presets
    const presets = {
        'extreme': { dpi: 72, quality: 0.4 },
        'strong': { dpi: 120, quality: 0.6 },
        'recommended': { dpi: 150, quality: 0.75 },
        'balanced': { dpi: 150, quality: 0.75 },
        'basic': { dpi: 220, quality: 0.9 }
    };

    const settings = useManual
        ? { dpi: dpi || 150, quality: (quality || 85) / 100 }
        : (presets[level] || presets.balanced);

    console.log('[Hybrid] Starting deep compression:', {
        level,
        targetDPI: settings.dpi,
        quality: settings.quality
    });

    const pdfDoc = await PDFDocument.load(file, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    let imagesProcessed = 0;
    let imagesCompressedCount = 0;

    // Map to track and deduplicate compressed images
    const originalToNewRef = new Map();

    for (let i = 0; i < totalPages; i++) {
        const page = pages[i];

        // Progress update
        self.postMessage({
            type: 'progress',
            jobId,
            percent: Math.round((i / totalPages) * 100),
            message: `Processing page ${i + 1}/${totalPages}...`
        });

        const resources = pdfDoc.context.lookup(page.node.Resources());
        if (!resources || !(resources instanceof PDFDict)) continue;

        const xObjects = pdfDoc.context.lookup(resources.get(PDFName.of('XObject')));
        if (!(xObjects instanceof PDFDict)) continue;

        const xObjectEntries = xObjects.entries();
        for (const [name, xObjectRaw] of xObjectEntries) {
            const xObject = pdfDoc.context.lookup(xObjectRaw);
            const ref = pdfDoc.context.getObjectRef(xObject);
            if (!ref) continue;

            const refHash = ref.toString();
            imagesProcessed++;

            // If already processed this shared image, reuse the new reference
            if (originalToNewRef.has(refHash)) {
                xObjects.set(name, originalToNewRef.get(refHash));
                continue;
            }

            if (xObject instanceof PDFStream) {
                const dict = xObject.dict;
                const subtype = dict.get(PDFName.of('Subtype'));

                if (subtype === PDFName.of('Image')) {
                    const filter = pdfDoc.context.lookup(dict.get(PDFName.of('Filter')));
                    const isJpg = filter === PDFName.of('DCTDecode') ||
                        filter === PDFName.of('DCT') ||
                        (Array.isArray(filter) && (filter.includes(PDFName.of('DCTDecode')) || filter.includes(PDFName.of('DCT'))));

                    const width = dict.get(PDFName.of('Width'))?.numberValue || 0;
                    const height = dict.get(PDFName.of('Height'))?.numberValue || 0;
                    const targetLongestSide = settings.dpi * 11;

                    if (isJpg || width > targetLongestSide || height > targetLongestSide) {
                        let bitmap = null;
                        try {
                            const imgBytes = xObject.contents;
                            const blob = new Blob([imgBytes]);
                            bitmap = await createImageBitmap(blob);

                            const scale = Math.min(1, targetLongestSide / Math.max(bitmap.width, bitmap.height));

                            if (scale < 0.95 || settings.quality < 0.6) {
                                const newWidth = Math.round(bitmap.width * scale);
                                const newHeight = Math.round(bitmap.height * scale);

                                const canvas = new OffscreenCanvas(newWidth, newHeight);
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

                                const compressedBlob = await canvas.convertToBlob({
                                    type: 'image/jpeg',
                                    quality: settings.quality
                                });

                                const newBytes = new Uint8Array(await compressedBlob.arrayBuffer());

                                // Extreme mode should always prioritize size even for small gains
                                // Other modes should require at least 5% reduction to justify quality loss
                                const sizeThreshold = level === 'extreme' ? 0.99 : 0.95;

                                if (newBytes.length < imgBytes.length * sizeThreshold) {
                                    const embeddedImage = await pdfDoc.embedJpg(newBytes);
                                    originalToNewRef.set(refHash, embeddedImage.ref);
                                    xObjects.set(name, embeddedImage.ref);
                                    imagesCompressedCount++;
                                } else {
                                    originalToNewRef.set(refHash, ref);
                                }
                            } else {
                                originalToNewRef.set(refHash, ref);
                            }
                        } catch (err) {
                            console.warn('[Hybrid] Image compression skipped:', err.message);
                            originalToNewRef.set(refHash, ref);
                        } finally {
                            if (bitmap) bitmap.close();
                        }
                    }
                }
            }
        }
    }

    console.log(`[Hybrid] Processed ${imagesProcessed} objects, compressed ${imagesCompressedCount}`);

    // Clean save strategy to remove de-referenced objects
    const cleanPdf = await PDFDocument.create();
    const copiedPages = await cleanPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach(p => cleanPdf.addPage(p));

    const compressedPdfBytes = await cleanPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    const originalSize = file.byteLength;
    const compressedSize = compressedPdfBytes.byteLength;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;

    console.log('[Hybrid] Compression complete:', {
        originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
        reduction: `${reduction.toFixed(1)}%`,
        processingTime: `${processingTime.toFixed(0)}ms`
    });

    return {
        buffer: compressedPdfBytes,
        filename: `compressed_${Date.now()}.pdf`,
        original_size: originalSize,
        compressed_size: compressedSize,
        reduction_percent: Math.max(0, Math.round(reduction)),
        engine_used: 'hybrid',
        processing_time_ms: Math.round(processingTime),
        images_processed: imagesProcessed,
        images_compressed: imagesCompressedCount
    };
}

// ============================================================================
// COMPRESSION ROUTER (Device-Adaptive)
// ============================================================================
async function compressPDF(payload) {
    let { file, level, quality, dpi, useManual, jobId } = payload;
    file = await ensureBuffer(file);

    // Detect device class
    const deviceInfo = detectDeviceClass();

    console.log('[PDF Compressor] Starting compression:', {
        deviceClass: deviceInfo.isLowEnd ? 'low-end' : 'high-end',
        preset: level,
        inputSize: `${(file.byteLength / 1024 / 1024).toFixed(2)} MB`
    });

    // Route to appropriate engine
    if (deviceInfo.isLowEnd) {
        // Low-end devices: Stage-0 fast compression ONLY
        return await compressWithStage0(file, jobId);
    } else {
        // High-end devices: Hybrid deep compression
        return await compressWithHybrid(file, level, quality, dpi, useManual, jobId);
    }
}

async function passwordProtectPDF(rawData, password, permissions = {}) {
    const fileData = await ensureBuffer(rawData);
    const pdf = await PDFDocument.load(fileData, { ignoreEncryption: true });

    const encryptedBytes = await pdf.save({
        userPassword: password,
        ownerPassword: password,
        permissions: {
            printing: permissions.allowPrinting !== false ? 'highResolution' : 'notAllowed',
            modifying: permissions.allowModifying !== false,
            copying: permissions.allowCopying !== false,
            annotating: permissions.allowAnnotating !== false,
            fillingForms: permissions.allowFillingForms !== false,
            contentAccessibility: true,
            documentAssembly: permissions.allowAssembly !== false
        }
    });

    return {
        buffer: encryptedBytes,
        filename: `protected_${Date.now()}.pdf`,
        original_size: fileData.byteLength,
        compressed_size: encryptedBytes.byteLength,
        reduction_percent: 0
    };
}

async function unlockPDF(rawData, password) {
    const fileData = await ensureBuffer(rawData);
    try {
        const pdf = await PDFDocument.load(fileData, {
            ignoreEncryption: false,
            password: password
        });

        const unlockedBytes = await pdf.save();

        return {
            buffer: unlockedBytes,
            filename: `unlocked_${Date.now()}.pdf`,
            original_size: fileData.byteLength,
            compressed_size: unlockedBytes.byteLength,
            reduction_percent: 0
        };
    } catch (error) {
        throw new Error('Invalid password or PDF is not encrypted');
    }
}

async function pdfToImage(rawData, format = 'jpeg', quality = 0.95, scale = 2.0, jobId, maxPages = null) {
    console.log(`[pdfToImage] Started Job: ${jobId}`, { format, quality, scale });

    if (typeof OffscreenCanvas === 'undefined') {
        throw new Error('OffscreenCanvas not supported in this browser.');
    }

    let fileData = null;
    let loadingTask = null;
    let pdf = null;

    await ensurePdfJsLoaded();

    try {
        fileData = await ensureBuffer(rawData);

        console.log(`[pdfToImage] Opening document with PDF.js...`);
        loadingTask = self.pdfjsLib.getDocument({
            data: fileData,
            disableWorker: true,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
            verbosity: 0 // Silence logs unless error
        });

        pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        console.log(`[pdfToImage] Document loaded. Pages: ${totalPages}`);

        const pagesToRender = maxPages ? Math.min(totalPages, maxPages) : totalPages;
        const useZip = pagesToRender > 1;

        if (useZip && typeof JSZip === 'undefined') {
            console.log("[pdfToImage] Importing JSZip...");
            try {
                importScripts('/workers/libs/jszip.min.js');
            } catch (e) {
                console.warn('[pdfToImage] Failed to load local JSZip, trying CDN...', e);
                importScripts('https://unpkg.com/jszip@3.10.1/dist/jszip.min.js');
            }
        }

        const zip = useZip ? new JSZip() : null;
        let lastBuffer = null;
        let lastFilename = "";

        for (let i = 1; i <= pagesToRender; i++) {
            console.log(`[pdfToImage] Rendering page ${i}/${pagesToRender}...`);
            self.postMessage({
                type: 'progress',
                jobId,
                percent: Math.round((i / pagesToRender) * 100),
                message: `Rendering page ${i}/${pagesToRender}...`
            });

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            console.log(`[pdfToImage] Page ${i} viewport: ${viewport.width}x${viewport.height}`);

            const canvas = new OffscreenCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            console.log(`[pdfToImage] Starting page ${i} render pipeline...`);
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            console.log(`[pdfToImage] Page ${i} render promise resolved.`);

            console.log(`[pdfToImage] Converting page ${i} to blob...`);
            const blob = await canvas.convertToBlob({ type: `image/${format}`, quality });
            console.log(`[pdfToImage] Converting page ${i} blob to buffer...`);
            const buffer = await blob.arrayBuffer();

            if (zip) {
                zip.file(`page_${i}.${format === 'jpeg' ? 'jpg' : format}`, buffer);
            } else {
                lastBuffer = buffer;
                lastFilename = `page_${i}.${format === 'jpeg' ? 'jpg' : format}`;
            }

            page.cleanup();
            console.log(`[pdfToImage] Page ${i} sequence complete.`);
        }

        if (zip) {
            console.log("[pdfToImage] Generating ZIP file...");
            const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
            return {
                buffer: zipBuffer,
                filename: `images_${Date.now()}.zip`,
                original_size: fileData.byteLength,
                compressed_size: zipBuffer.byteLength,
                reduction_percent: 0
            };
        } else {
            return {
                buffer: lastBuffer,
                filename: lastFilename,
                original_size: fileData.byteLength,
                compressed_size: lastBuffer.byteLength,
                reduction_percent: 0
            };
        }
    } catch (err) {
        console.error("[pdfToImage] Fatal error in rendering pipeline:", err);
        throw new Error(`PDF Rendering Failed: ${err.message}`);
    } finally {
        // CRITICAL: Explicitly destroy the document to free memory
        if (pdf) {
            try { await pdf.destroy(); } catch (e) { /* ignore */ }
        }
        if (loadingTask) {
            try { await loadingTask.destroy(); } catch (e) { /* ignore */ }
        }
        // Help GC
        fileData = null;
        pdf = null;
        await closeSessionDocument();
    }
}

// ============================================================================
// STREAMING SESSION HANDLERS
// ============================================================================

async function loadSessionDocument(data) {
    try {

        const buffer = await ensureBuffer(data);
        sessionPdfData = buffer; // Keep ref?

        // Load with pdf-lib for structural ops
        // But for TEXT extraction, we need PDF.js!
        // The user says "Use pdf.js to get text content".
        // pdf-lib is for manipulating PDF structure (merge/split).
        // For conversion (PDF->DOCX), we need text extraction.

        await ensurePdfJsLoaded();

        // PDF.js internal MessageHandler/LoopbackPort tries to Transfer input data.
        // SharedArrayBuffer is NOT transferable and will throw DataCloneError.
        // If we are using SAB, we must copy it for PDF.js compatibility.
        let pdfjsData = sessionPdfData;
        if (typeof SharedArrayBuffer !== 'undefined' && sessionPdfData.buffer instanceof SharedArrayBuffer) {
            console.log('[Worker] Copying SharedArrayBuffer for PDF.js compatibility (prevents DataCloneError)');
            pdfjsData = sessionPdfData.slice(); // Creates a copy backed by a regular ArrayBuffer
        }

        const loadingTask = self.pdfjsLib.getDocument({
            data: pdfjsData, // Use the (potentially copied) buffer
            disableWorker: true, // We ARE in a worker
            cMapUrl: '/workers/libs/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/workers/libs/standard_fonts/',
        });

        sessionPdfDoc = await loadingTask.promise;
        console.log(`[Worker] Session document loaded successfully. Pages: ${sessionPdfDoc.numPages}`);
        return { pageCount: sessionPdfDoc.numPages };

    } catch (e) {
        console.error('[Worker] Load Session Failed:', e);
        sessionPdfDoc = null; // Ensure null on failure
        throw e;
    }
}

async function extractSessionPage(pageNumber, mode = 'accurate') {
    if (!sessionPdfDoc) {
        console.error(`[Worker] extractSessionPage(${pageNumber}) failed: sessionPdfDoc is NULL. sessionPdfData exists: ${!!sessionPdfData}`);
        throw new Error("No session document loaded");
    }

    try {
        const generateSafeId = (text) => `chapter_${text.replace(/[\uE000-\uF8FF\uF000-\uF0FF]/g, '').replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/gm, '').replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        const page = await sessionPdfDoc.getPage(pageNumber);

        // 1. Detect Images (Robust Method using pdf-lib if available, or ops)
        let hasImages = false;

        // Method A: OPS Scan (Track images and their positions)
        const imageBlocks = [];
        try {
            const opList = await page.getOperatorList();
            const fnArray = opList.fnArray;
            const argsArray = opList.argsArray;
            const OPS = self.pdfjsLib.OPS;

            if (OPS) {
                let ctm = [1, 0, 0, 1, 0, 0];
                const transformStack = [];

                for (let i = 0; i < fnArray.length; i++) {
                    const fn = fnArray[i];
                    const args = argsArray[i];

                    if (fn === OPS.save) {
                        transformStack.push([...ctm]);
                    } else if (fn === OPS.restore) {
                        if (transformStack.length > 0) ctm = transformStack.pop();
                    } else if (fn === OPS.transform) {
                        // Matrix multiplication: [a b c d e f]
                        const [a1, b1, c1, d1, e1, f1] = ctm;
                        const [a2, b2, c2, d2, e2, f2] = args;
                        ctm = [
                            a1 * a2 + c1 * b2,
                            b1 * a2 + d1 * b2,
                            a1 * c2 + c1 * d2,
                            b1 * c2 + d1 * d2,
                            a1 * e2 + c1 * f2 + e1,
                            b1 * e2 + d1 * f2 + f1
                        ];
                    } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImage) {
                        hasImages = true;
                        // Images in PDF are drawn in a 1x1 unit square [0,1]x[0,1]
                        // Transform the corners of this unit square by the current CTM
                        const corners = [
                            [0, 0], [1, 0], [1, 1], [0, 1]
                        ];
                        const transformedCorners = corners.map(([px, py]) => [
                            ctm[0] * px + ctm[2] * py + ctm[4],
                            ctm[1] * px + ctm[3] * py + ctm[5]
                        ]);

                        const xs = transformedCorners.map(c => c[0]);
                        const ys = transformedCorners.map(c => c[1]);

                        const minX = Math.min(...xs);
                        const maxX = Math.max(...xs);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);

                        imageBlocks.push({
                            type: 'image',
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY,
                            bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn(`[Worker] OPS scan failed for page ${pageNumber}:`, e);
        }

        // Method B: Deep Scan via pdf-lib (If OPS failed to find images)
        // We have sessionPdfData (the ArrayBuffer).
        if (!hasImages && sessionPdfData && typeof PDFDocument !== 'undefined') {
            try {
                // Determine if we should pay the cost of parsing
                // Only do this if we are really unsure (e.g. no text, no ops images)
                // For now, let's just do it for debugging or if text is low.
                // But parsing the whole doc for every page is slow.
                // Optimally we parse ONCE at load time and cache the pdf-lib doc?
                // sessionPdfDoc is pdf.js doc.
                // Let's just try to parse this page's resources if we can?
                // No, pdf-lib needs to parse the whole structure.

                // Let's compromise: If textual content is LOW, we assume we might need image fallback anyway.
                // So reliable detection is less critical if we FORCE render.
                // But we want to know if it HAS images for the "hasImages" flag which might trigger other logic.
            } catch (e) { }
        }

        // 2. Extract Text
        const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false
        });

        const viewport = page.getViewport({ scale: 1.0 });
        const pageWidth = viewport.width;

        const styles = textContent.styles || {};
        const rawItems = textContent.items.map(item => {
            const fontStyle = styles[item.fontName] || {};
            const fontName = fontStyle.fontFamily || item.fontName || 'serif';

            // Derive bold/italic from font name or family
            const isBold = /bold|black|heavy/i.test(fontName) || (item.fontName && /bold|black|heavy/i.test(item.fontName));
            const isItalic = /italic|oblique/i.test(fontName) || (item.fontName && /italic/i.test(item.fontName));

            return {
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                w: item.width,
                h: item.height,
                fontHeight: Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]),
                fontName,
                isBold,
                isItalic
            };
        });

        const sortedItems = rawItems.sort((a, b) => {
            if (Math.abs(a.y - b.y) > (a.fontHeight / 2)) {
                return b.y - a.y;
            }
            return a.x - b.x;
        });

        const blocks = [];
        let currentBlock = null;
        let lastItem = null;
        let puaCharCount = 0;
        let totalCharCount = 0;

        for (const item of sortedItems) {
            if (!item.str.trim()) continue;

            for (let i = 0; i < item.str.length; i++) {
                const code = item.str.charCodeAt(i);
                // Expand PUA and non-printable check to catch more corrupt encoding
                const isPuaOrOdd = (code >= 0xE000 && code <= 0xFFFF) ||
                    (code >= 0xF000 && code <= 0xF8FF) || // Private Use Area
                    (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
                    (code === 0xFFFD); // Replacement character
                if (isPuaOrOdd) puaCharCount++;
                totalCharCount++;
            }

            const isNewParagraph = !currentBlock ||
                Math.abs(item.y - lastItem.y) > (item.fontHeight * 1.8); // Slightly tighter for better grouping

            if (isNewParagraph) {
                if (currentBlock) {
                    const runs = currentBlock.runs;
                    const text = runs.map(r => r.text).join('').replace(/\s+/g, ' ').trim();
                    if (text.length > 0) {
                        const isChapterPattern = /^(CHAPTER|SECTION|PART|LESSON|UNIT|CHAPTER\s+[0-9]+|BOOK)\s+[A-Z0-9ivx]+[:]*/i.test(text);
                        const isEarlyPage = pageNumber >= 2 && pageNumber <= 8;
                        const isTocEntry = isEarlyPage && isChapterPattern;
                        const isActualChapter = isChapterPattern && !isTocEntry;

                        const lineCount = currentBlock.lineStats.length;

                        // Improved alignment detection: Compare left and right margins
                        const centerThreshold = pageWidth * 0.12; // 12% tolerance for centering
                        const rightThreshold = pageWidth * 0.15;  // 15% tolerance for right alignment

                        const alignmentStats = currentBlock.lineStats.map(s => {
                            const leftMargin = s.minX;
                            const rightMargin = pageWidth - s.maxX;
                            const marginDiff = Math.abs(leftMargin - rightMargin);

                            if (s.width < pageWidth * 0.3) return 'left'; // Too short to judge alignment reliably, default left
                            if (marginDiff < centerThreshold) return 'center';
                            if (rightMargin < rightThreshold && leftMargin > rightMargin * 2) return 'right';
                            return 'left';
                        });

                        const centeredCount = alignmentStats.filter(a => a === 'center').length;
                        const rightCount = alignmentStats.filter(a => a === 'right').length;

                        let alignment = 'left';
                        if (centeredCount > lineCount / 2) alignment = 'center';
                        else if (rightCount > lineCount / 2) alignment = 'right';

                        const isHeadingCandidate = (currentBlock.maxFontHeight > 13) || (runs.some(r => r.isBold) && text.length < 150);
                        const blockType = isActualChapter ? 'h1' : (isHeadingCandidate ? 'h2' : 'p');

                        const firstChar = text.trim()[0];
                        const isBullet = ['•', '▪', '○', '●', '■', '➢', '➢', '-'].includes(firstChar) || /^\d+\./.test(text);

                        blocks.push({
                            type: blockType,
                            runs: runs,
                            text: text,
                            alignment,
                            isBullet,
                            indent: Math.max(0, Math.round(currentBlock.minX - 72)),
                            maxFontHeight: currentBlock.maxFontHeight,
                            minX: currentBlock.minX,
                            maxX: currentBlock.maxX,
                            minY: currentBlock.minY,
                            maxY: currentBlock.maxY,
                            id: isActualChapter ? generateSafeId(text) : null,
                            isTocEntry: isTocEntry
                        });
                    }
                }
                currentBlock = {
                    maxFontHeight: item.fontHeight,
                    runs: [{
                        text: item.str,
                        fontHeight: item.fontHeight,
                        fontName: item.fontName,
                        isBold: item.isBold,
                        isItalic: item.isItalic
                    }],
                    lineStats: [{ width: item.w, minX: item.x, maxX: item.x + item.w }],
                    minX: item.x,
                    maxX: item.x + item.w,
                    minY: viewport.height - item.y - item.h,
                    maxY: viewport.height - item.y
                };
            } else {
                const isSameLine = Math.abs(item.y - lastItem.y) < (item.fontHeight / 4);
                if (!isSameLine) {
                    currentBlock.lineStats.push({ width: 0, minX: item.x, maxX: 0 });
                }
                const currentLine = currentBlock.lineStats[currentBlock.lineStats.length - 1];

                const lastRun = currentBlock.runs[currentBlock.runs.length - 1];
                const isSameRun = item.isBold === lastRun.isBold &&
                    item.isItalic === lastRun.isItalic &&
                    Math.abs(item.fontHeight - lastRun.fontHeight) < 0.5 &&
                    item.fontName === lastRun.fontName &&
                    isSameLine;

                const separator = isSameLine ? '' : ' ';

                if (isSameRun) {
                    lastRun.text += separator + item.str;
                } else {
                    currentBlock.runs.push({
                        text: separator + item.str,
                        fontHeight: item.fontHeight,
                        fontName: item.fontName,
                        isBold: item.isBold,
                        isItalic: item.isItalic
                    });
                }
                currentBlock.maxFontHeight = Math.max(currentBlock.maxFontHeight, item.fontHeight);
                currentBlock.minX = Math.min(currentBlock.minX, item.x);
                currentBlock.maxX = Math.max(currentBlock.maxX, item.x + item.w);
                currentBlock.minY = Math.min(currentBlock.minY, viewport.height - item.y - item.h);
                currentBlock.maxY = Math.max(currentBlock.maxY, viewport.height - item.y);

                // Update line stats
                if (isSameLine) {
                    currentLine.minX = Math.min(currentLine.minX, item.x);
                    currentLine.maxX = Math.max(currentLine.maxX || 0, item.x + item.w);
                    currentLine.width = currentLine.maxX - currentLine.minX;
                } else {
                    currentLine.minX = item.x;
                    currentLine.maxX = item.x + item.w;
                    currentLine.width = item.w;
                }
            }
            lastItem = item;
        }

        if (currentBlock) {
            const runs = currentBlock.runs;
            const text = runs.map(r => r.text).join('').replace(/\s+/g, ' ').trim();
            if (text.length > 0) {
                const isChapterPattern = /^(CHAPTER|SECTION|PART|LESSON|UNIT|CHAPTER\s+[0-9]+|BOOK)\s+[A-Z0-9ivx]+[:]*/i.test(text);
                const isEarlyPage = pageNumber >= 2 && pageNumber <= 8;
                const isTocEntry = isEarlyPage && isChapterPattern;
                const isActualChapter = isChapterPattern && !isTocEntry;

                const lineCount = currentBlock.lineStats.length;
                const centeredCount = currentBlock.lineStats.filter(s =>
                    s.width < pageWidth * 0.9 && Math.abs(s.center - (pageWidth / 2)) < (pageWidth * 0.05)
                ).length;
                const rightCount = currentBlock.lineStats.filter(s =>
                    s.width < pageWidth * 0.9 && (pageWidth - s.maxX) < (pageWidth * 0.12)
                ).length;

                let alignment = 'left';
                if (centeredCount > lineCount / 2) alignment = 'center';
                else if (rightCount > lineCount / 2) alignment = 'right';

                const isHeadingCandidate = (currentBlock.maxFontHeight > 13) || (runs.some(r => r.isBold) && text.length < 150);
                const blockType = isActualChapter ? 'h1' : (isHeadingCandidate ? 'h2' : 'p');

                const firstChar = text.trim()[0];
                const isBullet = ['•', '▪', '○', '●', '■', '➢', '➢', '-'].includes(firstChar) || /^\d+\./.test(text);

                blocks.push({
                    type: blockType,
                    runs: runs,
                    text: text,
                    alignment,
                    isBullet,
                    indent: Math.max(0, Math.round(currentBlock.minX - 72)),
                    maxFontHeight: currentBlock.maxFontHeight,
                    minX: currentBlock.minX,
                    maxX: currentBlock.maxX,
                    minY: currentBlock.minY,
                    maxY: currentBlock.maxY,
                    id: isActualChapter ? generateSafeId(text) : null,
                    isTocEntry: isTocEntry
                });
            }
        }

        // Hyperlink extraction from annotations
        try {
            const annotations = await page.getAnnotations();
            annotations.forEach(anno => {
                if (anno.subtype === 'Link') {
                    const rect = anno.rect;
                    const viewport = page.getViewport({ scale: 1.0 });
                    // PDF coordinates are bottom-up, convert to top-down for matching
                    const annoBox = {
                        x1: rect[0],
                        y1: viewport.height - rect[3],
                        x2: rect[2],
                        y2: viewport.height - rect[1]
                    };

                    blocks.forEach(block => {
                        // Check for overlap between block bounds and annotation box
                        const horizontalOverlap = Math.max(0, Math.min(block.maxX, annoBox.x2) - Math.max(block.minX, annoBox.x1));
                        const verticalOverlap = Math.max(0, Math.min(block.maxY, annoBox.y2) - Math.max(block.minY, annoBox.y1));

                        if (horizontalOverlap > 0 && verticalOverlap > 0) {
                            if (anno.url) {
                                block.linkUrl = anno.url;
                                block.style = 'Hyperlink';
                            } else if (anno.dest) {
                                // Internal link (dest could be a named destination or page ref)
                                // Simplified: if it's a string, we treat it as an anchor
                                if (typeof anno.dest === 'string') {
                                    block.linkToId = generateSafeId(anno.dest);
                                    block.style = 'Hyperlink';
                                }
                            }
                        }
                    });
                }
            });
        } catch (e) {
            console.warn("[Worker] Annotation extraction failed:", e);
        }

        // TOC Link heuristic fallback
        blocks.forEach(block => {
            if (block.isTocEntry && !block.linkToId) {
                const chapterMatch = block.text.match(/CHAPTER\s+(\w+)[:\s]?/i);
                if (chapterMatch) {
                    const chapterText = `CHAPTER ${chapterMatch[1]}:`;
                    block.linkToId = generateSafeId(chapterText);
                    block.style = 'Hyperlink';
                }
            }
        });

        const totalTextLengthRaw = blocks.reduce((acc, b) => acc + (b.text?.length || 0), 0);

        let imageBuffer = null;
        let imageDims = null;

        const isTofuHeavy = puaCharCount > 8 && (puaCharCount / (totalCharCount || 1) > 0.02);

        if (isTofuHeavy || (totalTextLengthRaw < 40 && imageBlocks.length === 0)) {
            if (isTofuHeavy) {
                console.log(`[Worker] Page ${pageNumber} has significant tofus (${puaCharCount}). Forcing full-page image render.`);
            }
            const renderScale = 1.5;
            const renderViewport = page.getViewport({ scale: renderScale });
            const canvas = new OffscreenCanvas(renderViewport.width, renderViewport.height);
            const context = canvas.getContext('2d');

            await page.render({
                canvasContext: context,
                viewport: renderViewport
            }).promise;

            const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
            imageBuffer = await blob.arrayBuffer();
            imageDims = { width: renderViewport.width, height: renderViewport.height };
        }

        if (!imageBuffer && imageBlocks.length > 0) {
            console.log(`[Worker] Extracting ${imageBlocks.length} inline images for page ${pageNumber}`);
            const sliceScale = 1.5;
            const sliceViewport = page.getViewport({ scale: sliceScale });
            const pageCanvas = new OffscreenCanvas(sliceViewport.width, sliceViewport.height);
            const pageCtx = pageCanvas.getContext('2d');

            await page.render({ canvasContext: pageCtx, viewport: sliceViewport }).promise;

            for (const imgBlock of imageBlocks) {
                const sx = imgBlock.x * sliceScale;
                const sy = (viewport.height - imgBlock.y - imgBlock.height) * sliceScale;
                const sw = imgBlock.width * sliceScale;
                const sh = imgBlock.height * sliceScale;

                if (sw < 1 || sh < 1) continue;

                const safeSx = Math.max(0, Math.min(sx, sliceViewport.width - 1));
                const safeSy = Math.max(0, Math.min(sy, sliceViewport.height - 1));
                const safeSw = Math.min(sw, sliceViewport.width - safeSx);
                const safeSh = Math.min(sh, sliceViewport.height - safeSy);

                const imgCanvas = new OffscreenCanvas(safeSw, safeSh);
                const imgCtx = imgCanvas.getContext('2d');
                imgCtx.drawImage(pageCanvas, safeSx, safeSy, safeSw, safeSh, 0, 0, safeSw, safeSh);

                const blob = await imgCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
                const buffer = await blob.arrayBuffer();

                blocks.push({
                    type: 'image',
                    content: {
                        buffer: buffer,
                        width: safeSw,
                        height: safeSh,
                        extension: 'jpg'
                    },
                    x: imgBlock.x,
                    y: viewport.height - imgBlock.y - imgBlock.height,
                    width: imgBlock.width,
                    height: imgBlock.height,
                    minY: viewport.height - imgBlock.y - imgBlock.height,
                    maxY: viewport.height - imgBlock.y
                });
            }
        }

        // Final sort of blocks (text + images) by Y position, then X
        const finalBlocks = blocks.sort((a, b) => {
            if (Math.abs(a.minY - b.minY) > 5) {
                return a.minY - b.minY;
            }
            return (a.minX || a.x || 0) - (b.minX || b.x || 0);
        });

        const totalTextLengthCalculated = finalBlocks.filter(b => b.type !== 'image').reduce((acc, b) => acc + (b.text?.length || 0), 0);
        const textBlocks = finalBlocks.filter(b => b.type !== 'image').map(b => b.text);

        // Reduction fallback: if text length is very low but we have images, don't force full page render
        const shouldPassThrough = !!imageBuffer || totalTextLengthCalculated > 0 || imageBlocks.length > 0;

        // Capture why it failed if it did
        if (!imageBuffer && totalTextLength < 10) {
            if (!renderErrorMsg) renderErrorMsg = "Fallback failed: No image buffer produced.";
        }

        // Cleanup
        page.cleanup();

        return {
            pageNumber,
            textBlocks: imageBuffer ? [] : textBlocks,
            blocks: imageBuffer ? [] : blocks,
            rawItems: imageBuffer ? [] : rawItems,
            viewport: { width: viewport.width, height: viewport.height },
            hasImages: hasImages || (imageBuffer !== null),
            pageImage: imageBuffer ? {
                buffer: imageBuffer,
                width: imageDims.width,
                height: imageDims.height,
                extension: 'jpg'
            } : null,
            renderError: renderErrorMsg
        };

    } catch (e) {
        console.warn(`[Worker] Fatal error for page ${pageNumber}:`, e);
        throw e;
    }
}

async function analyzeSessionPage(pageNumber) {
    if (!sessionPdfDoc) throw new Error("No session document loaded");

    try {
        const page = await sessionPdfDoc.getPage(pageNumber);

        // 1. Text Content Analysis
        const textContent = await page.getTextContent();
        const textLength = textContent.items.reduce((acc, item) => acc + item.str.length, 0);
        const textItemCount = textContent.items.length;

        // 2. Operator List Analysis (Images & Vectors)
        const opList = await page.getOperatorList();
        const fnArray = opList.fnArray;

        // PDF.js Ops: paintImageXObject (85), paintInlineImage (86), paintImageMaskXObject (83) ... 
        // We can just count strict image painting ops.
        // Actually, let's just count how many "paintImage" ops.
        // OPS.paintImageXObject = 85
        // OPS.paintInlineImage = 86
        // OPS.paintImageMaskXObject = 83

        // This requires importing OPS from pdf.js if we want constants, 
        // or we just define them/guess them or count generic image-like names if we had names.
        // Accessing OPS from worker? self.pdfjsLib.OPS

        const OPS = self.pdfjsLib.OPS;
        let imageCount = 0;
        let vectorPathCount = 0;

        for (let i = 0; i < fnArray.length; i++) {
            const fn = fnArray[i];
            if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImage) {
                imageCount++;
            }
            // Vector paths: constructPath (13) ??
            // fill (23), stroke (24)
            if (fn === OPS.fill || fn === OPS.stroke) {
                vectorPathCount++;
            }
        }

        page.cleanup();

        return {
            pageNumber,
            textLength,
            textItemCount,
            imageCount,
            vectorPathCount
        };

    } catch (e) {
        console.warn(`[Worker] Analyze page ${pageNumber} failed, assuming complex:`, e);
        return { pageNumber, textLength: 0, imageCount: 0, vectorPathCount: 0, error: true };
    }
}

async function closeSessionDocument() {
    if (sessionPdfDoc) {
        try {
            sessionPdfDoc.destroy();
        } catch (e) { }
        sessionPdfDoc = null;
    }
    sessionPdfData = null; // Free memory
    return { success: true };
}
