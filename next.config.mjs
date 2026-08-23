/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — produces out/ with one HTML file per product. No Node server.
  output: 'export',
  // Matches Cloudflare Pages' static serving cleanly.
  trailingSlash: true,
  images: {
    // Required under static export. Images are pre-optimized upstream (Cloudinary),
    // so components use plain <img> with explicit width/height to prevent CLS.
    unoptimized: true,
  },
}

export default nextConfig
