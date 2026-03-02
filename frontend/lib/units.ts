/**
 * Centralized Unit Conversion for PPTX Parsing and Rendering
 * Standardizes on Pixels (96 DPI) for consistent web/canvas rendering.
 */

export const EMU_PER_INCH = 914400;
export const DPI_72 = 72; // Standard Print/PDF
export const DPI_96 = 96; // Standard Web/Screen

// Factors
export const EMU_PER_PT = EMU_PER_INCH / DPI_72; // 12700
export const EMU_PER_PX = EMU_PER_INCH / DPI_96; // 9525

// Constants for direct multiplication/division
export const EMU_TO_PT = 1 / EMU_PER_PT;
export const EMU_TO_PX = 1 / EMU_PER_PX;

/**
 * Convert EMUs to Pixels (96 DPI)
 * Used as the primary normalization target for the rendering engine.
 */
export function emuToPx(emu: number): number {
    return emu * EMU_TO_PX;
}

/**
 * Convert EMUs to Points (72 DPI)
 * Used only when explicitly interacting with PDF primitives that require Points.
 */
export function emuToPt(emu: number): number {
    return emu * EMU_TO_PT;
}

/**
 * Convert Points to Pixels
 * 1 PT = 1.333 PX
 */
export function ptToPx(pt: number): number {
    return pt * (DPI_96 / DPI_72);
}

/**
 * Convert Pixels to Points
 * 1 PX = 0.75 PT
 */
export function pxToPt(px: number): number {
    return px * (DPI_72 / DPI_96);
}
