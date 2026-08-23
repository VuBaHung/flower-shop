'use client'

import { useState } from 'react'
import Badge from './Badge'
import type { BadgeStyle } from '@/lib/types'

/**
 * Swipeable on touch (CSS scroll-snap, no JS), thumbnail-driven on desktop.
 *
 * The main image is a real <img> in the HTML, so the hero shot is present for crawlers and
 * with JS disabled. A single-image product (fixture HB-003) renders no thumbnail strip —
 * not an empty one.
 */
export default function ProductGallery({
  images,
  alt,
  badge,
  badgeStyle,
  onSale,
}: {
  images: string[]
  alt: string
  badge?: string
  badgeStyle?: BadgeStyle
  onSale: boolean
}) {
  const [index, setIndex] = useState(0)
  const current = images[index] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-porcelain">
        <img
          src={current}
          alt={alt}
          width={800}
          height={1000}
          loading="eager"
          decoding="async"
          className="aspect-card w-full object-cover"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {badge && <Badge label={badge} style={badgeStyle} />}
          {onSale && <Badge label="Giảm giá" style="hot" />}
        </div>
      </div>

      {images.length > 1 && (
        <div className="chip-scroll flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === index}
              className={`h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                i === index ? 'border-primary' : 'border-line hover:border-brand-300'
              }`}
            >
              <img
                src={src}
                alt=""
                width={160}
                height={200}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
