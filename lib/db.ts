import { MongoClient, type Db } from 'mongodb'
import type {
  CatalogData,
  Campaign,
  Occasion,
  Product,
  Settings,
  Status,
  BadgeStyle,
} from './types'
import { required } from './env'

/**
 * MongoDB access, normalized back to the lib/types.ts contract.
 *
 * PLAN.md §3A.2 — THE INVARIANT: this runs at BUILD time only, from Server Components
 * and from the admin app's server. It must never be imported by a Client Component and
 * never execute in a browser. If a customer's browser ever queries Mongo, the static
 * export and the SEO rationale in §1 are both gone.
 *
 * Normalization lives here for the same reason it lived in the Sheet parser: components
 * never parse strings. A document that fails to normalize is DROPPED with a warning
 * rather than failing the build — one bad product must not take the whole site offline.
 */

/**
 * Cached across module reloads. Next dev recompiles constantly and Atlas M0 caps
 * connections at 500; a client per reload exhausts that quickly.
 */
const globalForMongo = globalThis as unknown as { _mongo?: Promise<MongoClient> }

function client(): Promise<MongoClient> {
  if (!globalForMongo._mongo) {
    globalForMongo._mongo = new MongoClient(required('MONGODB_URI')).connect()
  }
  return globalForMongo._mongo
}

export async function db(): Promise<Db> {
  return (await client()).db(required('MONGODB_DB'))
}

// --- coercion helpers -------------------------------------------------------
// Mongo is schemaless and the admin form is the only writer, but a hand-edited
// document or an older schema version must not produce NaN in a price.

function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') {
    // Admin may type "850.000" or "850,000" — strip separators, keep digits.
    const cleaned = v.replace(/[.,\s]/g, '')
    if (cleaned === '') return undefined
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str).filter((x): x is string => !!x)
  // Tolerate the legacy comma-separated form from the Sheet era.
  if (typeof v === 'string') {
    return v.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function status(v: unknown): Status {
  return str(v) === 'hidden' ? 'hidden' : 'active'
}

function badgeStyle(v: unknown): BadgeStyle | undefined {
  const s = str(v)
  return s === 'hot' || s === 'info' || s === 'luxe' ? s : undefined
}

// --- document -> domain type ------------------------------------------------

function toProduct(doc: Record<string, unknown>): Product | undefined {
  const code = str(doc.code)
  const name = str(doc.name)
  // images[0] is the OG/Google result image; a product without one cannot render a card.
  const images = strArray(doc.images)
  if (!code || !name || images.length === 0) return undefined

  const price = num(doc.price)
  return {
    code,
    name,
    price,
    priceNote: str(doc.priceNote),
    // A sale price is meaningless without a base price to strike through.
    salePrice: price === undefined ? undefined : num(doc.salePrice),
    saleNote: str(doc.saleNote),
    occasions: strArray(doc.occasions),
    flowerType: str(doc.flowerType),
    subtitle: str(doc.subtitle),
    badge: str(doc.badge),
    badgeStyle: badgeStyle(doc.badgeStyle),
    shortDesc: str(doc.shortDesc),
    // PLAN.md §4.1: only surface ratings that are genuinely present.
    rating: num(doc.rating),
    reviewCount: num(doc.reviewCount),
    size: str(doc.size),
    description: str(doc.description),
    images,
    video: str(doc.video),
    spinFolder: str(doc.spinFolder),
    status: status(doc.status),
    featured: doc.featured === true,
    sort: num(doc.sort) ?? 999,
  }
}

function toOccasion(doc: Record<string, unknown>): Occasion | undefined {
  const slug = str(doc.slug)
  const label = str(doc.label)
  if (!slug || !label) return undefined
  return {
    slug,
    label,
    image: str(doc.image),
    seoTitle: str(doc.seoTitle),
    seoDescription: str(doc.seoDescription),
    intro: str(doc.intro),
  }
}

function toCampaign(doc: Record<string, unknown>): Campaign | undefined {
  const slug = str(doc.slug)
  const title = str(doc.title)
  const startDate = str(doc.startDate)
  const endDate = str(doc.endDate)
  // Without a window, isActive() can't resolve — drop rather than guess.
  if (!slug || !title || !startDate || !endDate) return undefined
  return {
    slug,
    title,
    bannerDesktop: str(doc.bannerDesktop) ?? '',
    bannerMobile: str(doc.bannerMobile) ?? '',
    bannerAlt: str(doc.bannerAlt) ?? title,
    subtitle: str(doc.subtitle),
    ctaText: str(doc.ctaText),
    ctaLink: str(doc.ctaLink),
    startDate,
    endDate,
    orderCutoff: str(doc.orderCutoff),
    productCodes: strArray(doc.productCodes),
    occasionFilter: str(doc.occasionFilter),
    intro: str(doc.intro),
    seoTitle: str(doc.seoTitle),
    seoDescription: str(doc.seoDescription),
    priority: num(doc.priority) ?? 99,
    status: status(doc.status),
  }
}

function toSettings(doc: Record<string, unknown> | null): Settings {
  const d = doc ?? {}
  const s = (k: string) => str(d[k]) ?? ''
  return {
    shopName: s('shopName'),
    tagline: s('tagline'),
    phone: s('phone'),
    zaloPhone: s('zaloPhone'),
    zaloOaId: str(d.zaloOaId),
    messengerUrl: str(d.messengerUrl),
    address: s('address'),
    hours: s('hours'),
    sameDayCutoff: s('sameDayCutoff'),
    announcementText: s('announcementText'),
    announcementLink: str(d.announcementLink),
    heroEyebrow: s('heroEyebrow'),
    heroTitle: s('heroTitle'),
    heroTitleAccent: s('heroTitleAccent'),
    heroText: s('heroText'),
    aboutText: s('aboutText'),
  }
}

/**
 * Reads the whole catalog. Called once per build.
 *
 * Returns EVERY product including hidden ones; lib/data.ts applies the status filter,
 * so it stays in one place and the admin can reuse this to list drafts.
 */
export async function loadFromMongo(): Promise<CatalogData> {
  const database = await db()

  const [productDocs, occasionDocs, campaignDocs, settingsDoc] = await Promise.all([
    database.collection('products').find({}).toArray(),
    database.collection('occasions').find({}).toArray(),
    database.collection('campaigns').find({}).toArray(),
    database.collection('settings').findOne({}),
  ])

  const products = productDocs
    .map((d) => toProduct(d as Record<string, unknown>))
    .filter((p): p is Product => {
      if (!p) console.warn('[db] skipped a product: missing code, name, or image')
      return !!p
    })
    .sort((a, b) => a.sort - b.sort)

  return {
    products,
    occasions: occasionDocs
      .map((d) => toOccasion(d as Record<string, unknown>))
      .filter((o): o is Occasion => !!o),
    campaigns: campaignDocs
      .map((d) => toCampaign(d as Record<string, unknown>))
      .filter((c): c is Campaign => !!c),
    settings: toSettings(settingsDoc as Record<string, unknown> | null),
  }
}
