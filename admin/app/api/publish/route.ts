import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * "Đăng lên website" — triggers a storefront rebuild via GitHub repository_dispatch
 * (PLAN.md §3). Saving to MongoDB does NOT publish; the static site only changes when it
 * is rebuilt. That separation lets the admin batch several edits and publish once.
 */
export async function POST() {
  const denied = await requireApiAuth()
  if (denied) return denied

  const token = process.env.GITHUB_DISPATCH_TOKEN?.trim()
  const repo = process.env.GITHUB_REPO?.trim()

  if (!token || !repo) {
    return NextResponse.json(
      {
        error:
          'Chưa cấu hình GITHUB_DISPATCH_TOKEN / GITHUB_REPO. Xem PLAN.md §3A.7.',
      },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'publish-storefront' }),
    })

    // GitHub returns 204 No Content on success.
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[publish] dispatch failed', res.status, detail)
      return NextResponse.json(
        { error: `GitHub trả về lỗi ${res.status}. Kiểm tra token và quyền repo.` },
        { status: 502 }
      )
    }

    // Stamp the publish so /api/pending can tell what has been published since.
    // A failure here must not report the publish as failed — the rebuild is already
    // running; the worst case is the pending count reads high until the next publish.
    try {
      const database = await db()
      await database
        .collection('meta')
        .updateOne(
          { _id: 'publish' as never },
          { $set: { lastPublishedAt: new Date() } },
          { upsert: true }
        )
    } catch (stampErr) {
      console.error('[publish] could not record publish time:', stampErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[publish] network error', err)
    return NextResponse.json({ error: 'Không kết nối được GitHub.' }, { status: 502 })
  }
}
