import { collection } from '@/lib/db'
import type { Occasion } from '@shared/types'
import OccasionsEditor from '@/components/OccasionsEditor'
import DbError from '@/components/DbError'
import PublishButton from '@/components/PublishButton'

export const dynamic = 'force-dynamic'

export default async function OccasionsPage() {
  let occasions: Occasion[] = []
  let error: string | null = null
  try {
    const col = await collection('occasions')
    occasions = (await col.find({}).toArray()) as unknown as Occasion[]
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không đọc được cơ sở dữ liệu.'
  }

  if (error) return <DbError message={error} />

  return (
    <>
      <h1 className="font-display text-lg font-black">Dịp</h1>
      <p className="mt-1 text-xs text-stone-500">
        Đây là các nút lọc trên trang chủ. Sản phẩm chỉ chọn được dịp có trong danh sách này.
      </p>
      <OccasionsEditor initial={occasions} />
      <PublishButton variant="section" />
    </>
  )
}
