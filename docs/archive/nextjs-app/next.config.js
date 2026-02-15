/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prepare for API integration later
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_URL ? `${process.env.API_URL}/:path*` : 'http://localhost:3001/api/:path*',
      },
      {
        source: '/internal/payments/:path*',
        destination:
          process.env.PAYMENT_SERVICE_URL
            ? `${process.env.PAYMENT_SERVICE_URL}/:path*`
            : 'http://localhost:3004/:path*',
      },
      {
        source: '/internal/auth/:path*',
        destination:
          process.env.AUTH_SERVICE_URL ? `${process.env.AUTH_SERVICE_URL}/:path*` : 'http://localhost:3001/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
