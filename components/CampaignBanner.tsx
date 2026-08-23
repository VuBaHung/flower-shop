import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import type { Campaign } from '@/lib/types'
import CutoffCountdown from './CutoffCountdown'

/**
 * Server component. Whether this renders at all was decided at BUILD time by
 * lib/campaigns.activeCampaign — never in the browser (PLAN.md §6.2).
 *
 * Separate mobile and desktop banner files, per PLAN.md §4 Sheet 3: cropping a 1920×600
 * banner down to a phone loses the message.
 */
export default function CampaignBanner({ campaign }: { campaign: Campaign }) {
  return (
    <section
      aria-labelledby="campaign-title"
      className="overflow-hidden rounded-3xl border border-brand-200 bg-porcelain shadow-card"
    >
      <div className="grid lg:grid-cols-2">
        <picture>
          <source media="(min-width: 1024px)" srcSet={campaign.bannerDesktop} />
          <img
            src={campaign.bannerMobile}
            alt={campaign.bannerAlt}
            width={800}
            height={1000}
            loading="lazy"
            decoding="async"
            className="h-56 w-full object-cover sm:h-72 lg:h-full"
          />
        </picture>

        <div className="space-y-4 p-6 sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-50 px-3 py-1 text-2xs font-black uppercase tracking-widest text-brand-700">
            <Tag className="h-3 w-3" aria-hidden="true" />
            Đang khuyến mãi
          </span>

          <h2
            id="campaign-title"
            className="font-display text-2xl font-black leading-snug text-ink sm:text-3xl"
          >
            {campaign.title}
          </h2>

          {campaign.subtitle && (
            <p className="text-sm font-semibold text-ink-muted">{campaign.subtitle}</p>
          )}
          {campaign.intro && (
            <p className="text-xs leading-relaxed text-ink-subtle">{campaign.intro}</p>
          )}

          {campaign.orderCutoff && <CutoffCountdown cutoff={campaign.orderCutoff} />}

          <Link
            href={campaign.ctaLink ?? '/?dip=sale'}
            className="inline-flex items-center gap-2 rounded-pill bg-primary px-6 py-3 text-xs font-extrabold text-white transition-all hover:bg-primary-hover hover:shadow-neon"
          >
            {campaign.ctaText ?? 'Xem mẫu đang giảm giá'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
