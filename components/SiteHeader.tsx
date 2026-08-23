import Link from 'next/link'
import { Flower2, Menu, MessageCircle, PhoneCall } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { formatPhone, telHref, zaloHref } from '@/lib/format'

const NAV = [
  { href: '/#mau-hoa', label: 'Mẫu hoa' },
  { href: '/#cam-ket', label: 'Cam kết' },
  { href: '/#lien-he', label: 'Liên hệ' },
]

/**
 * Server component. The mobile disclosure uses <details>, so the menu opens with
 * JavaScript disabled and needs no client bundle.
 */
export default function SiteHeader({ settings }: { settings: Settings }) {
  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-line/60">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Flower2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-black tracking-tight text-ink sm:text-xl">
                {settings.shopName}
              </span>
              <span className="mt-1 block text-2xs font-extrabold uppercase tracking-[0.2em] text-primary">
                {settings.tagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-ink-muted lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={zaloHref(settings.zaloPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-pill border border-zalo/20 bg-zalo/10 px-4 py-2.5 text-xs font-bold text-zalo transition-colors hover:bg-zalo hover:text-white sm:flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Chat Zalo
            </a>
            <a
              href={telHref(settings.phone)}
              className="hidden items-center gap-2 rounded-pill bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-neon lg:flex"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              {formatPhone(settings.phone)}
            </a>

            <details className="group relative lg:hidden">
              <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink-muted marker:content-none hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
                <Menu className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">Mở menu</span>
              </summary>
              <div className="absolute right-0 top-12 w-56 rounded-3xl border border-line bg-porcelain p-3 shadow-neon">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-brand-50 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={zaloHref(settings.zaloPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block rounded-xl bg-zalo px-3 py-2.5 text-center text-xs font-bold text-white"
                >
                  Tư vấn qua Zalo
                </a>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  )
}
