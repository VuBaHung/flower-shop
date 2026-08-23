# Design Tokens — extracted from `design/reference-homepage.html`

Source: the Gen Z / Y2K bloom mockup, committed at `design/reference-homepage.html`.
Extraction method: read the inline `tailwind.config` block and the `<style>` block, then
audited every utility class actually used in the markup. Values below are the real ones
from the file, not eyeballed.

**Status of the reference:** authoritative for *visual language* (palette, type feel, spacing
rhythm, card treatment, radii, glow shadows). Not authoritative for structure or behavior —
see §"What the mockup is missing" at the bottom.

---

## 1. Color

### 1.1 Raw ramps (verbatim from the mockup)

**`brand` — electric rose / Y2K pink.** The primary.

| Step | Hex | Contrast on white | Use |
|---|---|---|---|
| 50 | `#fff0f3` | — | tint backgrounds |
| 100 | `#ffccd5` | — | soft chips, icon plates |
| 200 | `#ffb3c1` | — | borders, on-dark text |
| 300 | `#ff85a1` | — | scrollbar thumb, decorative |
| 400 | `#f72585` | 3.78 ✗ | **decorative fills / gradients only** |
| 500 | `#ff0054` | 3.90 ✗ | **decorative fills / gradients only** |
| 600 | `#e0115f` | 4.76 ✓ | **all interactive fills, all price text** |
| 700 | `#b50e4c` | 6.71 ✓ | hover state, high-contrast text |
| 800 | `#8f0b3c` | — | — |
| 900 | `#5c0023` | — | on-tint text |

> ⚠️ **This ramp is not monotonic.** `400 (#f72585)` is magenta, `500 (#ff0054)` is a *lighter,
> redder* pink. That is why the mockup's `from-brand-400 via-brand-500 to-lavender-500`
> gradients read muddy. Keep the hexes (they are the look), but treat 400/500 as a
> decorative pair and never as sequential steps.

**`matcha` — fresh green accent.** Tailwind's default `green` ramp verbatim (50 `#f0fdf4` → 900 `#14532d`).
Key: `500 #22c55e`, `600 #16a34a` (2.96 ✗), `700 #15803d` (5.01 ✓).

**`lavender` — aesthetic purple accent.** Tailwind's default `violet` 50–600.
Key: `400 #a78bfa` (2.72 ✗, decorative only), `600 #7c3aed` (5.70 ✓).

**Ambient surfaces**

| Token | Hex | Role |
|---|---|---|
| `cream` | `#fffaf5` | page background (`body`) |
| `porcelain` | `#ffffff` | card / section surface |
| `butter` | `#fffbeb` | warm alt surface |
| `zalo` | `#0068FF` | official Zalo blue (4.75 ✓ with white text) |

**Text**

| Role | Value |
|---|---|
| Primary | `#1e1b18` (set on `body`, near-black warm) |
| Secondary | `stone-600 #57534e` |
| Subtle | `stone-500 #78716c` (4.65 on cream ✓ — this is the floor) |
| On dark | `stone-200` / `stone-300` |

### 1.2 Accessibility rule derived from the above

The mockup fails WCAG AA in several places. One rule fixes all of them:

> **Filled interactive elements use step 600 or darker (matcha: 700 or darker). Steps 300–500
> are decorative fills, gradients, borders, and icon plates only.**

Specific failures found and their fixes:

| Where in the mockup | Problem | Fix |
|---|---|---|
| Product card "Inbox Zalo" button — white `text-xs` on `bg-brand-500` | 3.90:1 | `bg-brand-600 hover:bg-brand-700` |
| Hero "Check Phí Ship" — white `text-xs` on `bg-matcha-600` | 2.96:1 | `bg-matcha-700 hover:bg-matcha-800` |
| Badge pills — white `text-[10px]` on `brand-500`→`rose-500` gradient | ~3.9:1 at 10px | solid `brand-600`, text to 11px |
| Form placeholders — `placeholder-stone-400` | 2.52:1 | `placeholder-stone-500` |
| Card price — `text-brand-600` | 4.76:1 | ✓ already correct, keep |

### 1.3 Tokens the mockup has no value for — decided here

The plan needs these and the mockup never shows them (it has no sale pricing, no campaigns).

| Token | Value | Rationale |
|---|---|---|
| `sale` | `brand-600 #e0115f` | The sale price should look like a *normal* price — reuse the price color rather than inventing a red, which reads as an error state. |
| `price-was` | `stone-500 #78716c` | Struck-through original. Recedes, still AA-legible (it carries information). |
| `success` | `matcha-700 #15803d` | Toasts, "còn hàng", delivery-available. |
| `warning` | `amber-600` | Order cutoff urgency. |
| `error` | `rose-700` | Form validation. |

**`badge_style` mapping** (Sheet column → token). The mockup already implies exactly three
badge treatments, so the enum in PLAN.md §4 maps cleanly:

| `badge_style` | Mockup precedent | Token |
|---|---|---|
| `hot` | "Hot Trend 🔥" | `bg-brand-600 text-white` |
| `info` | "Giữ Lâu 3 Năm 💜" | `bg-lavender-600 text-white` |
| `luxe` | "Sang Chảnh ✨" | `bg-stone-900 text-white` |

Blank → no badge element rendered at all.

---

## 2. Typography

### 2.1 Families

| Role | Mockup | **Decision** | Why |
|---|---|---|---|
| Display / headings / prices | `Outfit` 400–900 | **`Be Vietnam Pro` 400–900** | Outfit's Google Fonts build is `latin` + `latin-ext` only. It has **no `U+1EA0–1EF9`** (ạ ả ế ộ ữ ợ…), **no `U+01A0–01B0`** (ơ ư), and **no `U+20AB` (₫)**. Every headline and every price would fall back mid-word to a system font. Be Vietnam Pro is a geometric sans with the same 100–900 range, purpose-built for Vietnamese — near-identical feel, full coverage. |
| Body / UI | `Plus Jakarta Sans` 400–800 | **keep** | Ships a `vietnamese` subset ✓. Note: max weight 800 — do not apply `font-black` (900) to body-font elements, it will synthesize. |

Load both via `next/font/google`, not a `<link>`. The mockup's `<link>` to fonts.googleapis.com
is a render-blocking third-party request and will cost you the Lighthouse ≥90 target.

### 2.2 Size scale

Sizes actually present in the mockup, mapped to named steps:

| Token | px | Mockup usage |
|---|---|---|
| `2xs` | 11 | pill labels, badges, captions (**floor**) |
| `xs` | 12 | card meta, buttons, footer links, body small |
| `sm` | 14 | body, nav links |
| `base` | 16 | hero paragraph |
| `lg` | 18 | card product name |
| `xl` | 20 | hero price |
| `2xl` | 24 | logo wordmark, section sub-headings, modal titles |
| `3xl` | 30 | section headings (mobile) |
| `4xl` | 36 | h1 (mobile) |
| `5xl` | 48 | section headings (desktop) |
| `6xl` | 60 | h1 (sm) |
| `7xl` | 72 | h1 (lg) |

> ⚠️ The mockup uses `text-[9px]`, `text-[10px]`, and `text-[11px]` heavily — badges, card meta,
> footer, floating tooltips. **9px and 10px are dropped.** Floor is 11px, and only for
> uppercase + `tracking-wider` pills. Everything informational is ≥12px. This is required for
> the A11y ≥90 target and it matters more in Vietnamese, where diacritic stacks need vertical room.

### 2.3 Weights, line height, tracking

- Weights in use: 400 / 500 / 600 / 700 / 800 / 900. The design leans **very** heavy —
  `font-black` on h1, logo, prices, and card names; `font-extrabold` on most buttons and labels.
  This is the signature of the look; keep it.
- Line heights: `leading-none` (logo), `leading-[1.08]` (h1 — tight), `leading-relaxed` (body copy).
  **Bump h1 to `leading-[1.15]`**: 1.08 clips ascender+diacritic stacks like `Ố` / `Ữ` at 72px.
- Tracking: `tracking-tight` (headlines), `tracking-wide` / `wider` / `widest` (uppercase eyebrows),
  `tracking-[0.2em]` (logo sub-label).

---

## 3. Spacing & layout

- **Base unit:** 4px (Tailwind default scale, unmodified).
- **Container:** `max-w-7xl` = **1280px**, gutters `px-4 sm:px-6 lg:px-8` (16 / 24 / 32).
- **Section rhythm:** `py-12` (80px band), `py-16`, `py-20` — the dominant section padding is
  `py-20` (80px) on desktop content sections, `py-12` on the value-prop strip.
- **Product grid gap:** `gap-8` (32px). Chip row gap: `gap-2`/`gap-3`. Card inner padding: `p-6` (24px).
- **Hero:** 12-column grid, **7 / 5** split (text / image), `gap-12`, `min-h-[85vh]`.
- **Header:** `h-20` (80px) sticky, plus a `py-2.5` announcement bar above it.

### Grid breakpoints — one change from the mockup

Mockup: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — it jumps 2 → 4 and skips 3.
At exactly 1024px that's four ~230px cards, which crushes the Vietnamese product names.

**Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`** (matches PLAN.md §6 Global).

---

## 4. Radii

| Token | Value | Applied to |
|---|---|---|
| `xl` | 0.75rem | inputs, small buttons, inner chips |
| `2xl` | 1rem | icon plates, badges, option tiles |
| `3xl` | **1.75rem** (overridden from Tailwind's 1.5rem) | **cards, modals, sections** |
| `4xl` | 2.5rem | hero image frame |
| `pill` / `full` | 9999px | all primary CTAs, filter chips, floating buttons |

Signature: **cards are `3xl`, buttons are always fully rounded pills.** Nothing in this design
has a square corner.

---

## 5. Shadows & elevation

| Token | Value | Use |
|---|---|---|
| `neon` | `0 12px 30px -5px rgba(247,37,133,0.30)` | card hover, primary CTA hover, hero image frame |
| `matcha-glow` | `0 12px 30px -5px rgba(34,197,94,0.25)` | green-accented card hover |
| `soft-card` | `0 10px 35px -8px rgba(0,0,0,0.05)` | *defined but unused in the mockup* |
| `glass` | `0 8px 32px 0 rgba(247,37,133,0.08)` | *defined but unused* |

**Card elevation pattern (this is the important part):** resting state is **border-only** —
`border border-stone-200/80`, no shadow. Hover swaps to `border-brand-300` + `shadow-neon`.
Codify as `shadow-card` (none) → `shadow-card-hover` (`neon`) so components can't drift.

**Glass panel** (used by the sticky header, hero form, floating badges):
```css
background: rgba(255,255,255,0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.9);
```

**Hero background** — three stacked radial gradients, worth reproducing exactly:
```css
radial-gradient(circle at 90% 10%, rgba(247,37,133,0.15) 0%, transparent 45%),
radial-gradient(circle at 10% 80%, rgba(167,139,250,0.18) 0%, transparent 50%),
radial-gradient(circle at 50% 50%, rgba(254,240,138,0.25) 0%, transparent 70%)
```

---

## 6. Motion

| Property | Value |
|---|---|
| Durations | 300ms (default, colors/transform), 500ms (card image zoom), 700ms (hero image zoom) |
| Easing | browser default — no custom curve is defined. Adopt `ease-out` for enter, `ease-in-out` for loops. |
| `float` keyframe | `5s ease-in-out infinite`, `translateY(0 → -12px)` + `rotate(0 → 4deg)` |
| Library animations used | `animate-ping` (announcement dot), `animate-pulse` (hero 🔥), `animate-bounce` (nav "Mix & Match" pill) |

> ⚠️ **Two required changes.** (1) The mockup has no `prefers-reduced-motion` handling while
> running a ping, a pulse, a bounce, and two floating elements simultaneously — wrap all of it.
> (2) `group-hover:scale-108` is used on **every** product image and hero image — `scale-108`
> is not a valid Tailwind value, so none of those hover zooms currently do anything. Use
> `scale-105` (or register `108` in the config) if you want the effect.

---

## 7. Component anatomy (example layout, per the reference)

### Product card — top to bottom
```
┌─────────────────────────────┐
│ [badge pill]                │  absolute top-4 left-4, colored by badge_style
│                             │
│      image, aspect-[4/5]    │  object-cover, group-hover:scale-105 (500ms)
│                             │
│  [ Xem Chi Tiết Máy ]       │  inset-x-4 bottom-4, opacity-0 → group-hover:opacity-100
├─────────────────────────────┤
│ subtitle          ★ 5.0(210)│  text-xs stone-500, rating right-aligned  ← see PLAN §4.1
│ Product Name 🌸             │  text-lg font-black, hover:text-brand-600
│ short_desc, two lines…      │  text-xs stone-500 line-clamp-2
│ ─────────────────────────── │  border-t border-stone-100, pt-2
│ 950.000₫      [Inbox Zalo]  │  price text-lg font-black text-brand-600
└─────────────────────────────┘
```
Card shell: `bg-white rounded-3xl border border-stone-200/80 flex flex-col`, body is
`p-6 flex-1 flex flex-col justify-between` — that is what pins the price row to the bottom.

**Two fixes required for uniform height:** the mockup clamps `short_desc` (`line-clamp-2`) but
**does not clamp the name** — a two-line Vietnamese product name breaks the grid immediately.
Clamp the name to 2 lines. And reserve the rating row's height even when empty, or the card
collapses unevenly once ratings are blank (which, per PLAN.md §4.1, they will be at launch).

### Section header pattern
```
✨ TRENDING BOUQUET COLLECTION     ← text-xs font-black uppercase tracking-widest text-brand-600
Mẫu Hoa Wax & Sáp "Sống Ảo"        ← font-display text-3xl sm:text-5xl font-black
```
Left-aligned, with filter chips right-aligned on the same row (`md:flex-row md:items-end justify-between`).

### Filter chip
- Active: `bg-stone-900 text-white`, no border.
- Inactive: `bg-white text-stone-600 border border-stone-200`, `hover:border-brand-400`.
- Row: `flex gap-2 overflow-x-auto pb-2` + custom 6px pink scrollbar (`#ff85a1`, fully rounded).

### Buttons
| Variant | Spec |
|---|---|
| Primary | `bg-gradient-to-r from-brand-500 to-brand-600` → **change to solid `bg-brand-600`** for AA; `rounded-full px-8 py-4 text-sm font-extrabold`, `hover:shadow-neon hover:scale-105` |
| Secondary | `bg-white border-2 border-stone-200 text-stone-900 rounded-full`, `hover:border-brand-300` |
| Zalo | `bg-zalo/10 text-zalo border border-zalo/20` → `hover:bg-zalo hover:text-white` |
| Card CTA | `bg-brand-600 rounded-full px-4 py-2 text-xs font-extrabold` + icon |

---

## 8. What the mockup is missing (build per PLAN.md, styled to match)

Confirmed by reading the file — none of these exist in it:

- Sticky bottom contact bar on mobile (PLAN §6 Global). The mockup has **only** the floating
  bottom-right buttons, and at `bottom-6 right-6` they sit directly on top of the last card's
  "Inbox Zalo" button on a 375px screen. PLAN's resolution (sticky bar on mobile, floating on
  desktop) is correct and necessary.
- Sale / campaign pricing — no strikethrough treatment anywhere. Tokens defined in §1.3 above.
- Campaign banner and hero swap.
- Product code on the card, and the copy-code button + toast.
- Video player (`<video preload="none">`).
- Occasion filter driven by real slugs — the mockup's `data-category` values mix material
  (`wax`) with occasion (`romance`, `birthday`, `luxury`). Chips must come from Sheet 2
  `Occasions` only; `flower_type` is a separate axis.

## 9. What the mockup has that the plan doesn't

Flagged for a scope decision before Phase 1 components are written:

| Mockup feature | Notes |
|---|---|
| **"Self-Mix Studio" bouquet builder** | A full 3-step configurator with live VND totalling and a "send to Zalo" handoff. It is linked from the nav *and* the hero secondary CTA. Substantial client component + needs a `BuilderOptions` data source. **Not in PLAN.md at all.** |
| **Customer testimonials section** | Three named people with photos and locations. Needs a `Testimonials` sheet, or it's hardcoded — which breaks "everything editable lives in the Sheet". Also inherits PLAN §4.1's honesty question, more sharply. |
| **Delivery-fee / district checker** | Hero form. Needs a `DeliveryAreas` list in Settings to work client-side against static data. |
| **Announcement bar** | Text + hotline. Must come from `Settings`, or editing it is a code change. |
| **Countdown timer** | Currently counts down from a hardcoded `18:45:20` on every page load. Per PLAN §6.2 it must read `order_cutoff` and render nothing when absent or past. |
| **"Gen Z Tokens UI" header button** | A dev artifact. Drop it. |

## 10. Do not carry over

- `<script src="https://cdn.tailwindcss.com">` and the inline `tailwind.config` — dev-only,
  ships a JIT compiler to the browser. Tokens move to `tailwind.config.ts`.
- The Lucide CDN `<script>` — use the `lucide-react` package.
- Unsplash image URLs — placeholders only.
- Invalid utility classes present in the file: `sage-*` (**never defined** — the entire builder
  section's background silently fails to render), `w-13 h-13`, `scale-108`, `.text-gradient`.
- Modals: `hidden` + `flex` on the same element, no ESC handler, no focus trap, no body scroll
  lock, no `aria-modal`. Use conditional rendering and a real dialog pattern.
