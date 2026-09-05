import Link from 'next/link'
import type { Product } from '@/lib/types'
import type { ResolvedPrice } from '@/lib/campaigns'
import Badge from './Badge'
import PriceDisplay from './PriceDisplay'
import CopyCodeButton from './CopyCodeButton'

/**
 * Server component. The only client leaf inside is CopyCodeButton.
 *
 * Uniform height (PLAN.md §12) comes from three things together:
 *   1. the grid stretches every card in a row to the same height,
 *   2. the body is flex-1 flex-col so it fills that height,
 *   3. the price/CTA row is pinned with mt-auto.
 * Both text fields are line-clamped. The mockup clamped short_desc but NOT the name,
 * which is what breaks its grid on the first two-line Vietnamese product name.
 *
 * The rating slot from the mockup holds the product code instead — ratings stay blank
 * until real reviews exist (PLAN.md §4.1), and the code needs to be on the card anyway
 * so a customer arriving in Zalo can quote it.
 */
export default function ProductCard({
  product,
  price,
  zaloUrl,
  eager = false,
}: {
  product: Product
  price: ResolvedPrice
  zaloUrl: string
  eager?: boolean
}) {
  const href = `/hoa/${product.code}/`

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border sm:rounded-3xl border-line bg-porcelain shadow-card transition-all duration-300 hover:border-brand-300 hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-card-sm overflow-hidden sm:aspect-card">
        <img
          src={product.images[0]}
          alt={`${product.name} — ${product.subtitle ?? 'hoa tươi thiết kế'}`}
          width={800}
          height={1000}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-image group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 sm:left-4 sm:top-4">
            <Badge label={product.badge} style={product.badgeStyle} />
          </span>
        )}
        {price.onSale && (
          <span className="absolute right-2 top-2 sm:right-4 sm:top-4">
            <Badge label="Giảm giá" style="hot" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-5">
        <div className="hidden items-baseline justify-between gap-2 text-2xs font-semibold text-ink-subtle sm:flex">
          <span className="truncate">{product.subtitle}</span>
          <span className="flex-shrink-0 font-mono font-bold tracking-wider text-ink-muted">
            {product.code}
          </span>
        </div>

        <h3 className="font-display text-sm font-black leading-snug text-ink sm:mt-1.5 sm:text-lg">
          <Link href={href} className="line-clamp-1 hover:text-primary sm:line-clamp-2">
            {product.name}
          </Link>
        </h3>

        {product.shortDesc && (
          <p className="mt-1.5 hidden line-clamp-2 text-xs leading-relaxed text-ink-subtle sm:block">
            {product.shortDesc}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-2 sm:gap-3 sm:border-t sm:border-line/70 sm:pt-3">
          <PriceDisplay price={price} />
          <CopyCodeButton code={product.code} zaloUrl={zaloUrl} />
        </div>
      </div>
    </article>
  )
}
