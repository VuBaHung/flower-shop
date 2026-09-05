'use client'

import { resolvePrice } from '@shared/campaigns'
import { formatVnd } from '@shared/format'
import type { Product } from '@shared/types'

/**
 * Live preview of the storefront product card, updated as the admin types.
 *
 * Imports resolvePrice/formatVnd from the SHARED lib rather than reimplementing them, so
 * the sale treatment and "Liên hệ" fallback cannot drift from what the real card renders
 * (PLAN.md §6.2, §12 — price rules live in exactly one place).
 *
 * The markup mirrors components/ProductCard.tsx in the storefront. It is a deliberate
 * copy, not an import: the storefront card is a Server Component styled with the brand
 * token set, and this admin app intentionally does not carry those tokens (§3A). Any
 * visual change to the real card should be mirrored here.
 */
export default function ProductPreview({
  draft,
  occasionLabels,
}: {
  draft: Partial<Product>
  occasionLabels: string[]
}) {
  // The preview shows the sale price as if a campaign were live, so the admin can see
  // what the discount will look like. Real activation is by campaign dates at build time.
  const saleCodes = new Set(draft.code ? [draft.code] : [])
  const price = resolvePrice(
    {
      code: draft.code ?? '',
      name: draft.name ?? '',
      price: draft.price,
      salePrice: draft.salePrice,
      saleNote: draft.saleNote,
      priceNote: draft.priceNote,
      occasions: [],
      images: [],
      status: 'active',
      featured: false,
      sort: 0,
    },
    saleCodes
  )

  const image = draft.images?.[0]
  const hasSale = price.onSale && price.wasAmount !== undefined

  return (
    <div className="sticky top-32">
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-stone-500">
        Xem trước
      </p>

      {/* Fixed 260px: roughly the width of a real card in the storefront's grid. */}
      <div className="w-[260px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="relative aspect-[4/5] bg-stone-100">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xs text-stone-400">
              Chưa có ảnh
            </span>
          )}

          {draft.badge && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-1 text-2xs font-black uppercase tracking-wide ${
                draft.badgeStyle === 'hot'
                  ? 'bg-rose-600 text-white'
                  : draft.badgeStyle === 'luxe'
                    ? 'bg-amber-400 text-stone-900'
                    : 'bg-sky-600 text-white'
              }`}
            >
              {draft.badge}
            </span>
          )}

          {hasSale && (
            <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-2xs font-black uppercase text-white">
              Giảm giá
            </span>
          )}
        </div>

        <div className="flex flex-col p-3">
          <div className="flex items-baseline justify-between gap-2 text-2xs font-semibold text-stone-500">
            <span className="truncate">{draft.subtitle}</span>
            <span className="flex-shrink-0 font-mono font-bold">{draft.code}</span>
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-sm font-black leading-snug text-stone-900">
            {draft.name || <span className="text-stone-400">(chưa có tên)</span>}
          </h3>

          {draft.shortDesc && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-500">
              {draft.shortDesc}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3">
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              {price.note && (
                <span className="text-xs font-semibold text-stone-500">{price.note}</span>
              )}
              <span
                className={`text-base font-black ${
                  price.amount === undefined
                    ? 'text-stone-900'
                    : hasSale
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                }`}
              >
                {price.amount === undefined ? 'Liên hệ' : formatVnd(price.amount)}
              </span>
              {price.wasAmount !== undefined && (
                <span className="text-xs font-semibold text-stone-400 line-through">
                  {formatVnd(price.wasAmount)}
                </span>
              )}
            </span>
            <span className="flex-shrink-0 rounded-full bg-rose-600 px-3 py-1.5 text-2xs font-extrabold text-white">
              Inbox Zalo
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-3 w-[260px] space-y-1 text-2xs text-stone-500">
        {occasionLabels.length > 0 && (
          <div className="flex gap-1.5">
            <dt className="font-bold">Dịp:</dt>
            <dd>{occasionLabels.join(', ')}</dd>
          </div>
        )}
        {(draft.images?.length ?? 0) > 1 && (
          <div className="flex gap-1.5">
            <dt className="font-bold">Ảnh:</dt>
            <dd>{draft.images!.length} ảnh trong thư viện</dd>
          </div>
        )}
        {draft.salePrice !== undefined && draft.price !== undefined && !hasSale && (
          // Explains why a filled-in sale price isn't showing, rather than looking broken.
          <p className="text-amber-700">
            Giá khuyến mãi chỉ hiện khi có chương trình đang chạy áp dụng mã này.
          </p>
        )}
      </dl>
    </div>
  )
}
