/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  },
  
  // API rewrites to handle CORS during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // Production optimizations
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  reactStrictMode: true,
  
  // Output configuration
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ['image/webp']
  },
  
};

module.exports = nextConfig;