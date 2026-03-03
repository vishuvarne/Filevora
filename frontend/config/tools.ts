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
    seoTitle?: string;
    seoDescription?: string;
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
    // --- Most Popular: Image to PDF (placed first for visibility) ---
    {
        id: "image-to-pdf",
        name: "Image to PDF",
        description: "Convert any image to PDF instantly. Support for JPG, PNG, WebP, HEIC and more. Combine multiple images into one PDF.",
        category: "PDF & Documents",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.red,
        endpoint: "/process/image-to-pdf",
        acceptedTypes: "image/*",
        multiple: true,
        seoTitle: "Image to PDF Converter - 100% Private & No Uploads | ConvertLocally",
        seoDescription: "Convert images (JPG, PNG, WebP) to PDF locally in your browser. Totally free, secure, and no uploaded files. No server storage."
    },
    {
        id: "jpg-to-pdf",
        name: "JPG to PDF",
        description: "Convert JPG and JPEG images to PDF. Combine multiple JPGs into a single PDF document.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.red,
        endpoint: "/process/image-to-pdf",
        acceptedTypes: "image/jpeg,image/jpg",
        multiple: true,
        seoTitle: "JPG to PDF Online Securely Without Uploading | ConvertLocally",
        seoDescription: "Combine JPG images into a single PDF locally on your device. Zero server upload ensures your photos stay 100% private."
    },
    // --- PDF & Documents ---
    /* Temporarily Disabled as requested
    {
        id: "edit-pdf",
        name: "Edit PDF",
        description: "Add text, fill forms, and annotate PDF documents directly in your browser. No upload required.",
        category: "PDF & Documents",
        iconPath: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.12l-2.673.891a.75.75 0 01-.95-.95l.89-2.672a4.5 4.5 0 011.12-1.89L16.862 4.487zm0 0L19.5 7.125",
        theme: THEMES.blue,
        endpoint: "/webapp",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        type: "interactive",
        seoTitle: "Edit PDF Online – Free Client-Side PDF Editor | ConvertLocally",
        seoDescription: "Edit PDF files directly in your browser. Add text, fill forms, and annotate PDFs without uploading. Fast, free, and secure."
    },
    */
    {
        id: "merge-pdf",
        name: "Merge PDF",
        description: "Combine multiple PDFs into one unified document.",
        category: "PDF & Documents",
        iconPath: "M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6",
        theme: THEMES.red,
        endpoint: "/process/merge-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: true,
        seoTitle: "Merge PDF Securely Without Uploading | ConvertLocally",
        seoDescription: "Combine multiple PDF files locally in your browser. 100% private, no server upload, and no file size limits. Fast, free, and secure."
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
        multiple: false,
        seoTitle: "Split PDF Offline in Browser – Private & Free | ConvertLocally",
        seoDescription: "Extract PDF pages securely inside your browser. No file upload, no size restriction, and absolute privacy for sensitive documents."
    },
    {
        id: "compress-pdf",
        name: "Compress PDF",
        description: "Reduce file size while maintaining quality.",
        category: "PDF & Documents",
        iconPath: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15h4.5M9 15l5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h-4.5M15 15v4.5M15 15l-5.25 5.25",
        theme: THEMES.green,
        endpoint: "/process/compress-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        seoTitle: "Compress Large PDFs Without Uploading | ConvertLocally",
        seoDescription: "Reduce large PDF sizes effortlessly without uploading to a server. High-speed local compression ensuring full privacy."
    },
    {
        id: "rotate-pdf",
        name: "Rotate PDF",
        description: "Rotate PDF pages.",
        category: "PDF & Documents",
        iconPath: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
        theme: THEMES.purple,
        endpoint: "/process/rotate-pdf",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        seoTitle: "Rotate PDF Pages Safely & Without Upload | ConvertLocally",
        seoDescription: "Fix PDF orientation locally in your browser. Fast, safe, and completely private—no documents hit our servers."
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
        multiple: false,
        seoTitle: "Private PDF Converter – Client-Side Processing | ConvertLocally",
        seoDescription: "Convert PDFs locally in your browser without data uploads. Experience offline-level security online for free."
    },
    /* Temporarily disabled: Heavy PDF to Office tools
    {
        id: "pdf-to-word",
        name: "PDF to Word",
        description: "Convert PDF documents to Word.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.blue,
        endpoint: "/process/pdf-to-word",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        seoTitle: "PDF to Word Converter – Free & Fast | ConvertLocally",
        seoDescription: "Convert PDF to Word online for free. Maintain formatting, fast processing, and secure file conversion with ConvertLocally. No signup required."
    },
    {
        id: "pdf-to-ppt",
        name: "PDF to PowerPoint",
        description: "Convert PDF documents to PowerPoint (PPTX).",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.orange,
        endpoint: "/process/pdf-to-ppt",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        seoTitle: "PDF to PowerPoint Converter Online – Free | ConvertLocally",
        seoDescription: "Convert PDF files to editable PowerPoint presentations online. Free, secure, and preserves layout with ConvertLocally."
    },
    */
    /* Temporarily disabled: Office tools
    {
        id: "word-to-pdf",
        name: "Word to PDF",
        description: "Convert Word documents to PDF.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.blue,
        endpoint: "/process/docx-to-pdf",
        acceptedTypes: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        multiple: false,
        seoTitle: "Word to PDF Converter Online – Free | ConvertLocally",
        seoDescription: "Convert Word documents to PDF instantly. Free, secure, and high-quality Word to PDF conversion powered by ConvertLocally."
    },
    {
        id: "excel-to-pdf",
        name: "Excel to PDF",
        description: "Convert Excel files to PDF.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.green,
        endpoint: "/process/xlsx-to-pdf",
        acceptedTypes: ".xlsx,.xls",
        multiple: false,
        seoTitle: "Excel to PDF Converter Online – Free | ConvertLocally",
        seoDescription: "Convert Excel files to PDF online instantly. Free, accurate, and secure document conversion with ConvertLocally."
    },
    {
        id: "ppt-to-pdf",
        name: "PowerPoint to PDF",
        description: "Convert PowerPoint to PDF.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.orange,
        endpoint: "/process/pptx-to-pdf",
        acceptedTypes: ".pptx,.ppt",
        multiple: false,
        seoTitle: "PPT to PDF Converter – Free & Fast | ConvertLocally",
        seoDescription: "Convert PowerPoint presentations to PDF online for free. Fast, secure, and high-quality conversion with ConvertLocally."
    },
    */
    {
        id: "pdf-to-jpg",
        name: "PDF to JPG",
        description: "Convert PDF pages to JPG images.",
        category: "PDF & Documents",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.yellow,
        endpoint: "/process/pdf-to-image",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false, // Backend expects single file
        presetOptions: { format: "jpeg" },
        seoTitle: "Convert PDF to JPG Locally – No Upload Required | ConvertLocally",
        seoDescription: "Extract images from PDF locally on your own machine. Secure, fast, and highly private processing."
    },
    /* Temporarily disabled: epub tools
    {
        id: "pdf-to-epub",
        name: "PDF to EPUB",
        description: "Convert PDF documents to EPUB.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.green,
        endpoint: "/process/pdf-to-epub",
        acceptedTypes: ".pdf,application/pdf",
        multiple: false,
        seoTitle: "PDF to EPUB Converter Online Free | ConvertLocally",
        seoDescription: "Convert PDF to EPUB ebook format online for free. Read your PDFs on any e-reader device."
    },
    {
        id: "epub-to-pdf",
        name: "EPUB to PDF",
        description: "Convert EPUB ebooks to PDF.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.red,
        endpoint: "/process/epub-to-pdf",
        acceptedTypes: ".epub",
        multiple: false,
        seoTitle: "EPUB to PDF Converter Online Free | ConvertLocally",
        seoDescription: "Convert EPUB ebooks to PDF online for free. Create printable versions of your ebooks instantly."
    },
    {
        id: "ebook-converter",
        name: "Ebook Converter",
        description: "Convert between ebook formats.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.green,
        endpoint: "/process/ebook-convert",
        acceptedTypes: "*",
        multiple: false,
        seoTitle: "Ebook Converter Online Free – EPUB, MOBI, PDF | ConvertLocally",
        seoDescription: "Convert between ebook formats online for free. Support for EPUB, MOBI, PDF, and more. No signup needed."
    },
    {
        id: "epub-to-mobi",
        name: "EPUB to MOBI",
        description: "Convert EPUB ebooks to MOBI format.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.green,
        endpoint: "/process/epub-to-mobi",
        acceptedTypes: ".epub",
        multiple: false,
        seoTitle: "EPUB to MOBI Converter Online Free | ConvertLocally",
        seoDescription: "Convert EPUB to MOBI for Kindle devices online for free. Fast, secure ebook conversion."
    },
    {
        id: "mobi-to-epub",
        name: "MOBI to EPUB",
        description: "Convert MOBI ebooks to EPUB format.",
        category: "PDF & Documents",
        iconPath: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
        theme: THEMES.green,
        endpoint: "/process/mobi-to-epub",
        acceptedTypes: ".mobi",
        multiple: false,
        seoTitle: "MOBI to EPUB Converter Online Free | ConvertLocally",
        seoDescription: "Convert MOBI to EPUB format online for free. Read your Kindle books on any e-reader."
    },
    {
        id: "document-converter",
        name: "Document Converter",
        description: "Convert generic documents.",
        category: "PDF & Documents",
        iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
        theme: THEMES.blue,
        endpoint: "/process/document-convert",
        acceptedTypes: "*",
        multiple: false,
        seoTitle: "Document Converter Online Free – Convert DOCX, XLSX, PPTX | ConvertLocally",
        seoDescription: "Convert between document formats online for free. Support for Word, Excel, PowerPoint, and PDF."
    },
    */

    // --- Image Tools ---
    {
        id: "convert-image",
        name: "Image Converter",
        description: "Convert images to various formats.",
        category: "Image",
        iconPath: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/*,.png,.jpeg,.jpg,.webp,.gif,.svg,.jxl,.avif,.heic,.heif,.ico,.bmp,.cur,.ani,.icns,.nef,.cr2,.hdr,.jpe,.mat,.pbm,.pfm,.pgm,.pnm,.ppm,.tiff,.jfif,.eps,.psd,.arw,.tif,.dng,.xcf,.rw2,.raf,.orf,.pef,.mos,.raw,.dcr,.crw,.cr3,.3fr,.erf,.mrw,.mef,.nrw,.srw,.sr2,.srf,.a,.aai,.ai,.art,.avs,.b,.bgr,.bgra,.bgro,.bmp2,.bmp3,.brf,.cal,.cals,.cin,.cip,.cmyk,.cmyka,.dcx,.dds,.dpx,.dxt1,.dxt5,.epdf,.epi,.eps2,.eps3,.epsf,.epsi,.ept,.ept2,.ept3,.exr,.farbfeld,.fax,.ff,.fit,.fits,.fl32,.fts,.ftxt,.g,.g3,.g4,.gif87,.gray,.graya,.group4,.hrz,.icb,.icon,.info,.ipl,.isobrl,.isobrl6,.j2c,.j2k,.jng,.jp2,.jpc,.jpm,.jps,.map,.miff,.mng,.mono,.mtv,.o,.otb,.pal,.palm,.pam,.pcd,.pcds,.pcl,.pct,.pcx,.pdb,.pgx,.phm,.picon,.pict,.pjpeg,.png00,.png24,.png32,.png48,.png64,.png8,.ps,.ps1,.ps2,.ps3,.psb,.ptif,.qoi,.r,.ras,.rgb,.rgba,.rgbo,.rgf,.sgi,.six,.sixel,.sparse-color,.strimg,.sun,.svgz,.tga,.tiff64,.ubrl,.ubrl6,.uil,.uyvy,.vda,.vicar,.viff,.vips,.vst,.wbmp,.wpg,.xbm,.xpm,.xv,.ycbcr,.ycbcra,.yuv",
        multiple: true,
        seoTitle: "Secure Image Converter – Browser-Based, No Uploads | ConvertLocally",
        seoDescription: "Convert any image format locally in your browser. Total privacy with no server access. Supports huge batches and 100+ formats."
    },
    {
        id: "jpg-to-png",
        name: "JPG to PNG",
        description: "Convert JPG to PNG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/jpeg,image/jpg",
        multiple: true,
        presetOptions: { target_format: "PNG" },
        seoTitle: "JPG to PNG Securely Without Uploads | ConvertLocally",
        seoDescription: "Convert JPG to PNG securely using local WASM technology. No images leave your device. Infinite batch conversions offline."
    },
    {
        id: "png-to-jpg",
        name: "PNG to JPG",
        description: "Convert PNG to JPG.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/png",
        multiple: true,
        presetOptions: { target_format: "JPEG" },
        seoTitle: "PNG to JPG Locally – 100% Private Format Conversion | ConvertLocally",
        seoDescription: "Change PNG to JPG fast in your browser. Strictly offline processing guarantees complete data security."
    },
    {
        id: "image-compressor",
        name: "Image Compressor",
        description: "Reduce image file size.",
        category: "Image",
        iconPath: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
        theme: THEMES.green,
        endpoint: "/webapp",
        acceptedTypes: "image/*",
        multiple: true,
        type: "interactive",
        seoTitle: "Compress Images 100% Locally Without Upload | ConvertLocally",
        seoDescription: "Make photos smaller natively in your browser. Ultra-secure client-side compression for limitless free images."
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
        multiple: false,
        seoTitle: "Rotate Image Offline in Browser – Private Tool | ConvertLocally",
        seoDescription: "Fix image orientation using purely local processing. No network payload."
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
        presetOptions: { target_format: "PNG" },
        seoTitle: "WebP to PNG Offline – Convert Locally Without Uploads | ConvertLocally",
        seoDescription: "Change WebP images to PNG directly in your browser. Complete privacy, zero upload limits, and instantly fast."
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
        presetOptions: { target_format: "PNG" },
        seoTitle: "JFIF to PNG Converter – No Server Upload Required | ConvertLocally",
        seoDescription: "Convert JFIF to PNG privately utilizing local device processing. Safe, free, and unlimited."
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
        multiple: false,
        seoTitle: "PNG to SVG Vectorizer – Private Browser Tool | ConvertLocally",
        seoDescription: "Trace raster images to SVG vector graphics without uploading your files. Secure client-side processing."
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
        presetOptions: { target_format: "JPEG" },
        seoTitle: "HEIC to JPG Securely – Browser-Based Offline Converter | ConvertLocally",
        seoDescription: "Convert iPhone HEIC photos to JPG offline in your browser. Protects personal photos by never uploading them."
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
        presetOptions: { target_format: "PNG" },
        seoTitle: "HEIC to PNG Converter Locally – Ultimate Privacy | ConvertLocally",
        seoDescription: "Convert Apple HEIC images to PNG without ever sending them to a server. 100% private processing."
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
        presetOptions: { target_format: "JPEG" },
        seoTitle: "WebP to JPG Offline Converter | ConvertLocally",
        seoDescription: "Save WebP as JPG using fast local processing. Maintain document security and skip slow uploads."
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
        multiple: true,
        seoTitle: "SVG Converter – Secure Local Image Processing | ConvertLocally",
        seoDescription: "Convert SVG to PNG or JPG securely without an internet connection using local browser execution."
    },
    {
        id: "avif-converter",
        name: "AVIF Converter",
        description: "Convert images to/from AVIF.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/*,image/avif",
        multiple: true,
        seoTitle: "AVIF Converter Locally – 100% Private Tool | ConvertLocally",
        seoDescription: "Convert AVIF files easily without file uploads. Fast client-side image transformation."
    },
    {
        id: "jpg-to-avif",
        name: "JPG to AVIF",
        description: "Compress JPG to AVIF for better quality.",
        category: "Image",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.blue,
        endpoint: "/process/convert-image",
        acceptedTypes: "image/jpeg,image/jpg",
        multiple: true,
        presetOptions: { target_format: "AVIF" },
        seoTitle: "JPG to AVIF Offline – Max Compression, Zero Uploads | ConvertLocally",
        seoDescription: "Compress JPG to next-gen AVIF privately inside your browser. No file size limits or paywalls."
    },

    // --- Video & Audio Tools ---
    /* Temporarily disabled: Video and audio tools are very heavy
    {
        id: "mp4-to-mp3",
        name: "MP4 to MP3",
        description: "Extract audio from video files. Processed locally - no upload required.",
        category: "Video & Audio",
        iconPath: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z",
        theme: THEMES.purple,
        endpoint: "/process/mp4-to-mp3",
        acceptedTypes: "video/*,.mp4,.mov,.avi,.mkv,.webm",
        multiple: false,
        seoTitle: "MP4 to MP3 Converter – Free Audio Extractor | ConvertLocally",
        seoDescription: "Extract audio from MP4 videos to MP3 format. Free, fast, and secure conversion processed locally in your browser."
    },
    {
        id: "audio-trim",
        name: "Audio Trim",
        description: "Cut and trim audio files. Works offline in your browser.",
        category: "Video & Audio",
        iconPath: "M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664",
        theme: THEMES.blue,
        endpoint: "/process/audio-trim",
        acceptedTypes: "audio/*,.mp3,.wav,.m4a,.aac,.ogg",
        multiple: false,
        seoTitle: "Audio Trimmer Online – Cut Audio Files Free | ConvertLocally",
        seoDescription: "Trim and cut audio files online for free. Fast audio editing in your browser with ConvertLocally."
    },
    {
        id: "audio-compress",
        name: "Audio Compress",
        description: "Reduce audio file size while maintaining quality.",
        category: "Video & Audio",
        iconPath: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15h4.5M9 15l5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h-4.5M15 15v4.5M15 15l-5.25 5.25",
        theme: THEMES.green,
        endpoint: "/process/audio-compress",
        acceptedTypes: "audio/*,.mp3,.wav,.m4a,.aac",
        multiple: false,
        seoTitle: "Compress Audio Files Online – Free | ConvertLocally",
        seoDescription: "Compress audio files to reduce size without quality loss. Free online audio compression with ConvertLocally."
    },
    */

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
        multiple: false,
        seoTitle: "Video to GIF Securely Offline | ConvertLocally",
        seoDescription: "Convert local video files to animated GIFs safely in your browser. Complete privacy without server uploads."
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
        multiple: false,
        seoTitle: "MP4 to GIF Converter Offline – Browser Based | ConvertLocally",
        seoDescription: "Animate MP4 files to GIF natively inside your browser. No size limits and fast, secure conversion."
    },
    {
        id: "webm-to-gif",
        name: "WEBM to GIF",
        description: "Convert WEBM to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/webm-to-gif",
        acceptedTypes: "video/webm",
        multiple: false,
        seoTitle: "WebM to GIF – No Upload Secure Converter | ConvertLocally",
        seoDescription: "Create GIFs from WebM directly on your device. Zero servers required for complete data privacy."
    },
    {
        id: "apng-to-gif",
        name: "APNG to GIF",
        description: "Convert APNG to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/apng-to-gif",
        acceptedTypes: "image/apng,image/png",
        multiple: false,
        seoTitle: "APNG to GIF Safely Without Upload | ConvertLocally",
        seoDescription: "Change Animated PNG to GIF perfectly matching your local privacy constraints. Client-side execution."
    },
    {
        id: "gif-to-mp4",
        name: "GIF to MP4",
        description: "Convert GIF to MP4 video.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/gif-to-mp4",
        acceptedTypes: "image/gif",
        multiple: false,
        seoTitle: "GIF to MP4 Offline Converter – Client Side Tool | ConvertLocally",
        seoDescription: "Transform GIF format to MP4 using browser WASM tech. Faster downloads and 100% private processing."
    },
    {
        id: "gif-to-apng",
        name: "GIF to APNG",
        description: "Convert GIF to APNG.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/gif-to-apng",
        acceptedTypes: "image/gif",
        multiple: false,
        seoTitle: "GIF to APNG Converter – Local Browser Execution | ConvertLocally",
        seoDescription: "Securely generate APNGs from GIFs. Convert media entirely offline via local web standards."
    },
    {
        id: "image-to-gif",
        name: "Image to GIF",
        description: "Convert images to GIF.",
        category: "GIF",
        iconPath: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
        theme: THEMES.gray,
        endpoint: "/process/images-to-gif",
        acceptedTypes: "image/*",
        multiple: true,
        seoTitle: "Image to GIF Converter Free – No Upload Security | ConvertLocally",
        seoDescription: "Stitch multiple images into a high-quality GIF inside your web interface securely and locally."
    },
    {
        id: "mov-to-gif",
        name: "MOV to GIF",
        description: "Convert MOV to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/mov-to-gif",
        acceptedTypes: "video/quicktime",
        multiple: false,
        seoTitle: "MOV to GIF Locally – Perfect Privacy Protection | ConvertLocally",
        seoDescription: "Animation extraction natively executed by your computer's browser. Safe, fast, offline support."
    },
    {
        id: "avi-to-gif",
        name: "AVI to GIF",
        description: "Convert AVI to GIF.",
        category: "GIF",
        iconPath: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
        theme: THEMES.gray,
        endpoint: "/process/avi-to-gif",
        acceptedTypes: "video/x-msvideo",
        multiple: false,
        seoTitle: "AVI to GIF Converter – 100% Secured | ConvertLocally",
        seoDescription: "No connection required. Transform ancient AVI files to web GIFs efficiently, keeping local bounds safe."
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
        type: "interactive",
        seoTitle: "Length Converter Online Free – Meters, Feet | ConvertLocally",
        seoDescription: "Convert between length units. Meters to feet, inches to cm, miles to km, and more."
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
        type: "interactive",
        seoTitle: "Weight Converter Online Free – KG, LB | ConvertLocally",
        seoDescription: "Convert between weight units. Kilograms to pounds, ounces to grams, and more."
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
        type: "interactive",
        seoTitle: "Temperature Converter Online Free | ConvertLocally",
        seoDescription: "Convert Celsius to Fahrenheit, Kelvin, and more. Free online temperature converter."
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
        type: "interactive",
        seoTitle: "Speed Converter Online Free | ConvertLocally",
        seoDescription: "Convert between speed units online. MPH to KPH, knots, and more."
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
        type: "interactive",
        seoTitle: "Volume Converter Online Free | ConvertLocally",
        seoDescription: "Convert between volume units. Liters to gallons, cups to ml, and more."
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
        type: "interactive",
        seoTitle: "Area Converter Online Free | ConvertLocally",
        seoDescription: "Convert between area units. Square feet to square meters, acres, hectares."
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
        type: "interactive",
        seoTitle: "UTC Time Converter Online Free | ConvertLocally",
        seoDescription: "Convert UTC time to local time. Free online UTC clock and timezone converter."
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
        type: "interactive",
        seoTitle: "Time Zone Map Online Free | ConvertLocally",
        seoDescription: "Interactive world time zone map. View current time across all time zones."
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
        type: "interactive",
        seoTitle: "PST to EST Time Converter Online Free | ConvertLocally",
        seoDescription: "Convert Pacific to Eastern time online. Quick timezone comparison tool."
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
        multiple: false,
        seoTitle: "RAR to ZIP Converter Online Free | ConvertLocally",
        seoDescription: "Convert RAR to ZIP online for free. Open and re-compress RAR archives to universally compatible ZIP."
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
        multiple: false,
        seoTitle: "7Z Extractor Online Free – Open 7Z Files | ConvertLocally",
        seoDescription: "Extract 7Z files online for free. Open and decompress 7-Zip archives directly in your browser."
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
        multiple: false,
        seoTitle: "TAR.GZ Converter Online Free | ConvertLocally",
        seoDescription: "Open and convert TAR.GZ archives online for free. Extract compressed Linux archives in your browser."
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
        type: "interactive",
        seoTitle: "Unit Converter Online Free – All-in-One | ConvertLocally",
        seoDescription: "Convert any units online for free. Length, weight, temperature, volume, area, speed."
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
        type: "interactive",
        seoTitle: "Time Converter Online Free | ConvertLocally",
        seoDescription: "Convert between time units. Hours to minutes, seconds, milliseconds, and more."
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
        multiple: false,
        seoTitle: "Archive Converter Online Free – ZIP, RAR, 7Z, TAR | ConvertLocally",
        seoDescription: "Convert between archive formats online for free. Support for ZIP, RAR, 7Z, TAR.GZ, and more."
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
        type: "interactive",
        seoTitle: "Chat with PDF AI – Fully Local Browser Processing | ConvertLocally",
        seoDescription: "Interact with private PDFs safely. The AI processing remains fully internal without compromising cloud document uploads."
    },
    // --- Video Tools ---
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
        presetOptions: { target_format: "mp3" },
        seoTitle: "Video to MP3 Converter Online Free | ConvertLocally",
        seoDescription: "Extract audio from video as MP3 online for free. Convert any video to MP3 audio."
    },

    // --- Audio Tools ---
    {
        id: "compress-audio",
        name: "Compress Audio",
        description: "Reduce audio file size.",
        category: "Video & Audio",
        iconPath: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
        theme: THEMES.green,
        endpoint: "/process/compress-audio",
        acceptedTypes: "audio/*",
        multiple: false,
        seoTitle: "Audio Converter Online – Free & Secure | ConvertLocally",
        seoDescription: "Convert audio files to MP3, WAV, and more online for free. Fast and secure audio conversion with ConvertLocally."
    },
    {
        id: "convert-audio",
        name: "Audio Converter",
        description: "Convert audio between formats.",
        category: "Video & Audio",
        iconPath: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
        theme: THEMES.blue,
        endpoint: "/process/convert-audio",
        acceptedTypes: "audio/*,video/*,.mp3,.wav,.flac,.ogg,.mogg,.oga,.opus,.aac,.alac,.m4a,.caf,.wma,.amr,.ac3,.aiff,.aifc,.aif,.mp1,.mp2,.mpc,.dsd,.dsf,.dff,.mqa,.au,.m4b,.voc,.weba,.mkv,.mp4,.avi,.mov,.webm,.ts,.mts,.m2ts,.wmv,.mpg,.mpeg,.flv,.f4v,.vob,.m4v,.3gp,.3g2,.mxf,.ogv,.rm,.rmvb,.divx",
        multiple: false,
        presetOptions: { target_format: "mp3" },
        seoTitle: "Audio Converter Online Free – MP3, WAV, OGG | ConvertLocally",
        seoDescription: "Convert between audio formats online for free. MP3, WAV, OGG, FLAC, AAC supported."
    },
    {
        id: "volume-booster",
        name: "Volume Booster",
        description: "Increase audio volume.",
        category: "Video & Audio",
        iconPath: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
        theme: THEMES.purple,
        endpoint: "/process/volume-booster",
        acceptedTypes: "audio/*",
        multiple: false,
        seoTitle: "Volume Booster Online Free – Increase Audio Volume | ConvertLocally",
        seoDescription: "Boost audio volume online for free. Increase the volume of MP3, WAV, and other audio files."
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
        type: "interactive",
        seoTitle: "Voice Recorder Online Free | ConvertLocally",
        seoDescription: "Record audio in your browser for free. Save as MP3 or WAV. No installation needed."
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
        type: "interactive",
        seoTitle: "Photo Collage Maker Offline – Secure Local Rendering | ConvertLocally",
        seoDescription: "Draft beautiful photo composites directly in-browser. Zero limits and 100% offline security."
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
        type: "interactive",
        seoTitle: "Image Resizer Secure Online App | ConvertLocally",
        seoDescription: "Scale your photos up and down inside your private local browser runtime effortlessly."
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
        type: "interactive",
        seoTitle: "Crop Image Locally – Secure Browser Editing | ConvertLocally",
        seoDescription: "Safely cut unecessary margins from files completely without third-party server exposure."
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
        type: "interactive",
        seoTitle: "Color Picker Online Free – HEX, RGB, HSL | ConvertLocally",
        seoDescription: "Pick colors from any image. Get HEX, RGB, HSL values. Extract color palettes instantly."
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
        type: "interactive",
        seoTitle: "Meme Generator Offline – Private Humor App | ConvertLocally",
        seoDescription: "Attach text over images entirely in your local browser state safely and instantaneously."
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
        type: "interactive",
        seoTitle: "Photo Editor Locally – Browser-Integrated App | ConvertLocally",
        seoDescription: "Modify color levels offline natively without relying on insecure external connections."
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
        type: "interactive",
        seoTitle: "QR Code Generator Online Free | ConvertLocally",
        seoDescription: "Generate QR codes online for free. Create QR codes for URLs, text, WiFi, and more."
    },

];
