export type ToolId = string;

export interface ToolDef {
    id: ToolId;
    name: string;
    description: string;
    category: "Video & Audio" | "Image" | "PDF & Documents" | "GIF" | "Others" | "Popular";
    iconPath: string;
    theme: {
        text: string;
        bg: string;
        bgLight: string;
        gradient: string;
        hoverShadow: string;
        iconColor: string;
        border: string;
        fromTo: string;
    };
    endpoint: string;
    acceptedTypes: string;
    multiple: boolean;
    presetOptions?: Record<string, string | number>;
    type?: "file" | "interactive"; // default is 'file'
}

const THEMES = {
    red: {
        text: "text-red-600",
        bg: "bg-red-500",
        bgLight: "bg-red-50",
        gradient: "bg-gradient-to-r from-red-500 to-red-600",
        hoverShadow: "hover:shadow-red-200/50",
        iconColor: "text-red-600",
        border: "border-red-200",
        fromTo: "from-gray-50 to-red-50"
    },
    blue: {
        text: "text-blue-600",
        bg: "bg-blue-500",
        bgLight: "bg-blue-50",
        gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
        hoverShadow: "hover:shadow-blue-200/50",
        iconColor: "text-blue-600",
        border: "border-blue-200",
        fromTo: "from-gray-50 to-blue-50"
    },
    green: {
        text: "text-green-600",
        bg: "bg-green-500",
        bgLight: "bg-green-50",
        gradient: "bg-gradient-to-r from-green-500 to-green-600",
        hoverShadow: "hover:shadow-green-200/50",
        iconColor: "text-green-600",
        border: "border-green-200",
        fromTo: "from-gray-50 to-green-50"
    },
    orange: {
        text: "text-orange-600",
        bg: "bg-orange-500",
        bgLight: "bg-orange-50",
        gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
        hoverShadow: "hover:shadow-orange-200/50",
        iconColor: "text-orange-600",
        border: "border-orange-200",
        fromTo: "from-gray-50 to-orange-50"
    },
    purple: {
        text: "text-purple-600",
        bg: "bg-purple-500",
        bgLight: "bg-purple-50",
        gradient: "bg-gradient-to-r from-purple-500 to-purple-600",
        hoverShadow: "hover:shadow-purple-200/50",
        iconColor: "text-purple-600",
        border: "border-purple-200",
        fromTo: "from-gray-50 to-purple-50"
    },
    yellow: {
        text: "text-yellow-600",
        bg: "bg-yellow-500",
        bgLight: "bg-yellow-50",
        gradient: "bg-gradient-to-r from-yellow-500 to-yellow-600",
        hoverShadow: "hover:shadow-yellow-200/50",
        iconColor: "text-yellow-600",
        border: "border-yellow-200",
        fromTo: "from-gray-50 to-yellow-50"
    },
    gray: {
        text: "text-slate-600",
        bg: "bg-slate-500",
        bgLight: "bg-slate-50",
        gradient: "bg-gradient-to-r from-slate-500 to-slate-600",
        hoverShadow: "hover:shadow-slate-200/50",
        iconColor: "text-slate-600",
        border: "border-slate-200",
        fromTo: "from-gray-50 to-slate-50"
    }
};

export const TOOLS: ToolDef[] = [
    // --- PDF & Documents ---
    {
        id: "merge-pdf",
        name: "Merge PDF",
        description: "Combine multiple PDFs into one unified document.",
        category: "PDF & Documents",
        iconPath: "M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6",
        theme: THEMES.red,
        endpoint: "/process/merge-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: true
    },
    {
        id: "split-pdf",
        name: "Split PDF",
        description: "Extract pages from your PDF files.",
        category: "PDF & Documents",
        iconPath: "M3.75 4.5h16.5M3.75 12h16.5m-16.5 7.5h16.5",
        theme: THEMES.orange,
        endpoint: "/process/split-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false
    },
    {
        id: "compress-pdf",
        name: "Compress PDF",
        description: "Reduce file size while analyzing quality.",
        category: "PDF & Documents",
        iconPath: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15h4.5M9 15l5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h-4.5M15 15v4.5M15 15l-5.25 5.25",
        theme: THEMES.green,
        endpoint: "/process/compress-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false
    },
    {
        id: "pdf-converter",
        name: "PDF Converter",
        description: "Convert PDFs to various formats.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.red,
        endpoint: "/process/pdf-to-image",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false
    },
    {
        id: "pdf-to-word",
        name: "PDF to Word",
        description: "Convert PDF documents to Word.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.blue,
        endpoint: "/process/pdf-to-word",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false
    },
    {
        id: "pdf-to-jpg",
        name: "PDF to JPG",
        description: "Convert PDF pages to JPG images.",
        category: "PDF & Documents",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.yellow,
        endpoint: "/process/pdf-to-image",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        presetOptions: { format: "jpeg" }
    },
    {
        id: "pdf-to-epub",
        name: "PDF to EPUB",
        description: "Convert PDF documents to EPUB.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.green,
        endpoint: "/process/pdf-to-epub",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false
    },
    {
        id: "epub-to-pdf",
        name: "EPUB to PDF",
        description: "Convert EPUB ebooks to PDF.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.red,
        endpoint: "/coming-soon",
        acceptedTypes: ".epub",
        multiple: false
    },
    {
        id: "image-to-pdf",
        name: "Image to PDF",
        description: "Convert any image to PDF.",
        category: "PDF & Documents",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.red,
        endpoint: "/process/image-to-pdf",
        acceptedTypes: "image/*",
        multiple: true
    },
    {
        id: "docx-to-pdf",
        name: "DOCX to PDF",
        description: "Convert Word documents to PDF.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.blue,
        endpoint: "/process/docx-to-pdf",
        acceptedTypes: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        multiple: false
    },
    {
        id: "jpg-to-pdf",
        name: "JPG to PDF",
        description: "Convert JPG images to PDF.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.red,
        endpoint: "/process/image-to-pdf",
        acceptedTypes: "image/jpeg,image/jpg",
        multiple: true
    },
    {
        id: "ebook-converter",
        name: "Ebook Converter",
        description: "Convert between ebook formats.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.green,
        endpoint: "/coming-soon",
        acceptedTypes: "*",
        multiple: false
    },
    {
        id: "document-converter",
        name: "Document Converter",
        description: "Convert generic documents.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.blue,
        endpoint: "/coming-soon",
        acceptedTypes: "*",
        multiple: false
    },

    // --- Image Tools ---
    {
        id: "convert-image",
        name: "Image Converter",
        description: "Convert images to various formats.",
        category: "Image",
        iconPath: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/*",
        multiple: true
    },
    {
        id: "rotate-image",
        name: "Rotate Image",
        description: "Rotate images easily.",
        category: "Image",
        iconPath: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
        theme: THEMES.purple,
        endpoint: "/process/rotate-image",
        acceptedTypes: "image/*",
        multiple: false
    },
    {
        id: "webp-to-png",
        name: "WEBP to PNG",
        description: "Convert WEBP to PNG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/webp",
        multiple: true,
        presetOptions: { target_format: "PNG" }
    },
    {
        id: "jfif-to-png",
        name: "JFIF to PNG",
        description: "Convert JFIF to PNG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/jpeg,image/pjpeg", // JFIF is technically JPEG
        multiple: true,
        presetOptions: { target_format: "PNG" }
    },
    {
        id: "png-to-svg",
        name: "PNG to SVG",
        description: "Convert PNG to SVG vector.",
        category: "Image",
        iconPath: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m0 0c-1.153 1.62-2.181 3.32-3.073 5.072a15.993 15.993 0 01-3.692-2.31",
        theme: THEMES.purple,
        endpoint: "/coming-soon",
        acceptedTypes: "image/png",
        multiple: false
    },
    {
        id: "heic-to-jpg",
        name: "HEIC to JPG",
        description: "Convert HEIC to JPG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image", // Fallback to generic, expecting backend support or fail
        acceptedTypes: ".heic,image/heic",
        multiple: true,
        presetOptions: { target_format: "JPEG" }
    },
    {
        id: "heic-to-png",
        name: "HEIC to PNG",
        description: "Convert HEIC to PNG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: ".heic,image/heic",
        multiple: true,
        presetOptions: { target_format: "PNG" }
    },
    {
        id: "webp-to-jpg",
        name: "WEBP to JPG",
        description: "Convert WEBP to JPG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/webp",
        multiple: true,
        presetOptions: { target_format: "JPEG" }
    },
    {
        id: "svg-converter",
        name: "SVG Converter",
        description: "Convert files to/from SVG.",
        category: "Image",
        iconPath: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m0 0c-1.153 1.62-2.181 3.32-3.073 5.072a15.993 15.993 0 01-3.692-2.31",
        theme: THEMES.purple,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/*,image/svg+xml",
        multiple: true
    },

    // --- GIF Tools (Placeholder) ---
    {
        id: "video-to-gif",
        name: "Video to GIF",
        description: "Create GIFs from video.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/video-to-gif",
        acceptedTypes: "video/*",
        multiple: false
    },
    {
        id: "mp4-to-gif",
        name: "MP4 to GIF",
        description: "Convert MP4 to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/video-to-gif",
        acceptedTypes: "video/mp4",
        multiple: false
    },
    {
        id: "webm-to-gif",
        name: "WEBM to GIF",
        description: "Convert WEBM to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "video/webm",
        multiple: false
    },
    {
        id: "apng-to-gif",
        name: "APNG to GIF",
        description: "Convert APNG to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "image/apng,image/png",
        multiple: false
    },
    {
        id: "gif-to-mp4",
        name: "GIF to MP4",
        description: "Convert GIF to MP4 video.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "image/gif",
        multiple: false
    },
    {
        id: "gif-to-apng",
        name: "GIF to APNG",
        description: "Convert GIF to APNG.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "image/gif",
        multiple: false
    },
    {
        id: "image-to-gif",
        name: "Image to GIF",
        description: "Convert images to GIF.",
        category: "GIF",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "image/*",
        multiple: true
    },
    {
        id: "mov-to-gif",
        name: "MOV to GIF",
        description: "Convert MOV to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "video/quicktime",
        multiple: false
    },
    {
        id: "avi-to-gif",
        name: "AVI to GIF",
        description: "Convert AVI to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "video/x-msvideo",
        multiple: false
    },


    // --- Utils/Converters (Mapped to UnitConverter) ---
    {
        id: "length-converter",
        name: "Length Converter",
        description: "Convert basic length units.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", // Generic
        theme: THEMES.blue,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "weight-converter",
        name: "Weight Converter",
        description: "Convert weight units.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.green,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "temperature-converter",
        name: "Temperature Converter",
        description: "Celsius to Fahrenheit and more.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.red,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "speed-converter",
        name: "Speed Converter",
        description: "Convert speed units.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.orange,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "volume-converter",
        name: "Volume Converter",
        description: "Convert volume units.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.purple,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "area-converter",
        name: "Area Converter",
        description: "Convert area measurement units.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.yellow,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },

    // --- Time Tools (Mapped to TimeConverter) ---
    {
        id: "utc-converter",
        name: "UTC Converter",
        description: "Convert local time to UTC.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.gray,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "time-zone-map",
        name: "Time Zone Map",
        description: "Visual time zone map.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.gray,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "pst-to-est",
        name: "PST to EST",
        description: "Convert PST to EST time.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.gray,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },

    // --- Utilities ---
    {
        id: "rar-to-zip",
        name: "RAR to Zip",
        description: "Convert RAR archives to Zip.",
        category: "Others",
        iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
        theme: THEMES.gray,
        endpoint: "/process/archive-convert",
        acceptedTypes: ".rar",
        multiple: false
    },
    {
        id: "7z-extractor",
        name: "7z Extractor",
        description: "Extract 7z files online.",
        category: "Others",
        iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
        theme: THEMES.gray,
        endpoint: "/process/archive-convert",
        acceptedTypes: ".7z",
        multiple: false
    },
    {
        id: "tar-gz-converter",
        name: "Tar.gz Converter",
        description: "Convert Tar.gz files.",
        category: "Others",
        iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
        theme: THEMES.gray,
        endpoint: "/process/archive-convert",
        acceptedTypes: ".tar.gz,.tgz",
        multiple: false
    },

    // --- Others/Converters ---
    {
        id: "unit-converter",
        name: "Unit Converter",
        description: "Convert units of measurement.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "time-converter",
        name: "Time Converter",
        description: "Convert time zones and durations.",
        category: "Others",
        iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "archive-converter",
        name: "Archive Converter",
        description: "Convert zip, rar, 7z archives.",
        category: "Others",
        iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
        theme: THEMES.gray,
        endpoint: "/coming-soon",
        acceptedTypes: ".zip,.rar,.7z",
        multiple: false
    },

    // --- AI Tools ---
    {
        id: "chat-with-pdf",
        name: "Chat with PDF",
        description: "Analyze and chat with your PDF documents using AI.",
        category: "PDF & Documents", // Fitting it into PDF category as per user mental model, or could be separate.
        iconPath: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
        theme: THEMES.purple,
        endpoint: "/process/chat-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        type: "interactive"
    },
    // --- Video Tools ---
    {
        id: "merge-video",
        name: "Merge Video",
        description: "Combine multiple videos into one.",
        category: "Video & Audio",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.red,
        endpoint: "/coming-soon", // Needs more complex logic
        acceptedTypes: "video/*",
        multiple: true
    },
    {
        id: "compress-video",
        name: "Compress Video",
        description: "Reduce video size without losing quality.",
        category: "Video & Audio",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.green,
        endpoint: "/process/compress-video",
        acceptedTypes: "video/*",
        multiple: false
    },
    {
        id: "video-to-mp4",
        name: "Video to MP4",
        description: "Convert any video to MP4 format.",
        category: "Video & Audio",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.blue,
        endpoint: "/process/convert-video",
        acceptedTypes: "video/*",
        multiple: false,
        presetOptions: { target_format: "mp4" }
    },
    {
        id: "video-to-mp3",
        name: "Video to MP3",
        description: "Extract audio from video files.",
        category: "Video & Audio",
        iconPath: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z",
        theme: THEMES.purple,
        endpoint: "/process/extract-audio",
        acceptedTypes: "video/*",
        multiple: false,
        presetOptions: { target_format: "mp3" }
    },
    {
        id: "trim-video",
        name: "Trim Video",
        description: "Cut out unwanted parts of your video.",
        category: "Video & Audio",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.orange,
        endpoint: "/coming-soon",
        acceptedTypes: "video/*",
        multiple: false
    },

    // --- Audio Tools ---
    {
        id: "compress-audio",
        name: "Compress Audio",
        description: "Reduce audio file size.",
        category: "Video & Audio",
        iconPath: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
        theme: THEMES.green,
        endpoint: "/coming-soon",
        acceptedTypes: "audio/*",
        multiple: false
    },
    {
        id: "convert-audio",
        name: "Audio Converter",
        description: "Convert audio between formats.",
        category: "Video & Audio",
        iconPath: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
        theme: THEMES.blue,
        endpoint: "/process/convert-audio",
        acceptedTypes: "audio/*",
        multiple: false,
        presetOptions: { target_format: "mp3" }
    },
    {
        id: "volume-booster",
        name: "Volume Booster",
        description: "Increase audio volume.",
        category: "Video & Audio",
        iconPath: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
        theme: THEMES.purple,
        endpoint: "/coming-soon",
        acceptedTypes: "audio/*",
        multiple: false
    },
    {
        id: "voice-recorder",
        name: "Voice Recorder",
        description: "Record your voice online.",
        category: "Video & Audio",
        iconPath: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z",
        theme: THEMES.red,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },

    // --- Web Apps (Footer) ---
    {
        id: "collage-maker",
        name: "Collage Maker",
        description: "Combine multiple images into a single collage.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.purple,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: true,
        type: "interactive"
    },
    {
        id: "image-resizer",
        name: "Image Resizer",
        description: "Resize images to any dimensions.",
        category: "Image",
        iconPath: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
        theme: THEMES.blue,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "crop-image",
        name: "Crop Image",
        description: "Crop and trim your images.",
        category: "Image",
        iconPath: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        theme: THEMES.green,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "color-picker",
        name: "Color Picker",
        description: "Pick colors and get HEX, RGB, and CSS values.",
        category: "Image",
        iconPath: "M4.098 19.902a3.75 3.75 0 005.304 0l.75-.75A3.75 3.75 0 0113.5 16.5h3.75m.75-9a3.75 3.75 0 00-3.75-3.75H13.5a3.75 3.75 0 00-3.75 3.75m0 0V12m0-6.75h.008v.008H16.5V5.25m0 6.75h.008v.008h-.008v-.008m0 6.75h.008v.008h-.008v-.008m0-6.75h.008v.008h-.008V12",
        theme: THEMES.orange,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "meme-generator",
        name: "Meme Generator",
        description: "Create memes with custom text on images.",
        category: "Image",
        iconPath: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z",
        theme: THEMES.yellow,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "photo-editor",
        name: "Photo Editor",
        description: "Adjust brightness, contrast, and more.",
        category: "Image",
        iconPath: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m0 0c-1.153 1.62-2.181 3.32-3.073 5.072a15.993 15.993 0 01-3.692-2.31",
        theme: THEMES.red,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "qr-code-generator",
        name: "QR Code Generator",
        description: "Generate QR codes from text or URLs.",
        category: "Others",
        iconPath: "M3.75 4.5a.75.75 0 00-.75.75v14.25c0 .414.336.75.75.75h14.25a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H3.75zM20.25 6v12H4.5V6h15.75zM6 10.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V10.5zm3 3a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-3zm3-6a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V10.5a.75.75 0 00-.75-.75h-.008z",
        theme: THEMES.gray,
        endpoint: "/webapp",
        acceptedTypes: "*",
        multiple: false,
        type: "interactive"
    },
    {
        id: "image-compressor",
        name: "Image Compressor",
        description: "Reduce image file size with quality and format options.",
        category: "Image",
        iconPath: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15h4.5M9 15l5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h-4.5M15 15v4.5M15 15l-5.25 5.25",
        theme: THEMES.green,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: false,
        type: "interactive"
    },
];
