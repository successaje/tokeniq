/** @type {import('next').NextConfig} */
const path = require('path');
const { src, components } = require('./paths');

const nextConfig = {
  // Enable Turbopack (stable in Next.js 15)
  turbopack: {},
  
  // Enable server actions (moved out of experimental in Next.js 15)
  experimental: {
    serverActions: {
      // Configure server actions options here
    },
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/*': path.resolve(__dirname, 'src/*'),
      // Add other path aliases as needed
    };
    
    // Ensure proper module resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      path.resolve(__dirname, 'node_modules'),
    ];

    // Add fallback for path module if needed
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: require.resolve('path-browserify'),
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
  
  // Server external packages
  serverExternalPackages: [],
};

module.exports = nextConfig;
