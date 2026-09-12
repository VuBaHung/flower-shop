import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { getSettings } from '@/lib/data'
import { siteUrl } from '@/lib/site'
import { clampDescription, floristJsonLd } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'
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

/*
 * Metadata is generated, not hardcoded, so the shop name/tagline/about text stay in one
 * place (the catalog) and a change in the admin app reaches the <head> on next build.
 *
 * title.template gives every child page "<page> — <shop>" without repeating the brand,
 * and metadataBase makes the relative OG image URLs below absolute — required, since
 * Facebook and Zalo reject relative og:image.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const url = siteUrl()
  const description = clampDescription(settings.aboutText)

  return {
    metadataBase: new URL(url),
    title: {
      default: `${settings.shopName} — ${settings.tagline}`,
      template: `%s — ${settings.shopName}`,
    },
    description,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: '/',
      siteName: settings.shopName,
      title: `${settings.shopName} — ${settings.tagline}`,
      description,
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang="vi" className={`${display.variable} ${sans.variable} scroll-smooth`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        {/* One Florist node for the whole site; product pages reference it by @id. */}
        <JsonLd data={floristJsonLd(settings)} />
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
