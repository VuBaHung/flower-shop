import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { collection, ensureIndexes } from '@/lib/db'
import { validateOccasion } from '@/lib/validate'

function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied
  const col = await collection('occasions')
  return NextResponse.json({ occasions: await col.find({}).toArray() })
}

/** Upsert by slug — the list is small and edited in place. */
export async function POST(req: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  const input = {
    slug: (str(body.slug) ?? '').toLowerCase(),
    label: str(body.label),
    image: str(body.image),
    seoTitle: str(body.seoTitle),
    seoDescription: str(body.seoDescription),
    intro: str(body.intro),
  }

  const errors = validateOccasion(input)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  await ensureIndexes()
  const col = await collection('occasions')
  await col.updateOne(
    { slug: input.slug },
    { $set: { ...input, updatedAt: new Date() } },
    { upsert: true }
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied

  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Thiếu slug.' }, { status: 400 })

  // An occasion still in use would leave those products unreachable by any filter chip,
  // so refuse and name the products rather than silently orphaning them.
  const products = await collection('products')
  const inUse = await products.countDocuments({ occasions: slug })
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Còn ${inUse} sản phẩm đang dùng dịp này. Gỡ khỏi sản phẩm trước.` },
      { status: 409 }
    )
  }

  const col = await collection('occasions')
  await col.deleteOne({ slug })
  return NextResponse.json({ ok: true })
}
