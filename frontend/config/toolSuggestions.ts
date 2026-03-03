export const toolSuggestions: Record<string, string[]> = {
    // PDF Tools
    "merge-pdf": ["compress-pdf", "pdf-to-word"],
    "split-pdf": ["merge-pdf", "compress-pdf", "pdf-to-jpg"],
    "compress-pdf": ["merge-pdf", "pdf-to-word"],
    "pdf-to-word": ["word-to-pdf"],
    "word-to-pdf": ["compress-pdf", "merge-pdf"],
    "excel-to-pdf": ["compress-pdf"],
    "ppt-to-pdf": ["compress-pdf", "merge-pdf"],
    "pdf-to-jpg": ["image-to-pdf", "image-compressor", "convert-image"],
    "image-to-pdf": ["compress-pdf", "merge-pdf"],
    "jpg-to-pdf": ["compress-pdf", "merge-pdf"],

    // Image Tools — image-to-pdf is a top suggestion for all image tools
    "image-compressor": ["image-to-pdf", "image-resizer", "convert-image", "crop-image"],
    "image-resizer": ["image-to-pdf", "image-compressor", "convert-image", "crop-image"],
    "crop-image": ["image-to-pdf", "image-resizer", "convert-image", "image-compressor"],
    "convert-image": ["image-to-pdf", "image-compressor", "image-resizer"],
    "collage-maker": ["image-to-pdf", "image-compressor", "image-resizer"],
    "meme-generator": ["image-to-pdf", "image-compressor", "convert-image"],
    "photo-editor": ["image-to-pdf", "image-compressor", "image-resizer"],

    // Video/Audio
    "video-to-mp4": ["compress-video", "trim-video"],
    "compress-video": ["video-to-mp4", "trim-video"],

    // Converters
    "unit-converter": ["time-converter", "length-converter"],
};

export const getSuggestedTools = (currentToolId: string): string[] => {
    return toolSuggestions[currentToolId] || ["image-to-pdf", "image-compressor", "merge-pdf", "convert-image"]; // Fallback to popular tools
};
