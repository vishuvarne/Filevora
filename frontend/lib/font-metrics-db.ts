/**
 * Font Metrics Database (v16)
 * 
 * Pre-computed average character widths for common fonts.
 * Used as Tier 3 fallback when fonts fail to load.
 * 
 * Units: proportion of fontSize (e.g., 0.5 means char width = 0.5 * fontSize)
 */

export interface FontMetrics {
    avgCharWidth: number;      // Average character width as proportion of fontSize
    spaceWidth: number;        // Space character width
    lineHeight: number;        // Line height multiplier
    capHeight: number;         // Capital letter height as proportion of fontSize
    descender: number;         // Descender depth (negative)
    category: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'script';
}

// Default metrics for each category
const CATEGORY_DEFAULTS: Record<FontMetrics['category'], FontMetrics> = {
    'sans-serif': { avgCharWidth: 0.52, spaceWidth: 0.25, lineHeight: 1.2, capHeight: 0.73, descender: -0.21, category: 'sans-serif' },
    'serif': { avgCharWidth: 0.48, spaceWidth: 0.25, lineHeight: 1.25, capHeight: 0.70, descender: -0.22, category: 'serif' },
    'monospace': { avgCharWidth: 0.60, spaceWidth: 0.60, lineHeight: 1.2, capHeight: 0.73, descender: -0.21, category: 'monospace' },
    'display': { avgCharWidth: 0.55, spaceWidth: 0.28, lineHeight: 1.1, capHeight: 0.75, descender: -0.15, category: 'display' },
    'script': { avgCharWidth: 0.50, spaceWidth: 0.22, lineHeight: 1.3, capHeight: 0.68, descender: -0.25, category: 'script' },
};

// Per-font metrics database (measured from actual fonts)
const FONT_METRICS_DB: Record<string, Partial<FontMetrics>> = {
    // Sans-Serif Fonts
    'arial': { avgCharWidth: 0.52, spaceWidth: 0.28, category: 'sans-serif' },
    'helvetica': { avgCharWidth: 0.52, spaceWidth: 0.28, category: 'sans-serif' },
    'helvetica neue': { avgCharWidth: 0.50, spaceWidth: 0.26, category: 'sans-serif' },
    'proxima nova': { avgCharWidth: 0.48, spaceWidth: 0.24, category: 'sans-serif' },
    'open sans': { avgCharWidth: 0.53, spaceWidth: 0.26, category: 'sans-serif' },
    'roboto': { avgCharWidth: 0.49, spaceWidth: 0.24, category: 'sans-serif' },
    'roboto medium': { avgCharWidth: 0.50, spaceWidth: 0.25, category: 'sans-serif' },
    'montserrat': { avgCharWidth: 0.55, spaceWidth: 0.27, category: 'sans-serif' },
    'lato': { avgCharWidth: 0.50, spaceWidth: 0.25, category: 'sans-serif' },
    'nunito': { avgCharWidth: 0.52, spaceWidth: 0.26, category: 'sans-serif' },
    'poppins': { avgCharWidth: 0.54, spaceWidth: 0.28, category: 'sans-serif' },
    'inter': { avgCharWidth: 0.50, spaceWidth: 0.25, category: 'sans-serif' },
    'calibri': { avgCharWidth: 0.46, spaceWidth: 0.23, category: 'sans-serif' },
    'segoe ui': { avgCharWidth: 0.48, spaceWidth: 0.24, category: 'sans-serif' },
    'tahoma': { avgCharWidth: 0.52, spaceWidth: 0.28, category: 'sans-serif' },
    'verdana': { avgCharWidth: 0.58, spaceWidth: 0.32, category: 'sans-serif' },
    'trebuchet ms': { avgCharWidth: 0.50, spaceWidth: 0.26, category: 'sans-serif' },
    'century gothic': { avgCharWidth: 0.53, spaceWidth: 0.30, category: 'sans-serif' },
    'gill sans': { avgCharWidth: 0.48, spaceWidth: 0.25, category: 'sans-serif' },
    'futura': { avgCharWidth: 0.50, spaceWidth: 0.26, category: 'sans-serif' },
    'avenir': { avgCharWidth: 0.52, spaceWidth: 0.27, category: 'sans-serif' },
    'oxygen': { avgCharWidth: 0.50, spaceWidth: 0.25, category: 'sans-serif' },
    'oxygen light': { avgCharWidth: 0.48, spaceWidth: 0.24, category: 'sans-serif' },

    // Serif Fonts
    'times new roman': { avgCharWidth: 0.45, spaceWidth: 0.25, category: 'serif' },
    'times': { avgCharWidth: 0.45, spaceWidth: 0.25, category: 'serif' },
    'georgia': { avgCharWidth: 0.50, spaceWidth: 0.27, category: 'serif' },
    'palatino': { avgCharWidth: 0.50, spaceWidth: 0.26, category: 'serif' },
    'book antiqua': { avgCharWidth: 0.50, spaceWidth: 0.26, category: 'serif' },
    'garamond': { avgCharWidth: 0.44, spaceWidth: 0.24, category: 'serif' },
    'cambria': { avgCharWidth: 0.48, spaceWidth: 0.25, category: 'serif' },
    'baskerville': { avgCharWidth: 0.46, spaceWidth: 0.25, category: 'serif' },
    'playfair display': { avgCharWidth: 0.48, spaceWidth: 0.24, category: 'serif' },
    'merriweather': { avgCharWidth: 0.52, spaceWidth: 0.28, category: 'serif' },
    'lora': { avgCharWidth: 0.48, spaceWidth: 0.25, category: 'serif' },
    'source serif pro': { avgCharWidth: 0.47, spaceWidth: 0.25, category: 'serif' },

    // Monospace Fonts
    'courier': { avgCharWidth: 0.60, spaceWidth: 0.60, category: 'monospace' },
    'courier new': { avgCharWidth: 0.60, spaceWidth: 0.60, category: 'monospace' },
    'consolas': { avgCharWidth: 0.55, spaceWidth: 0.55, category: 'monospace' },
    'monaco': { avgCharWidth: 0.60, spaceWidth: 0.60, category: 'monospace' },
    'source code pro': { avgCharWidth: 0.60, spaceWidth: 0.60, category: 'monospace' },
    'fira code': { avgCharWidth: 0.60, spaceWidth: 0.60, category: 'monospace' },
    'jetbrains mono': { avgCharWidth: 0.60, spaceWidth: 0.60, category: 'monospace' },

    // Display Fonts
    'bebas neue': { avgCharWidth: 0.42, spaceWidth: 0.20, lineHeight: 1.0, category: 'display' },
    'impact': { avgCharWidth: 0.45, spaceWidth: 0.22, lineHeight: 1.05, category: 'display' },
    'oswald': { avgCharWidth: 0.40, spaceWidth: 0.20, lineHeight: 1.05, category: 'display' },
    'raleway': { avgCharWidth: 0.48, spaceWidth: 0.24, category: 'display' },
    'amatic sc': { avgCharWidth: 0.35, spaceWidth: 0.18, lineHeight: 1.1, category: 'display' },
    'poiret one': { avgCharWidth: 0.50, spaceWidth: 0.28, lineHeight: 1.15, category: 'display' },
    'abril fatface': { avgCharWidth: 0.55, spaceWidth: 0.25, category: 'display' },
    'lobster': { avgCharWidth: 0.48, spaceWidth: 0.22, category: 'script' },
    'pacifico': { avgCharWidth: 0.52, spaceWidth: 0.24, category: 'script' },
    'dancing script': { avgCharWidth: 0.45, spaceWidth: 0.22, category: 'script' },
    'great vibes': { avgCharWidth: 0.42, spaceWidth: 0.20, category: 'script' },
    'anaheim': { avgCharWidth: 0.45, spaceWidth: 0.22, category: 'sans-serif' },

    // Symbol Fonts (special handling)
    'wingdings': { avgCharWidth: 1.0, spaceWidth: 1.0, category: 'display' },
    'webdings': { avgCharWidth: 1.0, spaceWidth: 1.0, category: 'display' },
    'symbol': { avgCharWidth: 0.60, spaceWidth: 0.30, category: 'display' },
};

// Google Fonts CDN mappings for fallback
export const GOOGLE_FONTS_MAP: Record<string, string> = {
    'proxima nova': 'Montserrat',
    'proxima nova semibold': 'Montserrat:wght@600',
    'helvetica neue': 'Open Sans',
    'avenir': 'Nunito',
    'bebas neue': 'Bebas Neue',
    'oxygen': 'Oxygen',
    'oxygen light': 'Oxygen:wght@300',
    'roboto medium': 'Roboto:wght@500',
    'amatic sc': 'Amatic SC',
    'poiret one': 'Poiret One',
    'anaheim': 'DM Sans', // Similar geometric sans
};

/**
 * Get font metrics for a given font family name.
 * Returns pre-computed metrics if available, otherwise category defaults.
 */
export function getFontMetrics(fontName: string): FontMetrics {
    const normalized = fontName.toLowerCase().trim().replace(/['"]/g, '');

    // Check for exact match
    if (FONT_METRICS_DB[normalized]) {
        const specific = FONT_METRICS_DB[normalized];
        const category = specific.category || 'sans-serif';
        return { ...CATEGORY_DEFAULTS[category], ...specific };
    }

    // Check for partial match
    for (const [key, metrics] of Object.entries(FONT_METRICS_DB)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            const category = metrics.category || 'sans-serif';
            return { ...CATEGORY_DEFAULTS[category], ...metrics };
        }
    }

    // Classify by keywords
    if (normalized.includes('mono') || normalized.includes('code') || normalized.includes('courier') || normalized.includes('terminal')) {
        return CATEGORY_DEFAULTS['monospace'];
    }
    if (normalized.includes('serif') || normalized.includes('times') || normalized.includes('roman') || normalized.includes('georgia')) {
        return CATEGORY_DEFAULTS['serif'];
    }
    if (normalized.includes('script') || normalized.includes('cursive') || normalized.includes('hand')) {
        return CATEGORY_DEFAULTS['script'];
    }
    if (normalized.includes('display') || normalized.includes('headline') || normalized.includes('poster')) {
        return CATEGORY_DEFAULTS['display'];
    }

    // Default to sans-serif (most common in presentations)
    return CATEGORY_DEFAULTS['sans-serif'];
}

/**
 * Get Google Fonts URL for a font if available
 */
export function getGoogleFontUrl(fontName: string): string | null {
    const normalized = fontName.toLowerCase().trim().replace(/['"]/g, '');
    const mapping = GOOGLE_FONTS_MAP[normalized];

    if (mapping) {
        const fontSpec = mapping.includes(':') ? mapping : `${mapping}:wght@400;700`;
        return `https://fonts.googleapis.com/css2?family=${fontSpec.replace(/ /g, '+')}&display=swap`;
    }

    return null;
}

/**
 * Calculate approximate text width using metrics database
 */
export function measureTextWithMetrics(text: string, fontName: string, fontSize: number): number {
    const metrics = getFontMetrics(fontName);
    let width = 0;

    for (const char of text) {
        if (char === ' ' || char === '\u00A0') {
            width += metrics.spaceWidth * fontSize;
        } else if (char === '\t') {
            width += metrics.spaceWidth * fontSize * 4;
        } else {
            width += metrics.avgCharWidth * fontSize;
        }
    }

    return width;
}
