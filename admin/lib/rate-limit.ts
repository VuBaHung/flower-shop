/**
 * Login attempt throttle. PLAN.md §3A.5 — the login route is the entire attack surface.
 *
 * Deliberately in-memory: single admin, single instance. It resets on redeploy, which is
 * acceptable here and avoids adding a Redis dependency to a one-person tool. If the admin
 * app is ever scaled to multiple instances this becomes per-instance and needs replacing.
 */

const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 8
const WINDOW_MS = 15 * 60 * 1000

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }

  entry.count += 1
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSec: 0 }
}

/** Called on success so a legitimate admin isn't locked out by earlier typos. */
export function clearRateLimit(key: string): void {
  attempts.delete(key)
}

/** Best-effort client identity behind a proxy. Only used for throttling. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}
