/*
 * The ADMIN app. Deliberately NOT output:'export' — it needs a Node server for the login,
 * the session cookie, and the write API routes. The public storefront in the parent
 * directory stays a static export; these two never share a build. PLAN.md §3A.6.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
