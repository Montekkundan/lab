import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer, nextRuntime }) => {
    // Raw-loader for .glsl files
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source', // This is more compatible with Next.js 14+ and Turbo
    });
    
    // Also allow plain text loading for Turbo compatibility
    config.module.rules.push({
      resourceQuery: /text/,
      type: 'asset/source',
    });

    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
  // Explicitly disable turbo for specific file patterns
  experimental: {
    turbo: {
      rules: {
        // Process .glsl files as text/plain
        '*.glsl': ['file_text'],
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/experiments',
        destination: '/',
        permanent: true
      }
    ]
  },
};

export default nextConfig;
