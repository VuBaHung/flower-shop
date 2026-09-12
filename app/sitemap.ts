import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/data'
import { siteUrl } from '@/lib/site'

/**
 * Static export writes this to /sitemap.xml at build time. Product URLs carry a
 * trailing slash to match next.config.mjs `trailingSlash: true` — a mismatch would
 * advertise URLs that 301 elsewhere, wasting crawl budget.
 *
 * lastModified uses the build date: every deploy rebuilds every page, and the catalog
 * carries no per-product updatedAt to be more precise with.
 */
export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl()
  const products = await getProducts()
  const lastModified = new Date()

  return [
    { url: `${url}/`, lastModified, changeFrequency: 'daily', priority: 1 },
    ...products.map((product) => ({
      url: `${url}/hoa/${product.code}/`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
