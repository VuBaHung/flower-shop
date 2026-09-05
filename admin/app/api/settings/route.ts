import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { collection } from '@/lib/db'

/**
 * Settings is a single document (PLAN.md §4). Stored with a fixed _id so repeated saves
 * update it rather than creating a second one that the storefront's findOne({}) might
 * then pick at random.
 */
const SETTINGS_ID = 'site'

export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied
  const col = await collection('settings')
  return NextResponse.json({ settings: (await col.findOne({})) ?? {} })
}

export async function PUT(req: Request) {
  const denied = await requireApiAuth()
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  const text = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '')

  const doc = {
    shopName: text('shopName'),
    tagline: text('tagline'),
    phone: text('phone'),
    zaloPhone: text('zaloPhone'),
    zaloOaId: text('zaloOaId'),
    messengerUrl: text('messengerUrl'),
    address: text('address'),
    hours: text('hours'),
    sameDayCutoff: text('sameDayCutoff'),
    announcementText: text('announcementText'),
    announcementLink: text('announcementLink'),
    heroEyebrow: text('heroEyebrow'),
    heroTitle: text('heroTitle'),
    heroTitleAccent: text('heroTitleAccent'),
    heroText: text('heroText'),
    aboutText: text('aboutText'),
    updatedAt: new Date(),
  }

  const col = await collection('settings')
  await col.updateOne({ _id: SETTINGS_ID as never }, { $set: doc }, { upsert: true })
  return NextResponse.json({ ok: true })
}
