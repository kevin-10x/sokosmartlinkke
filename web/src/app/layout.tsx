import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Soko — Find Markets, Shops & Matatu Stages in Kenya',
  description: 'Discover local markets, shops, and matatu stages across all 123 cities and towns in Kenya. Search by location, category, and keywords.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  )
}
