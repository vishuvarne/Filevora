
import { describe, it, expect } from 'vitest';
import { DocxStreamingBuilder } from './docx-streaming-builder';

describe('DocxStreamingBuilder', () => {
    it('should generate a non-empty blob', async () => {
        const builder = new DocxStreamingBuilder();
        await builder.initialize();

        await builder.addPage({
            textBlocks: ["Hello World", "This is a test paragraph."],
            hasImages: false,
            pageNumber: 1
        });

        const blob = await builder.finalize();
        console.log("Blob size:", blob.size);
        console.log("Blob type:", blob.type);

        expect(blob.size).toBeGreaterThan(0);
        // JSZip defaults to application/zip. The browser might auto-detect or we should force it in the save.
        // For this test, we accept application/zip or the docx mime type.
        expect(['application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']).toContain(blob.type);
    });

    it('should generate a valid blob even with empty pages', async () => {
        const builder = new DocxStreamingBuilder();
        await builder.initialize();

        await builder.addPage({
            textBlocks: [],
            hasImages: false,
            pageNumber: 1
        });

        const blob = await builder.finalize();
        console.log("Empty page Blob size:", blob.size);
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle blocks with font properties and headings', async () => {
        const builder = new DocxStreamingBuilder();
        await builder.initialize();

        await builder.addPage({
            blocks: [
                { type: 'h1', text: 'Main Title', fontName: 'Helvetica-Bold', fontHeight: 24, isBold: true },
                { type: 'p', text: 'This is a bold and italic paragraph.', isBold: true, isItalic: true, fontName: 'Times-Roman', fontHeight: 12 },
                { type: 'p', text: 'Normal text with specific font.', fontName: 'Courier', fontHeight: 10 },
                { type: 'p', text: 'Visit Google', linkUrl: 'https://google.com' },
                { type: 'p', text: 'Go to Chapter 1', linkToId: 'chapter_1' },
                { type: 'p', text: 'Centered Paragraph', alignment: 'center' },
                { type: 'p', text: 'Right Aligned Paragraph', alignment: 'right' }
            ],
            hasImages: false,
            pageNumber: 1,
            isLastPage: true
        });

        const blob = await builder.finalize();
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle paragraphs with multiple runs', async () => {
        const builder = new DocxStreamingBuilder();
        await builder.initialize();

        await builder.addPage({
            blocks: [
                {
                    type: 'p',
                    runs: [
                        { text: 'This part is ', isBold: false },
                        { text: 'BOLD', isBold: true, fontHeight: 14 },
                        { text: ' and this is ', isBold: false },
                        { text: 'ITALIC', isItalic: true, fontName: 'Times' }
                    ],
                    alignment: 'center'
                }
            ],
            hasImages: false,
            pageNumber: 1,
            isLastPage: true
        });

        const blob = await builder.finalize();
        expect(blob.size).toBeGreaterThan(0);
    });
});
