/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: !process.env.VERCEL && process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
