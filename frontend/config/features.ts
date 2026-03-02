export const FEATURES = {
    // Analytics and Monitoring
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',

    // Auth & Accounts
    ENABLE_AUTH: false, // Disabled for pure static export and 0 cost

    // Heavy AI & Backend operations (to save Render costs & prevent abuse)
    ENABLE_PDF_CHAT: false,
    ENABLE_CLOUD_IMPORT: false,

    // Processing options
    ENABLE_WASM_CONVERSION: true, // Core to the application, no backend cost

    // Performance features
    ENABLE_ANIMATIONS: true, // Smooth transitions via LazyMotion

    // UI features
    SHOW_ADS: false,
    SHOW_DONATE_BUTTON: true,
};

export const PERFORMANCE = {
    // Max sizes for client-side processing before warning user
    MAX_FILE_SIZE_MB: 200,
    MAX_FILES_PER_BATCH: 50,
};
