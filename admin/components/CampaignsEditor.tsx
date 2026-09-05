'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import type { Campaign } from '@shared/types'
import SingleImageUpload from './SingleImageUpload'

const inputClass = 'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm'

/**
 * Campaigns are few and short-lived, so this is a list plus one inline create/edit form
 * rather than its own route. PLAN.md §6.2 governs the rules the validator enforces:
 * year-agnostic slugs, and activation by date at build time.
 */
export default function CampaignsEditor({ initial }: { initial: Campaign[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Campaign | 'new' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Uploads write here rather than into a form field, so they survive re-renders and are
  // merged into the payload on save.
  const [banners, setBanners] = useState({ desktop: '', mobile: '' })

  function startEditing(c: Campaign | 'new') {
    setEditing(c)
    setErrors({})
    setBanners(
      c === 'new'
        ? { desktop: '', mobile: '' }
        : { desktop: c.bannerDesktop ?? '', mobile: c.bannerMobile ?? '' }
    )
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setBanner(null)

    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())
    payload.productCodes = String(form.get('productCodes') ?? '')
    payload.bannerDesktop = banners.desktop
    payload.bannerMobile = banners.mobile

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.status === 422) {
      setErrors((await res.json()).errors ?? {})
      setBusy(false)
      return
    }
    if (!res.ok) {
      setBanner('Lưu thất bại.')
      setBusy(false)
      return
    }
    setEditing(null)
    setBusy(false)
    router.refresh()
  }

  async function remove(slug: string) {
    await fetch(`/api/campaigns?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
    router.refresh()
  }

  const current = editing === 'new' ? null : editing

  return (
    <div className="mt-4 space-y-4">
      {banner && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {banner}
        </p>
      )}

      <ul className="space-y-2">
        {initial.map((c) => (
          <li
            key={c.slug}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{c.title}</span>
              <span className="font-mono text-2xs text-stone-500">
                {c.slug} · {c.startDate} → {c.endDate}
                {c.status !== 'active' && ' · đang tắt'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => startEditing(c)}
              className="rounded border border-stone-300 px-2 py-1 text-2xs font-bold text-stone-700"
            >
              Sửa
            </button>
            <button
              type="button"
              onClick={() => remove(c.slug)}
              aria-label={`Xoá ${c.title}`}
              className="rounded border border-rose-300 p-1.5 text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {editing === null ? (
        <button
          type="button"
          onClick={() => startEditing('new')}
          className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm chương trình
        </button>
      ) : (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-stone-300 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="c-slug" className="block text-xs font-bold text-stone-700">
                Slug
              </label>
              <input
                id="c-slug"
                name="slug"
                defaultValue={current?.slug}
                readOnly={!!current}
                required
                className={`${inputClass} font-mono ${current ? 'bg-stone-100' : ''}`}
              />
              <p className="mt-1 text-2xs text-stone-500">
                Không chứa năm: “hoa-20-10”, không phải “hoa-20-10-2026”.
              </p>
              {errors.slug && (
                <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">{errors.slug}</p>
              )}
            </div>

            <div>
              <label htmlFor="c-title" className="block text-xs font-bold text-stone-700">
                Tiêu đề
              </label>
              <input id="c-title" name="title" defaultValue={current?.title} required className={inputClass} />
              {errors.title && (
                <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="c-start" className="block text-xs font-bold text-stone-700">
                Ngày bắt đầu
              </label>
              <input
                id="c-start"
                name="startDate"
                type="date"
                defaultValue={current?.startDate}
                required
                className={inputClass}
              />
              {errors.startDate && (
                <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="c-end" className="block text-xs font-bold text-stone-700">
                Ngày kết thúc
              </label>
              <input
                id="c-end"
                name="endDate"
                type="date"
                defaultValue={current?.endDate}
                required
                className={inputClass}
              />
              {errors.endDate && (
                <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">{errors.endDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="c-priority" className="block text-xs font-bold text-stone-700">
                Ưu tiên
              </label>
              <input
                id="c-priority"
                name="priority"
                inputMode="numeric"
                defaultValue={current?.priority ?? 99}
                className={inputClass}
              />
              <p className="mt-1 text-2xs text-stone-500">Số nhỏ thắng khi trùng ngày.</p>
            </div>

            <div>
              <label htmlFor="c-status" className="block text-xs font-bold text-stone-700">
                Trạng thái
              </label>
              <select
                id="c-status"
                name="status"
                defaultValue={current?.status ?? 'active'}
                className={inputClass}
              >
                <option value="active">Bật</option>
                <option value="hidden">Tắt</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SingleImageUpload
              label="Banner máy tính"
              value={banners.desktop}
              onChange={(url) => setBanners((b) => ({ ...b, desktop: url }))}
              hint="Khoảng 1920×600."
              aspect="aspect-[16/5]"
            />
            <SingleImageUpload
              label="Banner điện thoại"
              value={banners.mobile}
              onChange={(url) => setBanners((b) => ({ ...b, mobile: url }))}
              hint="Khoảng 800×800. Dùng ảnh riêng — cắt ảnh ngang sẽ mất nội dung."
              aspect="aspect-square"
            />
          </div>

          <div>
            <label htmlFor="c-alt" className="block text-xs font-bold text-stone-700">
              Mô tả ảnh banner
            </label>
            <input
              id="c-alt"
              name="bannerAlt"
              defaultValue={current?.bannerAlt}
              className={inputClass}
            />
            <p className="mt-1 text-2xs text-stone-500">
              Mô tả ngắn nội dung ảnh — cho người khiếm thị và cho Google.
            </p>
          </div>

          <div>
            <label htmlFor="c-codes" className="block text-xs font-bold text-stone-700">
              Mã sản phẩm áp dụng
            </label>
            <input
              id="c-codes"
              name="productCodes"
              defaultValue={current?.productCodes?.join(', ')}
              placeholder="HB-001, HB-002"
              className={inputClass}
            />
            <p className="mt-1 text-2xs text-stone-500">
              Để trống = áp dụng cho mọi sản phẩm có giá khuyến mãi.
            </p>
          </div>

          <div>
            <label htmlFor="c-cutoff" className="block text-xs font-bold text-stone-700">
              Hạn đặt hàng
            </label>
            <input
              id="c-cutoff"
              name="orderCutoff"
              defaultValue={current?.orderCutoff}
              placeholder="Đặt trước 18/10 để giao đúng ngày"
              className={inputClass}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setErrors({})
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-bold text-stone-600"
            >
              Huỷ
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
