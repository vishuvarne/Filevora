import { ToolDef } from "@/config/tools";
import { FileTransferService } from "@/lib/file-transfer-service";
import { UniversalRouter } from "./navigation";
import { MemoryTransferCache } from "@/lib/memory-transfer-cache";
import { normalizePath } from "./navigation";

/**
 * Downloads a result blob/URL and converts it to a File object
 * @param result - The result object from a successful conversion
 * @returns Promise<File> - The downloaded file as a File object
 */
export async function downloadResultAsFile(result: any): Promise<File> {
    try {
        let blob: Blob;
        const downloadUrl = result.download_url;
        const filename = result.filename || 'converted-file';

        // Check if it's a blob URL (local processing)
        if (downloadUrl.startsWith('blob:')) {
            const response = await fetch(downloadUrl);
            blob = await response.blob();
        }
        // Check if it's a data URL
        else if (downloadUrl.startsWith('data:')) {
            const response = await fetch(downloadUrl);
            blob = await response.blob();
        }
        // It's a regular HTTP URL
        else {
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }
            blob = await response.blob();
        }

        // Determine file type from blob or filename
        let type = blob.type;
        if (!type || type === 'application/octet-stream') {
            // Try to infer from filename extension
            const extension = filename.split('.').pop()?.toLowerCase();
            const mimeTypes: Record<string, string> = {
                'pdf': 'application/pdf',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'mp3': 'audio/mpeg',
                'mp4': 'video/mp4',
                'zip': 'application/zip',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            };
            type = mimeTypes[extension || ''] || 'application/octet-stream';
        }

        return new File([blob], filename, { type });
    } catch (error) {
        console.error('Error downloading result as file:', error);
        throw new Error('Failed to download file for continuation');
    }
}

/**
 * Navigates to a tool with a pre-loaded file
 * @param router - Next.js App Router instance
 * @param toolId - The ID of the tool to navigate to
 * @param file - The file to pass to the tool
 * @param fromTool - Optional: the tool ID where the file came from
 */
export function navigateToToolWithFile(
    router: UniversalRouter,
    toolId: string,
    file: File,
    fromTool?: string
): void {
    try {
        const transferKey = `transfer_${Date.now()}`;

        // 1. FAST PATH: Store in RAM Cache (Instant, O(1))
        MemoryTransferCache.store(transferKey, file, {
            fromTool: fromTool || ''
        });

        // 2. BACKUP PATH: Store in IDB (Async, Persistent)
        FileTransferService.saveTransfer(transferKey, file, {
            fromTool: fromTool || ''
        }).catch(e => console.error("Background IDB save failed", e));

        // Navigate to the tool with the transfer key
        const path = `/tools/${toolId}`;
        router.push(`${path}?transfer=${transferKey}`);

    } catch (error) {
        console.error('Error navigating to tool with file:', error);
        throw new Error('Failed to navigate to next tool');
    }
}

/**
 * Navigates to a tool using a deferred file (URL) for instant large file transfer.
 * @param router - Next.js App Router instance
 * @param toolId - The ID of the tool to navigate to
 * @param data - The deferred file data { url, filename, type }
 * @param fromTool - Optional: the tool ID where the file came from
 */
export function navigateToToolWithDeferred(
    router: UniversalRouter,
    toolId: string,
    data: { url: string, filename: string, type: string },
    fromTool?: string
): void {
    try {
        const transferKey = `transfer_${Date.now()}`;

        // 1. FAST PATH: Store URL in RAM Cache (Instant, Zero Copy)
        MemoryTransferCache.storeDeferred(transferKey, data, {
            fromTool: fromTool || ''
        });

        // 2. BACKUP PATH: Fetch and Store in IDB (Background)
        // This runs asynchronously and does not block the navigation
        fetch(data.url)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], data.filename, { type: data.type });
                return FileTransferService.saveTransfer(transferKey, file, {
                    fromTool: fromTool || ''
                });
            })
            .catch(e => console.error("Background IDB save failed for deferred transfer", e));

        // Navigate immediately
        const path = `/tools/${toolId}`;
        router.push(`${path}?transfer=${transferKey}`);

    } catch (error) {
        console.error('Error navigating to tool with deferred file:', error);
        throw new Error('Failed to navigate to next tool');
    }
}




/**
 * Retrieves continuation data from sessionStorage
 * @param continuationKey - The key used to store the continuation data
 * @returns The continuation data or null if not found/expired
 */
export async function getContinuationData(continuationKey: string): Promise<{
    file: File;
    fromTool: string;
    timestamp: number;
} | null> {
    try {
        const dataStr = sessionStorage.getItem(continuationKey);
        if (!dataStr) return null;

        const data = JSON.parse(dataStr);

        // Check if data is too old (more than 5 minutes)
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - data.timestamp > fiveMinutes) {
            sessionStorage.removeItem(continuationKey);
            return null;
        }

        // Fetch the blob and recreate the File
        const response = await fetch(data.blobUrl);
        const blob = await response.blob();
        const file = new File([blob], data.filename, { type: data.type });

        // DO NOT remove immediately - let it persist for the session until expiry
        // sessionStorage.removeItem(continuationKey); 

        return {
            file,
            fromTool: data.fromTool,
            timestamp: data.timestamp // Return timestamp for UI countdown
        };
    } catch (error) {
        console.error('Error retrieving continuation data:', error);
        return null;
    }
}

/**
 * Manually deletes continuation data
 */
export function deleteContinuationData(continuationKey: string): void {
    try {
        const dataStr = sessionStorage.getItem(continuationKey);
        if (dataStr) {
            const data = JSON.parse(dataStr);
            if (data.blobUrl) URL.revokeObjectURL(data.blobUrl);
        }
        sessionStorage.removeItem(continuationKey);
    } catch (e) {
        console.error('Error deleting continuation data:', e);
    }
}

/**
 * Cleans up old continuation data from sessionStorage
 */
function cleanupOldContinuations(): void {
    try {
        const fiveMinutes = 5 * 60 * 1000;
        const keys = Object.keys(sessionStorage);

        keys.forEach(key => {
            if (key.startsWith('c_')) {
                try {
                    const dataStr = sessionStorage.getItem(key);
                    if (dataStr) {
                        const data = JSON.parse(dataStr);
                        if (Date.now() - data.timestamp > fiveMinutes) {
                            // Revoke blob URL if it exists
                            if (data.blobUrl) {
                                URL.revokeObjectURL(data.blobUrl);
                            }
                            sessionStorage.removeItem(key);
                        }
                    }
                } catch (e) {
                    // Invalid data, remove it
                    sessionStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.error('Error cleaning up old continuations:', error);
    }
}

/**
 * Checks if a file type is compatible with a tool's accepted types
 * @param file - The file to check
 * @param toolDef - The tool definition
 * @returns boolean - true if compatible, false otherwise
 */
export function isFileCompatibleWithTool(file: File, toolDef: ToolDef): boolean {
    const acceptedTypes = toolDef.acceptedTypes;

    // If tool accepts all files
    if (acceptedTypes === '*') return true;

    // Split accepted types by comma
    const types = acceptedTypes.split(',').map(t => t.trim());

    for (const acceptedType of types) {
        // Check for wildcard patterns like "image/*"
        if (acceptedType.includes('*')) {
            const [category] = acceptedType.split('/');
            if (file.type.startsWith(category + '/')) {
                return true;
            }
        }
        // Check for specific MIME type
        else if (file.type === acceptedType) {
            return true;
        }
        // Check for file extension (e.g., ".pdf")
        else if (acceptedType.startsWith('.')) {
            const extension = acceptedType.toLowerCase();
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith(extension)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Gets a user-friendly compatibility message
 * @param file - The file to check
 * @param toolDef - The tool definition
 * @returns A message indicating compatibility status
 */
export function getCompatibilityMessage(file: File, toolDef: ToolDef): string {
    if (isFileCompatibleWithTool(file, toolDef)) {
        return '✓ Compatible';
    }

    // Extract expected format from accepted types
    const acceptedTypes = toolDef.acceptedTypes.split(',')[0].trim();
    let expectedFormat = acceptedTypes;

    if (acceptedTypes.includes('/')) {
        expectedFormat = acceptedTypes.split('/')[1].toUpperCase();
    } else if (acceptedTypes.startsWith('.')) {
        expectedFormat = acceptedTypes.substring(1).toUpperCase();
    }

    return `⚠ Requires ${expectedFormat}`;
}
