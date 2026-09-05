'use client'

import { useState } from 'react'
import { LoaderCircle, Upload, X } from 'lucide-react'

/**
 * Direct video upload to Cloudinary, replacing the paste-a-URL field.
 *
 * Two things differ from the image uploads:
 *   1. the endpoint is /video/upload, not /image/upload
 *   2. videos are far larger, so the size is checked BEFORE uploading — a phone clip can
 *      be tens of MB and Cloudinary's free tier caps unsigned uploads at 100MB. Failing
 *      fast beats a three-minute upload that ends in an error.
 *
 * PLAN.md §6.1 wants a 5-8s clip, which lands well inside the limit.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

/** Cloudinary's unsigned limit. Kept well under to leave room for their overhead. */
const MAX_BYTES = 90 * 1024 * 1024

export default function VideoUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

  async function upload(file: File) {
    setError(null)

    if (file.size > MAX_BYTES) {
      const mb = Math.round(file.size / 1024 / 1024)
      setError(
        `Video ${mb}MB — quá lớn (tối đa 90MB). Quay clip ngắn 5–8 giây theo hướng dẫn.`
      )
      return
    }

    setBusy(true)
    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', UPLOAD_PRESET!)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        { method: 'POST', body }
      )
      const data = await res.json()
      if (!res.ok) {
        // The most common cause is a preset restricted to images only.
        setError(
          data?.error?.message ??
            'Tải video thất bại. Kiểm tra upload preset có cho phép video không.'
        )
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
      <span className="block text-xs font-bold text-stone-700">Video</span>

      {value && (
        <div className="relative mt-1.5">
          <video
            src={value}
            controls
            preload="metadata"
            className="w-full rounded-lg border border-stone-200"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Xoá video"
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
              Đang tải video… (có thể mất một lúc)
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {value ? 'Đổi video' : 'Chọn video từ máy'}
            </>
          )}
          <input
            type="file"
            accept="video/*"
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

      <p className="mt-1 text-2xs text-stone-500">
        Không bắt buộc. Clip 5–8 giây quay quanh bó hoa.
      </p>
      {error && (
        <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
