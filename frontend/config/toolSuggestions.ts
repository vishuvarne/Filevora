export const toolSuggestions: Record<string, string[]> = {
    // PDF Tools
    "merge-pdf": ["compress-pdf", "protect-pdf", "pdf-to-word"],
    "split-pdf": ["merge-pdf", "compress-pdf", "pdf-to-image"],
    "compress-pdf": ["protect-pdf", "merge-pdf", "pdf-to-word"],
    "pdf-to-word": ["word-to-pdf", "protect-pdf"],
    "pdf-to-excel": ["excel-to-pdf", "protect-pdf"],
    "pdf-to-ppt": ["ppt-to-pdf", "protect-pdf"],
    "word-to-pdf": ["compress-pdf", "merge-pdf", "protect-pdf"],
    "excel-to-pdf": ["compress-pdf", "protect-pdf"],
    "ppt-to-pdf": ["compress-pdf", "merge-pdf"],
    "protect-pdf": ["unlock-pdf", "compress-pdf"],
    "unlock-pdf": ["protect-pdf", "compress-pdf"],

    // Image Tools
    "image-compressor": ["image-resizer", "convert-image", "crop-image"],
    "image-resizer": ["image-compressor", "convert-image", "crop-image"],
    "crop-image": ["image-resizer", "convert-image", "image-compressor"],
    "convert-image": ["image-compressor", "image-resizer"],
    "collage-maker": ["image-compressor", "image-resizer"],
    "meme-generator": ["image-compressor", "convert-image"],
    "photo-editor": ["image-compressor", "image-resizer"],

    // Video/Audio
    "video-converter": ["video-compressor", "trim-video"],
    "video-compressor": ["video-converter", "trim-video"],

    // Converters
    "unit-converter": ["time-converter", "currency-converter"],
};

export const getSuggestedTools = (currentToolId: string): string[] => {
    return toolSuggestions[currentToolId] || ["image-compressor", "merge-pdf", "convert-image"]; // Fallback to popular tools
};
