/**
 * Emits a JSON-LD block. Server Component — the payload is built at build time and
 * inlined into the static HTML, so crawlers see it without executing any JS.
 *
 * `<` is escaped to `<` so a stray "</script>" inside catalog text (a product
 * description written in the admin app) cannot close the tag early and inject markup.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
