import { collection } from '@/lib/db'
import type { Settings } from '@shared/types'
import SettingsForm from '@/components/SettingsForm'
import DbError from '@/components/DbError'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let settings: Partial<Settings> = {}
  let error: string | null = null
  try {
    const col = await collection('settings')
    settings = ((await col.findOne({})) ?? {}) as unknown as Partial<Settings>
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không đọc được cơ sở dữ liệu.'
  }

  if (error) return <DbError message={error} />

  return (
    <>
      <h1 className="font-display text-lg font-black">Cài đặt</h1>
      <p className="mt-1 text-xs text-stone-500">
        Thông tin liên hệ và chữ trên trang chủ. PLAN.md §4: mọi nội dung sửa được ở đây,
        không cần sửa code.
      </p>
      <SettingsForm initial={settings} />
    </>
  )
}
