/**
 * Device Capability Detector
 * 
 * Detects low-end vs high-end devices based on hardware capabilities.
 * Used to route PDF compression to appropriate engine (Stage-0 vs Deep Compression).
 * 
 * Classification:
 * - Low-End: deviceMemory ≤ 4 GB OR hardwareConcurrency ≤ 4
 * - High-End: Above thresholds
 */

export type DeviceClass = 'low-end' | 'high-end';

export interface DeviceCapabilities {
    deviceClass: DeviceClass;
    memory: number | undefined;
    cores: number | undefined;
    isLowEnd: boolean;
}

// Session-level cache
let cachedCapabilities: DeviceCapabilities | null = null;

/**
 * Get device memory in GB (if available)
 */
function getDeviceMemory(): number | undefined {
    if (typeof navigator === 'undefined') return undefined;

    // @ts-ignore - deviceMemory is not in all TypeScript definitions
    const mem = navigator.deviceMemory;
    return typeof mem === 'number' ? mem : undefined;
}

/**
 * Get hardware concurrency (CPU cores)
 */
function getHardwareConcurrency(): number | undefined {
    if (typeof navigator === 'undefined') return undefined;

    const cores = navigator.hardwareConcurrency;
    return typeof cores === 'number' ? cores : undefined;
}

/**
 * Classify device as low-end or high-end based on hardware capabilities
 */
function classifyDevice(memory: number | undefined, cores: number | undefined): DeviceClass {
    // 1. Mobile Safari / iOS Detection
    // iOS doesn't support deviceMemory, and often restricts WASM memory significantly.
    // We treat all iOS devices as "low-end" for safety in the context of large WASM operations
    // unless we can essentially prove otherwise (which is hard).
    const isIOS = typeof navigator !== 'undefined' &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    // 2. Constrained Runtime Check
    // If deviceMemory is missing (common on high-end desktop Firefox/Safari too), 
    // we look for other signals. But for safety, "Unknown + Mobile" usually means constrained.
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Conservative fallback: treat unknown devices as low-end to ensure stability
    // Exception: If it's definitely a desktop browser (not mobile) and we just lack data,
    // we *could* lean high-end, but "Safe handling" is the priority.
    // PRD Rule: "Mobile Safari / constrained runtime" -> Low End.
    if (isIOS) {
        return 'low-end';
    }

    if (memory === undefined && cores === undefined) {
        // If we are on mobile and don't know specs -> Low-end
        if (isMobile) return 'low-end';

        // If desktop and unknown, we stick to low-end to be safe conformant to "Safe handling"
        return 'low-end';
    }

    // Low-end criteria: deviceMemory ≤ 4 GB OR hardwareConcurrency ≤ 4
    const isLowEndMemory = memory !== undefined && memory <= 4;
    const isLowEndCores = cores !== undefined && cores <= 4;

    // If we can check memory and it's low-end, classify as low-end
    if (isLowEndMemory) return 'low-end';

    // If we can check cores and it's low-end (and memory wasn't high-end), classify as low-end
    if (isLowEndCores) return 'low-end';

    // If we have at least one metric showing high-end, and no low-end signals, it's high-end
    const hasHighEndSignal =
        (memory !== undefined && memory > 4) ||
        (cores !== undefined && cores > 4);

    return hasHighEndSignal ? 'high-end' : 'low-end';
}

/**
 * Detect device capabilities (cached per session)
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
    // Return cached result if available
    if (cachedCapabilities) {
        return cachedCapabilities;
    }

    // Detect capabilities
    const memory = getDeviceMemory();
    const cores = getHardwareConcurrency();
    const deviceClass = classifyDevice(memory, cores);

    cachedCapabilities = {
        deviceClass,
        memory,
        cores,
        isLowEnd: deviceClass === 'low-end'
    };

    // Log for debugging (only once per session)
    if (typeof console !== 'undefined') {
        console.log('[Device Detector]', {
            deviceClass,
            memory: memory ? `${memory} GB` : 'unknown',
            cores: cores || 'unknown'
        });
    }

    return cachedCapabilities;
}

/**
 * Check if current device is low-end (convenience function)
 */
export function isLowEndDevice(): boolean {
    return detectDeviceCapabilities().isLowEnd;
}

/**
 * Reset cached capabilities (mainly for testing)
 */
export function resetDeviceCache(): void {
    cachedCapabilities = null;
}
