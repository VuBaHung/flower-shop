import type { Config } from 'tailwindcss'

/**
 * The admin tool's own config, deliberately NOT the storefront's token set. This is an
 * internal tool: it should look plain and legible, and it must not drift when the
 * storefront's brand tokens change. Stock Tailwind palette only.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Used for codes and status pills; stock Tailwind stops at text-xs.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}

export default config
