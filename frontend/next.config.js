/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    images: {
        unoptimized: true,
        formats: ['image/avif', 'image/webp'],
    },
    compress: true,
    trailingSlash: true,
    reactStrictMode: true,
    typescript: {
        // ignoreBuildErrors: true, 
    },
    poweredByHeader: false,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    turbopack: {
        resolveAlias: {
            canvas: './empty-module.js',
            module: './empty-module.js',
            fs: './empty-module.js',
            path: './mocked-path.js',
        },
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                path: require('path').resolve(__dirname, 'mocked-path.js'),
            };
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                module: false,
            };
        }
        return config;
    },
    transpilePackages: ['wasm-stream-runtime', 'mupdf'],
};

if (process.env.NODE_ENV === 'development') {
    nextConfig.headers = async () => {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                ],
            },
        ];
    };
}

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: true,
});

module.exports = withPWA(nextConfig);
