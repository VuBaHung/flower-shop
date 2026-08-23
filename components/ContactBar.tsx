import { MessageCircle, PhoneCall, Send } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { telHref, zaloHref } from '@/lib/format'

/**
 * Sticky bottom contact bar — MOBILE ONLY (PLAN.md §6 Global, §7).
 *
 * The mockup has no such bar; it has only the bottom-right floating buttons, which on a
 * 375px screen land directly on top of the last card's "Inbox Zalo" button. Per PLAN.md
 * §6: sticky bar on mobile (bigger tap targets, covers no product images), floating
 * buttons on desktop. The two never render together — see FloatingActions.
 *
 * No client bundle: these are three links and a media query.
 */
export default function ContactBar({ settings }: { settings: Settings }) {
  return (
    <nav
      aria-label="Liên hệ đặt hoa"
      className="glass-panel fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-line px-3 py-2.5 lg:hidden"
    >
      <a
        href={zaloHref(settings.zaloPhone)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl bg-zalo text-white"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="text-2xs font-extrabold">Zalo</span>
      </a>
      <a
        href={telHref(settings.phone)}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary text-white"
      >
        <PhoneCall className="h-5 w-5" aria-hidden="true" />
        <span className="text-2xs font-extrabold">Gọi ngay</span>
      </a>
      {settings.messengerUrl ? (
        <a
          href={settings.messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl bg-lavender-600 text-white"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          <span className="text-2xs font-extrabold">Messenger</span>
        </a>
      ) : (
        <a
          href="/#mau-hoa"
          className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl bg-stone-900 text-white"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          <span className="text-2xs font-extrabold">Xem mẫu</span>
        </a>
      )}
    </nav>
  )
}
