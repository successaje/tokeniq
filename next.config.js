/** @type {import('next').NextConfig} */
const path = require('path');

// Create path aliases
const createAliases = (basePath) => ({
  '@': path.resolve(basePath, 'src'),
  '@components': path.resolve(basePath, 'src/components'),
  // Add more aliases as needed
});

const nextConfig = {
  // Enable experimental features
  experimental: {
    serverActions: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add path aliases
    const aliases = createAliases(__dirname);
    
    config.resolve.alias = {
      ...config.resolve.alias,
      ...aliases,
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
