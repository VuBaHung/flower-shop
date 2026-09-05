/**
 * Env access with loud failures. PLAN.md §3A.7: a missing value must fail the build with
 * a message naming the key — never a silent empty catalog, and never a published site
 * with no products.
 *
 * Nothing here may be imported by a Client Component. These read server-only secrets;
 * bundling them into browser JS would leak MONGODB_URI, which §3A.2 forbids.
 */

/** Throws, naming the key. Use for values whose absence must stop the build. */
export function required(key: string): string {
  const value = process.env[key]
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Copy .env.example to .env and fill it in — see PLAN.md §3A.7.`
    )
  }
  return value.trim()
}

export function optional(key: string): string | undefined {
  const value = process.env[key]
  return value === undefined || value.trim() === '' ? undefined : value.trim()
}

/**
 * 'fixtures' | 'mongo'. Defaults to fixtures so the storefront builds from a completely
 * empty .env — the property Phase 3 depends on (PLAN.md §11).
 */
export function dataSource(): 'fixtures' | 'mongo' {
  const value = optional('DATA_SOURCE') ?? 'fixtures'
  if (value !== 'fixtures' && value !== 'mongo') {
    throw new Error(
      `DATA_SOURCE must be 'fixtures' or 'mongo', got '${value}'.`
    )
  }
  return value
}
