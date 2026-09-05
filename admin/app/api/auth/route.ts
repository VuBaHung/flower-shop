import { NextResponse } from 'next/server'
import { verifyCredentials, startSession, endSession } from '@/lib/auth'
import { checkRateLimit, clearRateLimit, clientKey } from '@/lib/rate-limit'

/**
 * The login endpoint — PLAN.md §3A.5 calls this the entire attack surface, so it is
 * throttled and it never reveals which half of the credential was wrong.
 */
export async function POST(req: Request) {
  const key = clientKey(req)
  const { allowed, retryAfterSec } = checkRateLimit(key)
  if (!allowed) {
    return NextResponse.json(
      { error: `Quá nhiều lần thử. Vui lòng đợi ${Math.ceil(retryAfterSec / 60)} phút.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  let username = ''
  let password = ''
  try {
    const body = await req.json()
    username = typeof body.username === 'string' ? body.username : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  let ok = false
  try {
    ok = await verifyCredentials(username, password)
  } catch (err) {
    // Misconfiguration (missing/!bcrypt env vars) — surface it to the operator rather
    // than letting it masquerade as a wrong password forever.
    console.error('[auth] configuration error:', err)
    return NextResponse.json(
      { error: 'Máy chủ chưa được cấu hình. Xem PLAN.md §3A.7.' },
      { status: 500 }
    )
  }

  if (!ok) {
    // One message for both failure modes: no username enumeration.
    return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' }, { status: 401 })
  }

  clearRateLimit(key)
  await startSession()
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await endSession()
  return NextResponse.json({ ok: true })
}
