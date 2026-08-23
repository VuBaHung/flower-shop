import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Flower2, PhoneCall, Ruler, Send, Truck } from 'lucide-react'
import { getCatalog, getProduct, getProducts, getRelatedProducts } from '@/lib/data'
import {
  activeCampaign,
  campaignProductCodes,
  resolvePrice,
} from '@/lib/campaigns'
import { formatPhone, telHref, zaloHref } from '@/lib/format'
import ProductGallery from '@/components/ProductGallery'
import ProductVideo from '@/components/ProductVideo'
import PriceDisplay from '@/components/PriceDisplay'
import CopyCodeButton from '@/components/CopyCodeButton'
import CutoffCountdown from '@/components/CutoffCountdown'
import ProductCard from '@/components/ProductCard'

/**
 * One static HTML file per product. Products are resolved HERE, at build time — never in
 * an effect, which is the single constraint the whole architecture rests on (PLAN.md §3).
 *
 * Phase 2 adds generateMetadata, OG tags and Product JSON-LD to this file. Note that no
 * AggregateRating may be emitted while ratings are blank or invented (PLAN.md §4.1).
 */
export function generateStaticParams() {
  return getProducts().map((p) => ({ code: p.code }))
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const product = getProduct(code)
  if (!product) notFound()

  const { settings, campaigns, products } = getCatalog()
  const campaign = activeCampaign(campaigns)
  const saleCodes = campaign
    ? campaignProductCodes(campaign, products)
    : new Set<string>()
  const price = resolvePrice(product, saleCodes)
  const onSale = price.onSale

  const zalo = zaloHref(settings.zaloPhone)
  const related = getRelatedProducts(product)

  return (
    <div className="mx-auto max-w-container px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/#mau-hoa"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tất cả mẫu hoa
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <ProductGallery
            images={product.images}
            alt={`${product.name} — ${product.subtitle ?? 'hoa tươi thiết kế'}`}
            badge={product.badge}
            badgeStyle={product.badgeStyle}
            onSale={onSale}
          />

          {/* Absent, not empty, when the video column is blank. */}
          {product.video && (
            <ProductVideo
              src={product.video}
              poster={product.images[0]}
              label={product.name}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            {product.subtitle && (
              <p className="text-2xs font-extrabold uppercase tracking-widest text-primary">
                {product.subtitle}
              </p>
            )}
            <h1 className="font-display text-3xl font-black leading-tight text-ink sm:text-4xl">
              {product.name}
            </h1>
          </div>

          {/* Large, copyable product code — this is what the customer quotes in Zalo. */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-porcelain p-4">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-subtle">
              Mã sản phẩm
            </span>
            <span className="font-mono text-lg font-black tracking-wider text-ink">
              {product.code}
            </span>
            <CopyCodeButton code={product.code} zaloUrl={zalo} variant="ghost" />
          </div>

          <div className="space-y-2">
            <PriceDisplay price={price} size="detail" />
            {price.amount === undefined && (
              <p className="text-xs text-ink-subtle">
                Giá thay đổi theo kích cỡ và mùa hoa — nhắn Zalo để được báo giá ngay.
              </p>
            )}
          </div>

          {onSale && campaign?.orderCutoff && (
            <CutoffCountdown cutoff={campaign.orderCutoff} />
          )}

          <div className="space-y-3">
            <CopyCodeButton code={product.code} zaloUrl={zalo} variant="detail" />
            <div className="grid grid-cols-2 gap-3">
              <a
                href={telHref(settings.phone)}
                className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-line bg-porcelain px-4 py-3 text-xs font-extrabold text-ink transition-colors hover:border-brand-300 hover:text-primary"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                {formatPhone(settings.phone)}
              </a>
              {settings.messengerUrl && (
                <a
                  href={settings.messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-line bg-porcelain px-4 py-3 text-xs font-extrabold text-ink transition-colors hover:border-brand-300 hover:text-primary"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Messenger
                </a>
              )}
            </div>
          </div>

          {product.description && (
            <div className="space-y-2">
              <h2 className="font-display text-base font-black text-ink">Mô tả</h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                {product.description}
              </p>
            </div>
          )}

          <dl className="grid gap-3 rounded-2xl border border-line bg-porcelain p-4 text-xs sm:grid-cols-2">
            {product.flowerType && (
              <div className="flex items-center gap-2">
                <Flower2 className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                <dt className="sr-only">Loại hoa</dt>
                <dd className="font-semibold text-ink-muted">{product.flowerType}</dd>
              </div>
            )}
            {product.size && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                <dt className="sr-only">Kích cỡ</dt>
                <dd className="font-semibold text-ink-muted">Size {product.size}</dd>
              </div>
            )}
            <div className="flex items-start gap-2 sm:col-span-2">
              <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-matcha-700" aria-hidden="true" />
              <dt className="sr-only">Giao hàng</dt>
              <dd className="leading-relaxed text-ink-muted">
                {settings.deliveryFeeNote}. {settings.sameDayCutoff}.
              </dd>
            </div>
          </dl>

          {/* Occasion chips link back to the filtered homepage grid. */}
          {product.occasions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-ink-subtle">
                Phù hợp dịp
              </span>
              {product.occasions.map((slug) => {
                const label =
                  getCatalog().occasions.find((o) => o.slug === slug)?.label ?? slug
                return (
                  <Link
                    key={slug}
                    href={`/?dip=${slug}`}
                    className="rounded-pill border border-line bg-porcelain px-3 py-1.5 text-xs font-bold text-ink-muted hover:border-brand-400 hover:text-primary"
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14 space-y-6 border-t border-line pt-10">
          <h2 className="font-display text-2xl font-black text-ink">Sản phẩm tương tự</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {related.map((p) => (
              <ProductCard
                key={p.code}
                product={p}
                price={resolvePrice(p, saleCodes)}
                zaloUrl={zalo}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
