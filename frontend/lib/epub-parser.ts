
import JSZip from 'jszip';

export interface EbookChapter {
    title: string;
    content: string; // HTML or Text
}

export class EpubParser {
    async parse(file: File): Promise<EbookChapter[]> {
        const zip = new JSZip();
        // @ts-ignore
        const content = await zip.loadAsync(file);

        // Find container.xml to locate OPF
        const containerXml = await content.file('META-INF/container.xml')?.async('string');
        if (!containerXml) throw new Error('Invalid EPUB: Missing META-INF/container.xml');

        const opfPath = this.extractOpfPath(containerXml);
        if (!opfPath) throw new Error('Invalid EPUB: Could not find OPF path');

        const opfContent = await content.file(opfPath)?.async('string');
        if (!opfContent) throw new Error('Invalid EPUB: Missing OPF file');

        // Parse OPF to get spine and manifest
        const manifest = this.parseManifest(opfContent, opfPath);
        const spine = this.parseSpine(opfContent);

        const chapters: EbookChapter[] = [];

        for (const itemId of spine) {
            const path = manifest[itemId];
            if (path) {
                const fileContent = await content.file(path)?.async('string');
                if (fileContent) {
                    chapters.push({
                        title: this.extractTitle(fileContent) || `Chapter ${chapters.length + 1}`,
                        content: this.processContent(fileContent)
                    });
                }
            }
        }

        return chapters;
    }

    private extractOpfPath(containerXml: string): string | null {
        const match = containerXml.match(/full-path="([^"]+)"/);
        return match ? match[1] : null;
    }

    private parseManifest(opf: string, opfPath: string): Record<string, string> {
        const manifest: Record<string, string> = {};
        const baseDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

        // Simple regex parser for manifest (robust enough for most valid EPUBs)
        const itemRegex = /<item\s+[^>]*id="([^"]+)"\s+[^>]*href="([^"]+)"/g;
        let match;
        while ((match = itemRegex.exec(opf)) !== null) {
            // resolve path relative to OPF
            manifest[match[1]] = baseDir + match[2];
        }
        return manifest;
    }

    private parseSpine(opf: string): string[] {
        const spine: string[] = [];
        const itemrefRegex = /<itemref\s+[^>]*idref="([^"]+)"/g;
        let match;
        while ((match = itemrefRegex.exec(opf)) !== null) {
            spine.push(match[1]);
        }
        return spine;
    }

    private extractTitle(html: string): string | null {
        // Try to find h1 or title tag
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        return titleMatch ? titleMatch[1].trim() : null;
    }

    private processContent(html: string): string {
        // Strip HTML body content only
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return bodyMatch ? bodyMatch[1] : html;
    }
}
