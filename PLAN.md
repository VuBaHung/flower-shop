# Flower Shop Catalog — Project Plan & Implementation Brief

> **Status:** Draft for review. §13 is the copy-paste script for a local coding agent.
> **Assumptions to confirm:** single admin (one shop owner), non-technical, manages products via spreadsheet. Market: Vietnam / HCMC. Language: Vietnamese UI.
> **Stack decision:** Next.js (static export) — chosen for developer familiarity.

---

## 1. Goal

A public, mobile-first flower catalog. Customers browse products and contact the shop via Zalo, phone, or Messenger to order. **No cart, no checkout, no online payment, no customer accounts.**

Success = a customer finds a bouquet on Google or a shared Zalo link, and messages the shop with a specific product code.

## 2. Hard constraints

| Constraint | Implication |
|---|---|
| Zero recurring cost | Cloudflare Pages + GitHub + Google Sheets. Domain (~$12/yr) is the only spend. |
| Commercial use permitted | Rules out Vercel Hobby. Cloudflare Pages is fine. |
| Must rank on Google | Static HTML per product with real meta tags. **Not** a client-rendered SPA. |
| Must look good on a phone | ~85% of traffic. Mobile-first, desktop second. |
| Admin must be non-technical | Google Sheets only. Never touches Git, terminal, or a CMS. |
| Small image storage | WebP, ≤150KB per image. |

## 3. Architecture

```
Google Sheet (admin edits)
        │  published as CSV → fetched at build time
        ▼
  Next.js 15 App Router, output: 'export'
        │  generateStaticParams → one HTML file per product
        ▼
    GitHub repo ──► Cloudflare Pages ──► https://shop.vn
```

- **Build trigger:** Cloudflare Deploy Hook. Admin taps a bookmarked link after editing the Sheet. Live in 1–2 minutes.
- **Fallback:** GitHub Actions daily cron build, so the site self-heals if the admin forgets.
- **Campaign scheduling:** the same cron is what activates and expires campaigns — see §6.2. Raise it to hourly in the week before a major date.
- **Build order:** the customer UI is built against local fixtures first; the Sheet is wired in later behind an env var. See §11.

### Next.js specifics — read these before coding

| Item | Requirement |
|---|---|
| `next.config.js` | `output: 'export'` — produces a static `out/` folder, no Node server |
| Rendering | **Server Components only.** No `getServerSideProps`, no route handlers, no ISR, no middleware — none survive static export |
| `next/image` | Requires `images: { unoptimized: true }` under static export. So **pre-optimize images yourself** (Cloudinary transforms or the resize script) |
| Data fetching | Plain `async` fetch of the Sheet CSV inside a cached `lib/sheet.ts`. Runs at build only |
| Trailing slashes | `trailingSlash: true` — matches Cloudflare Pages' static serving cleanly |
| Client JS | Only filters, gallery, copy-to-clipboard. Mark those `'use client'`; keep everything else server-rendered |

> The single biggest risk with Next.js here is accidentally client-rendering the product list. If products come from `useEffect`, the SEO goal is lost. Products must be resolved at build time in a Server Component.

## 4. Data model — Google Sheet

### Sheet 1: `Products`

| Column | Type | Required | Notes |
|---|---|---|---|
| `code` | text | ✅ | e.g. `HB-014`. Unique. Becomes the URL slug. Customer quotes this in Zalo. |
| `name` | text | ✅ | Vietnamese, e.g. "Bó hoa hồng đỏ Ecuador" |
| `price` | number | — | VND. Blank = "Liên hệ" |
| `price_note` | text | — | e.g. "từ" → renders "từ 850.000₫" |
| `sale_price` | number | — | VND. If set and within an active campaign window, shows as the price with `price` struck through. |
| `sale_note` | text | — | e.g. "Giá 20/10" — small label beside the sale price |
| `occasions` | text | ✅ | Comma-separated tags. Must match Sheet 2. |
| `flower_type` | text | — | hồng, hướng dương, lan, cẩm chướng… |
| `subtitle` | text | — | Small line above the name, e.g. "Waxflower Úc Import" — material or collection |
| `badge` | text | — | Corner ribbon on the card: "HOT TREND", "GIỮ LÂU 3 NĂM", "SANG CHẢNH". Blank = no badge. |
| `badge_style` | text | — | `hot` / `info` / `luxe` — maps to a token color, so the admin can't invent colors |
| `short_desc` | text | — | 1–2 lines shown on the card, truncated to 2 lines. Distinct from the full `description`. |
| `rating` | number | — | 1–5, one decimal. **See §4.1 before using.** |
| `review_count` | number | — | **See §4.1 before using.** |
| `size` | text | — | Nhỏ / Vừa / Lớn |
| `description` | text | — | 2–4 sentences. Feeds the meta description. |
| `image_1` … `image_5` | URL | ✅ (1 min) | Direct image URLs. See §6.1 for the shot list. |
| `video` | URL | — | Optional 5–8s clip walking around the arrangement. See §6.1. |
| `spin_folder` | URL | — | **Phase 5, optional.** Base URL of a 24–36 frame spin set. Leave blank for almost all products. |
| `status` | text | ✅ | `active` / `hidden` — hidden rows skipped at build |
| `featured` | boolean | — | Pins to homepage |
| `sort` | number | — | Lower = earlier |

### 4.1 On ratings — read before implementing

The reference design shows star ratings and review counts on every card. They test well; they also carry risk worth understanding.

**If the numbers are real** (collected from Zalo conversations, Facebook comments, or a form), display them and add `AggregateRating` to the product JSON-LD. Google may then show stars in search results, which lifts click-through meaningfully.

**If the numbers are invented to make the grid look established, do not add JSON-LD review markup.** Fabricated structured data violates Google's spam policies and risks a manual action that removes the whole site from search results — a much larger loss than the click-through gain. Display-only fake ratings are a business and trust question rather than a technical one, but they're not something I'd build structured data on top of.

**Recommended:** ship the card component with rating fields optional. Leave them blank until real reviews exist; the card layout should look correct either way. Add the JSON-LD only when the numbers are genuine.

### Sheet 2: `Occasions`

Still needed — these drive the homepage filter chips even without dedicated category pages. `seo_title` / `seo_description` / `intro` go unused unless category pages are added later; keep the columns.

| Column | Notes |
|---|---|
| `slug` | `sinh-nhat`, `khai-truong`, `chia-buon`, `tinh-yeu`, `cam-on`, `tot-nghiep`, `8-3`, `20-10`, `20-11`, `tet` |
| `label` | "Sinh nhật", "Khai trương"… |
| `seo_title` | Per-category page title |
| `seo_description` | Per-category meta description |
| `intro` | 1–2 paragraphs at the top of the category page (SEO weight) |

### Sheet 3: `Campaigns`

One row per promotion or seasonal event. The admin creates and edits these directly.

| Column | Type | Required | Notes |
|---|---|---|---|
| `slug` | text | ✅ | Year-agnostic: `hoa-20-10`, `valentine`, `tet`, `sale-cuoi-tuan`. **Never include the year** — see §6.2. |
| `title` | text | ✅ | "Hoa 20/10 — Ngày Phụ nữ Việt Nam" |
| `banner_desktop` | URL | ✅ | ~1920×600 |
| `banner_mobile` | URL | ✅ | ~800×800 or 4:5. **Separate file** — cropping a wide banner for mobile loses the message. |
| `banner_alt` | text | ✅ | Accessibility + SEO |
| `subtitle` | text | — | One line under the title |
| `cta_text` / `cta_link` | text | — | Defaults to the campaign page |
| `start_date` / `end_date` | date | ✅ | `YYYY-MM-DD`, inclusive. Controls activation — see §6.2 on build scheduling. |
| `order_cutoff` | date | — | "Đặt trước 18/10 để giao đúng ngày" |
| `product_codes` | text | — | Comma-separated. Blank = auto-include everything with a `sale_price`. |
| `occasion_filter` | text | — | Alternative to listing codes: pull all products carrying this occasion tag |
| `intro` | text | — | 1–3 paragraphs on the campaign page. **This is the SEO payload — don't leave it blank.** |
| `seo_title` / `seo_description` | text | — | Falls back to `title` / `intro` |
| `priority` | number | — | If campaigns overlap, lowest wins the homepage hero |
| `status` | text | ✅ | `active` / `hidden` — manual override on top of the dates |

### Sheet 4: `Settings`

Key/value: shop name, phone, Zalo number, **Zalo OA ID**, Messenger URL, address, hours, delivery areas, delivery fee note, same-day cutoff time, hero text, about text.

> Everything editable lives in the Sheet. No content should require a code change.

## 5. Site map

**Two page types only.** The homepage is the whole catalog with client-side filter chips; product detail is the only other route.

| Route | Page | Count |
|---|---|---|
| `/` | Homepage — header, hero, filter chips, full product grid, footer | 1 |
| `/hoa/[code]/` | Product detail | one per product |
| `/sitemap.xml`, `/robots.txt` | Generated at build | — |

Optional thin pages, only if wanted: `/gioi-thieu/`, `/lien-he/`. Both can instead be sections of the homepage.

### Why this is fine, and what it costs

**Product detail pages carry most of the SEO weight anyway** — they're what rank for specific searches and what produce distinct Zalo share previews. Those are unchanged.

**What's given up:** occasion landing pages (`/dip/sinh-nhat/`) and campaign landing pages (`/khuyen-mai/hoa-20-10/`). Those would have been the pages ranking for generic seasonal searches like "hoa 20/10". Filter chips on the homepage give the same *browsing* experience but produce no indexable URL, so there's nothing for Google to rank against those queries.

That's an acceptable trade **if traffic comes mainly from Zalo, Facebook, and word of mouth** — which the visual direction here suggests. If search becomes a priority later, occasion and campaign pages can be added without restructuring anything: the data model already supports them, and they'd reuse the same grid component.

### Filter chip behavior

- Chips filter the already-server-rendered grid client-side. Instant, no navigation.
- Update the URL with a query param (`/?dip=sinh-nhat`) so a filtered view is shareable and back-button works. Query params are not indexed as separate pages — that's expected here.
- The full unfiltered grid must be present in the HTML so the site works with JavaScript off.
- Campaigns become a homepage banner plus a "Đang sale" chip, rather than their own page.

## 6. UI specification

### 6.0 Design reference — read this before writing any UI

A reference homepage mockup exists at:

```
C:\Users\PC\Downloads\online_flower_shop_homepage.html
```

**First action of Phase 1:** copy that file into the repo as `/design/reference-homepage.html` and commit it. The Downloads folder is not a stable location — the file will eventually be moved or deleted, and the design intent is then lost. Everything below assumes the committed copy is the source of truth.

**Extract, don't eyeball.** Open the file, read its CSS, and pull out the actual values rather than approximating them by looking at a screenshot:

| Token group | What to capture |
|---|---|
| Color | Primary, accent, background, surface, text primary/secondary, border, sale/discount color, success/error |
| Typography | Font families (heading vs body), the full size scale, weights, line heights, letter spacing |
| Spacing | The base unit and the scale built on it |
| Radii | Cards, buttons, inputs, images |
| Shadows | Card resting and hover states |
| Layout | Max content width, gutters, grid gaps, card aspect ratio |
| Motion | Transition durations and easing |

Encode these in `tailwind.config.ts` under `theme.extend` as **named tokens** — `primary`, `surface`, `sale` — not raw hex values scattered through components. Any color or size appearing in JSX that isn't a named token is a bug.

**Where the reference is authoritative, and where it isn't**

- **Authoritative:** the visual language — palette, type, spacing rhythm, card treatment, button styling, overall feel. Match it closely.
- **Not authoritative:** structure and behavior. The mockup is one static homepage; it almost certainly lacks the sticky mobile contact bar (§6), campaign banner and sale pricing (§6.2), video player (§6.1), product code badges, and the occasion filter. Build all of those per this plan, styled to match the reference.
- **Check before copying:** whether the mockup is actually mobile-first, and whether it uses Tailwind, plain CSS, or a CDN framework. If it's desktop-only, the tokens still transfer but the layout must be rebuilt mobile-first.
- **Fonts:** if it loads a Google Font, move that to `next/font` rather than a `<link>` — self-hosting removes a render-blocking request and protects the Lighthouse target.
- **Diacritics:** verify the heading font renders Vietnamese correctly. Many display fonts have broken or missing diacritics — ế, ữ, ộ are the usual failures. If it fails, substitute a font with full Vietnamese support and keep everything else.

**Deliverable for this step:** a short `DESIGN-TOKENS.md` listing what was extracted, so the token set is reviewable independently of the code.

### Global
- Mobile-first. 1 col < 640px, 2 col < 1024px, 3–4 col above.
- Vietnamese language. Font with full diacritic support (Be Vietnam Pro, Inter, or Noto Sans) via `next/font`.
- **Sticky bottom contact bar on mobile, always visible:** `[Zalo] [Gọi] [Messenger]`
- Header: logo, search icon, occasion menu.
- Prices formatted `850.000₫`.

### Homepage — the whole catalog

Single scrolling page, per the reference design:

1. **Header** — logo + tagline, nav links to homepage sections, "Chat Zalo" button, phone number as a prominent pill CTA
2. **Section heading** — small uppercase eyebrow label above a large display headline
3. **Filter chips** — horizontally scrollable on mobile, active chip filled, inactive outlined. Underline accent bar beneath the row.
4. **Product grid** — 1 col mobile, 2 col tablet, 3–4 col desktop
5. **Campaign banner** — when active (§6.2)
6. Optional: about / commitments / feedback sections
7. **Footer**
8. **Floating action buttons, bottom right** — Zalo and phone, circular, above all content

> On mobile, reconcile the floating buttons with the sticky bottom bar from §6 Global. Pick one: I'd keep the sticky bar on mobile and the floating buttons on desktop, since a full-width bar has larger tap targets and doesn't cover product images.

### Product card

Per the reference design, top to bottom:

| Element | Notes |
|---|---|
| Image | Fixed aspect ratio (~4:5), rounded top corners |
| Badge | Absolute, top-left over the image. Pill, colored by `badge_style`. Omitted when blank. |
| `subtitle` | Small, muted, above the name |
| Rating + count | Right-aligned on the subtitle row. See §4.1. |
| Name | Bold, may include emoji. Clamp to 2 lines. |
| `short_desc` | Muted, clamp to 2 lines, ellipsis |
| Price | Large, accent color, `950.000₫` |
| **"Inbox Zalo" button** | On the card itself, not just the detail page |

**Cards must be uniform height** regardless of text length — line-clamp the name and description, and pin the price/button row to the bottom with flex. Ragged card heights are the most common way a grid like this falls apart.

**The card CTA needs care.** Tapping "Inbox Zalo" from the grid sends the customer to Zalo without ever seeing the product code, so they arrive saying "I want this one" with no reference. Two fixes, apply both:
- Copy the product code to the clipboard as part of the tap, with a toast: "Đã sao chép mã HB-014"
- Show the code on the card, small, near the price

Keep the card image and name linking to the detail page — the button should not swallow the whole card.

### 6.1 Product media strategy

Ordered by value per minute of the shop owner's time. Customers overwhelmingly get **scale** wrong when ordering flowers online — every option below is judged partly on how well it fixes that.

**Required — the 5-shot list**

Standardize this so every product looks consistent in the grid:

1. **Front, 4:5 ratio** — the hero. This is `image_1`, the OG share image, and the Google result. Plain background.
2. **Side / three-quarter** — shows depth, which a flat front shot hides.
3. **Top-down** — shows arrangement density.
4. **Close-up** — flower quality, the thing that justifies the price.
5. **Scale reference** — held by a person, or beside a common object. The single most useful shot; prevents "I thought it would be bigger" complaints.

**Recommended — short video**

A 5–8 second clip, phone in hand, walking once around the arrangement. No turntable, no rig.

- Stored on Cloudinary (free tier transcodes and serves it); target <500KB after compression
- Rendered as `<video muted loop playsinline preload="none" poster={image_1}>` — **`preload="none"` is mandatory** so it costs nothing until tapped
- Renders below the gallery, above the description
- Absent `video` → the section simply doesn't render
- Doubles as Facebook/Instagram content, so the effort isn't single-use

**Deferred to Phase 5 — 360 spin**

A drag-to-rotate viewer over 24–36 turntable frames. Deliberately *not* in the main build:

- ~2MB per product — 4× the page weight budget in §12
- Needs a turntable, fixed camera, and stable lighting; several minutes per product versus ~30 seconds
- Zero SEO value; Google indexes `image_1` and ignores the spin set
- Solves scale no better than shot #5

If it happens later (Phase 5): lazy-load behind a "Xem 360°" button, never on page load, and only for a handful of signature products.

### 6.2 Promotions & campaigns

Vietnamese flower demand is intensely seasonal — 8/3, 20/10, 20/11, Valentine, Ngày của Mẹ, Tết. A handful of dates likely outweigh whole quiet months, so campaigns are a core feature, not a nice-to-have.

Since there's no checkout, **discounts are purely informational**. The customer mentions the promo when they message on Zalo. No codes, no validation, no cart rules — far simpler than real e-commerce promotions.

**Where campaigns surface**

| Surface | Behavior |
|---|---|
| Homepage hero | Swaps to `banner_mobile` / `banner_desktop` of the active campaign with the lowest `priority`. Falls back to the default hero when none are active. |
| Campaign page `/khuyen-mai/[slug]/` | Banner, title, `intro` copy, cutoff notice, product grid |
| Product card | "Giảm giá" badge; `sale_price` shown with `price` struck through |
| Product detail | Same pricing treatment + `sale_note` + campaign cutoff line |
| Listings | "Đang khuyến mãi" filter chip |
| Nav | "Khuyến mãi" link, shown only while a campaign is active |

**Price display rule** — apply consistently everywhere:
- `sale_price` set **and** inside an active window → `~~1.200.000₫~~ **950.000₫**` + `sale_note`
- Otherwise → normal `price`
- Blank `price` → "Liên hệ", and `sale_price` is ignored

**The static-export catch — read this before implementing**

A static build doesn't know today's date. Whatever was true at build time is baked in, so **a campaign will not start or end on its own.** Two mechanisms, used for different things:

1. **Scheduled rebuilds — the real answer.** GitHub Actions cron: daily normally, hourly in the week before a major date. The build evaluates `start_date` / `end_date` against the build date and emits the correct HTML. Free, and it preserves static SEO.
2. **Client-side, cosmetic only.** A countdown timer to `order_cutoff` may be computed in the browser. **Never render prices or campaign activation client-side** — that reintroduces exactly the SEO problem this architecture exists to avoid.

Also: `end_date` passing must remove the campaign from the homepage hero and the nav, but the page itself stays live and indexed (see below).

**Year-agnostic URLs — the highest-leverage decision here**

Use `/khuyen-mai/hoa-20-10/`, never `/khuyen-mai/hoa-20-10-2026/`. Reusing the same URL every year lets it accumulate backlinks and ranking authority instead of restarting from zero annually. Searches for "hoa 20/10" spike hard and predictably; a page in its third year massively outranks a fresh one.

So expired campaign pages stay live and indexed year-round — just without the countdown and sale prices, and with copy that reads sensibly out of season. Don't 404 them, and don't remove them from the sitemap.

### Product detail — the only other page

With no category pages, this is where a customer lands from Google or a shared Zalo link. It carries the full SEO payload.

1. Back link to the homepage grid (preserve the active filter)
2. Image gallery, swipeable, tap to zoom
3. Badge, subtitle, name, rating
4. Name + **large, copyable product code** with "Sao chép mã" button
5. Price (or "Liên hệ"), with sale treatment if active
6. Video, if present (poster image until tapped) — and "Xem 360°" button if `spin_folder` is set
7. Description, flower type, size
8. **Primary CTA: "Nhắn Zalo đặt hàng"** — full width, high contrast
9. Secondary: call, Messenger, Zalo share
10. Delivery note + same-day cutoff
11. Occasion chips → link back to the filtered homepage (`/?dip=sinh-nhat`)
12. "Sản phẩm tương tự" — 4 products sharing an occasion tag

## 7. Zalo integration

Zalo offers official social plugins (chat widget, share button, follow widget). The chat widget requires a **Zalo OA (Official Account)** — a personal number only supports `zalo.me/{phone}` deep links.

### Split by device

| Device | Approach |
|---|---|
| **Mobile** | Sticky bottom bar only. `https://zalo.me/{phone}` opens the app directly. **Suppress the floating widget** — redundant, and it collides with the sticky bar. |
| **Desktop** | Zalo chat widget bubble (desktop users can't tap into the app) **+ a QR code on the product page** so they can scan with their phone. |
| **All** | Zalo Share button on product pages. Combined with OG tags, this turns customers into distribution. |

### Rules
- Load the widget script with `next/script` and `strategy="lazyOnload"` — it's third-party weight and must not block the Lighthouse target.
- Prefilled message text is unreliable on Zalo, so pair every Zalo CTA with the copy-code button + toast: "Đã sao chép mã HB-014".
- Verify the widget's z-index doesn't fight the sticky bar. Test on a real device.

### Other contact links
- Phone: `tel:+84...`
- Messenger: `https://m.me/{page}`

## 8. SEO requirements

**Per product page** — via `generateMetadata()` in `app/hoa/[code]/page.tsx`
- `title`: `{name} — {code} | {shop name}`
- `description` from `description`, truncated ~155 chars
- `openGraph`: title, description, `images: [image_1]`, `type: 'website'` — **this is what renders when someone shares to Zalo/Messenger; treat it as a first-class feature**
- JSON-LD `Product` schema via a `<script type="application/ld+json">` in the server component: name, image, description, sku (= code), offers (price, VND, availability)
- `alternates.canonical`
- `<h1>` = product name
- Descriptive `alt` on every image

**Homepage**
- Title and description target the shop's main terms, since there are no category pages to carry them
- The full product grid must be in the static HTML; filter chips only hide/show what's already there
- `?dip=` variants are not separate pages and should not appear in the sitemap

**Site-wide**
- JSON-LD `LocalBusiness` / `Florist` with address, hours, phone
- `app/sitemap.ts` and `app/robots.ts` — Next generates these statically
- `metadataBase` set so OG URLs resolve absolutely
- Clean URLs, no query strings for primary content
- Lighthouse mobile target: Performance ≥ 90, SEO 100, Accessibility ≥ 90
- Images: WebP, explicit `width`/`height` to prevent CLS, `loading="lazy"` below the fold
- Category pages carry the `intro` copy — thin listing pages don't rank

## 9. Admin workflow

1. Photograph the arrangement
2. Resize + convert to WebP (helper script, or Squoosh on phone)
3. Upload to Cloudinary → copy URL
4. Add a row in the Sheet
5. Tap the bookmarked "Publish" link
6. Live in ~2 minutes

**Deliverables for the admin:** a one-page Vietnamese instruction sheet, the Sheet pre-formatted with data validation on `occasions` and `status`, and the publish link saved as a phone bookmark.

## 10. Repo structure

```
/app
  layout.tsx                 ← fonts, metadataBase, LocalBusiness JSON-LD
  page.tsx                   ← homepage
  /hoa/[code]/page.tsx       ← generateStaticParams + generateMetadata
  /gioi-thieu/page.tsx       ← optional
  /lien-he/page.tsx          ← optional
  sitemap.ts
  robots.ts
/components
  ContactBar.tsx             ← 'use client'
  ProductCard.tsx            ← server
  ProductGrid.tsx            ← server, uniform-height flex cards
  FilterChips.tsx            ← 'use client', syncs to ?dip= query param
  FloatingActions.tsx        ← 'use client', desktop only
  CampaignBanner.tsx         ← server
  PriceDisplay.tsx           ← server, handles sale vs normal
  CutoffCountdown.tsx        ← 'use client', cosmetic only
  ProductGallery.tsx         ← 'use client'
  ProductVideo.tsx           ← 'use client', preload="none", poster
  SpinViewer.tsx             ← 'use client', Phase 5, dynamic import only
  ProductFilters.tsx         ← 'use client'
  CopyCodeButton.tsx         ← 'use client'
  ZaloWidget.tsx             ← 'use client', next/script lazyOnload, desktop only
  JsonLd.tsx
/lib
  types.ts                   ← WRITE THIS FIRST; the contract both sources satisfy
  data.ts                    ← single entry point; picks fixtures or Sheet by env var
  sheet.ts                   ← Phase 3: fetch + parse + normalize, cached
  campaigns.ts               ← active-window resolution against build date
  format.ts                  ← VND formatting, slugify
/design
  reference-homepage.html    ← committed copy of the provided mockup
  DESIGN-TOKENS.md           ← extracted token list
/data
  fixtures.json              ← Phase 1 data source; same shape as the Sheet output
/scripts
  resize-images.mjs
next.config.js
```

## 11. Build phases

**Sequencing principle: build the customer UI first, against local fixture data. No Google Sheet, no accounts, no credentials until the site already looks and works the way you want.**

This is deliberate. Wiring live data early means every UI iteration is gated on a network fetch and a spreadsheet being correct. Fixtures make Phase 1 fully offline and instant to iterate on.

**The design decision that makes this work:** define `lib/types.ts` first, and have both the fixture loader and the eventual Sheet parser return the identical normalized shape. Then Phase 3 is a one-function swap, not a refactor. Every component imports from `lib/data.ts`, which internally chooses fixtures or Sheet based on an env var — components never know which.

| Phase | Scope | Needs credentials? | Output |
|---|---|---|---|
| **1. Customer UI** | Design token extraction (§6.0), Next.js scaffold, `lib/types.ts`, `data/fixtures.json` (~12 realistic products, 4 occasions, 1 campaign), all customer routes, full mobile-first styling, gallery, video player, filters, contact bar, campaign banner + sale pricing | ❌ None | A complete, browsable site running on `localhost` |
| **2. SEO layer** | `generateMetadata`, OG tags, JSON-LD, `sitemap.ts`, `robots.ts`, image sizing, `next build` static export verified | ❌ None | Lighthouse targets met locally |
| **3. Data layer ("admin")** | Google Sheet created and structured, `lib/sheet.ts` CSV fetch + parse, swap fixtures → live Sheet behind an env var, admin instruction doc in Vietnamese, data validation on the Sheet | ⚠️ Sheet publish URL only (no login, no API key) | Admin can add a product and see it after a local rebuild |
| **4. Deploy** | GitHub repo, Cloudflare Pages project, domain + DNS, deploy hook, GitHub Actions cron, Zalo OA + widget, real product photos and copy | ✅ All of them | Live site |
| **5. Optional** | Search, Google Business Profile, analytics, 360 spin viewer | — | — |

**Phases 1 and 2 need nothing but a code editor.** That's most of the work, and it's the part worth iterating on hardest — the site is fully reviewable on your phone via `next dev` on your local network before a single account exists.

### On "the admin page"

Worth being explicit, since it shapes Phase 3: **there is no admin page in this plan.** Google Sheets *is* the admin interface. That's the entire reason this stack costs nothing and stays maintainable — no auth, no server, no database, nothing to secure or keep patched.

If you actually want a custom admin UI with a login and an upload form, that's a materially different project: it needs a server, a session store, file upload handling, and somewhere to run — and it stops being free. Flag it now if that's what you meant, because it changes the architecture rather than just adding a phase.

## 12. Acceptance criteria

- [ ] `next build` produces a static `out/` folder with one HTML file per product
- [ ] Viewing page source on a product page shows the product name and price in the HTML (not injected by JS)
- [ ] Adding a Sheet row publishes a live page within 2 minutes
- [ ] `status=hidden` removes it from the site and the sitemap
- [ ] Every product has a unique URL, title, meta description, and OG image
- [ ] Sharing a product link to Zalo shows the photo, name, and price
- [ ] Lighthouse mobile: Perf ≥ 90, SEO 100, A11y ≥ 90
- [ ] Contact bar visible without scrolling at 375px
- [ ] Copy-code button works on iOS Safari and Android Chrome
- [ ] Site renders all products with JavaScript disabled
- [ ] Product page total weight < 500KB **with video present but not yet played**
- [ ] Video section is absent, not broken, when the `video` column is blank
- [ ] Video does not autoplay on load and does not count against initial page weight
- [ ] A campaign activates on its `start_date` after a scheduled rebuild, with no manual edit
- [ ] A campaign expires on its `end_date`: removed from hero and nav, page still reachable and indexed
- [ ] `sale_price` renders with the original struck through, identically on cards and detail pages
- [ ] Campaign URLs contain no year
- [ ] Prices in page source are the correct campaign prices — never computed in the browser
- [ ] Every color and size in JSX resolves to a named Tailwind token, no raw hex
- [ ] Rendered UI visually matches the reference mockup's palette, type, and spacing
- [ ] Vietnamese diacritics render correctly in all fonts at all weights
- [ ] Homepage HTML contains every active product before any JS runs
- [ ] Filter chips update the URL query param and the back button works
- [ ] Cards are uniform height regardless of name or description length
- [ ] Card "Inbox Zalo" copies the product code and shows a toast
- [ ] No JSON-LD review markup unless the ratings are real (§4.1)
- [ ] Zero recurring cost besides the domain

## 13. Implementation script

> Copy this to your local coding agent. Phase 1 only — later phases get their own prompt.

```
Build a static flower shop catalog site. Read PLAN.md in this repo for the full
spec — Next.js constraints §3, data model §4, ratings caveat §4.1, routes §5,
UI §6, card spec in §6, media §6.1,
design reference §6.0, campaigns §6.2, Zalo §7, SEO §8, phasing §11.

Stack: Next.js 15 App Router, TypeScript, Tailwind CSS.
Deploy target (later): Cloudflare Pages static export.

PHASE 1 ONLY — customer-facing UI, no live data, no credentials, no deploy.

Data for this phase comes from /data/fixtures.json, committed to the repo.
Do NOT integrate Google Sheets yet. Do NOT set up any hosting or accounts.

Order of work:
0. Copy C:\Users\PC\Downloads\online_flower_shop_homepage.html into the repo as
   /design/reference-homepage.html and commit it. Read its CSS and extract the
   design tokens per PLAN.md §6.0 — colors, typography scale, spacing, radii,
   shadows, layout widths, motion. Encode them as NAMED tokens in
   tailwind.config.ts theme.extend, and write /design/DESIGN-TOKENS.md listing
   what you found. Show me that file before building components.
   The mockup is authoritative for visual language only. Structure and features
   come from this plan — the mockup will be missing the sticky mobile contact
   bar, campaign banner, sale pricing, video player, and occasion filters.
   Verify the heading font renders Vietnamese diacritics (ế, ữ, ộ) correctly;
   substitute if not.
1. lib/types.ts — Product, Occasion, Campaign, Settings types matching
   the columns in PLAN.md §4. This is the contract the Google Sheet parser will
   satisfy in Phase 3, so get the shape right now.
2. data/fixtures.json — ~12 realistic Vietnamese flower products across 4
   occasions, 2 with sale_price, 1 with a video, plus 1 active campaign and a
   settings block. Use placeholder image URLs.
3. lib/data.ts — the single entry point every component imports from. In this
   phase it reads fixtures. Phase 3 will add a Sheet branch behind an env var;
   design for that now but do not build it.
4. Two routes only: / (homepage with the full product grid and client-side
   filter chips) and /hoa/[code]/ (detail). No category or campaign pages.
   Fully styled mobile-first using ONLY the named tokens from step 0. No raw
   hex values or arbitrary sizes in JSX.
   Product cards must be uniform height (line-clamp text, flex-pin the price
   row) and carry an "Inbox Zalo" button that also copies the product code.

Non-negotiables even in Phase 1:
- next.config.js: output: 'export', trailingSlash: true, images.unoptimized: true
- Products resolved in Server Components at build time via generateStaticParams.
  NEVER fetch or render products in useEffect — that breaks the whole SEO goal.
- 'use client' only for: gallery, filters, copy-to-clipboard, contact bar,
  video controls, cutoff countdown. Everything else server-rendered.
- Sticky bottom contact bar on mobile (Zalo / call / Messenger). Use placeholder
  contact values from fixtures — no real Zalo account needed yet.
- Optional product video: <video muted loop playsinline preload="none"> with the
  hero image as poster. Must not autoplay or download until tapped. Blank video
  field renders nothing, not an empty container.
- Sale pricing: original struck through, sale price prominent, identical
  treatment on cards and detail pages. Computed at build time, never in browser.
- Vietnamese UI, VND formatted like 850.000₫.
- Site must render all products with JavaScript disabled.

Deliverable: `npm run dev` shows a complete browsable shop, and `npm run build`
produces a static out/ folder. Show me the out/ file tree and confirm a product
page's HTML contains the product name and price. Stop there — do not proceed to
SEO metadata or Sheets.
```

## 13.1 Scope decisions taken before Phase 1 (2026-08-23)

Three features present in the reference mockup but absent from this plan needed a call
before components were written. Resolved:

| Feature | Decision | Consequence |
|---|---|---|
| **"Self-Mix Studio" bouquet builder** | **Deferred** to Phase 5 | Nav and hero secondary CTA now point at the product grid instead. If it returns, it needs a `BuilderOptions` sheet — the highest-effort component in the mockup with zero SEO value. |
| **Customer testimonials section** | **Cut** | Not built. Same reasoning as §4.1 — invented quotes attached to real-looking names and faces are a trust problem, not a layout one. Revisit when real quotes exist; it would need a `Testimonials` sheet. |
| **Star ratings on cards** | **Blank at launch** | `rating` / `review_count` stay in the data model but are unused. The card's rating slot holds the **product code** instead, which §6 wants on the card anyway. No `AggregateRating` JSON-LD in Phase 2. |

Also decided: the mockup's hero **delivery-fee checker was kept**, backed by a new
`deliveryAreas` list in `Settings` and matched client-side against build-time data. It
answers the first question a customer asks and needs no backend.

New `Settings` keys added so the mockup's chrome is admin-editable rather than hardcoded:
`tagline`, `announcementText`, `announcementLink`, `heroEyebrow`, `heroTitle`,
`heroTitleAccent`, `deliveryAreas`.

## 14. Open questions

1. **Single admin, or multiple sellers?** Multiple sellers invalidates the Sheet approach entirely — needs accounts, permissions, moderation, and stops being free.
2. Domain name chosen?
3. Zalo OA created? Required for the chat widget; also looks more professional than a personal number.
4. Existing Facebook page to link, and existing product photos to migrate?
5. Public prices, or everything "Liên hệ"? Public prices convert better and help SEO.
6. Bilingual (VI/EN), or Vietnamese only?

---

**Cost summary:** domain ~$12/year. Everything else free at this scale, with no expiring trial. Free-tier terms shift, so re-verify Cloudflare and Cloudinary limits before launch.
