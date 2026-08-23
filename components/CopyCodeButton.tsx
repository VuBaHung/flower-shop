'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'

/**
 * PLAN.md §6: tapping "Inbox Zalo" from the grid sends the customer to Zalo with no
 * reference to the product, so they arrive saying "I want this one". Both fixes from the
 * plan are applied — the code is copied on tap, and the code is also printed on the card.
 *
 * Feedback is an inline aria-live swap rather than a global toast: a toast anchored
 * bottom-left sits underneath the sticky mobile contact bar, and a screen reader gets
 * nothing from it.
 *
 * navigator.clipboard needs a secure context; it is absent on plain-http LAN testing
 * (`next dev` on 192.168.x.x), so there is a textarea fallback. Never block navigation on
 * the copy — the Zalo hand-off has to happen either way.
 */
export default function CopyCodeButton({
  code,
  zaloUrl,
  variant = 'card',
}: {
  code: string
  zaloUrl: string
  variant?: 'card' | 'detail' | 'ghost'
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const el = document.createElement('textarea')
        el.value = code
        el.setAttribute('readonly', '')
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard denied — the code is printed on the card, so nothing is lost.
    }
  }

  const label = copied ? `Đã sao chép mã ${code}` : undefined

  if (variant === 'ghost') {
    return (
      <>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-pill border border-line-strong px-3 py-1.5 text-xs font-bold text-ink-muted transition-colors hover:border-primary hover:text-primary"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copied ? 'Đã sao chép' : 'Sao chép mã'}
        </button>
        <span aria-live="polite" className="sr-only">
          {label}
        </span>
      </>
    )
  }

  const sizing =
    variant === 'detail'
      ? 'w-full justify-center px-6 py-4 text-sm'
      : 'px-3 py-1.5 text-2xs sm:px-4 sm:py-2 sm:text-xs'

  return (
    <>
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={copy}
        className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-pill bg-primary font-extrabold text-white shadow-sm transition-colors hover:bg-primary-hover ${sizing}`}
      >
        <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        {variant === 'detail' ? 'Nhắn Zalo đặt hàng' : 'Inbox Zalo'}
      </a>
      <span aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  )
}
