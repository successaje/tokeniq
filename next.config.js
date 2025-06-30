/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable experimental features
  experimental: {
    serverActions: {}
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add path aliases - extend existing aliases instead of overriding
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
    };

    // Ensure proper module resolution
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      'node_modules',
    ];

    // Add fallbacks for better compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
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
