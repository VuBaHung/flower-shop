import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { getSettings } from '@/lib/data'
import AnnouncementBar from '@/components/AnnouncementBar'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ContactBar from '@/components/ContactBar'
import FloatingActions from '@/components/FloatingActions'

/*
 * Fonts are self-hosted through next/font — no render-blocking request to
 * fonts.googleapis.com, unlike the reference mockup.
 *
 * Outfit (the mockup's display face) was rejected: its Google Fonts build ships
 * `latin` + `latin-ext` only, so it has no U+1EA0–1EF9 (ạ ế ộ ữ ợ), no U+01A0–01B0
 * (ơ ư), and no U+20AB (₫) — it would fall back mid-word on every headline and every
 * price. Be Vietnam Pro is the same geometric register with full coverage.
 */
const display = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

// Variable font, 200–800. Do not apply font-black (900) to body text; it would synthesize.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  // Phase 2 owns the real SEO layer (generateMetadata, OG, JSON-LD, sitemap).
  title: 'Blossom & Vine',
  description: 'Tiệm hoa tươi thiết kế, giao hỏa tốc 2 giờ nội thành TP. Hồ Chí Minh.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang="vi" className={`${display.variable} ${sans.variable} scroll-smooth`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <AnnouncementBar settings={settings} />
        <SiteHeader settings={settings} />
        {/* pb-16 clears the mobile contact bar; it is hidden from lg up. */}
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <SiteFooter settings={settings} />
        <ContactBar settings={settings} />
        <FloatingActions settings={settings} />
      </body>
    </html>
  )
}
