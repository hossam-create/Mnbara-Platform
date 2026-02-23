/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'antd'],
    // Enable webpack build worker
    webpackBuildWorker: true,
  },

  eslint: {
    // Root monorepo ESLint config references plugins not installed in this package; skip during build
    ignoreDuringBuilds: true,
  },

  // Advanced bundle splitting and tree shaking
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Aggressive tree shaking and unused code elimination
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
        providedExports: true,
        concatenateModules: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Framework chunk - React, Next.js, React DOM
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|next|@next|styled-jsx)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // UI Library chunk - Radix UI, Headless UI, Antd
            'ui-vendor': {
              chunks: 'all',
              name: 'ui-vendor',
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|antd|lucide-react)[\\/]/,
              priority: 30,
            },

            // Utility libraries - clsx, tailwind, date-fns, etc
            'utils-vendor': {
              chunks: 'all',
              name: 'utils-vendor',
              test: /[\\/]node_modules[\\/](clsx|tailwind-merge|date-fns|axios|@tanstack)[\\/]/,
              priority: 20,
            },

            // Marketplace business logic
            'marketplace-core': {
              chunks: 'all',
              name: 'marketplace-core',
              test: /[\\/]src[\\/](services|store|types|utils|hooks)[\\/]/,
              priority: 15,
            },

            // Marketplace components (shared across routes)
            'marketplace-shared': {
              chunks: 'all',
              name: 'marketplace-shared',
              test: /[\\/]src[\\/]components[\\/](ui|common|errors|suspense)[\\/]/,
              priority: 10,
            },

            // Route-specific chunks
            'route-home': {
              chunks: 'all',
              name: 'route-home',
              test: /[\\/]src[\\/](pages[\\/]HomePage|components[\\/]home)[\\/]/,
              priority: 5,
            },

            'route-product': {
              chunks: 'all',
              name: 'route-product',
              test: /[\\/]src[\\/]components[\\/]product[\\/]/,
              priority: 5,
            },

            'route-cart': {
              chunks: 'all',
              name: 'route-cart',
              test: /[\\/]src[\\/]pages[\\/]CartPage[\\/]/,
              priority: 5,
            },

            // Large third-party libraries
            'vendor-large': {
              chunks: 'all',
              name: 'vendor-large',
              test: (module) => {
                const moduleName = module.nameForCondition?.() || '';
                // Libraries larger than 100KB get their own chunk
                return /[\\/]node_modules[\\/]/.test(moduleName) &&
                       !/react|next|@radix-ui|@headlessui|antd|lucide|clsx|tailwind|date-fns|axios|@tanstack/.test(moduleName);
              },
              priority: 5,
              minSize: 102400, // 100KB
            },

            // Default vendor chunk for remaining modules
            vendor: {
              chunks: 'all',
              name: 'vendor-remaining',
              test: /[\\/]node_modules[\\/]/,
              priority: 1,
            },
          },
        },

        // Minimize bundle size
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer,
          // Additional minimizers can be added here
        ],
      };

      // Remove unused exports and dependencies
      config.resolve.alias = {
        ...config.resolve.alias,
        // Alias to remove unused heavy dependencies
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      };
    }

    // Original fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Proxy API requests to backend gateway
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },

  // Image optimization with marketplace-specific domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.imgur.com' },
    ],
    // Optimize image loading
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Compression and headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },

  // Enable SWC minification for better performance
  swcMinify: true,

  // Output standalone for better deployment
  output: 'standalone',
};

module.exports = nextConfig;
