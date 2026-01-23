import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  trailingSlash: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  turbopack: {}, // Next.js 16 requires explicit turbopack config
};

export default withPWA(nextConfig);
