/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `pg` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  experimental: {
    serverExternalPackages: ['pg', 'pg-hstore', 'pg-native'], // Include all pg-related packages
  },
  
  // Add proper handling for pg native bindings if needed
  transpilePackages: ['pg-native', 'pg-query-stream'],
  
  // Add any other Next.js config settings below
};

module.exports = nextConfig;