export interface OutputBuilder {
    initialize(): Promise<void>;
    addPage(pageContent: any): Promise<void>;
    finalize(): Promise<Blob>; // Returns final file
}
