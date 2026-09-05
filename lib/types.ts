/**
 * The data contract. Both the Phase 1 fixture loader and the Phase 3 Google Sheet
 * parser must return exactly these shapes, so Phase 3 is a one-function swap in
 * lib/data.ts rather than a refactor.
 *
 * Columns mirror PLAN.md §4. Everything optional in the Sheet is optional here, and
 * normalization (comma-splitting, number coercion, blank -> undefined) happens in the
 * loader — components never parse strings.
 */

export type BadgeStyle = 'hot' | 'info' | 'luxe'
export type Status = 'active' | 'hidden'

export interface Product {
  /** e.g. "HB-014". Unique, becomes the URL slug, quoted by the customer in Zalo. */
  code: string
  name: string
  /** VND. undefined => render "Liên hệ" and ignore salePrice. */
  price?: number
  /** e.g. "từ" -> renders "từ 850.000₫" */
  priceNote?: string
  /** VND. Only honored inside an active campaign window. */
  salePrice?: number
  /** e.g. "Giá 20/10" — small label beside the sale price. */
  saleNote?: string
  /** Occasion slugs. Must exist in the Occasion list. */
  occasions: string[]
  flowerType?: string
  /** Small line above the name, e.g. "Waxflower Úc Import". */
  subtitle?: string
  badge?: string
  badgeStyle?: BadgeStyle
  /** 1–2 lines on the card, clamped to 2 lines. Distinct from `description`. */
  shortDesc?: string
  /**
   * PLAN.md §4.1: left blank until real reviews exist. No JSON-LD AggregateRating
   * may be emitted while these are absent or invented.
   */
  rating?: number
  reviewCount?: number
  size?: string
  /** 2–4 sentences. Feeds the meta description in Phase 2. */
  description?: string
  /** At least one. images[0] is the hero / OG / Google result image. */
  images: string[]
  /** Optional 5–8s clip. Absent => the video section does not render at all. */
  video?: string
  /** Phase 5 only. Blank for almost all products. */
  spinFolder?: string
  status: Status
  featured: boolean
  sort: number
}

export interface Occasion {
  slug: string
  label: string
  /**
   * Optional banner/thumbnail for the occasion. Added 2026-09-05 so the admin can
   * illustrate a filter chip or an occasion banner without a code change.
   */
  image?: string
  /** Unused until category pages exist; kept so the Sheet shape never changes. */
  seoTitle?: string
  seoDescription?: string
  intro?: string
}

export interface Campaign {
  /** Year-agnostic: "hoa-20-10", never "hoa-20-10-2026". PLAN.md §6.2. */
  slug: string
  title: string
  bannerDesktop: string
  bannerMobile: string
  bannerAlt: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  /** YYYY-MM-DD, inclusive. Evaluated against the build date. */
  startDate: string
  endDate: string
  /** "Đặt trước 18/10 để giao đúng ngày" */
  orderCutoff?: string
  /** Blank => auto-include every product carrying a salePrice. */
  productCodes: string[]
  occasionFilter?: string
  intro?: string
  seoTitle?: string
  seoDescription?: string
  /** Lowest wins the homepage hero when campaigns overlap. */
  priority: number
  status: Status
}

export interface Settings {
  shopName: string
  tagline: string
  phone: string
  /** Digits only — builds https://zalo.me/{zaloPhone} */
  zaloPhone: string
  /** Phase 4. Required for the desktop chat widget; a personal number can't have one. */
  zaloOaId?: string
  messengerUrl?: string
  address: string
  hours: string
  /** "Đặt trước 15:00 để giao trong ngày" */
  sameDayCutoff: string
  announcementText: string
  announcementLink?: string
  heroEyebrow: string
  heroTitle: string
  heroTitleAccent: string
  heroText: string
  aboutText: string
}

/** What lib/data.ts hands every component. */
export interface CatalogData {
  products: Product[]
  occasions: Occasion[]
  campaigns: Campaign[]
  settings: Settings
}
