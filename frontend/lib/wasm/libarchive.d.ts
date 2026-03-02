declare module 'libarchive.js/main' {
    export class Archive {
        static init(options: { workerUrl: string }): void;
        static open(file: File): Promise<Archive>;
        extractFiles(callback: (entry: { file: File; path: string }) => void): Promise<void>;
        getFilesObject(): Promise<Record<string, any>>;
    }
}
