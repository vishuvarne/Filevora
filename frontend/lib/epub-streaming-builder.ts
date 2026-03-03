import JSZip from 'jszip';
import { OutputBuilder } from './output-builder-interface';

const MIMETYPE = "application/epub+zip";
const CONTAINER_XML = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`;

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '') // Remove invalid XML characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Reusing LayoutBlock types from docx-streaming-builder if possible, or defining subset here.
// For now, defining subset for self-containment/cleanliness.

export interface LayoutBlock {
    type: 'paragraph' | 'heading' | 'table' | 'image' | 'list';
    id?: string;
    content: string | any;
    style?: {
        alignment?: 'left' | 'center' | 'right' | 'justify';
        fontSize?: number;
        isBold?: boolean;
        isItalic?: boolean;
    };
    isCentered?: boolean; // Legacy support
    linkToId?: string;
}

export class EpubStreamingBuilder implements OutputBuilder {
    private zip: JSZip;
    private manifestItems: string[] = [];
    private spineItems: string[] = [];
    private tocNavPoints: string[] = [];
    private pageCount = 0;
    private metadata: { title?: string; author?: string } = {};

    constructor() {
        this.zip = new JSZip();
    }

    setMetadata(meta: { title?: string; author?: string }) {
        this.metadata = meta;
    }

    async initialize(): Promise<void> {
        this.zip.file("mimetype", MIMETYPE);
        this.zip.folder("META-INF")?.file("container.xml", CONTAINER_XML);

        // Enhanced CSS
        const css = `
            body { font-family: 'Georgia', serif; line-height: 1.6; margin: 0; padding: 1em; } 
            p { margin: 1em 0; text-align: justify; }
            h1 { font-size: 2em; margin-bottom: 0.5em; color: #2c3e50; page-break-before: always; }
            h2 { font-size: 1.5em; margin-top: 1.5em; margin-bottom: 0.5em; color: #34495e; }
            img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .italic { font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin: 1em 0; }
            td, th { border: 1px solid #ddd; padding: 8px; }
            a { color: #0066cc; text-decoration: none; }
        `;
        this.zip.folder("OEBPS")?.folder("css")?.file("style.css", css);

        // Add CSS to manifest
        this.manifestItems.push(`<item id="css" href="css/style.css" media-type="text/css"/>`);
    }

    async addPage(pageContent: {
        textBlocks: string[],
        layoutBlocks?: LayoutBlock[], // Support enhanced engine
        blocks?: any[],
        hasImages?: boolean,
        pageNumber?: number,
        pageImage?: { buffer: ArrayBuffer, width: number, height: number, extension: string }
    }): Promise<void> {
        this.pageCount++;
        const pageNum = pageContent.pageNumber || this.pageCount;
        const filename = `chapter_${pageNum}.xhtml`;
        const itemID = `page_${pageNum}`;

        // Build XHTML
        let xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>Page ${pageNum}</title>
<link href="css/style.css" rel="stylesheet" type="text/css"/>
</head>
<body>
`;

        // Handle Page Image (Scanned PDF Fallback)
        if (pageContent.pageImage && (!pageContent.textBlocks || pageContent.textBlocks.length === 0)) {
            const imgFilename = `img_${pageNum}.${pageContent.pageImage.extension}`;
            const imgPath = `images/${imgFilename}`;
            this.zip.folder("OEBPS")?.folder("images")?.file(imgFilename, pageContent.pageImage.buffer);

            let mime = pageContent.pageImage.extension === 'png' ? 'image/png' : 'image/jpeg';
            const imgItemID = `img_${pageNum}`;
            this.manifestItems.push(`<item id="${imgItemID}" href="${imgPath}" media-type="${mime}"/>`);

            xhtml += `<div style="text-align: center; margin-bottom: 1em;">
                <img src="${imgPath}" alt="Page ${pageNum}" />
            </div>\n`;
        }

        // Handle Content
        const blocks = pageContent.layoutBlocks || pageContent.blocks || pageContent.textBlocks.map((t: string) => ({ type: 'paragraph', content: t }));

        for (const block of blocks) {
            // Text or Content
            const textContent = typeof block.content === 'string' ? block.content : (block.text || '');
            const safeText = escapeXml(textContent);

            const idAttr = block.id ? ` id="${block.id}"` : '';

            let classes = [];
            let styles = '';

            if (block.isCentered || block.style?.alignment === 'center') classes.push('center');
            if (block.style?.isBold) classes.push('bold');
            if (block.style?.isItalic) classes.push('italic');

            const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

            if (block.type === 'h1' || block.type === 'heading') { // Heuristic check level?
                // If it's a heading, verify if it should separate chapter
                xhtml += `<h1${idAttr}${classAttr}>${safeText}</h1>\n`;

                // Add to TOC if it looks like a chapter title
                if (safeText.length < 100) {
                    // logic could be added here
                }
            } else if (block.type === 'h2') {
                xhtml += `<h2${idAttr}${classAttr}>${safeText}</h2>\n`;
            } else if (block.type === 'image' && typeof block.content === 'object') {
                // Inline image logic would go here
            } else {
                // Link?
                if (block.linkToId) {
                    xhtml += `<p${classAttr}><a href="#${block.linkToId}">${safeText}</a></p>\n`;
                } else {
                    xhtml += `<p${idAttr}${classAttr}>${safeText}</p>\n`;
                }
            }
        }
        xhtml += `</body></html>`;

        // Add to Zip
        this.zip.folder("OEBPS")?.file(filename, xhtml);

        // Update Metadata
        this.manifestItems.push(`<item id="${itemID}" href="${filename}" media-type="application/xhtml+xml"/>`);
        this.spineItems.push(`<itemref idref="${itemID}"/>`);
        this.tocNavPoints.push(`
        <navPoint id="navPoint-${pageNum}" playOrder="${pageNum}">
            <navLabel><text>Page ${pageNum}</text></navLabel>
            <content src="${filename}"/>
        </navPoint>`);
    }

    async finalize(): Promise<Blob> {
        const title = this.metadata.title || "Converted Document";
        const author = this.metadata.author || "ConvertLocally User";

        // Generate content.opf
        const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>${escapeXml(title)}</dc:title>
        <dc:creator opf:role="aut">${escapeXml(author)}</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="BookId" opf:scheme="UUID">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        ${this.manifestItems.join("\n")}
    </manifest>
    <spine toc="ncx">
        ${this.spineItems.join("\n")}
    </spine>
</package>`;

        // Generate toc.ncx
        const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:12345"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="${this.pageCount}"/>
        <meta name="dtb:maxPageNumber" content="${this.pageCount}"/>
    </head>
    <docTitle><text>${escapeXml(title)}</text></docTitle>
    <navMap>
        ${this.tocNavPoints.join("\n")}
    </navMap>
</ncx>`;

        this.zip.folder("OEBPS")?.file("content.opf", opf);
        this.zip.folder("OEBPS")?.file("toc.ncx", ncx);

        return await this.zip.generateAsync({ type: "blob" });
    }
}
