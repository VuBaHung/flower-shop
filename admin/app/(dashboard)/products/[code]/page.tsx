import { notFound } from 'next/navigation'
import { collection } from '@/lib/db'
import type { Occasion, Product } from '@shared/types'
import ProductForm from '@/components/ProductForm'

export const dynamic = 'force-dynamic'

/**
 * Create and edit share one route: the literal code "new" means create. One form
 * component, one set of validation rules, no chance of the two drifting apart.
 */
export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const isNew = code === 'new'

  let product: Product | null = null
  let occasions: Occasion[] = []
  let error: string | null = null

  try {
    const occasionCol = await collection('occasions')
    occasions = (await occasionCol.find({}).toArray()) as unknown as Occasion[]

    if (!isNew) {
      const productCol = await collection('products')
      product = (await productCol.findOne({ code })) as unknown as Product | null
      if (!product) notFound()
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không đọc được cơ sở dữ liệu.'
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">Chưa kết nối được cơ sở dữ liệu</p>
        <p className="mt-1 font-mono text-xs text-amber-800">{error}</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-lg font-black">
        {isNew ? 'Thêm sản phẩm' : `Sửa ${code}`}
      </h1>
      <ProductForm product={product} occasions={occasions} isNew={isNew} />
    </>
  )
}
