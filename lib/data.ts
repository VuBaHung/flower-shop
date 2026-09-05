import fixtures from '@/data/fixtures.json'
import type { CatalogData, Occasion, Product, Campaign, Settings } from './types'
import { dataSource } from './env'

/**
 * The single entry point every component imports from. Runs at BUILD time only.
 *
 * PLAN.md §3A.2: components never learn where the data came from. DATA_SOURCE picks
 * fixtures or MongoDB and both return an identical CatalogData, so the storefront still
 * builds with a completely empty .env.
 *
 * These are async as of Phase 3 (Mongo is async). Every caller is a Server Component, so
 * awaiting costs nothing at runtime — it all resolves during the static export.
 */

function loadFixtures(): CatalogData {
  return {
    products: (fixtures.products as Product[]).slice(),
    occasions: fixtures.occasions as Occasion[],
    campaigns: fixtures.campaigns as Campaign[],
    settings: fixtures.settings as Settings,
  }
}

/**
 * Memoized for the lifetime of the build. generateStaticParams plus one call per product
 * page would otherwise re-query Mongo for every product in the catalog.
 */
let cached: Promise<CatalogData> | undefined

async function load(): Promise<CatalogData> {
  // Say which source built the site. A build that silently falls back to fixtures looks
  // completely successful while publishing placeholder content — the failure mode is
  // invisible without this line.
  const source = dataSource()
  console.log(
    source === 'mongo'
      ? '[data] building from MongoDB'
      : '[data] building from data/fixtures.json — set DATA_SOURCE=mongo for live data'
  )

  const raw =
    source === 'mongo'
      ? // Imported lazily so the mongodb driver is never pulled into a build that
        // doesn't use it — and never near a client bundle.
        await (await import('./db')).loadFromMongo()
      : loadFixtures()

  return {
    ...raw,
    // status=hidden is dropped HERE, once, so a hidden product can never reach a page,
    // a related list, or the sitemap regardless of source.
    products: raw.products
      .filter((p) => p.status === 'active')
      .sort((a, b) => a.sort - b.sort),
  }
}

export function getCatalog(): Promise<CatalogData> {
  if (!cached) cached = load()
  return cached
}

export async function getProducts(): Promise<Product[]> {
  return (await getCatalog()).products
}

export async function getProduct(code: string): Promise<Product | undefined> {
  return (await getCatalog()).products.find((p) => p.code === code)
}

export async function getSettings(): Promise<Settings> {
  return (await getCatalog()).settings
}

/** Only occasions that actually have at least one active product get a filter chip. */
export async function getUsedOccasions(): Promise<Occasion[]> {
  const { products, occasions } = await getCatalog()
  const used = new Set(products.flatMap((p) => p.occasions))
  return occasions.filter((o) => used.has(o.slug))
}

/** Up to `limit` other products sharing an occasion tag. */
export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const { products } = await getCatalog()
  return products
    .filter(
      (p) =>
        p.code !== product.code &&
        p.occasions.some((o) => product.occasions.includes(o))
    )
    .slice(0, limit)
}
