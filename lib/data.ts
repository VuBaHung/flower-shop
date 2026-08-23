import fixtures from '@/data/fixtures.json'
import type { CatalogData, Occasion, Product, Campaign, Settings } from './types'

/**
 * The single entry point every component imports from. Runs at BUILD time only.
 *
 * Phase 3 adds a Sheet branch here, behind DATA_SOURCE=sheet, returning the identical
 * CatalogData shape. Components never learn which source they got.
 */

function loadFixtures(): CatalogData {
  const products = (fixtures.products as Product[])
    // status=hidden rows are dropped here, so they can never reach a page or the sitemap.
    .filter((p) => p.status === 'active')
    .sort((a, b) => a.sort - b.sort)

  return {
    products,
    occasions: fixtures.occasions as Occasion[],
    campaigns: fixtures.campaigns as Campaign[],
    settings: fixtures.settings as Settings,
  }
}

export function getCatalog(): CatalogData {
  // Phase 3: if (process.env.DATA_SOURCE === 'sheet') return loadSheet()
  return loadFixtures()
}

export function getProducts(): Product[] {
  return getCatalog().products
}

export function getProduct(code: string): Product | undefined {
  return getCatalog().products.find((p) => p.code === code)
}

export function getSettings(): Settings {
  return getCatalog().settings
}

/** Only occasions that actually have at least one active product get a filter chip. */
export function getUsedOccasions(): Occasion[] {
  const { products, occasions } = getCatalog()
  const used = new Set(products.flatMap((p) => p.occasions))
  return occasions.filter((o) => used.has(o.slug))
}

/** Up to `limit` other products sharing an occasion tag. */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return getCatalog()
    .products.filter(
      (p) =>
        p.code !== product.code &&
        p.occasions.some((o) => product.occasions.includes(o))
    )
    .slice(0, limit)
}
