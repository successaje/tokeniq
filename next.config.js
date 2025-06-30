/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Basic configuration for Turbopack
  experimental: {
    turbo: {},
    // Disable server components if not needed
    serverComponentsExternalPackages: [],
    serverActions: true,
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    if (dev && !isServer) {
      // Only in development, on the client side
      config.watchOptions = {
        poll: 1000,
        ignored: ['**/node_modules/**', '**/.git/**']
      };
    }
    return config;
  },
  
  // Development server settings
  devIndicators: {
    autoPrerender: false,
  },
  
  // Disable type checking on build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during development
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable React Strict Mode if needed
  reactStrictMode: false,
  
  // Configure images if you're using next/image
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
