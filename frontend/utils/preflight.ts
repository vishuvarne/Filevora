export type ProcessingStrategy = 'WASM' | 'REMOTE' | 'REJECT';

export interface PreflightResult {
    strategy: ProcessingStrategy;
    reason?: string;
    estimatedTime?: string;
}

const MAX_WASM_SIZE = 50 * 1024 * 1024; // 50MB limit for WASM
const SUPPORTED_REMOTE_TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.ms-powerpoint', // ppt
    'video/mp4',
    'video/x-matroska', // mkv
    'video/quicktime', // mov
    'video/avi'
];

export const preflightCheck = (file: File): PreflightResult => {
    // 1. Check file size
    if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB absolute limit
        return {
            strategy: 'REJECT',
            reason: 'File is too large (Max 2GB)'
        };
    }

    // 2. Check for Video or Office Documents (Default to Remote for heavy formats)
    if (SUPPORTED_REMOTE_TYPES.includes(file.type) || file.name.match(/\.(doc|docx|ppt|pptx|mp4|mkv|mov|avi)$/i)) {
        return {
            strategy: 'REMOTE',
            reason: 'Format requires heavy processing engine.',
            estimatedTime: estimateRemoteTime(file.size)
        };
    }

    // 3. Fallback/Default for Images/PDFs -> WASM
    // But if it's huge, maybe suggest Remote? (For now, stick to simple logic)
    if (file.size > MAX_WASM_SIZE) {
        // If it is a PDF or Image but huge, might crash browser.
        // For now, let's keep it simple. If we had a remote PDF engine, we'd route here.
        // Assuming PDF specific tools handle their own logic, but let's be safe.
        if (file.type === 'application/pdf') {
            // PDF > 50MB might be slow in browser but usually okay.
            return { strategy: 'WASM', reason: 'Large file, might be slow.' };
        }
    }

    return { strategy: 'WASM' };
};

const estimateRemoteTime = (size: number): string => {
    // Rough calculation: 
    // ~1MB/s upload + process
    const seconds = Math.ceil(size / (1024 * 1024));
    if (seconds < 5) return 'Fast (< 5s)';
    if (seconds < 30) return '~30s';
    return '~' + Math.ceil(seconds / 60) + ' min';
};
