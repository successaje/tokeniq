/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable experimental features
  experimental: {
    serverActions: {}
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Force case sensitivity in file paths
    config.snapshot.managedPaths = [];
    
    // Clear all existing aliases to prevent conflicts
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force all @/ imports to be case-sensitive
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      // Fallback to @/ for everything else
      '@': path.resolve(__dirname, 'src'),
    };

    // Ensure proper module resolution
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      'node_modules',
    ];

    // Add fallback for path module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: require.resolve('path-browserify'),
    };

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
