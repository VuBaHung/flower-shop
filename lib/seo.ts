/**
 * SEO helpers: meta description shaping and JSON-LD builders.
 *
 * PLAN.md §4.1 is enforced here, not by convention — productJsonLd() has no code path
 * that emits aggregateRating, so invented ratings cannot reach the page even if the
 * fields are later populated with placeholder values.
 */
import type { Product, Settings } from './types'
import { absoluteUrl, siteUrl } from './site'

/** Google truncates around 160 chars. Cut on a word boundary, never mid-word. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:–—-]$/, '')}…`
}

/** "0901234567" -> "+84901234567". Schema.org wants E.164. */
export function e164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('0') ? `+84${digits.slice(1)}` : `+84${digits}`
}

/**
 * Parses Settings.hours ("8:00 – 20:00, tất cả các ngày") into schema.org opening
 * hours. Falls back to undefined rather than guessing — wrong hours in a local pack
 * is worse than absent hours.
 */
function openingHours(hours: string): string | undefined {
  const m = hours.match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/)
  if (!m) return undefined
  const pad = (h: string) => h.padStart(2, '0')
  return `Mo-Su ${pad(m[1])}:${m[2]}-${pad(m[3])}:${m[4]}`
}

/**
 * Florist (a LocalBusiness subtype) — the entity Google Maps and the local pack read.
 * Stable @id so the Product nodes can reference this same business as their seller.
 */
export function floristJsonLd(settings: Settings) {
  const url = siteUrl()
  const hours = openingHours(settings.hours)

  return {
    '@context': 'https://schema.org',
    '@type': 'Florist',
    '@id': `${url}/#florist`,
    name: settings.shopName,
    description: clampDescription(settings.aboutText),
    url,
    telephone: e164(settings.phone),
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
    ...(hours ? { openingHours: hours } : {}),
    priceRange: '₫₫',
    areaServed: { '@type': 'City', name: 'TP. Hồ Chí Minh' },
    sameAs: [`https://zalo.me/${settings.zaloPhone}`, settings.messengerUrl].filter(
      Boolean
    ),
  }
}

/**
 * Product node. `price` is omitted entirely when the product has none — an Offer
 * without a price is valid; an Offer claiming 0₫ is a lie Google will penalize.
 *
 * Deliberately emits no aggregateRating/review. See PLAN.md §4.1.
 */
export function productJsonLd(
  product: Product,
  settings: Settings,
  price: { current?: number }
) {
  const url = absoluteUrl(`/hoa/${product.code}/`)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    sku: product.code,
    ...(product.description
      ? { description: clampDescription(product.description, 300) }
      : {}),
    image: product.images.map((img) => absoluteUrl(img)),
    ...(product.flowerType ? { material: product.flowerType } : {}),
    brand: { '@type': 'Brand', name: settings.shopName },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'VND',
      ...(price.current !== undefined ? { price: String(price.current) } : {}),
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${siteUrl()}/#florist` },
    },
  }
}

/** Breadcrumb for a product page: Trang chủ > Mẫu hoa > <name>. */
export function breadcrumbJsonLd(product: Product) {
  const url = siteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${url}/` },
      { '@type': 'ListItem', position: 2, name: 'Mẫu hoa', item: `${url}/#mau-hoa` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: absoluteUrl(`/hoa/${product.code}/`),
      },
    ],
  }
}
