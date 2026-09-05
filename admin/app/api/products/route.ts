import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { collection, ensureIndexes } from '@/lib/db'
import { validateProduct } from '@/lib/validate'
import { normalizeProductInput, knownOccasionSlugs } from '@/lib/products'

/** List — used by the products table. */
export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied

  const products = await collection('products')
  const docs = await products.find({}).sort({ sort: 1 }).toArray()
  return NextResponse.json({ products: docs })
}

/** Create. */
export async function POST(req: Request) {
  // PLAN.md §3A.5 — every write route re-checks the session server-side.
  const denied = await requireApiAuth()
  if (denied) return denied

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  const input = normalizeProductInput(body)
  const mode = input.status === 'active' ? 'publish' : 'draft'
  const errors = validateProduct(input, await knownOccasionSlugs(), mode)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  const products = await collection('products')
  await ensureIndexes()

  const existing = await products.findOne({ code: input.code })
  if (existing) {
    return NextResponse.json(
      { errors: { code: `Mã ${input.code} đã tồn tại.` } },
      { status: 409 }
    )
  }

  await products.insertOne({ ...input, createdAt: new Date(), updatedAt: new Date() })
  return NextResponse.json({ ok: true, code: input.code }, { status: 201 })
}
