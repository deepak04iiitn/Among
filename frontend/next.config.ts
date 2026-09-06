import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode enforces React best practices
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    // Add allowed domains here as external image sources are added
    remotePatterns: [],
  },

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirect www → non-www in production
  async redirects() {
    if (process.env['NODE_ENV'] !== 'production') return [];
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'www.among.io' }],
        destination: 'https://among.io/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
