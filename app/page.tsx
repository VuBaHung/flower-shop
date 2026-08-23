import Link from 'next/link'
import { ArrowRight, Camera, Clock, HeartHandshake, MessageCircle, Sprout } from 'lucide-react'
import { getCatalog, getUsedOccasions } from '@/lib/data'
import {
  activeCampaign,
  campaignProductCodes,
  resolvePrice,
  type ResolvedPrice,
} from '@/lib/campaigns'
import { zaloHref } from '@/lib/format'
import ProductCard from '@/components/ProductCard'
import FilterableGrid, { type Chip, type GridItem } from '@/components/FilterableGrid'
import CampaignBanner from '@/components/CampaignBanner'
import DeliveryChecker from '@/components/DeliveryChecker'
import PriceDisplay from '@/components/PriceDisplay'

const COMMITMENTS = [
  {
    icon: Sprout,
    title: 'Hoa cắm trong ngày',
    body: 'Hoa nhập khẩu và hoa Đà Lạt chọn từng cành, cắm đúng ngày giao. Không dùng hoa tồn.',
    tone: 'bg-brand-100 text-brand-700',
  },
  {
    icon: Clock,
    title: 'Giao hỏa tốc 2 giờ',
    body: 'Shipper riêng của tiệm giao tận tay trong nội thành, giữ nguyên form bó hoa.',
    tone: 'bg-matcha-100 text-matcha-800',
  },
  {
    icon: Camera,
    title: 'Chụp ảnh trước khi giao',
    body: 'Gửi ảnh bó hoa thật qua Zalo để bạn duyệt trước. Chưa đồng ý là chưa giao.',
    tone: 'bg-lavender-100 text-lavender-600',
  },
  {
    icon: HeartHandshake,
    title: 'Cam kết đổi trả',
    body: 'Hoa không đúng như ảnh đã duyệt: đổi bó mới hoặc hoàn tiền 100%.',
    tone: 'bg-butter text-warning',
  },
]

export default function HomePage() {
  const { products, settings, campaigns } = getCatalog()
  const occasions = getUsedOccasions()
  const zalo = zaloHref(settings.zaloPhone)

  // Campaign activation and every price are resolved HERE, at build time.
  const campaign = activeCampaign(campaigns)
  const saleCodes = campaign
    ? campaignProductCodes(campaign, products)
    : new Set<string>()

  const priced: { code: string; price: ResolvedPrice }[] = products.map((p) => ({
    code: p.code,
    price: resolvePrice(p, saleCodes),
  }))
  const priceOf = (code: string) =>
    priced.find((p) => p.code === code)!.price

  const items: GridItem[] = products.map((product, i) => ({
    code: product.code,
    occasions: product.occasions,
    onSale: priceOf(product.code).onSale,
    node: (
      <ProductCard
        product={product}
        price={priceOf(product.code)}
        zaloUrl={zalo}
        eager={i < 4}
      />
    ),
  }))

  const chips: Chip[] = [
    { key: 'all', label: 'Tất cả mẫu' },
    ...occasions.map((o) => ({ key: o.slug, label: o.label })),
    ...(items.some((i) => i.onSale)
      ? [{ key: 'sale', label: 'Đang giảm giá' }]
      : []),
  ]

  const hero = products.find((p) => p.featured) ?? products[0]
  const heroPrice = priceOf(hero.code)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="bg-hero">
        <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
          <div className="space-y-6 lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-pill border border-brand-200 bg-porcelain/90 px-4 py-1.5 text-2xs font-extrabold tracking-wide text-brand-700">
              {settings.heroEyebrow}
            </span>

            <h1 className="font-display text-4xl font-black leading-display tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {settings.heroTitle}{' '}
              <span className="text-primary">{settings.heroTitleAccent}</span>
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
              {settings.heroText}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-primary px-7 py-4 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-neon"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Đặt hoa qua Zalo
              </a>
              <Link
                href="/#mau-hoa"
                className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-line bg-porcelain px-7 py-4 text-sm font-extrabold text-ink transition-colors hover:border-brand-300 hover:text-primary"
              >
                Xem mẫu hoa
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <DeliveryChecker areas={settings.deliveryAreas} />

            <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="text-2xs font-bold text-ink-subtle">Ảnh duyệt trước</dt>
                <dd className="font-display text-xl font-black text-primary">100%</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold text-ink-subtle">Giao nội thành</dt>
                <dd className="font-display text-xl font-black text-matcha-700">2 giờ</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold text-ink-subtle">Mở cửa mỗi ngày</dt>
                <dd className="font-display text-xl font-black text-lavender-600">7–21h</dd>
              </div>
            </dl>
          </div>

          {/* Hero product card — links to a real product, so it is not decoration. */}
          <div className="mt-10 lg:col-span-5 lg:mt-0">
            <Link
              href={`/hoa/${hero.code}/`}
              className="group relative block overflow-hidden rounded-4xl border-4 border-porcelain shadow-neon"
            >
              <img
                src={hero.images[0]}
                alt={hero.name}
                width={800}
                height={1000}
                loading="eager"
                decoding="async"
                className="aspect-card w-full object-cover transition-transform duration-hero group-hover:scale-105"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/10 to-transparent"
              />
              <span className="absolute inset-x-5 bottom-5 block space-y-1.5 text-white">
                <span className="block font-display text-xl font-black">{hero.name}</span>
                <span className="block text-2xs font-semibold text-stone-200">
                  Mã {hero.code} · {hero.subtitle}
                </span>
                <span className="block">
                  <PriceDisplay price={heroPrice} tone="on-dark" />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Campaign ---------- */}
      {campaign && (
        <div className="mx-auto max-w-container px-4 py-10 sm:px-6 lg:px-8">
          <CampaignBanner campaign={campaign} />
        </div>
      )}

      {/* ---------- Catalog ---------- */}
      <section id="mau-hoa" className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 space-y-2">
          <span className="block text-2xs font-black uppercase tracking-widest text-primary">
            Mẫu hoa đang có
          </span>
          <h2 className="font-display text-3xl font-black text-ink sm:text-4xl">
            Chọn mẫu, nhắn mã qua Zalo
          </h2>
          <p className="max-w-2xl text-sm text-ink-muted">
            Mỗi mẫu có một mã riêng. Bấm “Inbox Zalo” là mã được sao chép sẵn — bạn chỉ cần
            dán vào tin nhắn.
          </p>
        </div>

        <FilterableGrid items={items} chips={chips} />
      </section>

      {/* ---------- Commitments ---------- */}
      <section id="cam-ket" className="border-y border-line bg-porcelain py-12 lg:py-16">
        <div className="mx-auto grid max-w-container gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {COMMITMENTS.map(({ icon: Icon, title, body, tone }) => (
            <div key={title} className="flex gap-4">
              <span
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-subtle">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
