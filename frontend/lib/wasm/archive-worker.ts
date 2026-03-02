import { Archive } from 'libarchive.js';
import JSZip from 'jszip';

if (typeof window !== 'undefined') {
    Archive.init({
        workerUrl: '/workers/libs/worker-bundle.js'
    });
}

export interface ArchiveFile {
    file: File;
    path: string;
}

export class ArchiveWorker {
    public async extract(file: File, onProgress?: (percent: number) => void): Promise<ArchiveFile[]> {
        onProgress?.(10);
        const archive = await Archive.open(file);
        const files: ArchiveFile[] = [];

        onProgress?.(30);
        await archive.extractFiles((entry: { file: File; path: string }) => {
            files.push({
                file: entry.file,
                path: entry.path
            });
        });

        onProgress?.(100);
        return files;
    }

    public async list(file: File): Promise<string[]> {
        const archive = await Archive.open(file);
        const entries = await archive.getFilesObject();
        return Object.keys(entries);
    }

    /**
     * Create a ZIP archive from a list of files
     */
    public async createZip(files: ArchiveFile[], onProgress?: (percent: number) => void): Promise<Blob> {
        const zip = new JSZip();

        onProgress?.(10);
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            zip.file(f.path, f.file);
            onProgress?.(10 + (i / files.length) * 80);
        }

        const content = await zip.generateAsync({ type: "blob" });
        onProgress?.(100);
        return content;
    }
}
