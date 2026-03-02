
import JSZip from 'jszip';
import { DocxStreamingBuilder } from './frontend/lib/docx-streaming-builder';

// Mock OutputBuilder interface if needed, but we import the class directly.
// We need to run this with ts-node or similar.

async function testBuilder() {
    console.log("Starting Builder Test...");
    const builder = new DocxStreamingBuilder();
    await builder.initialize();

    await builder.addPage({
        textBlocks: ["Hello World", "This is a test paragraph."],
        hasImages: false,
        pageNumber: 1
    });

    const blob = await builder.finalize();
    console.log("Blob generated.");
    console.log("Blob size:", blob.size);
    console.log("Blob type:", blob.type);

    if (blob.size === 0) {
        console.error("FAIL: Blob size is 0");
    } else {
        console.log("SUCCESS: Blob size is > 0");
    }
}

testBuilder().catch(console.error);
