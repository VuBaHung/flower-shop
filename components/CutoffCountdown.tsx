'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatDayMonth } from '@/lib/format'

/**
 * COSMETIC ONLY. PLAN.md §6.2 allows exactly one thing to be computed in the browser —
 * a countdown to `order_cutoff`. Prices and campaign activation are never client-side.
 *
 * The mockup's timer counted down from a hardcoded 18:45:20 and reset on every page load.
 * This one reads the real cutoff, and renders nothing at all once it has passed rather
 * than sitting at 00:00:00.
 *
 * The static date sentence is what the server renders; the live remainder is appended
 * only after mount, so the first client render matches the HTML exactly.
 */
function remaining(cutoff: string): string | null {
  // Inclusive: the cutoff day counts, ending 23:59:59 Vietnam time.
  const deadline = new Date(`${cutoff}T23:59:59+07:00`).getTime()
  const ms = deadline - Date.now()
  if (!Number.isFinite(deadline) || ms <= 0) return null

  const mins = Math.floor(ms / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  if (days > 0) return `còn ${days} ngày ${hours} giờ`
  const minutes = mins % 60
  return hours > 0 ? `còn ${hours} giờ ${minutes} phút` : `còn ${minutes} phút`
}

export default function CutoffCountdown({ cutoff }: { cutoff: string }) {
  const [left, setLeft] = useState<string | null>(null)

  useEffect(() => {
    setLeft(remaining(cutoff))
    const id = setInterval(() => setLeft(remaining(cutoff)), 60_000)
    return () => clearInterval(id)
  }, [cutoff])

  return (
    <p className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-butter px-4 py-2.5 text-xs font-bold text-warning">
      <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>Đặt trước {formatDayMonth(cutoff)} để giao đúng ngày</span>
      {left && <span className="text-ink-muted">· {left}</span>}
    </p>
  )
}
