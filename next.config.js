import withPWA from 'next-pwa';

const nextConfig = {
  // output: 'standalone',

  reactStrictMode: true,

  compress: true,

  typedRoutes: false,

  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

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
        hostname:
          'poglpqvmbrfcvtuspvtx.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key:
              'X-Frame-Options',
            value: 'DENY',
          },
          {
            key:
              'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key:
              'Referrer-Policy',
            value:
              'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  disable:
    process.env.NODE_ENV ===
    'development',
})(nextConfig);
