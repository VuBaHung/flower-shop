'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import type { Settings } from '@shared/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900'

/** Every text key, so the form stays in step with the Settings type in one place. */
const TEXT_FIELDS: { key: keyof Settings; label: string; hint?: string }[] = [
  { key: 'shopName', label: 'Tên cửa hàng' },
  { key: 'tagline', label: 'Khẩu hiệu' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'zaloPhone', label: 'Số Zalo', hint: 'Chỉ chữ số — dùng để tạo link zalo.me' },
  { key: 'zaloOaId', label: 'Zalo OA ID', hint: 'Cần cho widget chat trên desktop.' },
  { key: 'messengerUrl', label: 'Link Messenger' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'hours', label: 'Giờ mở cửa' },
  { key: 'sameDayCutoff', label: 'Giờ chốt giao trong ngày' },
  { key: 'announcementText', label: 'Thanh thông báo' },
  { key: 'announcementLink', label: 'Link thông báo' },
  { key: 'heroEyebrow', label: 'Hero — dòng nhỏ' },
  { key: 'heroTitle', label: 'Hero — tiêu đề' },
  { key: 'heroTitleAccent', label: 'Hero — chữ nhấn' },
]

export default function SettingsForm({ initial }: { initial: Partial<Settings> }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)

    const form = new FormData(e.currentTarget)
    const payload: Record<string, unknown> = {}
    for (const { key } of TEXT_FIELDS) payload[key] = form.get(key)
    payload.heroText = form.get('heroText')
    payload.aboutText = form.get('aboutText')

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setMessage(res.ok ? 'Đã lưu. Nhấn “Đăng lên website” để cập nhật.' : 'Lưu thất bại.')
      if (res.ok) router.refresh()
    } catch {
      setMessage('Không kết nối được máy chủ.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-4 pb-24">
      <section className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        {TEXT_FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-xs font-bold text-stone-700">
              {label}
            </label>
            <input
              id={key}
              name={key}
              defaultValue={(initial[key] as string) ?? ''}
              className={inputClass}
            />
            {hint && <p className="mt-1 text-2xs text-stone-500">{hint}</p>}
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <label htmlFor="heroText" className="block text-xs font-bold text-stone-700">
            Hero — mô tả
          </label>
          <textarea
            id="heroText"
            name="heroText"
            rows={3}
            defaultValue={initial.heroText ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="aboutText" className="block text-xs font-bold text-stone-700">
            Giới thiệu cửa hàng
          </label>
          <textarea
            id="aboutText"
            name="aboutText"
            rows={4}
            defaultValue={initial.aboutText ?? ''}
            className={inputClass}
          />
        </div>
      </section>


      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {message && <span className="flex-1 text-xs font-semibold text-stone-600">{message}</span>}
          <button
            type="submit"
            disabled={busy}
            className="ml-auto flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Lưu cài đặt
          </button>
        </div>
      </div>
    </form>
  )
}
