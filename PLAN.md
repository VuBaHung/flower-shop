# Flower Shop Catalog — Project Plan & Implementation Brief

> **Status:** Revised 2026-09-05 — admin architecture changed. Phases 1–2 are built; §11 Phase 3 is superseded by §3A.
> **Assumptions to confirm:** single admin (one shop owner), non-technical. Market: Vietnam / HCMC. Language: Vietnamese UI.
> **Stack decision:** Next.js (static export) for the storefront — chosen for developer familiarity.
>
> **⚠️ 2026-09-05 architecture change — read §3A before any Phase 3 work.** The original plan
> used Google Sheets as the admin interface and explicitly had *no admin page* (old §11). The
> owner has since asked for a real admin UI with a login, backed by MongoDB Atlas and
> Cloudinary. That decision is taken and this document now reflects it. It changes §2, §3,
> §4, §9, §10, §11 and §12. The reasoning and the costs it accepts are recorded in §3A rather
> than removed, so the trade is auditable later.

---

## 1. Goal

A public, mobile-first flower catalog. Customers browse products and contact the shop via Zalo, phone, or Messenger to order. **No cart, no checkout, no online payment, no customer accounts.**

Success = a customer finds a bouquet on Google or a shared Zalo link, and messages the shop with a specific product code.

## 2. Hard constraints

| Constraint | Implication |
|---|---|
| Near-zero recurring cost | Storefront on GitHub/Cloudflare Pages; admin on a free-tier host; MongoDB Atlas free tier; Cloudinary free tier. Domain (~$12/yr) is the only guaranteed spend. **Weakened from "zero" on 2026-09-05 — see §3A.** |
| Commercial use permitted | Rules out Vercel Hobby. Cloudflare Pages is fine. |
| Must rank on Google | Static HTML per product with real meta tags. **Not** a client-rendered SPA. |
| Must look good on a phone | ~85% of traffic. Mobile-first, desktop second. |
| Admin must be non-technical | A password-protected web form. Never touches Git, terminal, or a spreadsheet schema. |
| Admin data must survive | MongoDB Atlas is now the system of record. Unlike a Sheet, it has no version history the owner can read — **backups are mandatory, not optional.** See §3A.4. |
| Small image storage | WebP, ≤150KB per image. |

## 3. Architecture

```
   ADMIN APP (private, server-rendered, own deployment)
   Next.js, auth + product form + Cloudinary upload widget
        │  writes
        ▼
   MongoDB Atlas (free tier M0) ── system of record
        │  read ONCE at build time by the storefront
        ▼
   STOREFRONT (public, output: 'export')
        │  generateStaticParams → one HTML file per product
        ▼
    GitHub repo ──► Pages/Cloudflare ──► https://shop.vn
        ▲
        └── admin taps "Publish" in the admin UI → repository_dispatch → rebuild
```

**The load-bearing decision: MongoDB is read at BUILD time, never at request time.**
The storefront stays a static export with zero database calls from a customer's browser.
If the storefront ever queries Mongo per-request, §1's entire SEO rationale and the free
hosting both collapse. This is the single rule most likely to be broken by accident — see
§3A.2.

- **Two deployments, one repo.** The public site and the admin app are separate builds with separate hosting and separate env vars. The admin app is never part of the static export.
- **Build trigger:** a "Publish" button in the admin UI calls a GitHub `repository_dispatch` webhook. Live in 1–2 minutes. Replaces the bookmarked Cloudflare deploy hook.
- **Fallback:** GitHub Actions daily cron build, so the site self-heals if the admin forgets to publish and so campaigns activate on schedule.
- **Campaign scheduling:** the same cron is what activates and expires campaigns — see §6.2. Raise it to hourly in the week before a major date.
- **Build order:** the customer UI is built against local fixtures first; MongoDB is wired in later behind an env var. See §11.

## 3A. Admin UI architecture (decided 2026-09-05)

This section supersedes the old §11 "On 'the admin page'", which stated there was no admin
page. The owner asked for one. It is being built.

### 3A.1 What this trade actually costs

Recorded plainly so nobody re-litigates it later, and so the risks get budgeted rather than
discovered:

| What we gain | What we give up |
|---|---|
| A real login + product form; no spreadsheet columns to respect | Auth, sessions, and a database now exist and must be kept patched and secured |
| Image upload from the phone, no manual Cloudinary step | A second deployment, second set of env vars, second thing that can break |
| Validation at entry — a bad `occasions` tag can be rejected with a message | Free tiers can sleep, throttle, or change terms; M0 has no SLA |
| Data model can evolve without re-teaching a spreadsheet | **No Google-Sheets version history.** A mis-click can destroy data with no undo unless we build backups |

The storefront's SEO, speed, and hosting cost are all **unchanged**, because of the
build-time-read rule. That is the part worth protecting.

### 3A.2 The invariant

> The public storefront must contain **no** database credential, **no** runtime Mongo query,
> and **no** admin code. `MONGODB_URI` belongs to the admin app and to the CI build job —
> never to anything shipped to a browser, and never in a `NEXT_PUBLIC_*` variable.

`lib/data.ts` keeps its current role as the single entry point. It gains a Mongo branch that
runs at build time only. Every component keeps importing `getCatalog()` and still never
learns where the data came from — the §11 "one-function swap" design survives this change
intact, which is why the existing components need no rewrite.

### 3A.3 Storage split

| Data | Where | Why |
|---|---|---|
| Products, occasions, campaigns, settings | **MongoDB Atlas M0** (free, 512MB) | Structured, queryable, ~hundreds of documents. Far more than enough. |
| Images and video | **Cloudinary** (free tier) | Purpose-built: upload widget, automatic WebP conversion, and the resize transforms §6.1 already assumes. Mongo stores only the resulting URL string. |

Cloudinary is **not** an alternative to MongoDB here — it is the image half of the same
system. Storing images in Mongo (GridFS or base64) would exhaust the 512MB tier quickly and
lose the transform pipeline the plan already depends on.

Use Cloudinary's **unsigned upload preset** from the admin browser, so image bytes never
pass through the admin server and the API secret is never shipped to the client. Constrain
the preset to WebP, max dimensions, and a single folder.

### 3A.4 Backups are mandatory

The old design got version history free — Google Sheets keeps every revision and the owner
can restore one. **MongoDB M0 has no automated backup on the free tier.** Losing the
database means re-entering every product by hand from photographs.

Minimum acceptable: the daily cron build already reads the whole catalog. It commits a
timestamped JSON snapshot to the repo on each run. That gives Git-backed history at no cost,
and it doubles as the fixture file for local development. This is a required deliverable,
not a nice-to-have.

### 3A.5 Auth — deliberately minimal (confirmed 2026-09-05)

**One static admin account. No user table, no registration, no password reset, no email
flow, no OAuth, no third-party auth library.** The owner confirmed this scope; anything more
is unjustified for a single person logging into their own shop tool.

Concretely:

- Username + password live in the admin app's env vars. There is no accounts collection in MongoDB.
- Compare with a **constant-time** comparison, not `===`.
- On success, set a signed HTTP-only `Secure` `SameSite=Lax` session cookie. No JWT in `localStorage`.
- Every admin page and every write API route re-checks that cookie server-side. Hiding the UI is not access control — this is the one rule that cannot be skipped for being simple.
- A basic attempt-delay on the login route. Cheap, and it is the entire attack surface.

Two things stay non-negotiable even at this scope, because they cost nothing now and are
expensive to retrofit:

1. **Store the password as a hash** (`bcrypt`/`argon2`) in the env var, not plaintext. Same effort, and it means a leaked env file doesn't hand over the account.
2. **Never commit the real values.** `.env` is git-ignored; `.env.example` holds empty placeholders and *is* committed.

If this ever becomes multiple sellers, this design is intentionally throwaway — see §14 Q1.
It would need real accounts, ownership on every product, and moderation.

### 3A.7 Credentials are deferred

No accounts need to exist to build Phases 3 and 3B. The repo carries a committed
`.env.example` with every required key present and empty:

```
# Storefront (build time only — never NEXT_PUBLIC_*)
DATA_SOURCE=fixtures          # 'fixtures' | 'mongo'
MONGODB_URI=
MONGODB_DB=

# Admin app
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=

# Cloudinary (unsigned preset — see §3A.3)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# Publish button (§3) — GitHub repository_dispatch
GITHUB_DISPATCH_TOKEN=
GITHUB_REPO=
```

`DATA_SOURCE` defaults to `fixtures`, so **the storefront keeps building with an entirely
empty `.env`.** Missing values must fail with a clear message naming the key, at startup —
never with a silent empty catalog, and never by publishing a site with no products. The
owner fills these in at Phase 3.5.

### 3A.6 Where the admin app runs

It needs a Node server, so it cannot live on the static host. It also should **not** be
publicly indexable — `noindex` is set in `admin/app/layout.tsx` and it is absent from the
sitemap.

**Decided 2026-09-05: the admin app is HOSTED, not local-only.** The owner adds products
from a phone, at the shop — §9's photograph-and-upload-on-the-spot workflow. Running the
admin only on a laptop (`npm run dev`) would be free, expose no login page at all, and
remove this whole attack surface, but it cannot serve a phone. That option was considered
and rejected for that reason; revisit only if the workflow changes.

Consequences accepted by hosting it:

- A public login page exists. That is why §3A.5's throttle and server-side checks on every route are not optional.
- Free instances sleep on idle — expect a **30–60s cold start** on the first open of the day. Annoying, not blocking, for a tool opened a few times daily.
- A second deployment to keep alive. It deploys once and is then untouched; adding a product does not redeploy it.

**Host chosen 2026-09-05: Render free tier.** Vercel Hobby is ruled out by §2's
commercial-use constraint (the same reason it was rejected for the storefront). Render won
on: free with no card, no adapter needed for a Next server app, and a 15-minute setup.
Accepted cost: free instances sleep after ~15 minutes idle, so the first login of the day
waits 30–60s. Railway (~$5/mo) removes that but breaks §2's zero-recurring-cost rule.

Nothing in the code is Render-specific — it is a stock Next server app, so moving hosts is
a matter of re-entering env vars. See `docs/DEPLOY-ADMIN.md`.

**Verify current free-tier terms before committing** — §2's cost constraint depends on
them, and they move.

**On the two URLs.** The admin having its own address is a consequence of the storefront
being a static export (`output: 'export'`): a folder of HTML files cannot run a login or an
API route. Three options were weighed:

| | Approach | Verdict |
|---|---|---|
| A | Two deployments, two URLs | **Chosen.** Storefront stays static, free, fast. |
| B | One app, admin at `/admin`, drop `output: 'export'` | **Rejected.** Every product page becomes server-rendered for customers, forfeiting §1's SEO rationale and §2's free hosting — to tidy a URL only the owner ever sees. |
| C | Keep both, map `shop.vn/admin` to the admin deployment via a CDN proxy rule | **Deferred to Phase 4.** Gives the single-domain URL while keeping the static storefront. A routing rule, not a rewrite — nothing built now blocks it. |

---

### Next.js specifics — read these before coding

| Item | Requirement |
|---|---|
| `next.config.js` | `output: 'export'` — produces a static `out/` folder, no Node server |
| Rendering | **Server Components only.** No `getServerSideProps`, no route handlers, no ISR, no middleware — none survive static export |
| `next/image` | Requires `images: { unoptimized: true }` under static export. So **pre-optimize images yourself** (Cloudinary transforms or the resize script) |
| Data fetching | Mongo read inside a cached `lib/db.ts`, called from Server Components. **Build time only** — see §3A.2 |
| Trailing slashes | `trailingSlash: true` — matches Cloudflare Pages' static serving cleanly |
| Client JS | Only filters, gallery, copy-to-clipboard. Mark those `'use client'`; keep everything else server-rendered |

> The single biggest risk with Next.js here is accidentally client-rendering the product list. If products come from `useEffect`, the SEO goal is lost. Products must be resolved at build time in a Server Component.

## 4. Data model — MongoDB collections

> **2026-09-05:** this was a Google Sheet; it is now four MongoDB collections —
> `products`, `occasions`, `campaigns`, `settings`. **The fields below are unchanged**, and
> `lib/types.ts` remains the contract. Read the "Column" tables as documents, `snake_case`
> column names as the `camelCase` fields already defined in `lib/types.ts`.
>
> Two things the admin form must now enforce, which the Sheet could not:
> - `code` is unique and immutable once created — it is the public URL and the string the customer quotes in Zalo. Changing it breaks a live link. The form should make it read-only after creation.
> - `occasions` values must exist in the `occasions` collection. This is now a multi-select, not free text, so the old "must match Sheet 2" failure mode disappears.
>
> Index `code` (unique) and `status`. The dataset is small enough that nothing else needs one.

### Collection 1: `products`

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

### Collection 2: `occasions`

Still needed — these drive the homepage filter chips even without dedicated category pages. `seo_title` / `seo_description` / `intro` go unused unless category pages are added later; keep the columns.

| Column | Notes |
|---|---|
| `slug` | `sinh-nhat`, `khai-truong`, `chia-buon`, `tinh-yeu`, `cam-on`, `tot-nghiep`, `8-3`, `20-10`, `20-11`, `tet` |
| `label` | "Sinh nhật", "Khai trương"… |
| `seo_title` | Per-category page title |
| `seo_description` | Per-category meta description |
| `intro` | 1–2 paragraphs at the top of the category page (SEO weight) |

### Collection 3: `campaigns`

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

### Collection 4: `settings`

A single document. Shop name, phone, Zalo number, **Zalo OA ID**, Messenger URL, address,
hours, delivery areas, delivery fee note, same-day cutoff time, hero text, about text — plus
the §13.1 additions (`tagline`, `announcementText`, `announcementLink`, `heroEyebrow`,
`heroTitle`, `heroTitleAccent`, `deliveryAreas`).

> Everything editable lives in the database. No content should require a code change.

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

**Revised 2026-09-05 for the admin UI.** Six manual steps become three, and the two most
error-prone (resize/convert, and copy-pasting a URL into the right column) disappear:

1. Photograph the arrangement
2. Open the admin site on the phone → log in → "Thêm sản phẩm" → fill the form, upload photos directly from the camera roll
3. Tap **"Đăng lên website"** → live in ~2 minutes

Cloudinary's upload widget does the resize and WebP conversion on upload, so the ≤150KB
constraint in §2 is enforced by the preset rather than by the admin remembering to run a
script.

**Deliverables for the admin:** a one-page Vietnamese instruction sheet, the admin URL saved
as a phone bookmark, and credentials handed over in person or via a password manager — not
in a chat message.

**The form must be forgiving.** This is a phone, in a shop, probably one-handed:
- Save a draft (`status: hidden`) without every required field, so a half-entered product isn't lost
- Confirm before delete, and prefer `hidden` over destructive delete in the UI
- Show upload progress; a slow mobile connection uploading five photos looks frozen otherwise
- Make clear that saving ≠ publishing. Changes sit in the database until "Đăng lên website" is tapped — that separation is useful (batch several edits, publish once) but only if the UI states it.

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
  types.ts                   ← the contract every source satisfies. UNCHANGED by the admin rewrite
  data.ts                    ← single entry point; picks fixtures or Mongo by env var
  db.ts                      ← Phase 3: Mongo client + BUILD-TIME catalog read, normalized to types.ts
  campaigns.ts               ← active-window resolution against build date
  format.ts                  ← VND formatting, slugify
/design
  reference-homepage.html    ← committed copy of the provided mockup
  DESIGN-TOKENS.md           ← extracted token list
/data
  fixtures.json              ← Phase 1 data source; same shape as the DB output
  snapshots/                 ← §3A.4 dated JSON backups, committed by the cron build
next.config.js               ← storefront only: output:'export'

--- separate deployment, NOT part of the static export ---
/admin
  app/
    login/page.tsx           ← the entire attack surface; rate-limit it
    (dashboard)/
      products/page.tsx      ← list, search, toggle active/hidden
      products/[id]/page.tsx ← create + edit form, Cloudinary upload widget
      campaigns/page.tsx
      occasions/page.tsx
      settings/page.tsx
      publish/               ← 'Đăng lên website' → repository_dispatch
    api/                     ← server-side writes; every route re-checks the session
  lib/
    auth.ts                  ← session cookie, password hash verify
    db.ts                    ← shares the types.ts contract with the storefront
  next.config.js             ← NO output:'export' here — this one needs a server
```

## 11. Build phases

**Sequencing principle: build the customer UI first, against local fixture data. No database, no accounts, no credentials until the site already looks and works the way you want.**

This is deliberate. Wiring live data early means every UI iteration is gated on a network fetch. Fixtures make Phase 1 fully offline and instant to iterate on.

**The design decision that makes this work:** define `lib/types.ts` first, and have both the fixture loader and the eventual database reader return the identical normalized shape. Then Phase 3 is a one-function swap, not a refactor. Every component imports from `lib/data.ts`, which internally chooses fixtures or MongoDB based on an env var — components never know which.

**This survived the 2026-09-05 admin change intact.** Phases 1 and 2 are built and need no
rework; `lib/types.ts` did not change. That is the payoff for having defined the contract
first.

**Credentials are deferred by design.** Phase 3 is written against an `.env.example` with
empty placeholders. The code is built, typechecked, and reviewable before a single account
exists — every accounts step is Phase 3.5. Nothing in Phase 3 requires the owner to have
signed up for anything.

| Phase | Scope | Needs credentials? | Output |
|---|---|---|---|
| **1. Customer UI** | Design token extraction (§6.0), Next.js scaffold, `lib/types.ts`, `data/fixtures.json` (~12 realistic products, 4 occasions, 1 campaign), all customer routes, full mobile-first styling, gallery, video player, filters, contact bar, campaign banner + sale pricing | ❌ None | A complete, browsable site running on `localhost` |
| **2. SEO layer** | `generateMetadata`, OG tags, JSON-LD, `sitemap.ts`, `robots.ts`, image sizing, `next build` static export verified | ❌ None | Lighthouse targets met locally |
| **3. Data layer** ✅ **Built 2026-09-05** | `lib/db.ts` build-time Mongo read, normalized to `types.ts`; swap fixtures → DB behind `DATA_SOURCE`; `.env.example` with empty placeholders; snapshot/backup script (§3A.4) | ❌ **None** — placeholders only | Storefront builds from either source; fixtures still work |
| **3B. Admin UI** ✅ **Built 2026-09-05** | `/admin` app: static single-account login (§3A.5), product list + create/edit form, campaigns/occasions/settings editors, Cloudinary upload widget, Publish button → `repository_dispatch`, Vietnamese instruction doc | ❌ **None** — placeholders only | Admin app runs locally against a local Mongo or a stub |
| **3.5 Accounts** | Owner creates: MongoDB Atlas M0, Cloudinary, admin host. Fill in the `.env` values. Seed the DB from `fixtures.json`. | ✅ All of them | Real data flowing end to end |
| **4. Deploy** | Storefront host + domain + DNS, admin app deployed with `noindex`, GitHub Actions cron + dispatch hook, Zalo OA + widget, real photos and copy | ✅ All of them | Live site |
| **5. Optional** | Search, Google Business Profile, analytics, 360 spin viewer | — | — |

**Phases 1, 2, 3 and 3B need nothing but a code editor.** That is now most of the work, and
it's the part worth iterating on hardest — both apps are fully reviewable on your phone via
`next dev` on your local network before a single account exists.

### On "the admin page" — reversed 2026-09-05

This section previously read: *"there is no admin page in this plan. Google Sheets is the
admin interface."* The owner has asked for a real admin UI, and that decision is taken.

The original warning was that this needs a server, a session store, file upload handling,
and somewhere to run — and stops being free. That remains true, and §3A.1 records exactly
which of those costs are being accepted. What §3A buys back is the storefront: by reading
MongoDB at **build** time only, the public site stays a static export with the same SEO,
speed, and hosting cost it has today. The admin app is the only new thing that needs a
server.

The rejected alternative was hosting the storefront itself on a server and querying the
database per request. That would have been simpler to write and would have cost the project
its reason for existing (§1) — it is not on the table.

## 12. Acceptance criteria

- [ ] `next build` produces a static `out/` folder with one HTML file per product
- [ ] Viewing page source on a product page shows the product name and price in the HTML (not injected by JS)
- [ ] Creating a product in the admin UI and tapping Publish makes a live page within 2 minutes
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
- [ ] No recurring cost besides the domain, on current free-tier terms (§3A.6)

**Admin UI (added 2026-09-05):**

- [ ] The public `out/` bundle contains no database credential, no Mongo query, and no admin code (§3A.2)
- [ ] `grep -r "MONGODB_URI" out/` returns nothing
- [ ] The storefront still builds and renders with `DATA_SOURCE=fixtures` and a completely empty `.env`
- [ ] A missing required env var fails the build with a message naming the key — never a silent empty catalog
- [ ] Visiting any admin route logged-out redirects to login
- [ ] Calling a write API route directly with no session cookie returns 401 — verified with `curl`, not just in the browser
- [ ] The admin app is `noindex` and absent from the sitemap
- [ ] `.env` is git-ignored; `.env.example` is committed with empty values; no real secret is in git history
- [ ] Product `code` is not editable after creation
- [ ] A product can be saved as a draft with required fields still blank, without data loss
- [ ] Uploading a photo produces a WebP under 150KB without the admin resizing anything
- [ ] The daily cron commits a dated JSON snapshot to `/data/snapshots` (§3A.4)
- [ ] Restoring from a snapshot has been tested at least once, before launch

## 13. Implementation script

> **Historical — Phases 1–2, completed.** Kept as a record of how the current code was
> produced. Its "do not integrate Google Sheets yet" instructions refer to an architecture
> replaced on 2026-09-05; for new work follow §3A and §11 Phases 3 / 3B instead.

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

## 13.2 Phase 3 / 3B implementation notes (2026-09-05)

Built and verified. Both apps typecheck and build; the storefront still exports statically
from fixtures with a completely empty `.env`.

**Verified against §12 with curl, not just the browser:**
all 8 API routes return 401 unauthenticated; all 4 dashboard routes 307 to `/login`;
forged, unsigned, malformed and correctly-signed-but-expired session cookies are all
rejected; the login throttle trips on the 9th attempt; `out/` contains no credential and
no Mongo driver; the admin serves `noindex, nofollow`.

**Two bugs found by testing, both fixed:**

1. **dotenv corrupts every bcrypt hash.** `$` is a variable reference to dotenv — quoted
   or not — so `ADMIN_PASSWORD_HASH` silently truncated from 60 chars to 33 and login
   failed for everyone. Only backslash-escaping survives (verified across bare, single-
   and double-quoted forms). `scripts/hash-password.mjs` now emits the escaped form, and
   `lib/auth.ts` detects a corrupted hash and says so instead of reporting a wrong
   password. This would have locked the owner out on day one.
2. **The storefront build compiled `admin/`.** The root `tsconfig.json` globbed
   `**/*.tsx`, so admin server code was being typechecked into the public build — exactly
   what §3A.2 forbids. `admin` is now excluded.

**Deviation from §10:** the plan sketched `/admin/lib/db.ts` as sharing the storefront's
db module. It is a separate file: the storefront's is a read-only build-time loader, the
admin's writes. They share `lib/types.ts` through a `@shared/*` alias, which is what
actually keeps the two in step.

**Not built (needs accounts — Phase 3.5, see `docs/SETUP-PHASE-3.5.md`):** nothing is
wired to a real MongoDB, Cloudinary, or GitHub token yet. Untested until then: an
end-to-end save→publish→live cycle, a real image upload, and — most important — a restore
from `scripts/snapshot.mjs`, which §12 requires before launch.

## 14. Open questions

1. ~~**Single admin, or multiple sellers?**~~ **Resolved 2026-09-05: single admin.** The auth in §3A.5 is a single static account with no user table. Multiple sellers would require replacing it outright — accounts, permissions, moderation.
2. Domain name chosen?
3. Zalo OA created? Required for the chat widget; also looks more professional than a personal number.
4. Existing Facebook page to link, and existing product photos to migrate?
5. Public prices, or everything "Liên hệ"? Public prices convert better and help SEO.
6. Bilingual (VI/EN), or Vietnamese only?

---

**Cost summary:** domain ~$12/year. Everything else free at this scale, with no expiring trial. Free-tier terms shift, so re-verify Cloudflare and Cloudinary limits before launch.
