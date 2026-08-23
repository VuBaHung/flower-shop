import { MessageCircle, PhoneCall } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { formatPhone, telHref, zaloHref } from '@/lib/format'

/**
 * Floating contact buttons — DESKTOP ONLY. `hidden lg:flex` is what keeps these from
 * colliding with the sticky mobile ContactBar (PLAN.md §6, §7).
 */
export default function FloatingActions({ settings }: { settings: Settings }) {
  return (
    <div className="fixed bottom-6 right-6 z-30 hidden flex-col gap-3 lg:flex">
      <a
        href={zaloHref(settings.zaloPhone)}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-12 w-12 items-center justify-center rounded-pill bg-zalo text-white shadow-neon transition-transform hover:scale-110"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Chat Zalo với florist</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-stone-900 px-3 py-1.5 text-2xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          Chat Zalo với florist
        </span>
      </a>
      <a
        href={telHref(settings.phone)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-pill bg-primary text-white shadow-neon transition-transform hover:scale-110"
      >
        <PhoneCall className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Gọi {formatPhone(settings.phone)}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-stone-900 px-3 py-1.5 text-2xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          Gọi {formatPhone(settings.phone)}
        </span>
      </a>
    </div>
  )
}
