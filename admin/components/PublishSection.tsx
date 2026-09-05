'use client'

import { usePathname } from 'next/navigation'
import PublishButton from './PublishButton'

/**
 * The single publish panel for the settings-style pages (Khuyến mãi, Dịp, Cài đặt).
 *
 * One panel shared across all three rather than one per page: publishing rebuilds the
 * whole site, so three separate buttons implied three separate publishes and invited
 * exactly the repeated-rebuild problem this is meant to avoid.
 *
 * Excluded from the product pages — the edit form there already has a sticky save bar,
 * and stacking a publish panel under it crowds the two actions together.
 */
export default function PublishSection() {
  const pathname = usePathname()
  const onSettingsPage = ['/campaigns', '/occasions', '/settings'].some((p) =>
    pathname.startsWith(p)
  )

  if (!onSettingsPage) return null

  return (
    <div className="mx-auto max-w-5xl px-4 pb-6">
      <PublishButton variant="section" />
    </div>
  )
}
