/**
 * Capability Registry
 * 
 * Maps operations to their required capabilities and default constraints.
 * This is the source of truth for what capabilities each tool needs.
 */

import { CapabilityType, CapabilityTemplate, CapabilityConstraints } from './capability-types';

/**
 * Registry of all operations and their capability requirements
 */
export const CAPABILITY_REGISTRY: Record<string, CapabilityTemplate> = {
    // ===== PDF Operations =====
    "pdf.merge": {
        operation: "pdf.merge",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // Increased to 500MB
            max_files: 1, // 1 output file
            max_instructions: 100_000_000, // Increased
            max_duration_ms: 60_000, // Increased to 60 seconds
        },
        no_network: true,
        description: "Merge multiple PDF files into one",
    },

    "pdf.split": {
        operation: "pdf.split",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // Increased to 500MB
            max_files: 1000, // Max 1000 output pages
            max_instructions: 50_000_000,
            max_duration_ms: 30_000,
        },
        no_network: true,
        description: "Split PDF into individual pages",
    },

    "pdf.rotate": {
        operation: "pdf.rotate",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 1,
            max_instructions: 20_000_000,
            max_duration_ms: 15_000,
        },
        no_network: true,
        description: "Rotate PDF pages",
    },

    "pdf.compress": {
        operation: "pdf.compress",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // Increased to 500MB
            max_files: 1,
            max_instructions: 200_000_000, // Compression is CPU-intensive
            max_duration_ms: 120_000, // 2 minutes
        },
        no_network: true,
        description: "Compress PDF file size",
    },

    "pdf.password-protect": {
        operation: "pdf.password-protect",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 1,
            max_instructions: 20_000_000,
            max_duration_ms: 15_000,
        },
        no_network: true,
        description: "Add password protection to PDF",
    },

    "pdf.remove-password": {
        operation: "pdf.remove-password",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 1,
            max_instructions: 20_000_000,
            max_duration_ms: 15_000,
        },
        no_network: true,
        description: "Remove password from PDF",
    },

    "pdf.to-image": {
        operation: "pdf.to-image",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 500, // Max 500 pages
            max_instructions: 100_000_000, // Rendering is expensive
            max_duration_ms: 60_000,
        },
        no_network: true,
        description: "Convert PDF to image format",
    },

    "pdf.to-word": {
        operation: "pdf.to-word",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 1,
            max_instructions: 200_000_000,
            max_duration_ms: 120_000,
        },
        no_network: true,
        description: "Convert PDF to Word Document",
    },

    "pdf.to-epub": {
        operation: "pdf.to-epub",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 1,
            max_instructions: 200_000_000,
            max_duration_ms: 120_000,
        },
        no_network: true,
        description: "Convert PDF to EPUB",
    },

    "docx.to-pdf": {
        operation: "docx.to-pdf",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 1,
            max_instructions: 200_000_000,
            max_duration_ms: 60_000,
        },
        no_network: true,
        description: "Convert DOCX to PDF",
    },

    "xlsx.to-pdf": {
        operation: "xlsx.to-pdf",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 100 * 1024 * 1024, // 100MB
            max_files: 1,
            max_instructions: 100_000_000,
            max_duration_ms: 60_000,
        },
        no_network: true,
        description: "Convert Excel to PDF",
    },

    "pptx.to-pdf": {
        operation: "pptx.to-pdf",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 200 * 1024 * 1024, // 200MB
            max_files: 1,
            max_instructions: 100_000_000,
            max_duration_ms: 60_000,
        },
        no_network: true,
        description: "Convert PowerPoint to PDF",
    },

    "video.merge": {
        operation: "video.merge",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 2 * 1024 * 1024 * 1024, // 2GB
            max_files: 20,
            max_instructions: 1_000_000_000,
            max_duration_ms: 600_000, // 10 minutes
        },
        no_network: true,
        description: "Merge multiple videos into one",
    },

    "gif.convert": {
        operation: "gif.convert",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 100 * 1024 * 1024, // 100MB
            max_files: 1,
            max_instructions: 200_000_000,
            max_duration_ms: 120_000, // 2 minutes
        },
        no_network: true,
        description: "Convert animated image formats",
    },

    "ebook.convert": {
        operation: "ebook.convert",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // 500MB
            max_files: 1,
            max_instructions: 200_000_000,
            max_duration_ms: 120_000,
        },
        no_network: true,
        description: "Convert between ebook formats",
    },

    "document.convert": {
        operation: "document.convert",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // 500MB
            max_files: 1,
            max_instructions: 200_000_000,
            max_duration_ms: 120_000,
        },
        no_network: true,
        description: "Convert between document formats",
    },

    // ===== Image Operations =====
    "image.convert": {
        operation: "image.convert",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // Increased to 500MB
            max_files: 100, // Batch conversion
            max_instructions: 100_000_000,
            max_duration_ms: 60_000,
        },
        no_network: true,
        description: "Convert image format",
    },

    "image.rotate": {
        operation: "image.rotate",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024,
            max_files: 50,
            max_instructions: 20_000_000,
            max_duration_ms: 15_000,
        },
        no_network: true,
        description: "Rotate image",
    },

    "image.to-pdf": {
        operation: "image.to-pdf",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 500 * 1024 * 1024, // Increased to 500MB
            max_files: 1, // One PDF output
            max_instructions: 100_000_000,
            max_duration_ms: 60_000,
        },
        no_network: true,
        description: "Convert images to PDF",
    },

    // ===== Audio/Video Operations =====
    "audio.convert": {
        operation: "audio.convert",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 1024 * 1024 * 1024, // Increased to 1GB
            max_files: 1,
            max_instructions: 500_000_000, // FFmpeg is CPU-intensive
            max_duration_ms: 300_000, // 5 minutes
        },
        no_network: true,
        description: "Convert audio format",
    },

    "video.to-gif": {
        operation: "video.to-gif",
        requires: [
            CapabilityType.FILE_READ,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 1024 * 1024 * 1024, // Increased to 1GB
            max_files: 1,
            max_instructions: 500_000_000, // Very CPU-intensive
            max_duration_ms: 300_000, // 5 minutes
        },
        no_network: true,
        description: "Convert video to GIF",
    },

    // ===== Remote/Network Operations (EXPLICITLY ALLOWED) =====
    "cloud.import": {
        operation: "cloud.import",
        requires: [
            CapabilityType.NETWORK_FETCH,
            CapabilityType.FILE_WRITE,
            CapabilityType.CPU_EXECUTE,
            CapabilityType.MEMORY_ALLOCATE,
        ],
        default_constraints: {
            max_bytes: 100 * 1024 * 1024,
            max_files: 1,
            max_instructions: 10_000_000,
            max_duration_ms: 60_000,
            allowed_methods: ["GET"],
        },
        no_network: false, // Network is required
        description: "Import file from cloud storage",
    },
};

/**
 * Lookup capability requirement for a tool
 */
export function getCapabilityTemplate(toolId: string): CapabilityTemplate | null {
    // Map tool IDs to operation names
    const operationMap: Record<string, string> = {
        "merge-pdf": "pdf.merge",
        "split-pdf": "pdf.split",
        "rotate-pdf": "pdf.rotate",
        "compress-pdf": "pdf.compress",
        "pdf-password-protect": "pdf.password-protect",
        "pdf-remove-password": "pdf.remove-password",
        "pdf-to-jpg": "pdf.to-image",
        "pdf-to-image": "pdf.to-image",
        "pdf-converter": "pdf.to-image",
        "pdf-to-word": "pdf.to-word",
        "pdf-to-epub": "pdf.to-epub",
        "docx-to-pdf": "docx.to-pdf",
        "word-to-pdf": "docx.to-pdf",

        "convert-image": "image.convert",
        "rotate-image": "image.rotate",
        "image-to-pdf": "image.to-pdf",
        "jpg-to-pdf": "image.to-pdf",
        "webp-to-png": "image.convert",
        "webp-to-jpg": "image.convert",
        "png-to-jpg": "image.convert",
        "jpg-to-png": "image.convert",
        "heic-to-jpg": "image.convert",
        "heic-to-png": "image.convert",

        "mp4-to-mp3": "audio.convert",
        "audio-trim": "audio.convert",
        "audio-compress": "audio.convert",

        "video-to-gif": "video.to-gif",
        "mp4-to-gif": "video.to-gif",
        "webm-to-gif": "video.to-gif",
        "mov-to-gif": "video.to-gif",
        "gif-to-mp4": "video.to-gif",

        // New tool mappings
        "excel-to-pdf": "xlsx.to-pdf",
        "ppt-to-pdf": "pptx.to-pdf",
        "merge-video": "video.merge",
        "apng-to-gif": "gif.convert",
        "gif-to-apng": "gif.convert",
        "ebook-converter": "ebook.convert",
        "document-converter": "document.convert",

        "pdf-to-ppt": "pdf.to-word",
        "avi-to-gif": "video.to-gif",
        "jfif-to-png": "image.convert",
        "svg-to-png": "image.convert",
        "svg-to-jpg": "image.convert",
        "png-to-svg": "image.convert",
        "jpg-to-svg": "image.convert",
        "webp-to-svg": "image.convert",
        "md-to-pdf": "document.convert",
        "txt-to-pdf": "document.convert",
        "csv-to-pdf": "document.convert",
        "csv-to-xlsx": "document.convert",
        "html-to-pdf": "document.convert",
        "rtf-to-pdf": "document.convert",
        "avif-converter": "image.convert",
        "jpg-to-avif": "image.convert",
        "epub-to-mobi": "ebook.convert",
        "mobi-to-epub": "ebook.convert",
        "epub-to-pdf": "ebook.convert",
        "mobi-to-pdf": "ebook.convert",
        "rar-to-zip": "document.convert",
        "7z-to-zip": "document.convert",
        "tar-to-zip": "document.convert",
    };

    const operation = operationMap[toolId];
    if (!operation) {
        console.warn(`No capability template found for tool: ${toolId}`);
        return null;
    }

    return CAPABILITY_REGISTRY[operation] || null;
}

/**
 * Check if a tool requires network access
 */
export function requiresNetwork(toolId: string): boolean {
    const template = getCapabilityTemplate(toolId);
    return template ? !template.no_network : false;
}

/**
 * Get all capabilities required for a tool
 */
export function getRequiredCapabilities(toolId: string): CapabilityType[] {
    const template = getCapabilityTemplate(toolId);
    return template ? template.requires : [];
}

/**
 * Get default constraints for a tool
 */
export function getDefaultConstraints(toolId: string): CapabilityConstraints {
    const template = getCapabilityTemplate(toolId);
    return template ? template.default_constraints : {};
}
