import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { collection, ensureIndexes } from '@/lib/db'
import { validateCampaign } from '@/lib/validate'
import type { Status } from '@shared/types'

function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str).filter((x): x is string => !!x)
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied
  const col = await collection('campaigns')
  return NextResponse.json({ campaigns: await col.find({}).sort({ priority: 1 }).toArray() })
}

/** Upsert by slug. */
export async function POST(req: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  const status: Status = str(body.status) === 'active' ? 'active' : 'hidden'
  const input = {
    slug: (str(body.slug) ?? '').toLowerCase(),
    title: str(body.title),
    bannerDesktop: str(body.bannerDesktop) ?? '',
    bannerMobile: str(body.bannerMobile) ?? '',
    bannerAlt: str(body.bannerAlt) ?? '',
    subtitle: str(body.subtitle),
    ctaText: str(body.ctaText),
    ctaLink: str(body.ctaLink),
    startDate: str(body.startDate),
    endDate: str(body.endDate),
    orderCutoff: str(body.orderCutoff),
    productCodes: strArray(body.productCodes),
    occasionFilter: str(body.occasionFilter),
    intro: str(body.intro),
    seoTitle: str(body.seoTitle),
    seoDescription: str(body.seoDescription),
    priority: Number(body.priority) || 99,
    status,
  }

  const errors = validateCampaign(input)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  await ensureIndexes()
  const col = await collection('campaigns')
  await col.updateOne({ slug: input.slug }, { $set: input }, { upsert: true })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied
  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Thiếu slug.' }, { status: 400 })
  const col = await collection('campaigns')
  await col.deleteOne({ slug })
  return NextResponse.json({ ok: true })
}
