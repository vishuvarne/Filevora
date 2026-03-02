const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type StreamEvent = {
    event: 'log' | 'metadata' | 'output_chunk' | 'result';
    level?: 'info' | 'warning' | 'error' | 'raw';
    message?: string;
    total_items?: number;
    sequence?: number;
    type?: string;
    filename?: string;
    status?: 'partial' | 'final' | 'error' | 'success';
    result?: any;
    metadata?: any;
};

export type StreamingHandlers = {
    onLog?: (msg: string, level: string) => void;
    onMetadata?: (data: any) => void;
    onChunk?: (chunk: any) => void;
    onResult?: (result: any) => void;
    onError?: (err: Error) => void;
};

export async function processJobStreaming(
    toolId: string,
    files: File[],
    payload: any,
    handlers: StreamingHandlers,
    signal?: AbortSignal
) {
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    formData.append("payload_json", JSON.stringify(payload));

    const url = `${API_BASE_URL}/stream/process?tool_id=${toolId}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Streaming failed: ${response.status} ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("ReadableStream not supported");

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process SSE formatted data: "data: {json}\n\n"
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep partial line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.replace('data: ', '').trim();
                        const event: StreamEvent = JSON.parse(jsonStr);

                        switch (event.event) {
                            case 'log':
                                handlers.onLog?.(event.message || '', event.level || 'info');
                                break;
                            case 'metadata':
                                handlers.onMetadata?.(event);
                                break;
                            case 'output_chunk':
                                handlers.onChunk?.(event);
                                break;
                            case 'result':
                                if (event.status === 'success') {
                                    handlers.onResult?.(event.result);
                                } else {
                                    handlers.onError?.(new Error(event.message || "Job failed"));
                                }
                                break;
                        }
                    } catch (e) {
                        console.error("Error parsing SSE event:", e, line);
                    }
                }
            }
        }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            handlers.onLog?.("Execution aborted by user", "warning");
        } else {
            handlers.onError?.(err);
        }
    }
}
