/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: !process.env.VERCEL && process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  images: {
    domains: ['picsum.photos', 'localhost', 'maps.googleapis.com'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
}

module.exports = nextConfig
