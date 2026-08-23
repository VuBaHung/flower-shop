import type { BadgeStyle } from '@/lib/types'

/**
 * badge_style -> token, so the admin picks from an enum and can never invent a colour
 * (PLAN.md §4, DESIGN-TOKENS.md §1.3).
 *
 * All three fills are step 600+ so white text clears WCAG AA. The mockup's gradient
 * brand-500 -> rose-500 pill measured ~3.9:1 at 10px.
 */
const STYLES: Record<BadgeStyle, string> = {
  hot: 'bg-brand-600',
  info: 'bg-lavender-600',
  luxe: 'bg-stone-900',
}

export default function Badge({
  label,
  style = 'hot',
}: {
  label: string
  style?: BadgeStyle
}) {
  return (
    <span
      className={`inline-block rounded-pill px-3 py-1 text-2xs font-black uppercase tracking-wider text-white shadow-sm ${STYLES[style]}`}
    >
      {label}
    </span>
  )
}
