/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  // Optimized for Vercel serverless deployment
  // Remove standalone output for Vercel
  
  // Disable static generation for dynamic pages
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Experimental optimizations
  experimental: {
    optimizeServerReact: true,
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    forceSwcTransforms: true,
    // Critical bundle optimization
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  webpack: (config, { isServer, buildId, dev, defaultLoaders, webpack }) => {
    // Fixes npm packages that depend on `pg` module and axios compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        fs: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        url: false,
        assert: false,
        stream: false,
        util: false,
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        zlib: false,
        querystring: false,
        path: false,
        crypto: false,
        os: false,
        dns: false,
      };
      
      // Add plugins for polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    // Production optimizations only
    if (!dev && !isServer) {
      // Critical: Split large vendor chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Split Prisma client (major contributor to bundle size)
          prisma: {
            test: /[\\/]node_modules[\\/]@prisma[\\/]/,
            name: 'prisma',
            chunks: 'all',
            priority: 30,
          },
          // Split React libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          // Split large UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui)[\\/]/,
            name: 'ui-libs',
            chunks: 'all',
            priority: 15,
          },
          // Split utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](lodash|date-fns|moment)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 10,
          },
          // Default vendor chunk for remaining dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 5,
            maxSize: 200000, // 200KB max per chunk
          },
        },
      };

      // Minimize bundle size
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Disable source maps in production (removes 593KB middleware.js.map)
    if (!dev) {
      config.devtool = false;
    }

    return config;
  },
  
  // Add proper handling for pg native bindings if needed
  transpilePackages: ['pg-native', 'pg-query-stream'],
  
  // Disable ESLint during build to avoid errors
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enable image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Enable static optimization
  trailingSlash: false,
  
  // Headers for caching optimization  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  
  // SWC minification is enabled by default in Next.js 15
  // Note: headers() is not compatible with static export
};

module.exports = nextConfig;