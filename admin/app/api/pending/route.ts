import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { collection, db } from '@/lib/db'

/**
 * How many saved edits are waiting to be published.
 *
 * The storefront is a static export (PLAN.md §3A.2), so saving to MongoDB never changes
 * the live site — only a rebuild does. Without this, the admin has no way to tell whether
 * anything is pending, which is exactly the confusion that made "save" feel broken.
 *
 * Compares each document's updatedAt against the timestamp written by /api/publish.
 */
export async function GET() {
  const denied = await requireApiAuth()
  if (denied) return denied

  try {
    const database = await db()
    const meta = await database.collection('meta').findOne({ _id: 'publish' as never })
    // Never published: everything currently in the database is pending.
    const lastPublish = meta?.lastPublishedAt ? new Date(meta.lastPublishedAt) : new Date(0)

    const since = { updatedAt: { $gt: lastPublish } }
    const [products, occasions, campaigns, settings] = await Promise.all([
      (await collection('products')).countDocuments(since),
      (await collection('occasions')).countDocuments(since),
      (await collection('campaigns')).countDocuments(since),
      (await collection('settings')).countDocuments(since),
    ])

    const total = products + occasions + campaigns + settings
    return NextResponse.json({
      total,
      breakdown: { products, occasions, campaigns, settings },
      lastPublishedAt: meta?.lastPublishedAt ?? null,
    })
  } catch (err) {
    // A pending count is a convenience, never a reason to break the page.
    console.error('[pending] failed:', err)
    return NextResponse.json({ total: null, breakdown: null, lastPublishedAt: null })
  }
}
