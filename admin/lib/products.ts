import type { Product, BadgeStyle, Status } from '@shared/types'
import { collection } from './db'

/**
 * Coerces whatever the form or an API client sent into the Product shape from
 * lib/types.ts. The storefront's reader does the same job on the way out; doing it on the
 * way IN means the database mostly holds already-clean documents.
 */

function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') {
    // The admin types VND naturally: "850.000" or "850,000".
    const cleaned = v.replace(/[.,\s]/g, '')
    if (cleaned === '') return undefined
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map(str).filter((x): x is string => !!x)
  }
  if (typeof v === 'string') {
    return v.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

/**
 * Drops keys whose value is undefined so Mongo stores an ABSENT field rather than null.
 *
 * This matters: lib/campaigns.resolvePrice checks `!== undefined`, so a stored null slips
 * past every guard and reaches formatVnd, which calls .toLocaleString() on it and crashes
 * the page. Absent and undefined behave identically; null does not.
 */
function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

export function normalizeProductInput(body: unknown): Partial<Product> & { code: string } {
  const b = (body ?? {}) as Record<string, unknown>

  const price = num(b.price)
  const badgeStyleRaw = str(b.badgeStyle)
  const badgeStyle: BadgeStyle | undefined =
    badgeStyleRaw === 'hot' || badgeStyleRaw === 'info' || badgeStyleRaw === 'luxe'
      ? badgeStyleRaw
      : undefined

  const status: Status = str(b.status) === 'active' ? 'active' : 'hidden'

  return omitUndefined({
    // Codes are upper-case by convention (HB-001) — normalize so "hb-001" isn't a
    // second, colliding product.
    code: (str(b.code) ?? '').toUpperCase(),
    name: str(b.name),
    price,
    priceNote: str(b.priceNote),
    // Guard the same rule the validator states, so a bad pair can't reach the database
    // even if validation is ever bypassed.
    salePrice: price === undefined ? undefined : num(b.salePrice),
    saleNote: str(b.saleNote),
    occasions: strArray(b.occasions),
    flowerType: str(b.flowerType),
    subtitle: str(b.subtitle),
    badge: str(b.badge),
    badgeStyle,
    shortDesc: str(b.shortDesc),
    // PLAN.md §4.1: ratings stay absent unless genuinely supplied. The form has no input
    // for these; they are only settable via the API, deliberately.
    rating: num(b.rating),
    reviewCount: num(b.reviewCount),
    size: str(b.size),
    description: str(b.description),
    images: strArray(b.images),
    video: str(b.video),
    spinFolder: str(b.spinFolder),
    status,
    featured: b.featured === true,
    sort: num(b.sort) ?? 999,
  })
}

/** The valid `occasions` values — validation rejects anything outside this set. */
export async function knownOccasionSlugs(): Promise<string[]> {
  const occasions = await collection('occasions')
  const docs = await occasions.find({}, { projection: { slug: 1 } }).toArray()
  return docs.map((d) => String(d.slug)).filter(Boolean)
}
