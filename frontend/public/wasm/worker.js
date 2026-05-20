import init, { init as initConverter, convert_chunk, finish } from "./converter.js";

self.onmessage = async (event) => {
    const { type, payload } = event.data;

    try {
        switch (type) {
            case 'INIT':
                // Initialize WASM
                // payload.wasmModuleUrl should be relative to this worker or absolute
                // If this worker is at /wasm/worker.js, and wasm is at /wasm/docx_to_pdf_bg.wasm
                await init(payload.wasmModuleUrl);
                await initConverter(payload.jobType);
                self.postMessage({ type: 'INIT_SUCCESS' });
                break;

            case 'CHUNK':
                convert_chunk(payload);
                self.postMessage({ type: 'CHUNK_RECEIVED' });
                break;

            case 'FINISH':
                const result = finish();
                self.postMessage({ type: 'FINISH_SUCCESS', payload: result }, { transfer: [result.buffer] });
                self.close();
                break;

            case 'ABORT':
                self.close();
                break;
        }
    } catch (err) {
        console.error("Worker Error:", err);
        self.postMessage({ type: 'ERROR', payload: err.toString() });
    }
};
