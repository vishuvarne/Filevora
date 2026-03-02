import { CapabilityType } from './capability-types';

export interface ExplanationEntry {
    title: string;
    description: string;
    suggestion: string;
    alternatives?: string[];
}

export const EXPLANATION_REGISTRY: Record<string, ExplanationEntry> = {
    "size_exceeded": {
        title: "File Size Limit Exceeded",
        description: "The total size of the uploaded files exceeds the safety limits for on-device processing.",
        suggestion: "Try processing a smaller file or splitting the PDF into separate parts.",
        alternatives: ["Split PDF into smaller chunks", "Compress PDF before processing"]
    },
    "unknown_tool": {
        title: "Unsupported Component",
        description: "The requested tool or operation is not recognized by the security policy engine.",
        suggestion: "Ensure you are using an official Filevora tool.",
        alternatives: ["Check for app updates", "Contact support if this persists"]
    },
    "missing_capability_network": {
        title: "Network Access Denied",
        description: "This operation attempted to access the internet, but network capabilities were not granted.",
        suggestion: "Filevora tools run locally by default to protect your privacy.",
        alternatives: ["Continue with local-only processing", "Use a cloud-enabled alternative if available"]
    },
    "missing_capability_file_write": {
        title: "File Storage Denied",
        description: "The system was unable to grant write access to save the result.",
        suggestion: "Check if your browser or device has storage space and appropriate permissions.",
    },
    "safety_violation": {
        title: "Safety Constraint Triggered",
        description: "A security boundary was hit during execution (e.g., unexpected memory access).",
        suggestion: "The process was aborted and all transient data was wiped to ensure your safety.",
        alternatives: ["Retry with a different file", "Report this error to our engineering team"]
    }
};

export function getExplanation(reasonCode: string): ExplanationEntry {
    return EXPLANATION_REGISTRY[reasonCode] || {
        title: "Action Denied",
        description: `The operation was blocked by the security policy engine. (Reason: ${reasonCode})`,
        suggestion: "Please try again or contact support."
    };
}
