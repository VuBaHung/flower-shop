'use client'

import { useState } from 'react'
import { LoaderCircle, Upload, X } from 'lucide-react'

/**
 * Cloudinary upload, PLAN.md §3A.3.
 *
 * Uses an UNSIGNED upload preset posted straight from the browser: the image bytes never
 * pass through the admin server, and no API secret is ever shipped to the client. The
 * cloud name and preset name are public by design — restrict the preset (WebP, max
 * dimensions, one folder) in the Cloudinary dashboard, which is where the ≤150KB rule in
 * PLAN.md §2 is actually enforced.
 *
 * Progress is shown per file because five photos on shop wifi otherwise looks frozen
 * (PLAN.md §9).
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function ImageUploader({
  images,
  onChange,
}: {
  images: string[]
  onChange: (next: string[]) => void
}) {
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

  async function upload(files: FileList) {
    setError(null)
    setUploading(files.length)

    const uploaded: string[] = []
    for (const file of Array.from(files)) {
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
          break
        }
        // secure_url so the storefront never serves an image over plain http.
        if (data.secure_url) uploaded.push(data.secure_url as string)
      } catch {
        setError('Không kết nối được Cloudinary.')
        break
      } finally {
        setUploading((n) => n - 1)
      }
    }

    if (uploaded.length > 0) onChange([...images, ...uploaded])
    setUploading(0)
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function move(index: number, delta: number) {
    const next = [...images]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      {images.length > 0 && (
        <ul className="mb-3 space-y-2">
          {images.map((url, i) => (
            <li
              key={url + i}
              className="flex items-center gap-2 rounded-lg border border-stone-200 p-2"
            >
              <img src={url} alt="" width={48} height={48} className="h-12 w-12 rounded object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-2xs text-stone-500">{url}</span>
                {i === 0 && (
                  <span className="text-2xs font-bold text-emerald-700">
                    Ảnh chính — dùng cho Google &amp; Zalo
                  </span>
                )}
              </span>
              <span className="flex flex-shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Chuyển lên"
                  className="rounded border border-stone-300 px-2 py-1 text-2xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Chuyển xuống"
                  className="rounded border border-stone-300 px-2 py-1 text-2xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Xoá ảnh"
                  className="rounded border border-rose-300 p-1 text-rose-600"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {configured ? (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 px-4 py-4 text-xs font-bold text-stone-600 hover:border-stone-500">
          {uploading > 0 ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Đang tải {uploading} ảnh…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Chọn ảnh từ máy
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading > 0}
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      ) : (
        // Phase 3B runs before any account exists (PLAN.md §3A.7), so the form still has
        // to work: paste a URL by hand until Cloudinary is configured.
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-2xs font-bold text-amber-900">
            Cloudinary chưa được cấu hình — dán URL ảnh thủ công.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              placeholder="https://…"
              className="flex-1 rounded border border-stone-300 px-2 py-1.5 text-xs"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                const input = e.currentTarget
                const value = input.value.trim()
                if (value) {
                  onChange([...images, value])
                  input.value = ''
                }
              }}
            />
            <span className="self-center text-2xs text-amber-800">Enter để thêm</span>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-2xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
