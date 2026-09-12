/**
 * Canonical site identity: the one place the public origin is defined.
 *
 * Everything SEO-facing (metadataBase, canonical URLs, OG image URLs, sitemap,
 * robots, JSON-LD @id) derives from siteUrl(). When the real domain is bought,
 * set NEXT_PUBLIC_SITE_URL in the deploy workflow — no code change anywhere else.
 *
 * The GitHub Pages project URL is the fallback so the current deploy stays correct
 * and self-consistent until then.
 */
import { optional } from './env'

const FALLBACK_URL = 'https://vubahung.github.io/flower-shop'

/** Absolute origin (plus basePath, if any), never with a trailing slash. */
export function siteUrl(): string {
  const raw = optional('NEXT_PUBLIC_SITE_URL') ?? FALLBACK_URL
  return raw.replace(/\/+$/, '')
}

/** Absolute URL for a root-relative path. Images in the catalog are already absolute. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl()}/${path.replace(/^\/+/, '')}`
}
