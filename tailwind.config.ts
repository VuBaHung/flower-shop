import type { Config } from 'tailwindcss'

/**
 * Tokens extracted from design/reference-homepage.html — see design/DESIGN-TOKENS.md
 * for the full audit, contrast measurements, and every place this deviates from the
 * mockup (and why).
 *
 * RULE: no raw hex and no arbitrary size values in JSX. If a value isn't named here,
 * it's a bug. Add it here first.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* --- Raw ramps (verbatim from the mockup) --- */

        // Electric rose / Y2K bloom. NOTE: not monotonic — 400 is magenta, 500 is a
        // lighter red-pink. Treat 400/500 as a decorative pair, never as a ramp.
        brand: {
          50: '#fff0f3',
          100: '#ffccd5',
          200: '#ffb3c1',
          300: '#ff85a1',
          400: '#f72585', // decorative only — 3.78:1 on white
          500: '#ff0054', // decorative only — 3.90:1 on white
          600: '#e0115f', // ✓ 4.76:1 — interactive fills + all price text
          700: '#b50e4c', // ✓ 6.71:1 — hover
          800: '#8f0b3c',
          900: '#5c0023',
        },
        // Fresh matcha / pistachio leaf
        matcha: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // 2.96:1 — icons-on-tint only, NOT a fill with white text
          700: '#15803d', // ✓ 5.01:1 — filled buttons
          800: '#166534',
          900: '#14532d',
        },
        // Aesthetic lavender
        lavender: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa', // 2.72:1 — decorative only
          500: '#8b5cf6',
          600: '#7c3aed', // ✓ 5.70:1
        },

        /* --- Ambient surfaces --- */
        cream: '#fffaf5', // page background
        porcelain: '#ffffff', // card / section surface
        butter: '#fffbeb', // warm alt surface
        zalo: '#0068FF', // ✓ 4.75:1 with white text

        /* --- Semantic aliases: prefer these in JSX over the raw ramps --- */
        primary: {
          DEFAULT: '#e0115f', // brand-600
          hover: '#b50e4c', // brand-700
          soft: '#ffccd5', // brand-100
          tint: '#fff0f3', // brand-50
        },
        ink: {
          DEFAULT: '#1e1b18', // body text
          muted: '#57534e', // stone-600
          subtle: '#78716c', // stone-500 — contrast floor
        },
        line: {
          DEFAULT: '#e7e5e4', // stone-200
          strong: '#d6d3d1', // stone-300
        },
        // Campaign pricing (§6.2) — the mockup has no precedent for these.
        sale: '#e0115f', // sale price reads as a normal price
        'price-was': '#78716c', // struck-through original, still AA-legible
        success: '#15803d',
        warning: '#d97706',
        error: '#be123c',
      },

      fontFamily: {
        // Outfit was replaced: no Vietnamese subset, no U+20AB (₫).
        display: ['var(--font-display)', 'Be Vietnam Pro', 'sans-serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'sans-serif'],
      },

      fontSize: {
        // 9px and 10px from the mockup are deliberately dropped. 11px floor.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px — uppercase pills only
      },

      lineHeight: {
        // The mockup's leading-[1.08] on a 72px h1 clips diacritic stacks like Ố / Ữ.
        display: '1.15',
      },

      aspectRatio: {
        // Mobile shows two cards per row, so a 4/5 portrait image made each card ~330px
        // tall and barely one row fit on screen. 1/1 on mobile, 4/5 from `sm` up where
        // the extra height costs nothing. The gallery keeps 4/5 everywhere.
        'card-sm': '1 / 1',
        card: '4 / 5', // every product image, in the grid and the gallery
      },

      borderRadius: {
        '3xl': '1.75rem', // overrides Tailwind's 1.5rem — cards, modals, sections
        '4xl': '2.5rem', // hero image frame
        pill: '9999px', // every CTA and chip
      },

      boxShadow: {
        neon: '0 12px 30px -5px rgba(247, 37, 133, 0.3)',
        'matcha-glow': '0 12px 30px -5px rgba(34, 197, 94, 0.25)',
        'soft-card': '0 10px 35px -8px rgba(0, 0, 0, 0.05)',
        glass: '0 8px 32px 0 rgba(247, 37, 133, 0.08)',
        // Card elevation pattern: border-only at rest, glow on hover.
        card: 'none',
        'card-hover': '0 12px 30px -5px rgba(247, 37, 133, 0.3)',
      },

      backgroundImage: {
        // Hero: three stacked radials, verbatim from the mockup.
        hero: [
          'radial-gradient(circle at 90% 10%, rgba(247,37,133,0.15) 0%, transparent 45%)',
          'radial-gradient(circle at 10% 80%, rgba(167,139,250,0.18) 0%, transparent 50%)',
          'radial-gradient(circle at 50% 50%, rgba(254,240,138,0.25) 0%, transparent 70%)',
        ].join(','),
      },

      maxWidth: {
        container: '80rem', // 1280px — max-w-7xl
      },

      transitionDuration: {
        DEFAULT: '300ms',
        image: '500ms', // card image zoom
        hero: '700ms', // hero image zoom
      },

      scale: {
        108: '1.08', // the mockup used `scale-108`, which silently did nothing
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(4deg)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
