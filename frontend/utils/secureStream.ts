/**
 * secureStream.ts
 * Handles low-memory encrypted (TLS) streaming uploads.
 */

export interface StreamUploadOptions {
    file: File;
    url: string;
    onProgress?: (loaded: number, total: number) => void;
    metadata?: Record<string, string>;
}

export async function uploadViaStream({ file, url, onProgress, metadata }: StreamUploadOptions): Promise<Response> {
    // 1. Create a TransformStream to monitor progress without buffering
    const progressStream = new TransformStream({
        transform(chunk, controller) {
            if (onProgress) {
                // Calculate progress roughly (chunk size)
                // Note: precise progress in transform might be tricky if chunks vary
                // We accumulate manually.
            }
            controller.enqueue(chunk);
        }
    });

    // Track progress manually since TransformStream chunk inspection 
    // allows us to count bytes passing through.
    let bytesUploaded = 0;
    const progressTracker = new TransformStream({
        transform(chunk, controller) {
            bytesUploaded += chunk.byteLength;
            if (onProgress) {
                onProgress(bytesUploaded, file.size);
            }
            controller.enqueue(chunk);
        }
    });

    // 2. Prepare the stream
    // file.stream() gives us a ReadableStream of the file content.
    const fileStream = file.stream().pipeThrough(progressTracker);

    // 3. Prepare headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('X-File-Name', encodeURIComponent(file.name));
    headers.set('X-File-Size', file.size.toString());
    headers.set('X-File-Type', file.type);

    if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
            headers.set(`X-Meta-${key}`, encodeURIComponent(value));
        });
    }

    // 4. Perform the fetch
    // Note: Duplex 'half' is required for streaming uploads in some fetch implementations (e.g. Chrome)
    // Typescript definitions might strictly require standard RequestInit, so casting might be needed.
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: fileStream,
        // @ts-ignore - 'duplex' is a newer standard property
        duplex: 'half'
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response;
}
