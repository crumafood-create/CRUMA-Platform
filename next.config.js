/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

  reactStrictMode: true,

  compress: true,

  typedRoutes: true,

  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  images: {
    formats: [
      'image/avif',
      'image/webp',
    ],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',

        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
