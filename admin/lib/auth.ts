import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

/**
 * Single static admin account. PLAN.md §3A.5 — confirmed scope: no user table, no
 * registration, no password reset, no OAuth, no auth library.
 *
 * The session is a signed cookie: `<expiry>.<hmac>`. That is enough for one operator
 * because there is no user identity to carry — possession of a validly signed, unexpired
 * cookie IS the authorization. No session store to run, nothing extra to secure.
 *
 * Server-only. Never import from a Client Component.
 */

const COOKIE = 'fs_admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 12 // 12h — a shop shift, then re-login.

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim()
  if (!secret) {
    throw new Error(
      'Missing SESSION_SECRET. Generate one with:\n' +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
        'See PLAN.md §3A.7.'
    )
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('hex')
}

/** Constant-time compare that is also safe on length mismatch (timingSafeEqual throws). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function createSessionValue(): string {
  const expiry = String(Date.now() + MAX_AGE_SECONDS * 1000)
  return `${expiry}.${sign(expiry)}`
}

function isValidSession(value: string | undefined): boolean {
  if (!value) return false
  const [expiry, mac] = value.split('.')
  if (!expiry || !mac) return false
  // Verify the signature BEFORE trusting the expiry it carries.
  if (!safeEqual(mac, sign(expiry))) return false
  const expiresAt = Number(expiry)
  return Number.isFinite(expiresAt) && Date.now() < expiresAt
}

/**
 * Verify submitted credentials. Always runs the bcrypt compare even when the username is
 * wrong, so response time doesn't reveal whether the username exists.
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME?.trim() ?? ''
  const expectedHash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? ''

  if (!expectedUser || !expectedHash) {
    throw new Error(
      'ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not set. ' +
        'Generate a hash with `npm run hash-password` — see PLAN.md §3A.7.'
    )
  }

  // A syntactically invalid hash makes bcrypt return false rather than throw, which looks
  // like a wrong password forever. Diagnose it instead.
  if (!/^\$2[aby]\$/.test(expectedHash)) {
    // The overwhelmingly likely cause: dotenv expanded the '$' segments of the hash.
    // Every bcrypt hash contains '$', and dotenv treats those as variable references
    // regardless of quoting, silently truncating a 60-char hash to ~33. Verified
    // behaviour — see scripts/hash-password.mjs.
    const looksTruncated = expectedHash.length > 0 && expectedHash.length < 60
    throw new Error(
      looksTruncated
        ? 'ADMIN_PASSWORD_HASH looks corrupted: it is ' +
          `${expectedHash.length} characters, but a bcrypt hash is 60. ` +
          'dotenv expands "$" in .env values, so the hash must be written with each ' +
          '"$" escaped as "\\$". Run `npm run hash-password` and paste its output verbatim.'
        : 'ADMIN_PASSWORD_HASH is not a bcrypt hash. Store the HASH, not the password — ' +
          'run `npm run hash-password`.'
    )
  }

  if (expectedHash.length !== 60) {
    throw new Error(
      `ADMIN_PASSWORD_HASH is ${expectedHash.length} characters; a bcrypt hash is 60. ` +
        'Check for a truncated or partially expanded value in .env.'
    )
  }

  const passwordOk = await bcrypt.compare(password, expectedHash)
  const userOk = safeEqual(username, expectedUser)
  return passwordOk && userOk
}

export async function startSession(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, createSessionValue(), {
    httpOnly: true,
    // Off on plain-http localhost, on everywhere real.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function endSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** The single source of truth for "is this request authenticated". */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return isValidSession(store.get(COOKIE)?.value)
}

/**
 * Guard for every write API route. PLAN.md §3A.5: hiding the UI is not access control —
 * each route re-checks server-side.
 */
export async function requireApiAuth(): Promise<Response | null> {
  if (await isAuthenticated()) return null
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export function generateSecret(): string {
  return randomBytes(32).toString('hex')
}
