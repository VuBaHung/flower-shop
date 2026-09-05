'use client'

import { useState } from 'react'
import { Check, CloudUpload, LoaderCircle, TriangleAlert } from 'lucide-react'

/**
 * PLAN.md §9: saving is not publishing. Changes sit in the database until this is tapped.
 * That separation is useful — batch several edits, publish once — but only if the UI says
 * so, hence the explanatory line in the confirm step and the success message.
 */
export default function PublishButton({
  variant = 'header',
}: {
  /**
   * 'header' — the compact button in the top bar.
   * 'section' — a full-width panel at the foot of a page, so the admin can publish from
   *   where they just finished editing instead of scrolling back up.
   *
   * Both call the same endpoint: publishing rebuilds the WHOLE site, never one section.
   * The section copy says so, so a button under "Khuyến mãi" isn't read as
   * "publish only campaigns".
   */
  variant?: 'header' | 'section'
} = {}) {
  const [state, setState] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function publish() {
    setState('busy')
    setMessage(null)
    try {
      const res = await fetch('/api/publish', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMessage(data.error ?? 'Không đăng được.')
        setState('error')
        return
      }
      setState('done')
      // Long enough to read; the rebuild itself takes 1–2 minutes.
      setTimeout(() => setState('idle'), 8000)
    } catch {
      setMessage('Không kết nối được máy chủ.')
      setState('error')
    }
  }

  if (variant === 'section') {
    return (
      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">
          Đăng lên website
        </h2>
        <p className="mt-1 text-2xs text-stone-500">
          Cập nhật <strong>toàn bộ</strong> thay đổi đã lưu (sản phẩm, khuyến mãi, dịp,
          cài đặt) lên website. Mất khoảng 2 phút.
        </p>

        {state === 'done' ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <Check className="h-4 w-4" aria-hidden="true" />
            Đang cập nhật — khoảng 2 phút nữa website sẽ hiện thay đổi.
          </p>
        ) : state === 'confirm' ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">
              Đăng toàn bộ thay đổi lên website?
            </span>
            <button
              type="button"
              onClick={publish}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Đăng
            </button>
            <button
              type="button"
              onClick={() => setState('idle')}
              className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-bold text-stone-600"
            >
              Huỷ
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setState('confirm')}
              disabled={state === 'busy'}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-60 sm:w-auto"
            >
              {state === 'busy' ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CloudUpload className="h-4 w-4" aria-hidden="true" />
              )}
              Đăng lên website
            </button>
            {state === 'error' && message && (
              <p role="alert" className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-700">
                <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                {message}
              </p>
            )}
          </div>
        )}
      </section>
    )
  }

  if (state === 'confirm') {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-stone-500 sm:inline">
          Đăng toàn bộ thay đổi lên website?
        </span>
        <button
          type="button"
          onClick={publish}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Đăng
        </button>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold text-stone-600"
        >
          Huỷ
        </button>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        Đang cập nhật — khoảng 2 phút
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {state === 'error' && message && (
        <span
          role="alert"
          className="hidden max-w-xs items-center gap-1 text-xs font-semibold text-rose-700 sm:flex"
        >
          <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={() => setState('confirm')}
        disabled={state === 'busy'}
        className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {state === 'busy' ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <CloudUpload className="h-4 w-4" aria-hidden="true" />
        )}
        Đăng lên website
      </button>
    </div>
  )
}
