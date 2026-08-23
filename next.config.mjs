/*
 * GitHub Pages serves a project site from a subpath (/flower-shop), so every asset and
 * internal link needs that prefix. Cloudflare Pages and `next dev` serve from the root,
 * so the prefix is opt-in via env — set only by .github/workflows/deploy.yml.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — produces out/ with one HTML file per product. No Node server.
  output: 'export',
  // Matches Cloudflare Pages' static serving cleanly.
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    // Required under static export. Images are pre-optimized upstream (Cloudinary),
    // so components use plain <img> with explicit width/height to prevent CLS.
    unoptimized: true,
  },
}

export default nextConfig
