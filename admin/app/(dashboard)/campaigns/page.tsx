import { collection } from '@/lib/db'
import type { Campaign } from '@shared/types'
import CampaignsEditor from '@/components/CampaignsEditor'
import DbError from '@/components/DbError'
import PublishButton from '@/components/PublishButton'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
  let campaigns: Campaign[] = []
  let error: string | null = null
  try {
    const col = await collection('campaigns')
    campaigns = (await col.find({}).sort({ priority: 1 }).toArray()) as unknown as Campaign[]
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không đọc được cơ sở dữ liệu.'
  }

  if (error) return <DbError message={error} />

  return (
    <>
      <h1 className="font-display text-lg font-black">Khuyến mãi</h1>
      <p className="mt-1 text-xs text-stone-500">
        Chương trình tự bật/tắt theo ngày khi website được build lại. Slug không được chứa năm.
      </p>
      <CampaignsEditor initial={campaigns} />
      <PublishButton variant="section" />
    </>
  )
}
