// Tool metadata for enhanced information display
export interface ToolMetadata {
    processingTime: 'instant' | 'fast' | 'medium' | 'slow';
    processingTimeDescription: string;
    batchSupport: boolean;
    estimatedSpeed?: string;
}

export const TOOL_METADATA: Record<string, ToolMetadata> = {
    // PDF Tools
    'merge-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 3 seconds',
        batchSupport: true,
        estimatedSpeed: '~100 pages/sec'
    },
    'split-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: false,
        estimatedSpeed: '~150 pages/sec'
    },
    'compress-pdf': {
        processingTime: 'medium',
        processingTimeDescription: '3-10 seconds',
        batchSupport: false,
        estimatedSpeed: 'Depends on size'
    },
    'pdf-to-image': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~50 pages/sec'
    },
    'image-to-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 3 seconds',
        batchSupport: true,
        estimatedSpeed: '~100 images/sec'
    },
    'pdf-to-word': {
        processingTime: 'medium',
        processingTimeDescription: '5-15 seconds',
        batchSupport: false,
        estimatedSpeed: '~30 pages/sec'
    },
    'word-to-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~50 pages/sec'
    },
    'pdf-to-excel': {
        processingTime: 'medium',
        processingTimeDescription: '5-15 seconds',
        batchSupport: false,
        estimatedSpeed: '~20 pages/sec'
    },
    'excel-to-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~40 sheets/sec'
    },
    'pdf-to-ppt': {
        processingTime: 'medium',
        processingTimeDescription: '5-15 seconds',
        batchSupport: false,
        estimatedSpeed: '~25 pages/sec'
    },
    'ppt-to-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~30 slides/sec'
    },
    'rotate-pdf': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: false,
        estimatedSpeed: '~200 pages/sec'
    },
    'pdf-to-text': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 3 seconds',
        batchSupport: false,
        estimatedSpeed: '~80 pages/sec'
    },

    // Image Tools
    'image-compressor': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },
    'convert-image': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~50 images/sec'
    },
    'image-resizer': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },
    'crop-image': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },
    'photo-editor': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },
    'heic-to-jpg': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 3 seconds',
        batchSupport: true,
        estimatedSpeed: '~40 images/sec'
    },
    'png-to-jpg': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~60 images/sec'
    },
    'jpg-to-png': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~60 images/sec'
    },
    'webp-to-jpg': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~55 images/sec'
    },
    'jpg-to-webp': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~55 images/sec'
    },
    'png-to-webp': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~55 images/sec'
    },
    'webp-to-png': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~55 images/sec'
    },
    'svg-to-png': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~70 images/sec'
    },
    'png-to-svg': {
        processingTime: 'medium',
        processingTimeDescription: '5-10 seconds',
        batchSupport: false,
        estimatedSpeed: '~15 images/sec'
    },
    'jfif-to-jpg': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 2 seconds',
        batchSupport: true,
        estimatedSpeed: '~70 images/sec'
    },
    'apng-to-gif': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 3 seconds',
        batchSupport: false,
        estimatedSpeed: '~25 frames/sec'
    },

    // Video & Audio Tools
    'compress-video': {
        processingTime: 'slow',
        processingTimeDescription: '30-120 seconds',
        batchSupport: false,
        estimatedSpeed: '~0.5x realtime'
    },
    'video-to-gif': {
        processingTime: 'medium',
        processingTimeDescription: '10-30 seconds',
        batchSupport: false,
        estimatedSpeed: '~1x realtime'
    },
    'video-converter': {
        processingTime: 'slow',
        processingTimeDescription: '30-120 seconds',
        batchSupport: false,
        estimatedSpeed: '~0.8x realtime'
    },
    'trim-video': {
        processingTime: 'medium',
        processingTimeDescription: '5-20 seconds',
        batchSupport: false,
        estimatedSpeed: '~2x realtime'
    },
    'video-to-audio': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~5x realtime'
    },
    'compress-audio': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~10x realtime'
    },
    'audio-converter': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~8x realtime'
    },
    'video-to-mp4': {
        processingTime: 'medium',
        processingTimeDescription: '10-40 seconds',
        batchSupport: false,
        estimatedSpeed: '~1x realtime'
    },
    'mp4-to-webm': {
        processingTime: 'medium',
        processingTimeDescription: '10-40 seconds',
        batchSupport: false,
        estimatedSpeed: '~1x realtime'
    },
    'webm-to-mp4': {
        processingTime: 'medium',
        processingTimeDescription: '10-40 seconds',
        batchSupport: false,
        estimatedSpeed: '~1x realtime'
    },

    // GIF Tools
    'gif-compressor': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~30 frames/sec'
    },
    'gif-to-video': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~40 frames/sec'
    },
    'gif-resizer': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 5 seconds',
        batchSupport: false,
        estimatedSpeed: '~35 frames/sec'
    },
    'reverse-gif': {
        processingTime: 'fast',
        processingTimeDescription: 'Usually under 3 seconds',
        batchSupport: false,
        estimatedSpeed: '~50 frames/sec'
    },

    // Web Apps (Client-side)
    'collage-maker': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: true,
        estimatedSpeed: 'Instant'
    },
    'meme-generator': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },
    'color-picker': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },
    'qr-code-generator': {
        processingTime: 'instant',
        processingTimeDescription: 'Client-side, instant',
        batchSupport: false,
        estimatedSpeed: 'Instant'
    },

    // Other Tools
    'epub-to-pdf': {
        processingTime: 'medium',
        processingTimeDescription: '10-30 seconds',
        batchSupport: false,
        estimatedSpeed: '~50 pages/sec'
    },
    'pdf-to-epub': {
        processingTime: 'medium',
        processingTimeDescription: '10-30 seconds',
        batchSupport: false,
        estimatedSpeed: '~40 pages/sec'
    },
};

// Helper function to get metadata for a tool
export function getToolMetadata(toolId: string): ToolMetadata | undefined {
    return TOOL_METADATA[toolId];
}

// Get processing time badge color
export function getProcessingTimeColor(time: ToolMetadata['processingTime']): string {
    switch (time) {
        case 'instant':
            return 'text-green-600 dark:text-green-400';
        case 'fast':
            return 'text-blue-600 dark:text-blue-400';
        case 'medium':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'slow':
            return 'text-orange-600 dark:text-orange-400';
        default:
            return 'text-muted-foreground';
    }
}
