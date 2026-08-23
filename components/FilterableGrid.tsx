'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'

export interface GridItem {
  code: string
  occasions: string[]
  onSale: boolean
  /** A server-rendered <ProductCard>. Passed in as a prop so the card stays a Server Component. */
  node: ReactNode
}

export interface Chip {
  key: string
  label: string
}

const ALL = 'all'
const SALE = 'sale'

/**
 * Client-side filtering over cards that were already rendered on the server.
 *
 * Why this shape:
 *  - Every card is in the static HTML, unfiltered, before any JS runs. That is what keeps
 *    the SEO goal and the "works with JavaScript disabled" criterion (PLAN.md §12) intact.
 *    Filtering only ever adds a `hidden` class to something already in the document.
 *  - The initial state is deliberately ALL, not the URL's value. Reading the URL happens in
 *    an effect after mount, so the prerendered HTML is identical for every ?dip= value.
 *  - `useSearchParams` is avoided on purpose: under `output: 'export'` it forces a Suspense
 *    boundary and a client-side bailout. location.search + history is enough here.
 */
export default function FilterableGrid({
  items,
  chips,
}: {
  items: GridItem[]
  chips: Chip[]
}) {
  const [active, setActive] = useState<string>(ALL)

  const readUrl = useCallback(() => {
    const dip = new URLSearchParams(window.location.search).get('dip')
    setActive(dip && chips.some((c) => c.key === dip) ? dip : ALL)
  }, [chips])

  useEffect(() => {
    readUrl()
    window.addEventListener('popstate', readUrl)
    return () => window.removeEventListener('popstate', readUrl)
  }, [readUrl])

  function select(key: string) {
    setActive(key)
    const url = new URL(window.location.href)
    if (key === ALL) url.searchParams.delete('dip')
    else url.searchParams.set('dip', key)
    // pushState so the back button steps through filters (PLAN.md §5).
    window.history.pushState({}, '', url)
  }

  const matches = (item: GridItem) =>
    active === ALL ||
    (active === SALE ? item.onSale : item.occasions.includes(active))

  const shown = items.filter(matches).length

  return (
    <>
      <div
        role="group"
        aria-label="Lọc theo dịp tặng"
        className="chip-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
      >
        {chips.map((chip) => {
          const isActive = chip.key === active
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => select(chip.key)}
              aria-pressed={isActive}
              className={`flex-shrink-0 rounded-pill px-5 py-2.5 text-xs font-extrabold transition-colors ${
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'border border-line bg-porcelain text-ink-muted hover:border-brand-400 hover:text-primary'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        {shown} mẫu hoa
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.code} className={matches(item) ? 'h-full' : 'hidden'}>
            {item.node}
          </div>
        ))}
      </div>

      {shown === 0 && (
        <p className="mt-10 rounded-3xl border border-line bg-porcelain p-8 text-center text-sm text-ink-muted">
          Chưa có mẫu nào trong dịp này. Nhắn Zalo để florist tư vấn mẫu phù hợp nhé.
        </p>
      )}
    </>
  )
}
