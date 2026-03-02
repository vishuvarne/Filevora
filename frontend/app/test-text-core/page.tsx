'use client';

import { useEffect, useRef, useState } from 'react';
import { TextCoreEngine } from '@/lib/text-core/font-loader';
import { TextShaper } from '@/lib/text-core/text-shaper';
import { LayoutEngine } from '@/lib/text-core/layout-engine';
import { CanvasRenderer } from '@/lib/text-core/renderer';
import { PdfWriter } from '@/lib/text-core/pdf-writer';

export default function TestTextCorePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

    useEffect(() => {
        async function runTest() {
            try {
                setStatus('Loading Engine...');
                const engine = await TextCoreEngine.getInstance();
                // engine.init() is called inside getInstance()

                setStatus('Loading Font...');
                const fontRes = await fetch('/fonts/poppins-400.woff2');
                if (!fontRes.ok) throw new Error('Failed to load font');
                const fontBuffer = await fontRes.arrayBuffer();
                const font = await engine.loadFont('Poppins', fontBuffer);

                setStatus('Shaping & Layout...');
                const shaper = new TextShaper(engine.hb);
                const layoutEngine = new LayoutEngine(shaper);

                // Test Text with Mixed Sizes and Colors
                const runs = [
                    {
                        text: "Hello World! ",
                        font: font,
                        fontSize: 32,
                        color: 'FF0000'
                    },
                    {
                        text: "This is the TextCore Engine ",
                        font: font,
                        fontSize: 24,
                        color: '000000'
                    },
                    {
                        text: "rendering mixed sizes ",
                        font: font,
                        fontSize: 16,
                        color: '0000FF'
                    },
                    {
                        text: "and colors within a single paragraph flow.",
                        font: font,
                        fontSize: 24,
                        color: '000000'
                    }
                ];

                const options = {
                    maxWidth: 500,
                    lineHeight: 1.5,
                    indent: 40, // First line indent
                    bullet: {
                        text: '•',
                        font: font,
                        fontSize: 32, // Large bullet
                        color: 'FF0000',
                        space: 10
                    }
                };

                const layout = layoutEngine.layoutRichText(runs, options);
                console.log('Layout result:', layout);

                // Render to Canvas
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const renderer = new CanvasRenderer();

                        // Set canvas size
                        canvasRef.current.width = 600;
                        canvasRef.current.height = layout.height + 100;

                        // Clear and background
                        ctx.fillStyle = '#f0f0f0';
                        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                        // Render
                        setStatus('Rendering to Canvas...');
                        renderer.renderParagraph(layout, ctx, 20, 50);
                    }
                }

                // Generate PDF
                setStatus('Generating PDF...');
                const pdfWriter = new PdfWriter();
                const pdfDoc = await pdfWriter.createPdf();
                const page = pdfWriter.addPage(pdfDoc);
                const { height } = page.getSize();

                // PDF uses Y-up. We position at top of page (e.g. y = 50 from top).
                // renderParagraph y argument is 'Visual Y from top'.
                await pdfWriter.drawParagraph(page, layout, 20, 50);

                const pdfBytes = await pdfDoc.save();
                setPdfBlob(new Blob([pdfBytes as any], { type: 'application/pdf' }));

                setStatus('Success! Check Canvas and Download PDF.');

            } catch (e: any) {
                console.error(e);
                setStatus('Error: ' + e.message);
            }
        }

        runTest();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">TextCore Engine Verification</h1>
            <div className="mb-4">
                Status: <span className="font-mono font-bold">{status}</span>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl mb-2">Canvas Output</h2>
                    <canvas ref={canvasRef} className="border border-gray-300 shadow-md"></canvas>
                </div>

                <div>
                    <h2 className="text-xl mb-2">PDF Output</h2>
                    {pdfBlob && (
                        <a
                            href={URL.createObjectURL(pdfBlob)}
                            download="test-textcore.pdf"
                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Download PDF
                        </a>
                    )}
                    {!pdfBlob && <div className="text-gray-500">Generating...</div>}
                </div>
            </div>
        </div>
    );
}
