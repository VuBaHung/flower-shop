import { Phone } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { formatPhone, telHref } from '@/lib/format'

/**
 * Text comes from Settings, not from code — the shop owner must be able to change it
 * without a code change (PLAN.md §4 Sheet 4).
 *
 * The mockup's version is a single non-wrapping flex row; at 375px its Vietnamese copy
 * wrapped to three lines. Here the hotline is hidden on the narrowest screens (it is
 * already in the header and the sticky bar) so the bar stays one line.
 */
export default function AnnouncementBar({ settings }: { settings: Settings }) {
  return (
    <div className="bg-brand-600 px-4 py-2 text-center text-2xs font-bold tracking-wide text-white sm:text-xs">
      <div className="mx-auto flex max-w-container items-center justify-center gap-2">
        <span
          aria-hidden="true"
          className="hidden h-1.5 w-1.5 flex-shrink-0 rounded-full bg-butter sm:inline-block"
        />
        <span>{settings.announcementText}</span>
        <a
          href={telHref(settings.phone)}
          className="ml-1 hidden items-center gap-1 underline underline-offset-2 hover:text-brand-100 sm:inline-flex"
        >
          <Phone className="h-3 w-3" aria-hidden="true" />
          {formatPhone(settings.phone)}
        </a>
      </div>
    </div>
  )
}
