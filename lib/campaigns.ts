import type { Campaign, Product } from './types'

/**
 * Campaign activation, resolved against the BUILD date — never the browser's date.
 *
 * PLAN.md §6.2: a static build bakes in whatever was true at build time, so campaigns
 * start and end via scheduled rebuilds (GitHub Actions cron), not on their own. Rendering
 * activation or prices client-side would reintroduce exactly the SEO problem this
 * architecture exists to avoid.
 */

/** Build-time "today" as YYYY-MM-DD in Asia/Ho_Chi_Minh, so a UTC CI runner doesn't flip the date. */
export function buildDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Inclusive on both ends. ISO date strings compare correctly as plain strings. */
export function isActive(campaign: Campaign, today = buildDate()): boolean {
  return (
    campaign.status === 'active' &&
    campaign.startDate <= today &&
    today <= campaign.endDate
  )
}

/** The campaign that owns the homepage hero: active, lowest `priority` wins. */
export function activeCampaign(
  campaigns: Campaign[],
  today = buildDate()
): Campaign | undefined {
  return campaigns
    .filter((c) => isActive(c, today))
    .sort((a, b) => a.priority - b.priority)[0]
}

/**
 * Which products a campaign covers. Blank `productCodes` means "everything carrying a
 * salePrice", per PLAN.md §4 Sheet 3.
 */
export function campaignProductCodes(
  campaign: Campaign,
  products: Product[]
): Set<string> {
  if (campaign.productCodes.length > 0) return new Set(campaign.productCodes)
  if (campaign.occasionFilter) {
    return new Set(
      products
        .filter((p) => p.occasions.includes(campaign.occasionFilter!))
        .map((p) => p.code)
    )
  }
  return new Set(
    products.filter((p) => p.salePrice !== undefined).map((p) => p.code)
  )
}

/**
 * The resolved price for one product. This is THE price rule from PLAN.md §6.2 and is the
 * only place it lives — cards and detail pages both call this, so they cannot diverge.
 */
export interface ResolvedPrice {
  /** undefined => render "Liên hệ" */
  amount?: number
  /** Set only when a sale is active: the original, to be struck through. */
  wasAmount?: number
  /** e.g. "từ" */
  note?: string
  /** e.g. "Giá cuối tuần" — shown only alongside an active sale. */
  saleNote?: string
  onSale: boolean
}

export function resolvePrice(
  product: Product,
  saleCodes: Set<string>
): ResolvedPrice {
  // Blank price wins outright: "Liên hệ", and salePrice is ignored.
  if (product.price === undefined) {
    return { onSale: false }
  }

  const onSale =
    product.salePrice !== undefined &&
    product.salePrice < product.price &&
    saleCodes.has(product.code)

  if (onSale) {
    return {
      amount: product.salePrice,
      wasAmount: product.price,
      saleNote: product.saleNote,
      onSale: true,
    }
  }

  return { amount: product.price, note: product.priceNote, onSale: false }
}
