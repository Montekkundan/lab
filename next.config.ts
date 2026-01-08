import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
