import JSZip from 'jszip';
import { OutputBuilder } from './output-builder-interface';

// Helper to ensure JSZip is a constructor (ESM/CJS interop)
function createZip(): JSZip {
  if (typeof JSZip === 'function') {
    return new JSZip();
  }
  // @ts-ignore
  if (JSZip.default && typeof JSZip.default === 'function') {
    // @ts-ignore
    return new JSZip.default();
  }
  throw new Error("JSZip is not a constructor");
}

// Simple XML templates for valid DOCX
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="jpg" ContentType="image/jpeg"/>
<Default Extension="jpeg" ContentType="image/jpeg"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:eastAsia="Georgia" w:cs="Georgia"/><w:sz w:val="24"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="200" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="200" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="24"/></w:rPr><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="480" w:after="120"/><w:jc w:val="left"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="120"/><w:jc w:val="left"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80"/><w:jc w:val="left"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="29"/><w:qFormat/><w:pPr><w:spacing w:before="200" w:after="200"/><w:jc w:val="left"/></w:pPr><w:rPr><w:i/><w:iCs/></w:rPr></w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>
</w:styles>`;

function escapeXml(unsafe: string): string {
  return unsafe
    // Remove ALL characters from PUA, control, and non-printable ranges
    .replace(/[\uE000-\uFFFF\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const DOCUMENT_HEADER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" 
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" 
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" 
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" 
 xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<w:body>`;

const DOCUMENT_FOOTER = `<w:sectPr><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>`;

const FONT_MAP: Record<string, string> = {
  'Helvetica': 'Arial',
  'Times': 'Times New Roman',
  'Courier': 'Courier New',
  'Symbol': 'Symbol',
  'ZapfDingbats': 'Wingdings',
  'Arial': 'Arial',
  'Georgia': 'Georgia',
  'Verdana': 'Verdana'
};

function mapFont(pdfFont?: string): string {
  if (!pdfFont) return 'Arial';
  // Strip subsets (e.g., ABCDEF+FontName)
  const baseFont = pdfFont.includes('+') ? pdfFont.split('+')[1] : pdfFont;
  // Strip variants (e.g., FontName-Bold)
  const clean = baseFont.split('-')[0].split(',')[0].trim();
  return FONT_MAP[clean] || clean;
}

interface DocxRelationship {
  id: string;
  type: string;
  target: string;
  targetMode?: string;
}

// --- Enhanced Layout Engine Types ---

export interface TextStyle {
  fontName?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface TableData {
  rows: string[][];
  width: number;
}

export interface ImageData {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  extension: string;
}

export interface LayoutBlock {
  type: 'paragraph' | 'heading' | 'table' | 'image' | 'list';
  bounds: { x: number; y: number; width: number; height: number };
  content: string | TableData | ImageData;
  style: TextStyle;
}

// Minimal interface for what we expect from a PDF Page source (e.g. PDF.js or Custom)
export interface PDFPageSource {
  textItems: TextItem[];
  images?: ImageData[];
  width: number;
  height: number;
}

export interface TextItem {
  str: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
  width: number;
  height: number;
  fontName?: string;
  hasEOL?: boolean;
}

// --- Layout Detection Algorithms ---

export function detectLayoutBlocks(page: PDFPageSource): LayoutBlock[] {
  // 1. Detect Tables
  const tables = detectTables(page.textItems);

  // 2. Identify Images
  const imageBlocks: LayoutBlock[] = (page.images || []).map(img => ({
    type: 'image',
    bounds: { x: 0, y: 0, width: img.width, height: img.height }, // TODO: Real coords
    content: img,
    style: {}
  }));

  // 3. Reconstruct Paragraphs (excluding table content)
  const paragraphBlocks = reconstructParagraphs(page.textItems); // Simplified passing

  return [...paragraphBlocks, ...imageBlocks]; // TODO: Merge and sort by Y
}

export function detectTables(textItems: TextItem[]): TableData[] {
  // Heuristic: Identifying grid-like structures
  // 1. Group by Y (Rows) to find lines
  // 2. Find consecutive rows with similar column structures (X coordinates)
  // 3. Extract cells

  // Implementation Note: Robust table detection requires analyzing X-intervals overlaps across multiple lines.
  // For the initial release, we prioritize text flow. 
  // Future: Integration with WASM-based layout analysis (e.g., Tabula-like logic).
  return [];
}

export function reconstructParagraphs(textItems: TextItem[]): LayoutBlock[] {
  if (!textItems || textItems.length === 0) return [];

  // 1. Group by Y coordinate (Lines)
  // PDF coordinates: Y typically increases downwards in PDF.js outputs, or upwards in raw PDF.
  // We assume standardized coordinates where top-left is 0,0.

  // Sort by Y, then X
  const sorted = [...textItems].sort((a, b) => {
    // fuzzy Y comparison
    if (Math.abs(a.transform[5] - b.transform[5]) > 4) {
      return b.transform[5] - a.transform[5]; // Sort top-to-bottom (assuming PDF coordinate system where higher Y is higher on page) -> Wait, usually PDF.js gives transform[5] as Y position from bottom?
      // Actually standard PDF is bottom-left origin. So higher Y = top.
      // If using PDF.js textContent, transform[5] is y translation.
    }
    return a.transform[4] - b.transform[4]; // Left-to-right
  });

  const lines: TextItem[][] = [];
  let currentLine: TextItem[] = [];
  let lastY = -Infinity;

  for (const item of sorted) {
    if (currentLine.length === 0) {
      currentLine.push(item);
      lastY = item.transform[5];
      continue;
    }

    // Check if on same line (within loose tolerance)
    if (Math.abs(item.transform[5] - lastY) < 6) { // 6 unit tolerance
      currentLine.push(item);
    } else {
      // New line
      // Sort current line by X
      currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
      lines.push(currentLine);
      currentLine = [item];
      lastY = item.transform[5];
    }
  }
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
    lines.push(currentLine);
  }

  // 2. Group Lines into Paragraphs
  const blocks: LayoutBlock[] = [];
  let currentBlockText: string[] = [];
  let blockStartY = 0;
  let lastFontSize = 0;

  // Heuristic for font size to detect headings
  // Calculate mode font size for document body? For now simple absolute thresholds.

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineText = line.map(t => t.str).join(' ');
    // Estimate font size from first char (scaleY)
    const fontSize = Math.sqrt(line[0].transform[0] * line[0].transform[0] + line[0].transform[1] * line[0].transform[1]); // crude scale extraction

    // Check if new paragraph
    // - Significant Y gap?
    // - Font size change?
    // - Indentation? (Check X of first item)

    const isHeading = fontSize > 14 || (fontSize > 12 && /[A-Z]/.test(lineText[0])); // Simple heuristic

    if (currentBlockText.length > 0) {
      // Decide if we should break
      // If font size changes significantly -> Break
      if (Math.abs(fontSize - lastFontSize) > 2) {
        // Push old block
        blocks.push({
          type: lastFontSize > 14 ? 'heading' : 'paragraph',
          bounds: { x: 0, y: blockStartY, width: 600, height: 0 }, // TODO: Calc bounds
          content: currentBlockText.join(' '),
          style: { fontSize: lastFontSize }
        });
        currentBlockText = [];
        blockStartY = line[0].transform[5];
      }
    }

    if (currentBlockText.length === 0) {
      blockStartY = line[0].transform[5];
      lastFontSize = fontSize;
    }

    currentBlockText.push(lineText);
  }

  // Flush last block
  if (currentBlockText.length > 0) {
    blocks.push({
      type: lastFontSize > 14 ? 'heading' : 'paragraph',
      bounds: { x: 0, y: blockStartY, width: 600, height: 0 },
      content: currentBlockText.join(' '),
      style: { fontSize: lastFontSize }
    });
  }

  return blocks;
}

export class DocxStreamingBuilder implements OutputBuilder {
  private zip: JSZip;
  private documentXmlChunks: string[] = [];
  private relationships: DocxRelationship[] = [];
  private nextRelId = 1;
  private nextImageId = 1;
  private nextBookmarkId = 0;
  private lastPageMargins = '';

  private pageWidthTwips = 11906; // Default A4
  private pageHeightTwips = 16838;
  private pageWidthEmu = 7560000;  // EMU for 11906 TWIPS (approx)
  private pageHeightEmu = 10692000;
  private hasDetectedSize = false;

  constructor() {
    this.zip = createZip();
    console.log("[DocxStreamingBuilder] JSZip initialized successfully");
  }

  async initialize(): Promise<void> {
    this.zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
    this.zip.file("_rels/.rels", RELS_XML);
    this.zip.folder("word")?.file("styles.xml", STYLES_XML);

    // Define initial relationships (styles)
    this.addRelationship("http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles", "styles.xml");

    // Start document XML
    this.documentXmlChunks.push(DOCUMENT_HEADER);
  }

  private addRelationship(type: string, target: string, targetMode?: string): string {
    const id = `rId${this.nextRelId++}`;
    this.relationships.push({ id, type, target, targetMode });
    return id;
  }

  private setPageSize(widthPoints: number, heightPoints: number) {
    // Word uses TWIPS (1/1440 inch = 1/20 point)
    // and EMUs (1/914400 inch = 1/12700 point)
    this.pageWidthTwips = Math.round(widthPoints * 20);
    this.pageHeightTwips = Math.round(heightPoints * 20);
    this.pageWidthEmu = Math.round(widthPoints * 12700);
    this.pageHeightEmu = Math.round(heightPoints * 12700);
    this.hasDetectedSize = true;
    console.log(`[DocxStreamingBuilder] Page size set to: ${widthPoints}x${heightPoints}pt (${this.pageWidthTwips}x${this.pageHeightTwips} twips)`);
  }

  async addPage(pageContent: {
    textBlocks?: string[],
    layoutBlocks?: LayoutBlock[], // NEW: Optional input from Enhanced Engine
    blocks?: any[], // Legacy blocks
    hasImages?: boolean,
    pageNumber?: number,
    isLastPage?: boolean,
    width?: number, // Page width in points (72dpi)
    height?: number,
    viewport?: { width: number, height: number }, // Added viewport
    pageImage?: { buffer: ArrayBuffer, width: number, height: number, extension: string }
  }): Promise<void> {

    // 0. Detect Page Size from first page
    if (!this.hasDetectedSize) {
      const width = pageContent.width || pageContent.viewport?.width;
      const height = pageContent.height || pageContent.viewport?.height;

      if (width && height) {
        this.setPageSize(width, height);
      } else if (pageContent.pageImage) {
        // Fallback to aspect ratio from image
        const imgRatio = pageContent.pageImage.width / pageContent.pageImage.height;
        if (Math.abs(imgRatio - 0.7727) < 0.03) { // Letter
          this.setPageSize(612, 792);
        } else { // Default A4 (or match aspect)
          const baseWidth = imgRatio > 0.8 ? 612 : 595.3; // A4 width in pt
          this.setPageSize(baseWidth, baseWidth / imgRatio);
        }
      }
    }

    // 1. Enhanced Layout Engine Path
    let hasContent = false;

    if (pageContent.layoutBlocks && pageContent.layoutBlocks.length > 0) {
      console.log(`[DocxStreamingBuilder] Using Enhanced Layout Engine for page ${pageContent.pageNumber}`);
      for (const block of pageContent.layoutBlocks) {
        this.writeLayoutBlock(block);
        hasContent = true;
      }

      // Add page break if needed
      if (!pageContent.isLastPage && hasContent) {
        this.documentXmlChunks.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
      }
      return;
    }

    // 2. Handle Page Image (Scanned PDF Fallback or Cover)
    if (pageContent.pageImage) {
      const imgFileName = `image${this.nextImageId++}.${pageContent.pageImage.extension}`;
      this.zip.folder("word")?.folder("media")?.file(imgFileName, pageContent.pageImage.buffer);

      const rId = this.addRelationship(
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
        `media/${imgFileName}`
      );

      const imgWidth = pageContent.pageImage.width || 800;
      const imgHeight = pageContent.pageImage.height || 1100;
      const aspectRatio = imgWidth / imgHeight;

      let finalWidthEmu: number;
      let finalHeightEmu: number;

      if (aspectRatio > (this.pageWidthEmu / this.pageHeightEmu)) {
        finalWidthEmu = this.pageWidthEmu;
        finalHeightEmu = Math.round(this.pageWidthEmu / aspectRatio);
      } else {
        finalHeightEmu = this.pageHeightEmu;
        finalWidthEmu = Math.round(this.pageHeightEmu * aspectRatio);
      }

      const imageXml = `<w:p>
  <w:pPr><w:spacing w:line="0" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">
        <wp:simplePos x="0" y="0"/>
        <wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>
        <wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>
        <wp:extent cx="${finalWidthEmu}" cy="${finalHeightEmu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:wrapNone/>
        <wp:docPr id="${this.nextImageId}" name="Picture ${this.nextImageId}"/>
        <wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${this.nextImageId}" name="${imgFileName}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="${rId}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${finalWidthEmu}" cy="${finalHeightEmu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:anchor>
    </w:drawing>
  </w:r>
</w:p>`;

      this.documentXmlChunks.push(imageXml);
      hasContent = true;

      if (!pageContent.isLastPage && hasContent) {
        this.documentXmlChunks.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
      }
      return;
    }

    // 3. Handle Text Blocks (Normal Content)
    const blocks = pageContent.blocks || (pageContent.textBlocks || []).map((t: string) => ({ type: 'p', text: t }));
    for (const block of blocks) {
      this.writeLayoutBlock(block);
      hasContent = true;
    }

    // Add page break if needed - only if we actually wrote content
    if (!pageContent.isLastPage && hasContent) {
      this.documentXmlChunks.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }
  }

  private writeLayoutBlock(block: any): void {
    if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'p' || block.type === 'h1' || block.type === 'h2') {
      const type = block.type;
      const isHeading = (type === 'h1' || type === 'h2' || type === 'heading') || (block.maxFontHeight && block.maxFontHeight > 14);

      const runs = block.runs || [{
        text: block.content || block.text || "",
        isBold: block.isBold,
        isItalic: block.isItalic,
        fontHeight: block.fontHeight,
        fontName: block.fontName,
        style: block.style
      }];

      if (runs.length === 0 || (runs.length === 1 && !runs[0].text.trim())) return;

      const style = block.style || {};
      const alignment = block.alignment || style.alignment || 'left';
      const indent = block.indent || 0; // In points? PDF coords are points (72dpi), Word expects TWIPs (1/1440 inch = 1/20 point)
      const indentTwips = Math.round(indent * 20);

      let pPr = "";
      // Explicitly set spacing to avoid large default Word gaps
      const beforeSpacing = isHeading ? 240 : 0; // 12pt for headings, 0 for body
      const afterSpacing = isHeading ? 120 : 0;  // 6pt for headings, 0 for body
      pPr += `<w:spacing w:before="${beforeSpacing}" w:after="${afterSpacing}" w:line="240" w:lineRule="auto"/>`;

      if (isHeading) {
        const hStyle = (type === 'h1' || (block.maxFontHeight && block.maxFontHeight > 16)) ? "Heading1" : "Heading2";
        pPr += `<w:pStyle w:val="${hStyle}"/>`;
      }
      if (alignment && alignment !== 'left') {
        pPr += `<w:jc w:val="${alignment}"/>`;
      }
      if (indentTwips > 0) {
        pPr += `<w:ind w:left="${indentTwips}"/>`;
      }

      // Start Paragraph
      let xml = `<w:p><w:pPr>${pPr}</w:pPr>`;

      // Render Runs
      for (const run of runs) {
        const runText = run.text;
        if (!runText) continue;
        const safeText = escapeXml(runText);

        const runStyle = run.style || {};
        const isBold = run.isBold || runStyle.isBold || (isHeading && runs.length === 1);
        const isItalic = run.isItalic || runStyle.isItalic;
        const fontSize = run.fontHeight || runStyle.fontSize || (isHeading ? 16 : 12);
        const fontName = mapFont(run.fontName || runStyle.fontName);

        let rPr = `<w:rPr>`;
        rPr += `<w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>`;
        if (isBold) rPr += `<w:b/><w:bCs/>`;
        if (isItalic) rPr += `<w:i/><w:iCs/>`;

        // Color support (if passed from worker in future)
        if (run.color || style.color) {
          const hex = (run.color || style.color).replace('#', '');
          rPr += `<w:color w:val="${hex}"/>`;
        }

        if (block.linkUrl || block.linkToId) rPr += `<w:u w:val="single"/><w:color w:val="0563C1"/>`;
        rPr += `<w:sz w:val="${Math.round(fontSize * 2)}"/><w:szCs w:val="${Math.round(fontSize * 2)}"/>`;
        rPr += `</w:rPr>`;

        const runXml = `<w:r>${rPr}<w:t xml:space="preserve">${safeText}</w:t></w:r>`;

        if (block.linkUrl) {
          const rId = this.addRelationship("http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", block.linkUrl, "External");
          xml += `<w:hyperlink r:id="${rId}">${runXml}</w:hyperlink>`;
        } else if (block.linkToId) {
          xml += `<w:hyperlink w:anchor="${block.linkToId}">${runXml}</w:hyperlink>`;
        } else {
          xml += runXml;
        }
      }

      xml += `</w:p>`;
      this.documentXmlChunks.push(xml);
    }
    else if (block.type === 'table') {
      // Basic Table Implementation
      const tableData = block.content as TableData;
      if (!tableData || !tableData.rows) return;

      let tableXml = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0"/></w:tblPr>`;

      for (const row of tableData.rows) {
        tableXml += `<w:tr>`;
        for (const cellText of row) {
          tableXml += `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r><w:t>${escapeXml(cellText)}</w:t></w:r></w:p></w:tc>`;
        }
        tableXml += `</w:tr>`;
      }
      tableXml += `</w:tbl>`;
      this.documentXmlChunks.push(tableXml);
    }
    else if (block.type === 'image') {
      const imgData = block.content as ImageData;
      if (!imgData || !imgData.buffer) return;

      const imgFileName = `image_${this.nextImageId++}.${imgData.extension || 'jpg'}`;
      this.zip.folder("word")?.folder("media")?.file(imgFileName, imgData.buffer);

      const rId = this.addRelationship(
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
        `media/${imgFileName}`
      );

      // Convert PDF points to EMUs (1 pt = 12700 EMUs)
      // Usually the worker sends points.
      const widthEmu = Math.round((block.width || 200) * 12700);
      const heightEmu = Math.round((block.height || 200) * 12700);

      // Use wp:inline for images that should flow between paragraphs
      const inlineImageXml = `<w:p>
  <w:pPr>
    <w:jc w:val="${block.style?.alignment || 'center'}"/>
    <w:spacing w:before="120" w:after="120"/>
  </w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:docPr id="${this.nextImageId}" name="Picture ${this.nextImageId}"/>
        <wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${this.nextImageId}" name="${imgFileName}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="${rId}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>`;

      this.documentXmlChunks.push(inlineImageXml);
    }
  }

  async finalize(): Promise<Blob> {
    // Standard document section properties
    const finalSectPr = `<w:sectPr><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/><w:pgSz w:w="${this.pageWidthTwips}" w:h="${this.pageHeightTwips}"/></w:sectPr>`;
    this.documentXmlChunks.push(finalSectPr);
    this.documentXmlChunks.push(`</w:body></w:document>`);

    // 1. Write document.xml
    const fullXml = this.documentXmlChunks.join("");
    console.log(`[DocxStreamingBuilder] Finalizing. XML Length: ${fullXml.length}, Size: ${this.pageWidthTwips}x${this.pageHeightTwips}`);
    this.zip.folder("word")?.file("document.xml", fullXml);

    // 2. Write document.xml.rels (Dynamic)
    let relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;

    this.relationships.forEach(rel => {
      relsXml += `<Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"${rel.targetMode ? ` TargetMode="${rel.targetMode}"` : ""}/>`;
    });
    relsXml += `</Relationships>`;

    this.zip.folder("word")?.folder("_rels")?.file("document.xml.rels", relsXml);


    try {
      // Generate Zip Blob
      const blob = await this.zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 4 } // Balance speed/size
      });

      console.log(`[DocxStreamingBuilder] Generated Blob. Size: ${blob.size}, Type: ${blob.type}`);
      return blob;
    } catch (e) {
      console.error("[DocxStreamingBuilder] ZIP Generation Failed:", e);
      throw e;
    }
  }
}
