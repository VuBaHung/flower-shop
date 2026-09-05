import Link from 'next/link'
import { Plus } from 'lucide-react'
import { collection } from '@/lib/db'
import type { Product } from '@shared/types'
import ProductRow from '@/components/ProductRow'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  let products: Product[] = []
  let error: string | null = null

  try {
    const col = await collection('products')
    products = (await col.find({}).sort({ sort: 1 }).toArray()) as unknown as Product[]
  } catch (err) {
    // Almost always "MONGODB_URI not set yet" during Phase 3B. Say so plainly rather
    // than rendering an empty list that looks like a database with no products.
    error = err instanceof Error ? err.message : 'Không đọc được cơ sở dữ liệu.'
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-lg font-black">Sản phẩm</h1>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm sản phẩm
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Chưa kết nối được cơ sở dữ liệu</p>
          <p className="mt-1 font-mono text-xs text-amber-800">{error}</p>
        </div>
      )}

      {!error && products.length === 0 && (
        <p className="mt-6 rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          Chưa có sản phẩm nào. Nhấn “Thêm sản phẩm” để bắt đầu.
        </p>
      )}

      {products.length > 0 && (
        <ul className="mt-4 space-y-2">
          {products.map((p) => (
            <ProductRow key={p.code} product={p} />
          ))}
        </ul>
      )}
    </>
  )
}
