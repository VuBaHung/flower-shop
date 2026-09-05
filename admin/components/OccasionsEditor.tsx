'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import type { Occasion } from '@shared/types'
import SingleImageUpload from './SingleImageUpload'

export default function OccasionsEditor({ initial }: { initial: Occasion[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Image for the row currently being added, and for any existing row being re-imaged.
  const [newImage, setNewImage] = useState('')
  const [editingImage, setEditingImage] = useState<string | null>(null)

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/occasions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: form.get('slug'),
        label: form.get('label'),
        image: newImage,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.errors ? Object.values(data.errors).join(' ') : (data.error ?? 'Lưu thất bại.'))
      setBusy(false)
      return
    }
    e.currentTarget.reset()
    setNewImage('')
    setBusy(false)
    router.refresh()
  }

  async function saveImage(o: Occasion, url: string) {
    setError(null)
    const res = await fetch('/api/occasions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The route upserts by slug: label must be resent or it would be blanked.
      body: JSON.stringify({ slug: o.slug, label: o.label, image: url }),
    })
    if (!res.ok) {
      setError('Lưu ảnh thất bại.')
      return
    }
    setEditingImage(null)
    router.refresh()
  }

  async function remove(slug: string) {
    setError(null)
    const res = await fetch(`/api/occasions?slug=${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Xoá thất bại.')
      return
    }
    router.refresh()
  }

  return (
    <div className="mt-4 space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {initial.map((o) => (
          <li
            key={o.slug}
            className="rounded-xl border border-stone-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              {o.image ? (
                <img
                  src={o.image}
                  alt=""
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xs text-stone-400">
                  —
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{o.label}</span>
                <span className="font-mono text-2xs text-stone-500">{o.slug}</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setEditingImage((cur) => (cur === o.slug ? null : o.slug))
                }
                className="rounded border border-stone-300 px-2 py-1 text-2xs font-bold text-stone-700 hover:bg-stone-50"
              >
                {o.image ? 'Đổi ảnh' : 'Thêm ảnh'}
              </button>
              <button
                type="button"
                onClick={() => remove(o.slug)}
                aria-label={`Xoá ${o.label}`}
                className="rounded border border-rose-300 p-1.5 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {editingImage === o.slug && (
              <div className="mt-3 border-t border-stone-200 pt-3">
                <SingleImageUpload
                  label={`Ảnh cho "${o.label}"`}
                  value={o.image ?? ''}
                  onChange={(url) => saveImage(o, url)}
                  aspect="aspect-[16/9]"
                  hint="Lưu ngay sau khi tải lên."
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="rounded-xl border border-stone-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="label"
            placeholder="Tên hiển thị (Sinh nhật)"
            required
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="slug"
            placeholder="slug (sinh-nhat)"
            required
            pattern="[a-z0-9\-]+"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Thêm
          </button>
        </div>

        <div className="mt-3">
          <SingleImageUpload
            label="Ảnh (không bắt buộc)"
            value={newImage}
            onChange={setNewImage}
            aspect="aspect-[16/9]"
          />
        </div>
      </form>
    </div>
  )
}
