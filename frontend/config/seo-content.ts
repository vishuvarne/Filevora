export interface ToolSEOContent {
    keywords: string[];
    howToSteps: {
        step1: { title: string; description: string };
        step2: { title: string; description: string };
        step3: { title: string; description: string };
    };
    useCases: { title: string; desc: string; icon: "briefcase" | "academic" | "database" }[];
    faqs: { question: string; answer: string }[];
}

export const GENERIC_USE_CASES = [
    {
        title: "For Professionals",
        desc: "Ensure your documents meet industry standards. Perfect for contracts, reports, and presentations.",
        icon: "briefcase" as const
    },
    {
        title: "For Students",
        desc: "Submit assignments in the correct format. Easily handle PDFs, research papers, and images.",
        icon: "academic" as const
    },
    {
        title: "Save Storage",
        desc: "Optimize files without losing quality to free up space on your device or cloud storage.",
        icon: "database" as const
    }
];

export const TOOL_SEO_CONTENT: Record<string, ToolSEOContent> = {
    // --- HIGH PRIORITY PDF TOOLS ---
    "edit-pdf": {
        keywords: [
            "edit pdf", "pdf editor", "edit pdf online", "free pdf editor",
            "add text to pdf", "type on pdf", "fill pdf form", "pdf editor free no upload",
            "edit pdf offline", "annotate pdf", "pdf text editor"
        ],
        howToSteps: {
            step1: { title: "Open PDF", description: "Select the PDF document you want to edit from your device." },
            step2: { title: "Add Text & Annotate", description: "Click anywhere on the document to add text. Change fonts, colors, and sizes easily." },
            step3: { title: "Save Changes", description: "Click Export to instantly save your modified PDF without it ever leaving your browser." }
        },
        useCases: [
            { title: "Fill Forms", desc: "Easily complete and sign PDF forms for government, business, or school applications.", icon: "briefcase" },
            { title: "Annotate Notes", desc: "Add typed notes, highlights, and corrections directly onto your lecture PDFs.", icon: "academic" },
            { title: "Secure Editing", desc: "Edit sensitive financial or medical documents securely without uploading them to any cloud server.", icon: "database" }
        ],
        faqs: [
            { question: "Is it safe to edit PDFs with this tool?", answer: "Yes, our PDF Editor processes your document entirely in your browser. Your sensitive files are never uploaded to our servers, ensuring 100% privacy." },
            { question: "Can I edit existing text in the PDF?", answer: "Currently, you can add new text, fill forms, and annotate. Modifying existing text requires advanced capabilities that we are still developing." },
            { question: "Is this tool completely free?", answer: "Yes, you can edit and export as many PDFs as you want without watermarks or hidden fees." }
        ]
    },
    "image-to-pdf": {
        keywords: [
            "image to pdf", "image to pdf converter", "convert image to pdf",
            "photo to pdf", "picture to pdf", "convert photo to pdf online",
            "image to pdf converter online free", "convert image to pdf online",
            "jpg png to pdf", "convert photos to pdf", "combine images into pdf",
            "multiple images to pdf", "free image to pdf no watermark",
            "image to pdf converter no signup", "best image to pdf converter",
            "convert screenshot to pdf", "scan to pdf online", "picture to pdf converter"
        ],
        howToSteps: {
            step1: { title: "Upload your Images", description: "Select or drag & drop JPG, PNG, WebP or HEIC images into the converter box." },
            step2: { title: "Adjust Order", description: "If you uploaded multiple images, drag to reorder them exactly how you want them in the PDF." },
            step3: { title: "Convert & Download", description: "Click the Convert button to instantly merge your images into a secure PDF document." }
        },
        useCases: [
            { title: "Digitize Receipts", desc: "Easily turn photos of receipts into professional PDFs for expense reports or accounting.", icon: "briefcase" },
            { title: "Submit Assignments", desc: "Compile photos of your handwritten homework into a single, neat PDF file for submission.", icon: "academic" },
            { title: "Archive Photos", desc: "Combine related memories into a single PDF album that takes up less space and is easy to share.", icon: "database" }
        ],
        faqs: [
            { question: "How do I convert an image to PDF for free?", answer: "Upload your image (JPG, PNG, WebP, HEIC, BMP, or TIFF) to ConvertLocally's Image to PDF converter. Click convert, and your PDF is ready to download instantly. No signup, no watermark, completely free." },
            { question: "Can I combine multiple images into one PDF?", answer: "Yes! ConvertLocally lets you upload multiple images at once and combines them into a single PDF document. Each image gets its own page, perfectly centered on A4-sized pages." },
            { question: "What image formats can I convert to PDF?", answer: "ConvertLocally supports all major image formats: JPG/JPEG, PNG, WebP, HEIC (iPhone photos), BMP, TIFF, GIF, and AVIF. Simply drag and drop any image file to convert it to PDF." },
            { question: "Is it safe to convert images to PDF online?", answer: "ConvertLocally processes all conversions directly in your browser using WebAssembly. Your files never leave your device — they are not uploaded to any server. This makes it the most secure image to PDF converter available." },
            { question: "How do I convert a photo from my phone to PDF?", answer: "Open ConvertLocally on your phone's browser, tap the upload area to select photos from your gallery, and tap convert. Works on iPhone (HEIC photos), Android, and all mobile devices. No app installation needed." }
        ]
    },
    "jpg-to-pdf": {
        keywords: [
            "jpg to pdf", "jpeg to pdf", "jpg to pdf converter",
            "convert jpg to pdf", "jpg to pdf online free",
            "convert jpeg to pdf online", "merge jpg to pdf",
            "multiple jpg to pdf", "best jpg to pdf converter",
            "jpg to pdf converter online free no watermark",
            "how to convert jpg to pdf", "free jpg to pdf converter"
        ],
        howToSteps: {
            step1: { title: "Upload JPG Images", description: "Select one or more JPEG/JPG photos from your device to begin the conversion." },
            step2: { title: "Sort Images", description: "Drag and drop the uploaded photos to arrange them in the correct page order." },
            step3: { title: "Save as PDF", description: "Click Convert to seamlessly merge your JPG files into a single, high-quality PDF." }
        },
        useCases: [
            { title: "Business Documents", desc: "Convert scanned JPEG documents into professional PDF formats for client sharing.", icon: "briefcase" },
            { title: "Study Materials", desc: "Turn JPEG pictures of textbook pages into a consolidated study PDF.", icon: "academic" },
            { title: "Portfolio Creation", desc: "Easily compile your best JPG photography work into a single portfolio document.", icon: "database" }
        ],
        faqs: [
            { question: "How to convert JPG to PDF online for free?", answer: "Upload your JPG file to ConvertLocally's JPG to PDF converter. The conversion happens instantly in your browser — no signup, no watermark, completely free. Download your PDF with one click." },
            { question: "Can I merge multiple JPG files into one PDF?", answer: "Yes! Upload multiple JPG images and ConvertLocally will combine them into a single multi-page PDF. Each JPG becomes a separate page, centered and scaled to fit A4 size." },
            { question: "Is there a file size limit for JPG to PDF conversion?", answer: "ConvertLocally supports JPG files up to 100MB each. Since conversion happens locally in your browser, there are no server-side limits. You can convert as many files as you want, completely free." }
        ]
    },
    "merge-pdf": {
        keywords: [
            "merge pdf files online free", "combine pdf documents", "join pdf files",
            "merge multiple pdfs into one", "pdf merger online no watermark",
            "combine pdf files online", "merge pdf free", "how to merge pdfs"
        ],
        howToSteps: {
            step1: { title: "Select PDF Files", description: "Choose two or more PDF documents you want to combine from your computer." },
            step2: { title: "Reorder Pages", description: "Drag and drop the PDF files to set the exact order they should appear in the merged document." },
            step3: { title: "Combine PDFs", description: "Click the Merge button to instantly join all your files into a single continuous PDF." }
        },
        useCases: [
            { title: "Contract Assembly", desc: "Combine multiple contract pages, appendixes, and signature pages into one final document.", icon: "briefcase" },
            { title: "Research Synthesis", desc: "Merge various PDF articles, notes, and sources into one comprehensive research folder.", icon: "academic" },
            { title: "Clean Up Storage", desc: "Join multiple related mini-PDFs into single categorized files for better organization.", icon: "database" }
        ],
        faqs: [
            { question: "How do I merge PDF files online for free?", answer: "Upload multiple PDF files to ConvertLocally's Merge PDF tool. Drag to reorder if needed, then click merge. Your combined PDF is ready to download instantly. No signup required." },
            { question: "Does merging PDFs reduce quality?", answer: "No, merging PDFs with ConvertLocally simply combines the pages without altering the quality or resolution of the original files." },
            { question: "Is my merged PDF secure?", answer: "Yes, merging happens securely in your browser. Your files are never stored on our servers, ensuring total privacy." }
        ]
    },
    "compress-pdf": {
        keywords: [
            "compress pdf online free", "reduce pdf size", "shrink pdf file",
            "make pdf smaller", "pdf compressor no quality loss",
            "compress pdf to 100kb", "compress pdf to 200kb", "reduce pdf file size free"
        ],
        howToSteps: {
            step1: { title: "Upload Large PDF", description: "Select the oversized PDF document you need to compress." },
            step2: { title: "Choose Quality", description: "Our tool automatically selects the optimal balance between file size reduction and visual quality." },
            step3: { title: "Download Small PDF", description: "Click Compress. Your new, lighter PDF will be ready in seconds." }
        },
        useCases: [
            { title: "Email Attachments", desc: "Shrink massive PDF reports so they easily fit within standard 25MB email attachment limits.", icon: "briefcase" },
            { title: "Faster Uploads", desc: "Compress thesis or assignment PDFs for faster submission to university portals.", icon: "academic" },
            { title: "Save Disk Space", desc: "Reduce the size of archived PDFs to drastically lower your cloud storage usage.", icon: "database" }
        ],
        faqs: [
            { question: "How can I compress a PDF file for free?", answer: "Upload your PDF to ConvertLocally's Compress PDF tool. It automatically reduces file size while maintaining quality. Processing happens in your browser — your file never leaves your device." },
            { question: "Will my PDF lose quality after compression?", answer: "Our advanced compression algorithms are designed to reduce file size significantly while keeping text crisp and images clear. The visual difference is minimal." }
        ]
    },
    "pdf-to-word": {
        keywords: [
            "pdf to word converter free", "convert pdf to docx", "pdf to word online free no email",
            "best pdf to word converter", "pdf to word exact formatting", "edit pdf in word"
        ],
        howToSteps: {
            step1: { title: "Select PDF Document", description: "Upload the PDF file you wish to convert into an editable Word document." },
            step2: { title: "Text Extraction", description: "Our AI engine accurately extracts text, formatting, and images from your PDF." },
            step3: { title: "Download Word File", description: "Receive a fully editable Microsoft Word (.docx) file preserving your layout." }
        },
        useCases: [
            { title: "Edit Contracts", desc: "Turn uneditable PDF contracts into Word documents to easily revise clauses and terms.", icon: "briefcase" },
            { title: "Extract Research", desc: "Convert PDF papers to Word to easily quote, highlight, and reorganize information.", icon: "academic" },
            { title: "Update Resumes", desc: "Convert your old PDF resume back to Word format to update your work experience and skills.", icon: "database" }
        ],
        faqs: [
            { question: "How do I convert PDF to Word for free?", answer: "Upload your PDF to ConvertLocally's PDF to Word converter. The tool extracts text and formatting to create an editable Word document (.docx). Free, fast, and no email required." },
            { question: "Will the Word document keep my layout?", answer: "Yes, ConvertLocally uses advanced layout preservation algorithms to ensure your new Word document looks as close to the original PDF as possible, including tables, images, and fonts." },
            { question: "Is the text fully editable?", answer: "Absolutely. Once converted to .docx format, you can freely edit, delete, or add text using Microsoft Word, Google Docs, or LibreOffice." },
            { question: "Do you support scanned PDFs?", answer: "For scanned PDFs, we perform basic text extraction. For best results, PDFs with selectable text are highly recommended." }
        ]
    },
    "word-to-pdf": {
        keywords: [
            "word to pdf converter free", "convert docx to pdf", "word to pdf online",
            "best word to pdf converter", "save doc as pdf", "convert doc to pdf without office"
        ],
        howToSteps: {
            step1: { title: "Upload Word File", description: "Select your Microsoft Word document (.doc or .docx) to convert." },
            step2: { title: "Analyze Formatting", description: "Our browser-based LibreOffice engine analyzes and perfectly maps your document's layout." },
            step3: { title: "Generate PDF", description: "Click Convert to instantly download a professional, read-only PDF document." }
        },
        useCases: [
            { title: "Client Proposals", desc: "Convert your Word proposals to secure PDFs before sending to clients to prevent unwanted edits.", icon: "briefcase" },
            { title: "Thesis Submission", desc: "Easily turn your final .docx thesis into a strict PDF format required by universities.", icon: "academic" },
            { title: "Cross-Platform Sharing", desc: "Ensure your document looks identical on Windows, Mac, iOS, and Android by converting to PDF.", icon: "database" }
        ],
        faqs: [
            { question: "How do I convert Word to PDF online?", answer: "Upload your Word document (.docx) to ConvertLocally. It converts to PDF preserving formatting, fonts, and layout. The conversion uses LibreOffice WASM and runs entirely in your browser." },
            { question: "Will the PDF look exactly like my Word file?", answer: "Yes! ConvertLocally utilizes an industry-standard conversion engine that perfectly retains your original fonts, images, tables, and pagination." },
            { question: "Do I need Microsoft Word installed?", answer: "No. ConvertLocally handles the entire conversion process in the cloud, meaning you do not need Microsoft Office installed on your device." }
        ]
    },

    // --- HIGH PRIORITY IMAGE TOOLS ---
    "png-to-jpg": {
        keywords: [
            "png to jpg converter", "convert png to jpeg", "png to jpg online free",
            "png to jpg without losing quality", "change png to jpg", "free png to jpeg tool"
        ],
        howToSteps: {
            step1: { title: "Upload PNG Image", description: "Drag and drop the PNG file you want to convert." },
            step2: { title: "Set JPG Quality", description: "Our tool processes the image, handling any transparency intelligently." },
            step3: { title: "Download JPG", description: "Download your compressed, web-ready JPEG file instantly." }
        },
        useCases: [
            { title: "Web Optimization", desc: "Convert heavy PNG graphics to lightweight JPGs to make your website load faster.", icon: "briefcase" },
            { title: "Format Compatibility", desc: "Change PNGs to JPGs for upload portals that only accept standard JPEG formats.", icon: "academic" },
            { title: "Save Space", desc: "Dramatically decrease image file sizes on your hard drive by converting lossless PNGs to JPGs.", icon: "database" }
        ],
        faqs: [
            { question: "How do I convert PNG to JPG?", answer: "Upload your PNG file to ConvertLocally's PNG to JPG converter. It converts instantly in your browser with adjustable quality. Free, unlimited conversions with no watermark." },
            { question: "What happens to the transparent background?", answer: "Since JPG format does not support transparency, any transparent areas in your PNG will be automatically filled with a solid white background during conversion." },
            { question: "Is PNG or JPG better for photos?", answer: "JPG is generally much better for photographs as it provides excellent quality at a significantly smaller file size than PNG." }
        ]
    },
    "jpg-to-png": {
        keywords: [
            "jpg to png converter", "convert jpeg to png", "jpg to png online free",
            "change jpg to png", "make jpg png", "free jpeg to png"
        ],
        howToSteps: {
            step1: { title: "Select JPG Photo", description: "Upload the JPEG or JPG image you wish to convert." },
            step2: { title: "Lossless Processing", description: "ConvertLocally converts the image data into a lossless PNG format." },
            step3: { title: "Get PNG File", description: "Download your newly converted PNG image with crystal-clear quality." }
        },
        useCases: [
            { title: "Logo Preparation", desc: "Convert JPG logos to PNG before using background removal tools requiring PNG alpha channels.", icon: "briefcase" },
            { title: "Graphic Design", desc: "Translate JPG assets to PNG to work cleanly in Photoshop or Illustrator projects.", icon: "academic" },
            { title: "Avoid Compression", desc: "Save JPGs as PNGs to prevent further quality loss during repeated editing and saving.", icon: "database" }
        ],
        faqs: [
            { question: "How to convert JPG to PNG online?", answer: "Upload your JPG to ConvertLocally's converter. It creates a lossless PNG. Processing happens locally — your images stay private." },
            { question: "Will converting JPG to PNG improve quality?", answer: "Converting a JPG to PNG will not miraculously restore lost details or improve the original quality, but it will ensure that saving the file multiple times in the future will not further degrade its quality." },
            { question: "Can this tool make the background transparent?", answer: "This specific tool only converts the format. To remove a background, you would need our dedicated Background Remover tool." }
        ]
    },
    "heic-to-jpg": {
        keywords: [
            "heic to jpg converter", "convert heic to jpeg", "iphone photo to jpg",
            "open heic files on windows", "heic converter free", "change heic to jpg"
        ],
        howToSteps: {
            step1: { title: "Upload HEIC Photos", description: "Select the .HEIC images taken from your iPhone or iPad." },
            step2: { title: "Convert Format", description: "Our browser engine translates Apple's HEIC format into standard JPEG." },
            step3: { title: "Download JPG", description: "Save the universally compatible JPG photos to your device." }
        },
        useCases: [
            { title: "Cross-Device Sharing", desc: "Convert iPhone HEIC photos to JPG so they can be viewed properly on Windows or Android devices.", icon: "briefcase" },
            { title: "School Portals", desc: "Change HEIC homework photos to JPG so they are accepted by strict learning management systems.", icon: "academic" },
            { title: "Social Media Uploads", desc: "Easily convert HEIC to JPG before uploading photos to websites that do not yet support Apple's format.", icon: "database" }
        ],
        faqs: [
            { question: "How to convert iPhone HEIC photos to JPG?", answer: "Upload your HEIC files to ConvertLocally. It converts Apple's HEIC format to universally compatible JPG instantly. Works on any device with a web browser." },
            { question: "Why are my iPhone photos HEIC?", answer: "Apple uses HEIC (High-Efficiency Image Container) by default to save storage space, but it is not universally supported on all devices or websites." },
            { question: "Are my personal photos uploaded to the cloud?", answer: "No. Our HEIC to JPG conversion happens entirely locally inside your browser padding. Your private photos are completely secure." }
        ]
    },

    // --- HIGH PRIORITY AUDIO/VIDEO TOOLS ---
    "mp4-to-mp3": {
        keywords: [
            "mp4 to mp3 converter", "extract audio from video", "video to audio converter",
            "convert mp4 to mp3 free", "mp4 to mp3 online", "video to mp3 free"
        ],
        howToSteps: {
            step1: { title: "Upload MP4 Video", description: "Select the video file you want to extract audio from." },
            step2: { title: "Extract Audio", description: "Our powerful engine strips the video track and isolates the high-quality audio." },
            step3: { title: "Download MP3", description: "Save the requested MP3 audio file directly to your device." }
        },
        useCases: [
            { title: "Podcasts from Video", desc: "Turn video interviews or recorded meetings into audio-only podcasts.", icon: "briefcase" },
            { title: "Lecture Transcripts", desc: "Extract audio from recorded class lectures to listen on the go or upload to transcription tools.", icon: "academic" },
            { title: "Save Music", desc: "Convert music video files into MP3 format to save storage and listen offline.", icon: "database" }
        ],
        faqs: [
            { question: "How do I extract audio from an MP4 video?", answer: "Upload your MP4 to ConvertLocally's converter. It rapidly extracts the audio track and provides you with a clean MP3 file. The process is free and requires no registration." },
            { question: "Is the audio quality degraded during conversion?", answer: "ConvertLocally extracts the audio stream smoothly, ensuring maximum bitrate retention for crystal-clear MP3 sound." },
            { question: "Do you support video formats other than MP4?", answer: "Yes, you can also upload MOV, AVI, FLV, and WebM files to extract audio to MP3." }
        ]
    },

    // Catch-all fallback
    "default": {
        keywords: ["free online file converter", "file conversion tool", "ConvertLocally convert"],
        howToSteps: {
            step1: { title: "Select your File", description: "Upload the file you want to convert from your computer or mobile device." },
            step2: { title: "Processing", description: "Our advanced engine will quickly and securely process your file." },
            step3: { title: "Download", description: "Your processed file is ready. Click download to save it." }
        },
        useCases: GENERIC_USE_CASES,
        faqs: [
            { question: "Is this tool free to use?", answer: "Yes, all tools on ConvertLocally are 100% free with no hidden fees or subscriptions." },
            { question: "Do I need to create an account?", answer: "No, you can use all our tools instantly without signing in or providing an email address." },
            { question: "Are my files secure?", answer: "Absolutely. All processing is done securely, and files are automatically deleted after 1 hour." }
        ]
    }
};

export function getToolSEOContent(toolId: string): ToolSEOContent {
    return TOOL_SEO_CONTENT[toolId] || TOOL_SEO_CONTENT["default"];
}
