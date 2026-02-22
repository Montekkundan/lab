import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  webpack: (config) => {
    // Raw-loader for .glsl files
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });
    
    config.module.rules.push({
      resourceQuery: /text/,
      type: 'asset/source',
    });

    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
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

  async headers() {
    return [
      {
        source: '/models/:path*.v2.glb',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/models/:path*.glb',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
    ],
  },

  turbopack: {
    rules: {
      '*.glsl': ['file_text'],
    }
  }
};

export default nextConfig;
