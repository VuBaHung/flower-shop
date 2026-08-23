'use client'

import { useRef, useState } from 'react'
import { Play } from 'lucide-react'

/**
 * PLAN.md §6.1 / §12: the video must not autoplay and must not count against initial page
 * weight. `preload="none"` plus a poster means nothing is fetched until the customer taps.
 *
 * The <video> element itself is only mounted on tap, so even the poster request is the
 * hero image the page already has cached.
 *
 * Callers must not render this at all when `video` is blank — an absent section, never an
 * empty container.
 */
export default function ProductVideo({
  src,
  poster,
  label,
}: {
  src: string
  poster: string
  label: string
}) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-black text-ink">Video bó hoa thật</h2>

      {playing ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          controls
          muted
          loop
          playsInline
          preload="none"
          autoPlay
          className="aspect-card w-full rounded-3xl border border-line bg-stone-900 object-cover sm:aspect-video"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative block w-full overflow-hidden rounded-3xl border border-line"
        >
          <img
            src={poster}
            alt=""
            width={800}
            height={1000}
            loading="lazy"
            decoding="async"
            className="aspect-card w-full object-cover sm:aspect-video"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-stone-900/30 transition-colors group-hover:bg-stone-900/40">
            <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-porcelain/95 text-primary shadow-neon">
              <Play className="h-6 w-6" aria-hidden="true" />
            </span>
          </span>
          <span className="sr-only">Xem video {label}</span>
        </button>
      )}
    </section>
  )
}
