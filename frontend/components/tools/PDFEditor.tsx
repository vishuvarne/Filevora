"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
    ArrowDownTrayIcon,
    TrashIcon,
    PlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassPlusIcon,
    MagnifyingGlassMinusIcon,
    DocumentTextIcon,
    XMarkIcon,
    CheckIcon
} from "@heroicons/react/24/outline";

// Use CDN for worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

type ToolMode = 'select' | 'text' | 'sign' | 'image' | 'cross' | 'check' | 'circle' | 'highlight' | 'draw';

interface TextBox {
    id: string;
    page: number;
    x: number; // percentage 0-1 from left
    y: number; // percentage 0-1 from top
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    bold: boolean;
    italic: boolean;
}

interface Drawing {
    id: string;
    page: number;
    points: { x: number; y: number }[];
    color: string;
    width: number;
    isHighlight: boolean;
}

interface Shape {
    id: string;
    page: number;
    x: number;
    y: number;
    type: 'cross' | 'check' | 'circle';
    color: string;
    size: number;
}

interface ImageItem {
    id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    dataUrl: string;
}

export default function PDFEditor() {
    // --- State ---
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTool, setActiveTool] = useState<ToolMode>('select');

    // Text Boxes
    const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

    // Drawings
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

    // Shapes
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

    // Images
    const [images, setImages] = useState<ImageItem[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingImagePos = useRef<{ x: number, y: number } | null>(null);

    // --- File Loading ---
    const onFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
            setCurrentPage(1);
            setScale(1.0);
            setTextBoxes([]);
            setSelectedBoxId(null);
        } catch (error) {
            console.error("Error loading PDF:", error);
            alert("Failed to load PDF file.");
            setFile(null);
        }
    };

    // --- Rendering ---
    const renderPage = useCallback(async () => {
        if (!pdfDoc || !canvasRef.current) return;

        try {
            const page = await pdfDoc.getPage(currentPage);
            const viewport = page.getViewport({ scale: scale * 1.5 }); // 1.5x for higher res rendering

            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (!context) return;

            // Set actual size in memory (scaled to account for high DPI devices)
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Set visual size in CSS
            canvas.style.width = `${viewport.width / 1.5}px`;
            canvas.style.height = `${viewport.height / 1.5}px`;

            if (overlayRef.current) {
                overlayRef.current.style.width = `${viewport.width / 1.5}px`;
                overlayRef.current.style.height = `${viewport.height / 1.5}px`;
            }

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            if (renderTaskRef.current) {
                await renderTaskRef.current.promise.catch(() => { });
            }

            renderTaskRef.current = page.render(renderContext);
            await renderTaskRef.current.promise;
        } catch (error) {
            if (error instanceof pdfjsLib.RenderingCancelledException) {
                // Ignore cancelled renders
            } else {
                console.error("Error rendering page:", error);
            }
        }
    }, [pdfDoc, currentPage, scale]);

    useEffect(() => {
        renderPage();
    }, [renderPage]);

    // --- Interaction Handlers ---
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!overlayRef.current) return;

        if (activeTool === 'select') {
            setSelectedBoxId(null);
            setSelectedDrawingId(null);
            setSelectedShapeId(null);
            setSelectedImageId(null);
            return;
        }

        if (activeTool === 'text') {
            const overlayRect = overlayRef.current.getBoundingClientRect();
            let newX = (e.clientX - overlayRect.left) / overlayRect.width;
            let newY = (e.clientY - overlayRect.top) / overlayRect.height;

            // Adjust to center vaguely
            newX = Math.max(0, Math.min(newX, 0.9));
            newY = Math.max(0, Math.min(newY, 0.95));

            const newBox: TextBox = {
                id: `text-${Date.now()}`,
                page: currentPage,
                x: newX,
                y: newY,
                text: "Double click to edit",
                fontSize: 16,
                fontFamily: "Helvetica",
                color: "#000000",
                bold: false,
                italic: false,
            };
            setTextBoxes([...textBoxes, newBox]);
            setSelectedBoxId(newBox.id);
            // Switch back to select tool automatically after placing text? Or stay in text mode?
            // Usually editors stay in text mode or switch to select. Let's switch to select so they can drag it immediately.
            setActiveTool('select');
        } else if (activeTool === 'cross' || activeTool === 'check' || activeTool === 'circle') {
            const overlayRect = overlayRef.current.getBoundingClientRect();
            let newX = (e.clientX - overlayRect.left) / overlayRect.width;
            let newY = (e.clientY - overlayRect.top) / overlayRect.height;

            newX = Math.max(0.05, Math.min(newX, 0.95));
            newY = Math.max(0.05, Math.min(newY, 0.95));

            const newShape: Shape = {
                id: `shape-${Date.now()}`,
                page: currentPage,
                x: newX,
                y: newY,
                type: activeTool,
                color: activeTool === 'cross' ? '#ef4444' : (activeTool === 'check' ? '#22c55e' : '#000000'), // red cross, green check, black circle default
                size: 24, // default px size
            };

            setShapes([...shapes, newShape]);
            setSelectedShapeId(newShape.id);
            setActiveTool('select');
        } else if (activeTool === 'sign' || activeTool === 'image') {
            const overlayRect = overlayRef.current.getBoundingClientRect();
            let newX = (e.clientX - overlayRect.left) / overlayRect.width;
            let newY = (e.clientY - overlayRect.top) / overlayRect.height;

            newX = Math.max(0.05, Math.min(newX, 0.95));
            newY = Math.max(0.05, Math.min(newY, 0.95));

            pendingImagePos.current = { x: newX, y: newY };
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingImagePos.current) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;

            // Get intrinsic size
            const img = new Image();
            img.onload = () => {
                // Scale down if too large, max 200px equivalent (assume 800px display width -> 25%)
                let width = img.width;
                let height = img.height;
                const aspect = width / height;

                if (width > 200) {
                    width = 200;
                    height = 200 / aspect;
                }

                const newImage: ImageItem = {
                    id: `img-${Date.now()}`,
                    page: currentPage,
                    x: pendingImagePos.current!.x,
                    y: pendingImagePos.current!.y,
                    width,
                    height,
                    dataUrl
                };

                setImages(prev => [...prev, newImage]);
                setSelectedImageId(newImage.id);
                setActiveTool('select');
                pendingImagePos.current = null;
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    // --- Drawing Handlers ---
    const handleOverlayPointerDown = (e: React.PointerEvent) => {
        if (!overlayRef.current) return;
        if (activeTool !== 'draw' && activeTool !== 'highlight') return;

        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        const overlayRect = overlayRef.current.getBoundingClientRect();
        const x = (e.clientX - overlayRect.left) / overlayRect.width;
        const y = (e.clientY - overlayRect.top) / overlayRect.height;

        setCurrentDrawing({
            id: `draw-${Date.now()}`,
            page: currentPage,
            points: [{ x, y }],
            color: activeTool === 'highlight' ? '#FFD700' : '#000000',
            width: activeTool === 'highlight' ? 12 : 3,
            isHighlight: activeTool === 'highlight',
        });
    };

    const handleOverlayPointerMove = (e: React.PointerEvent) => {
        if (!currentDrawing || !overlayRef.current) return;
        if (activeTool !== 'draw' && activeTool !== 'highlight') return;

        const overlayRect = overlayRef.current.getBoundingClientRect();
        const x = (e.clientX - overlayRect.left) / overlayRect.width;
        const y = (e.clientY - overlayRect.top) / overlayRect.height;

        setCurrentDrawing({
            ...currentDrawing,
            points: [...currentDrawing.points, { x, y }],
        });
    };

    const handleOverlayPointerUp = (e: React.PointerEvent) => {
        if (!currentDrawing) return;

        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (currentDrawing.points.length > 1) {
            setDrawings([...drawings, currentDrawing]);
        }
        setCurrentDrawing(null);
    };

    const handleDeleteDrawing = (id: string) => {
        setDrawings(drawings.filter(d => d.id !== id));
        if (selectedDrawingId === id) setSelectedDrawingId(null);
    };

    const handleDeleteText = (id: string) => {
        setTextBoxes(textBoxes.filter(b => b.id !== id));
        if (selectedBoxId === id) setSelectedBoxId(null);
    };

    const handleDeleteShape = (id: string) => {
        setShapes(shapes.filter(s => s.id !== id));
        if (selectedShapeId === id) setSelectedShapeId(null);
    };

    const handleDeleteImage = (id: string) => {
        setImages(images.filter(i => i.id !== id));
        if (selectedImageId === id) setSelectedImageId(null);
    };

    const updateTextBox = (id: string, updates: Partial<TextBox>) => {
        setTextBoxes(boxes => boxes.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const updateShape = (id: string, updates: Partial<Shape>) => {
        setShapes(s => s.map(shape => shape.id === id ? { ...shape, ...updates } : shape));
    };

    const updateImage = (id: string, updates: Partial<ImageItem>) => {
        setImages(imgs => imgs.map(img => img.id === id ? { ...img, ...updates } : img));
    };

    // --- Dragging Logic ---
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent, item: { id: string; x: number; y: number }, type: 'text' | 'shape' | 'image') => {
        e.stopPropagation();
        setSelectedBoxId(null);
        setSelectedShapeId(null);
        setSelectedDrawingId(null);
        setSelectedImageId(null);

        if (type === 'text') {
            setSelectedBoxId(item.id);
        } else if (type === 'shape') {
            setSelectedShapeId(item.id);
        } else if (type === 'image') {
            setSelectedImageId(item.id);
        }

        setIsDragging(true);

        if (overlayRef.current) {
            const overlayRect = overlayRef.current.getBoundingClientRect();
            // Calculate mouse position relative to overlay in percentages
            const mouseX = (e.clientX - overlayRect.left) / overlayRect.width;
            const mouseY = (e.clientY - overlayRect.top) / overlayRect.height;
            dragOffset.current = {
                x: mouseX - item.x,
                y: mouseY - item.y
            };
        }
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !overlayRef.current) return;

        let targetId = selectedBoxId;
        let dragType = 'text';

        if (!targetId && selectedShapeId) {
            targetId = selectedShapeId;
            dragType = 'shape';
        }
        if (!targetId && selectedImageId) {
            targetId = selectedImageId;
            dragType = 'image';
        }

        if (!targetId) return;

        const overlayRect = overlayRef.current.getBoundingClientRect();

        let newX = ((e.clientX - overlayRect.left) / overlayRect.width) - dragOffset.current.x;
        let newY = ((e.clientY - overlayRect.top) / overlayRect.height) - dragOffset.current.y;

        // Keep inside bounds (approximate)
        newX = Math.max(0, Math.min(newX, 0.95));
        newY = Math.max(0, Math.min(newY, 0.95));

        if (dragType === 'shape') {
            updateShape(targetId, { x: newX, y: newY });
        } else if (dragType === 'image') {
            updateImage(targetId, { x: newX, y: newY });
        } else {
            updateTextBox(targetId, { x: newX, y: newY });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    // --- Export Logic ---
    const handleExport = async () => {
        if (!file || textBoxes.length === 0) return;
        setIsExporting(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDocLib = await PDFDocument.load(new Uint8Array(arrayBuffer));

            // Embed standard fonts
            const helveticaFont = await pdfDocLib.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDocLib.embedFont(StandardFonts.HelveticaBold);
            const helveticaOblique = await pdfDocLib.embedFont(StandardFonts.HelveticaOblique);
            const helveticaBoldOblique = await pdfDocLib.embedFont(StandardFonts.HelveticaBoldOblique);

            const pages = pdfDocLib.getPages();

            // Apply all text boxes
            for (const box of textBoxes) {
                // PDF pages are 0-indexed in pdf-lib
                const pageIndex = box.page - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { width, height } = page.getSize();

                // Convert hex to rgb
                let r = 0, g = 0, b = 0;
                if (box.color.startsWith('#') && box.color.length === 7) {
                    r = parseInt(box.color.slice(1, 3), 16) / 255;
                    g = parseInt(box.color.slice(3, 5), 16) / 255;
                    b = parseInt(box.color.slice(5, 7), 16) / 255;
                }

                // Select font variation
                let font = helveticaFont;
                if (box.bold && box.italic) font = helveticaBoldOblique;
                else if (box.bold) font = helveticaBold;
                else if (box.italic) font = helveticaOblique;

                // PDF-lib origin is bottom-left. We stored y as percentage from top.
                // Text is drawn from its baseline. We subtract a bit for the font height approximation.
                const pdfX = box.x * width + 2; // small padding
                const pdfY = height - (box.y * height) - box.fontSize;

                // Split text by newlines if edited
                const lines = box.text.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    page.drawText(lines[i], {
                        x: pdfX,
                        y: pdfY - (i * box.fontSize * 1.2), // line height 1.2
                        size: box.fontSize,
                        font: font,
                        color: rgb(r, g, b),
                    });
                }
            }

            // Apply all drawings
            for (const drawing of drawings) {
                const pageIndex = drawing.page - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { width, height } = page.getSize();

                // Convert hex to rgb
                let r = 0, g = 0, b = 0;
                if (drawing.color.startsWith('#') && drawing.color.length === 7) {
                    r = parseInt(drawing.color.slice(1, 3), 16) / 255;
                    g = parseInt(drawing.color.slice(3, 5), 16) / 255;
                    b = parseInt(drawing.color.slice(5, 7), 16) / 255;
                }

                const strokeThickness = (drawing.width / 1000) * Math.max(width, height);

                for (let i = 1; i < drawing.points.length; i++) {
                    const startPoint = drawing.points[i - 1];
                    const endPoint = drawing.points[i];

                    page.drawLine({
                        start: { x: startPoint.x * width, y: height - (startPoint.y * height) },
                        end: { x: endPoint.x * width, y: height - (endPoint.y * height) },
                        color: rgb(r, g, b),
                        thickness: strokeThickness,
                        opacity: drawing.isHighlight ? 0.4 : 1,
                    });
                }
            }

            // Apply all shapes
            for (const shape of shapes) {
                const pageIndex = shape.page - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { width, height } = page.getSize();

                // Convert hex to rgb
                let r = 0, g = 0, b = 0;
                if (shape.color.startsWith('#') && shape.color.length === 7) {
                    r = parseInt(shape.color.slice(1, 3), 16) / 255;
                    g = parseInt(shape.color.slice(3, 5), 16) / 255;
                    b = parseInt(shape.color.slice(5, 7), 16) / 255;
                }

                // In UI, shape.x and y are top-left of the bounding box.
                // Bounding box size is roughly 24px (shape.size) out of maybe 800px width.
                const sizeRatio = shape.size / 800; // rough generic scaling
                const radius = (sizeRatio * width) / 2;
                const strokeWidth = 3 * (width / 800); // scaled stroke

                // Center of the shape in PDF coords
                const centerX = shape.x * width + radius;
                const centerY = height - (shape.y * height) - radius;

                if (shape.type === 'circle') {
                    page.drawCircle({
                        x: centerX,
                        y: centerY,
                        size: radius,
                        borderWidth: strokeWidth,
                        borderColor: rgb(r, g, b),
                        opacity: 1
                    });
                } else if (shape.type === 'cross') {
                    // Draw X
                    page.drawLine({ start: { x: centerX - radius, y: centerY - radius }, end: { x: centerX + radius, y: centerY + radius }, thickness: strokeWidth, color: rgb(r, g, b) });
                    page.drawLine({ start: { x: centerX - radius, y: centerY + radius }, end: { x: centerX + radius, y: centerY - radius }, thickness: strokeWidth, color: rgb(r, g, b) });
                } else if (shape.type === 'check') {
                    // Draw Checkmark (roughly)
                    page.drawLine({ start: { x: centerX - radius, y: centerY }, end: { x: centerX - (radius / 4), y: centerY - radius }, thickness: strokeWidth, color: rgb(r, g, b) });
                    page.drawLine({ start: { x: centerX - (radius / 4), y: centerY - radius }, end: { x: centerX + radius, y: centerY + radius }, thickness: strokeWidth, color: rgb(r, g, b) });
                }
            }

            const pdfBytes = await pdfDocLib.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            // Trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = `edited_${file.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- Active Box State ---
    const activeBox = textBoxes.find(b => b.id === selectedBoxId);

    return (
        <div className="flex-1 w-full bg-background rounded-2xl shadow-sm border border-border flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 min-h-[700px]">
            {!file ? (
                <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                    <div className="max-w-3xl w-full text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 mb-4 shadow-sm animate-in zoom-in">
                            <DocumentTextIcon className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 mb-8 max-w-lg mx-auto">
                            Add text, highlight, draw, and fill forms directly in your browser.
                            100% free and secure — no upload required.
                        </p>
                        <Dropzone
                            onFilesSelected={onFilesSelected}
                            acceptedTypes=".pdf,application/pdf"
                            multiple={false}
                            label="Upload PDF to Edit"
                        />
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col bg-background">
                    {/* Top Toolbar (PDFFiller Style) */}
                    <div className="h-16 border-b border-border bg-white dark:bg-slate-950 flex items-center justify-between px-2 sm:px-4 shrink-0 overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Tools Cluster */}
                            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-lg border border-border/50">
                                <button onClick={() => setActiveTool('select')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'select' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-500 hover:text-primary'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-0.5"><path fillRule="evenodd" d="M15.022 1L8.978 1 0 16.516l2.126.969L4.414 13h5.172l2.288 4.485 2.126-.97-5.022-15.515zM7.058 11.235l1.9-4.8 1.9 4.8H7.058z" clipRule="evenodd" /></svg>
                                    <span className="text-[9px] font-semibold">Select</span>
                                </button>
                                <button onClick={() => setActiveTool('text')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'text' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-500 hover:text-primary'}`}>
                                    <span className="text-sm font-bold leading-none mb-0.5 font-serif">T</span>
                                    <span className="text-[9px] font-semibold">Text</span>
                                </button>
                                <button onClick={() => setActiveTool('sign')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'sign' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-500 hover:text-primary'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                                    <span className="text-[9px] font-semibold">Sign</span>
                                </button>
                                <button onClick={() => setActiveTool('image')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'image' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-500 hover:text-primary'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                    <span className="text-[9px] font-semibold">Image</span>
                                </button>
                                <div className="w-px h-6 bg-border mx-1"></div>
                                <button onClick={() => setActiveTool('cross')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'cross' ? 'bg-white dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
                                    <XMarkIcon className="w-4 h-4 mb-0.5 text-red-500" strokeWidth={2} />
                                    <span className="text-[9px] font-semibold text-slate-500">Cross</span>
                                </button>
                                <button onClick={() => setActiveTool('check')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'check' ? 'bg-white dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 mb-0.5 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    <span className="text-[9px] font-semibold text-slate-500">Check</span>
                                </button>
                                <button onClick={() => setActiveTool('circle')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'circle' ? 'bg-white dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
                                    <div className="w-4 h-4 border-[2.5px] border-slate-500 rounded-full mb-0.5"></div>
                                    <span className="text-[9px] font-semibold text-slate-500">Circle</span>
                                </button>
                                <div className="w-px h-6 bg-border mx-1"></div>
                                <button onClick={() => setActiveTool('highlight')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'highlight' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-500 hover:text-primary'}`}>
                                    <div className="w-4 h-4 bg-yellow-300/50 border-b-2 border-yellow-400 mb-0.5"></div>
                                    <span className="text-[9px] font-semibold">Highlight</span>
                                </button>
                                <button onClick={() => setActiveTool('draw')} className={`flex flex-col items-center justify-center w-12 h-10 rounded transition-all ${activeTool === 'draw' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-500 hover:text-primary'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                                    <span className="text-[9px] font-semibold">Draw</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 shrink-0"
                            >
                                <span className="hidden sm:inline">{isExporting ? "Exporting..." : "DONE"}</span>
                                <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setFile(null); setTextBoxes([]); }}
                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-border bg-white dark:bg-slate-900"
                                title="Close PDF"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Properties Toolbar (Contextual) */}
                    {activeBox && (
                        <div className="h-10 border-b border-border bg-slate-50 dark:bg-slate-900/50 flex items-center px-4 gap-4 animate-in slide-in-from-top-2 shrink-0 overflow-x-auto custom-scrollbar">
                            <div className="flex items-center gap-2 font-bold text-[10px] text-slate-500 uppercase tracking-wider shrink-0">
                                Text Properties
                            </div>
                            <div className="h-4 w-px bg-border shrink-0"></div>

                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <input
                                    type="color"
                                    value={activeBox.color}
                                    onChange={(e) => updateTextBox(activeBox.id, { color: e.target.value })}
                                    className="w-7 h-7 p-0.5 rounded cursor-pointer border border-border bg-white"
                                    title="Text Color"
                                />
                                <div className="h-4 w-px bg-border shrink-0 mx-1"></div>
                                <select
                                    value={activeBox.fontSize}
                                    onChange={(e) => updateTextBox(activeBox.id, { fontSize: Number(e.target.value) })}
                                    className="bg-white dark:bg-slate-950 border border-border rounded text-xs px-2 py-1 focus:ring-1 focus:ring-primary w-16"
                                    title="Font Size"
                                >
                                    {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                                <div className="h-4 w-px bg-border shrink-0 mx-1"></div>
                                <button
                                    onClick={() => updateTextBox(activeBox.id, { bold: !activeBox.bold })}
                                    className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-colors border ${activeBox.bold ? 'bg-slate-200 dark:bg-slate-800 border-border text-foreground' : 'border-transparent hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                    title="Bold"
                                >
                                    B
                                </button>
                                <button
                                    onClick={() => updateTextBox(activeBox.id, { italic: !activeBox.italic })}
                                    className={`w-7 h-7 flex items-center justify-center rounded text-sm italic font-serif transition-colors border ${activeBox.italic ? 'bg-slate-200 dark:bg-slate-800 border-border text-foreground' : 'border-transparent hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                    title="Italic"
                                >
                                    I
                                </button>
                                <div className="h-4 w-px bg-border shrink-0 mx-1"></div>
                                <button
                                    onClick={() => handleDeleteText(activeBox.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete Text Box"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Workspace Workspace */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* Left Sidebar (Pages) */}
                        <div className="w-48 xl:w-56 border-r border-border bg-slate-50/50 dark:bg-slate-900/30 flex flex-col shrink-0">
                            <div className="h-10 border-b border-border flex items-center justify-between px-3 shrink-0">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{numPages} pages</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                {/* Dummy placeholder for thumbnails for now. Real thumbnails need a separate canvas render loop per page */}
                                {Array.from({ length: numPages }).map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-full aspect-[1/1.4] rounded border shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all ${currentPage === i + 1 ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-950' : 'border-border bg-white/50 dark:bg-slate-950/50 hover:border-slate-400'}`}
                                    >
                                        <DocumentTextIcon className={`w-8 h-8 ${currentPage === i + 1 ? 'text-primary' : 'text-slate-300 dark:text-slate-700'}`} />
                                        <span className={`text-[10px] mt-2 font-medium ${currentPage === i + 1 ? 'text-primary' : 'text-slate-500'}`}>Page {i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center Canvas Area */}
                        <div
                            className={`flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950 p-4 sm:p-8 flex items-start justify-center relative custom-scrollbar ${activeTool === 'text' ? 'cursor-text' : (activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair')}`}
                            onClick={handleCanvasClick}
                        >
                            {/* Visual container centered in the scroll area */}
                            <div
                                className="relative bg-white shadow-md border border-black/10 dark:border-white/10 transition-transform duration-200"
                                style={{ transformOrigin: 'top center', marginBottom: '80px' /* space for bottom bar */ }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    className="block pointer-events-none"
                                />

                                {/* Interactive Overlay */}
                                <div
                                    ref={overlayRef}
                                    className="absolute inset-0 select-none overflow-hidden touch-none"
                                    onPointerDown={(e) => {
                                        if (activeTool === 'draw' || activeTool === 'highlight') {
                                            handleOverlayPointerDown(e);
                                        }
                                    }}
                                    onPointerMove={(e) => {
                                        if (activeTool === 'draw' || activeTool === 'highlight') {
                                            handleOverlayPointerMove(e);
                                        }
                                    }}
                                    onPointerUp={(e) => {
                                        if (activeTool === 'draw' || activeTool === 'highlight') {
                                            handleOverlayPointerUp(e);
                                        }
                                    }}
                                >
                                    {/* SVG Layer for Drawings */}
                                    <svg viewBox="0 0 10000 10000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                        {[...drawings, ...(currentDrawing ? [currentDrawing] : [])]
                                            .filter(d => d.page === currentPage)
                                            .map(d => {
                                                if (d.points.length < 2) return null;
                                                const pathData = `M ${d.points[0].x * 10000} ${d.points[0].y * 10000} ` +
                                                    d.points.slice(1).map(p => `L ${p.x * 10000} ${p.y * 10000}`).join(' ');

                                                return (
                                                    <path
                                                        key={d.id}
                                                        d={pathData}
                                                        stroke={d.color}
                                                        strokeWidth={d.width * 100} // scale to 10k viewBox
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        opacity={d.isHighlight ? 0.4 : 1}
                                                        style={{ mixBlendMode: d.isHighlight ? 'multiply' : 'normal', pointerEvents: activeTool === 'select' ? 'auto' : 'none', cursor: activeTool === 'select' ? 'pointer' : 'default' }}
                                                        onClick={(e) => {
                                                            if (activeTool === 'select') {
                                                                e.stopPropagation();
                                                                setSelectedDrawingId(d.id);
                                                                setSelectedBoxId(null);
                                                            }
                                                        }}
                                                    />
                                                );
                                            })}
                                    </svg>

                                    {/* Selected Drawing UI (Delete Button) */}
                                    {drawings.filter(d => d.id === selectedDrawingId && d.page === currentPage).map(d => (
                                        <div
                                            key={`ui-${d.id}`}
                                            className="absolute pointer-events-auto"
                                            style={{ left: `${d.points[0].x * 100}%`, top: `${d.points[0].y * 100}%` }}
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteDrawing(d.id); }}
                                                className="absolute -top-6 -left-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 z-10"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Text Boxes Layer */}
                                    {textBoxes.filter(b => b.page === currentPage).map(box => (
                                        <div
                                            key={box.id}
                                            className={`absolute cursor-move border-2 transition-colors ${selectedBoxId === box.id
                                                ? 'border-blue-500 border-dashed bg-blue-500/5'
                                                : 'border-transparent hover:border-slate-300'
                                                }`}
                                            style={{
                                                left: `${box.x * 100}%`,
                                                top: `${box.y * 100}%`,
                                                transform: `scale(${scale})`, // keep apparent font size roughly consistent visually, actually let's not scale the element, let's scale the font size
                                                transformOrigin: 'top left',
                                                color: box.color,
                                                fontSize: `${box.fontSize * scale}px`, // visual scaling
                                                fontWeight: box.bold ? 'bold' : 'normal',
                                                fontStyle: box.italic ? 'italic' : 'normal',
                                                fontFamily: box.fontFamily,
                                                padding: '2px 4px',
                                                minWidth: '50px',
                                                minHeight: '20px',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.2
                                            }}
                                            onPointerDown={(e) => {
                                                if (activeTool === 'select') {
                                                    handlePointerDown(e, box, 'text');
                                                } else {
                                                    e.stopPropagation();
                                                    setSelectedBoxId(box.id);
                                                    setSelectedShapeId(null);
                                                    setActiveTool('select');
                                                }
                                            }}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onClick={(e) => { e.stopPropagation(); setSelectedBoxId(box.id); setSelectedShapeId(null); }}
                                        >
                                            <div
                                                className="outline-none"
                                                contentEditable={selectedBoxId === box.id}
                                                suppressContentEditableWarning
                                                onBlur={(e) => updateTextBox(box.id, { text: e.currentTarget.innerText })}
                                                onPointerDown={(e) => {
                                                    // If already selected, allow clicking inside to focus text
                                                    if (selectedBoxId === box.id) {
                                                        e.stopPropagation();
                                                    }
                                                }}
                                                style={{ cursor: selectedBoxId === box.id ? 'text' : (activeTool === 'select' ? 'move' : 'default') }}
                                            >
                                                {box.text}
                                            </div>
                                            {/* Delete shortcut button on the box when selected */}
                                            {selectedBoxId === box.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteText(box.id); }}
                                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"
                                                >
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Shapes Layer */}
                                    {shapes.filter(s => s.page === currentPage).map(shape => (
                                        <div
                                            key={shape.id}
                                            className={`absolute pointer-events-auto touch-none group p-2 -m-2`}
                                            style={{
                                                left: `${shape.x * 100}%`,
                                                top: `${shape.y * 100}%`,
                                            }}
                                            onPointerDown={(e) => {
                                                if (activeTool === 'select') {
                                                    handlePointerDown(e, shape, 'shape');
                                                } else {
                                                    e.stopPropagation();
                                                    setSelectedShapeId(shape.id);
                                                    setSelectedBoxId(null);
                                                    setActiveTool('select');
                                                }
                                            }}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onClick={(e) => { e.stopPropagation(); setSelectedShapeId(shape.id); setSelectedBoxId(null); }}
                                        >
                                            <div
                                                className={`relative flex items-center justify-center transition-colors ${selectedShapeId === shape.id ? 'ring-2 ring-primary ring-offset-2 rounded' : 'group-hover:ring-1 group-hover:ring-primary/50 group-hover:ring-offset-1 rounded'}`}
                                                style={{
                                                    width: `${shape.size}px`,
                                                    height: `${shape.size}px`,
                                                    color: shape.color,
                                                    cursor: activeTool === 'select' ? 'move' : 'default'
                                                }}
                                            >
                                                {shape.type === 'cross' && <XMarkIcon className="w-full h-full text-current" strokeWidth={3} />}
                                                {shape.type === 'check' && <CheckIcon className="w-full h-full text-current" strokeWidth={3} />}
                                                {shape.type === 'circle' && <div className="w-full h-full border-[3px] rounded-full border-current"></div>}
                                            </div>

                                            {/* Interactive Delete Button for Selected Shape */}
                                            {selectedShapeId === shape.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteShape(shape.id); }}
                                                    className="absolute -top-7 -right-7 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10"
                                                    title="Delete Shape"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Images Layer */}
                                    {images.filter(img => img.page === currentPage).map(imgItem => (
                                        <div
                                            key={imgItem.id}
                                            className={`absolute pointer-events-auto touch-none group p-2 -m-2`}
                                            style={{
                                                left: `${imgItem.x * 100}%`,
                                                top: `${imgItem.y * 100}%`,
                                            }}
                                            onPointerDown={(e) => {
                                                if (activeTool === 'select') {
                                                    handlePointerDown(e, imgItem, 'image');
                                                } else {
                                                    e.stopPropagation();
                                                    setSelectedImageId(imgItem.id);
                                                    setSelectedBoxId(null);
                                                    setSelectedShapeId(null);
                                                    setActiveTool('select');
                                                }
                                            }}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onClick={(e) => { e.stopPropagation(); setSelectedImageId(imgItem.id); setSelectedBoxId(null); setSelectedShapeId(null); }}
                                        >
                                            <div
                                                className={`relative transition-colors ${selectedImageId === imgItem.id ? 'ring-2 ring-blue-500 ring-offset-2 rounded border border-blue-500/50' : 'group-hover:ring-1 group-hover:ring-blue-500/50 group-hover:ring-offset-1 rounded'}`}
                                                style={{
                                                    width: `${imgItem.width * scale}px`,
                                                    height: `${imgItem.height * scale}px`,
                                                    cursor: activeTool === 'select' ? 'move' : 'default'
                                                }}
                                            >
                                                <img
                                                    src={imgItem.dataUrl}
                                                    alt="Inserted element"
                                                    className="w-full h-full object-contain pointer-events-none"
                                                />
                                            </div>

                                            {/* Interactive Delete Button for Selected Image */}
                                            {selectedImageId === imgItem.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(imgItem.id); }}
                                                    className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10"
                                                    title="Delete Image"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Floating Bottom Bar (Zoom & Pagination) */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-full px-4 py-2 flex items-center gap-4 shadow-xl border border-slate-700 animate-in slide-in-from-bottom-4 shadow-black/20">
                                {/* Pagination */}
                                <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                                        disabled={currentPage === 1}
                                        className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-medium tabular-nums min-w-[3rem] text-center shrink-0">
                                        {currentPage} / {numPages}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(numPages, p + 1)); }}
                                        disabled={currentPage === numPages}
                                        className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Zoom */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.25)); }}
                                        className="p-1 rounded hover:bg-slate-700 transition-colors"
                                    >
                                        <MagnifyingGlassMinusIcon className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-medium tabular-nums w-10 text-center shrink-0">{Math.round(scale * 100)}%</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(3, s + 0.25)); }}
                                        className="p-1 rounded hover:bg-slate-700 transition-colors"
                                    >
                                        <MagnifyingGlassPlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
