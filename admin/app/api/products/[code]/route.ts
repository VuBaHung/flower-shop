import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { collection } from '@/lib/db'
import { validateProduct } from '@/lib/validate'
import { normalizeProductInput, knownOccasionSlugs } from '@/lib/products'

type Params = { params: Promise<{ code: string }> }

export async function GET(_req: Request, { params }: Params) {
  const denied = await requireApiAuth()
  if (denied) return denied

  const { code } = await params
  const products = await collection('products')
  const doc = await products.findOne({ code })
  if (!doc) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 })
  return NextResponse.json({ product: doc })
}

export async function PUT(req: Request, { params }: Params) {
  const denied = await requireApiAuth()
  if (denied) return denied

  const { code } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  // `code` is the public URL and the string customers quote in Zalo (PLAN.md §4), so it
  // is immutable after creation. The form disables the field; this enforces it against a
  // direct API call, which the form cannot.
  const input = { ...normalizeProductInput(body), code }

  const mode = input.status === 'active' ? 'publish' : 'draft'
  const errors = validateProduct(input, await knownOccasionSlugs(), mode)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  const products = await collection('products')
  const result = await products.updateOne(
    { code },
    { $set: { ...input, updatedAt: new Date() } }
  )
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

/**
 * Hard delete. The UI steers toward status='hidden' instead (PLAN.md §9) because a
 * deleted product also breaks any Zalo link a customer has already been sent.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireApiAuth()
  if (denied) return denied

  const { code } = await params
  const products = await collection('products')
  const result = await products.deleteOne({ code })
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
