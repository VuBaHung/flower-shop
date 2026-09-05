'use client'

import { useState } from 'react'
import { LoaderCircle, Upload, X } from 'lucide-react'

/**
 * One-image Cloudinary upload, for banners (campaigns) and occasion images.
 *
 * Same unsigned-preset approach as ImageUploader (PLAN.md §3A.3): bytes go straight from
 * the browser to Cloudinary, no secret client-side, no bytes through the admin server.
 * Kept separate from ImageUploader because that one manages an ordered gallery — reuse
 * would mean bending it around a single value it does not otherwise need.
 *
 * Falls back to a URL field when Cloudinary isn't configured, so the form still works.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function SingleImageUpload({
  value,
  onChange,
  label,
  hint,
  /** Preview box shape — banners are wide, occasion images are square-ish. */
  aspect = 'aspect-[16/6]',
}: {
  value: string
  onChange: (url: string) => void
  label: string
  hint?: string
  aspect?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

  async function upload(file: File) {
    setBusy(true)
    setError(null)

    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', UPLOAD_PRESET!)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? 'Tải ảnh thất bại.')
      } else if (data.secure_url) {
        onChange(data.secure_url as string)
      }
    } catch {
      setError('Không kết nối được Cloudinary.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="block text-xs font-bold text-stone-700">{label}</span>

      {value && (
        <div className="relative mt-1.5">
          <img
            src={value}
            alt=""
            className={`w-full rounded-lg border border-stone-200 object-cover ${aspect}`}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`Xoá ${label}`}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 shadow-sm hover:bg-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {configured ? (
        <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 px-3 py-3 text-xs font-bold text-stone-600 hover:border-stone-500">
          {busy ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Đang tải…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {value ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
              e.target.value = ''
            }}
          />
        </label>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… (Cloudinary chưa cấu hình)"
          className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      )}

      {hint && !error && <p className="mt-1 text-2xs text-stone-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
