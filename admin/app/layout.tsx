import type { Metadata } from 'next'
import './globals.css'

/**
 * PLAN.md §3A.6: the admin app must never be indexed. This is the shop's private tool;
 * it has no business in search results.
 */
export const metadata: Metadata = {
  title: 'Quản trị — Blossom & Vine',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  )
}
