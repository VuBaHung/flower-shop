'use client'

import { useMemo, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import type { DeliveryArea } from '@/lib/types'
import { formatVnd } from '@/lib/format'

/**
 * The mockup's hero has a "check shipping" form that goes nowhere. It is worth keeping —
 * fee and timing are the first question a customer asks — and it works with zero backend:
 * the district list is baked in from Settings at build time and matched in the browser.
 */
export default function DeliveryChecker({ areas }: { areas: DeliveryArea[] }) {
  const [query, setQuery] = useState('')

  const match = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return null
    const hit = areas.find(
      (a) => a.district.toLowerCase().includes(q) || q.includes(a.district.toLowerCase())
    )
    return hit ?? 'none'
  }, [query, areas])

  return (
    <div className="max-w-md space-y-2">
      <div className="glass-panel flex items-center gap-2 rounded-pill border border-brand-100 p-2 pl-4">
        <MapPin className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
        <label htmlFor="district" className="sr-only">
          Nhập quận/huyện để xem phí giao hoa
        </label>
        <input
          id="district"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập quận/huyện…"
          autoComplete="address-level3"
          className="w-full bg-transparent py-1.5 text-sm font-semibold text-ink placeholder-ink-subtle focus:outline-none"
        />
        <span
          aria-hidden="true"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-pill bg-matcha-700 text-white"
        >
          <Search className="h-4 w-4" />
        </span>
      </div>

      <p aria-live="polite" className="min-h-5 px-4 text-xs font-bold">
        {match === null ? (
          <span className="text-ink-subtle">
            Ví dụ: Quận 1, Bình Thạnh, Thủ Đức
          </span>
        ) : match === 'none' ? (
          <span className="text-ink-muted">
            Chưa có trong danh sách — nhắn Zalo để florist báo phí giao.
          </span>
        ) : (
          <span className="text-success">
            {match.district}: giao trong {match.eta} ·{' '}
            {match.fee === 0 ? 'miễn phí giao' : `phí ${formatVnd(match.fee)}`}
          </span>
        )}
      </p>
    </div>
  )
}
