import Link from 'next/link'
import type { Product } from '@shared/types'

/** One row in the product list. Server component — no interactivity beyond the link. */
export default function ProductRow({ product }: { product: Product }) {
  const hidden = product.status !== 'active'

  return (
    <li>
      <Link
        href={`/products/${product.code}`}
        className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 hover:border-stone-400"
      >
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xs text-stone-400">
            Chưa có ảnh
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-mono text-2xs font-bold text-stone-500">
              {product.code}
            </span>
            {hidden && (
              <span className="rounded bg-stone-200 px-1.5 py-0.5 text-2xs font-bold text-stone-600">
                Nháp
              </span>
            )}
            {product.featured && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-2xs font-bold text-amber-700">
                Nổi bật
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm font-bold text-stone-900">
            {product.name || <span className="text-stone-400">(chưa có tên)</span>}
          </span>
        </span>

        <span className="flex-shrink-0 text-xs font-bold text-stone-700">
          {product.price === undefined
            ? 'Liên hệ'
            : new Intl.NumberFormat('vi-VN').format(product.price) + '₫'}
        </span>
      </Link>
    </li>
  )
}
