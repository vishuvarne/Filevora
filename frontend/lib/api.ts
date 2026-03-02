const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://filevora.onrender.com";

export type ProcessResponse = {
    job_id: string;
    filename: string;
    download_url: string;
    original_size?: number;
    compressed_size?: number;
    reduction_percent?: number;
};

export async function processJob(
    endpoint: string,
    formData: FormData,
    signal?: AbortSignal,
    onProgress?: (percent: number, status: 'uploading' | 'converting') => void
): Promise<ProcessResponse> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${API_BASE_URL}${endpoint}`;

        xhr.open('POST', url);

        // Upload progress
        if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    // Cap at 99% for upload phase, 100% means upload done, now waiting for server
                    onProgress(Math.min(99, percentComplete), 'uploading');
                }
            };
        }

        // Handle abort
        if (signal) {
            signal.addEventListener('abort', () => {
                xhr.abort();
                reject(new DOMException('Aborted', 'AbortError'));
            });
        }

        xhr.onload = () => {
            // Request finished (upload + processing done)
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    // It's possible success returns non-JSON? Unlikely for our API but safe handling
                    reject(new Error("Invalid server response format"));
                }
            } else {
                try {
                    const errorRes = JSON.parse(xhr.responseText);
                    let errorMessage = errorRes.detail || `Error ${xhr.status}: ${xhr.statusText}`;

                    // Handle FastAPI validation errors (array of objects)
                    if (typeof errorMessage === 'object') {
                        // Optional: Try to format it nicer if it's a list of errors
                        if (Array.isArray(errorRes.detail)) {
                            errorMessage = errorRes.detail.map((e: { msg: string; loc?: string[] }) => `${e.msg} (${e.loc?.join(".")})`).join(", ");
                        } else {
                            errorMessage = JSON.stringify(errorMessage);
                        }
                    }

                    reject(new Error(errorMessage));
                } catch (e) {
                    // If JSON parse fails (e.g. 504 Gateway Timeout HTML), return status text or truncated body
                    const rawText = xhr.responseText.slice(0, 100); // First 100 chars
                    reject(new Error(`Server Error ${xhr.status}: ${xhr.statusText} (${rawText})`));
                }
            }
        };

        xhr.onerror = () => {
            reject(new Error("Network connection error"));
        };

        xhr.upload.onloadend = () => {
            // Upload finished, entering request processing phase
            // Don't reset progress - keep it at 99% while converting
            if (onProgress) {
                onProgress(99, 'converting');
            }
        };

        // Increase timeout to 5 minutes (300s) for large batches
        xhr.timeout = 300000;
        xhr.ontimeout = () => {
            reject(new Error("Request timed out (300s exceeded). The server is taking too long to process your files."));
        };

        xhr.send(formData);
    });
}

// Keeping these for reference but they could be refactored to use processJob
export async function mergePdfs(files: File[]): Promise<ProcessResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return processJob("/process/merge-pdf", formData);
}

export async function convertImage(
    file: File,
    format: string,
    quality: number
): Promise<ProcessResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_format", format);
    formData.append("quality", quality.toString());
    return processJob("/process/convert-image", formData);
}

export function getDownloadUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
}

export async function sendEmail(email: string, downloadUrl: string, filename: string) {
    const res = await fetch(`${API_BASE_URL}/process/email-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, download_url: downloadUrl, filename })
    });
    if (!res.ok) throw new Error("Failed to send email");
    return res.json();
}

export async function importCloudFile(
    provider: string,
    fileUrl: string,
    filename: string,
    accessToken?: string,
    fileId?: string
): Promise<ProcessResponse> {
    const res = await fetch(`${API_BASE_URL}/api/cloud/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            provider,
            file_url: fileUrl,
            filename,
            access_token: accessToken,
            file_id: fileId
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Cloud import failed");
    }
    return res.json();
}
