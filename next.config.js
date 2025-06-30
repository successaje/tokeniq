/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable experimental features
  experimental: {
    serverActions: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
    };

    // Configure module resolution
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      'node_modules',
    ];

    // Add fallback for path module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false,
      fs: false,
    };

    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  // React configuration
  reactStrictMode: false,
  // Images configuration
  images: {
    domains: ['localhost'],
  },
  // Server external packages
  serverExternalPackages: [],
};

module.exports = nextConfig;
