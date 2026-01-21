import type { NextConfig } from "next";

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
};

export default nextConfig;
