/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for Turbopack
  experimental: {
    turbo: {},
    // Disable server components if not needed
    serverComponentsExternalPackages: [],
  },
  
  // Simple webpack configuration
  webpack: (config, { dev, isServer }) => {
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
