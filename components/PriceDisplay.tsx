import type { ResolvedPrice } from '@/lib/campaigns'
import { formatVnd } from '@/lib/format'

/**
 * The ONE place a price is rendered. Cards and detail pages both use this, so the sale
 * treatment cannot drift between them (PLAN.md §6.2, §12).
 *
 * The value is always resolved at build time by lib/campaigns.resolvePrice — nothing here
 * looks at the browser's clock.
 */
export default function PriceDisplay({
  price,
  size = 'card',
  tone = 'default',
}: {
  price: ResolvedPrice
  size?: 'card' | 'detail'
  /** 'on-dark' for the hero card, where the price sits over a photo. */
  tone?: 'default' | 'on-dark'
}) {
  const onDark = tone === 'on-dark'
  const amountClass = size === 'detail' ? 'text-3xl' : 'text-base sm:text-lg'
  const wasClass = size === 'detail' ? 'text-base' : 'text-xs'

  if (price.amount === undefined) {
    return (
      <span
        className={`font-display font-black ${amountClass} ${
          onDark ? 'text-white' : 'text-ink'
        }`}
      >
        Liên hệ
      </span>
    )
  }

  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {price.note && (
        <span
          className={`text-xs font-semibold ${onDark ? 'text-stone-300' : 'text-ink-subtle'}`}
        >
          {price.note}
        </span>
      )}
      <span
        className={`font-display font-black ${amountClass} ${
          onDark ? 'text-white' : price.onSale ? 'text-sale' : 'text-primary'
        }`}
      >
        {formatVnd(price.amount)}
      </span>
      {price.wasAmount !== undefined && (
        <span
          className={`font-semibold line-through ${wasClass} ${
            onDark ? 'text-stone-300' : 'text-price-was'
          }`}
        >
          {formatVnd(price.wasAmount)}
        </span>
      )}
      {price.saleNote && (
        <span
          className={`rounded-pill px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider ${
            onDark ? 'bg-porcelain/20 text-white' : 'bg-brand-50 text-brand-700'
          }`}
        >
          {price.saleNote}
        </span>
      )}
    </span>
  )
}
