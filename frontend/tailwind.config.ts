import type { Config } from 'tailwindcss';

/**
 * AMONG Tailwind Configuration
 * Warm Linen — cream paper, espresso ink, dried-rose accent. See /docs/theme.md.
 *
 * All token values reference CSS custom properties defined in globals.css.
 * Never add raw hex values or gradient tokens here.
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/utils/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    extend: {
      // ─── Color palette ─────────────────────────────────────────────────
      // All colors reference CSS custom properties defined in globals.css.
      // Do NOT use raw hex or rgb values here — always go through the token.
      colors: {
        // AMONG design tokens
        bg: {
          DEFAULT: 'var(--color-bg)',
          subtle:  'var(--color-bg-subtle)',
        },
        text: {
          DEFAULT:   'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          subtle:  'var(--color-accent-subtle)',
        },
        // Semantic feedback — muted, never saturated
        error: 'var(--color-error)',
        warn:  'var(--color-warn)',
        ok:    'var(--color-ok)',
        info:  'var(--color-info)',

        // shadcn/ui compatibility aliases
        // These must use hsl() + HSL variables because shadcn internals expect it.
        background:         'hsl(var(--background))',
        foreground:         'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring:  'hsl(var(--ring))',
      },

      // ─── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        editorial: ['var(--font-editorial)', 'Fraunces', 'Georgia', 'serif'],
        ui:        ['var(--font-ui)',        'Karla', 'system-ui', 'sans-serif'],
        brand:     ['var(--font-brand)',     'Comfortaa', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fixed editorial scale — see CLAUDE.md §7.4 for token rationale
        display:    ['5rem',    { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '400' }],
        headline:   ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '400' }],
        'title-xl': ['2rem',    { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '400' }],
        title:      ['1.5rem',  { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg':  ['1.125rem',{ lineHeight: '1.7',  letterSpacing: '0',       fontWeight: '400' }],
        body:       ['1rem',    { lineHeight: '1.65', letterSpacing: '0',       fontWeight: '400' }],
        ui:         ['0.875rem',{ lineHeight: '1.5',  letterSpacing: '0.005em', fontWeight: '400' }],
        caption:    ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.01em',  fontWeight: '400' }],
      },

      // ─── Border radius ──────────────────────────────────────────────────
      // Primary buttons: rounded-pill  | Cards: rounded-lg | Inputs: rounded-md
      borderRadius: {
        none:  '0',
        sm:    '6px',      // var(--radius-sm)
        md:    '10px',     // var(--radius-md) — inputs, small cards
        lg:    '16px',     // var(--radius-lg) — cards, surface containers
        xl:    '24px',     // var(--radius-xl) — SNY cards, larger containers
        pill:  '9999px',   // var(--radius-pill) — PRIMARY action shape
        full:  '50%',      // avatar containers only
        DEFAULT: 'var(--radius)',
      },

      // ─── Max widths ──────────────────────────────────────────────────────
      maxWidth: {
        reading: '65ch',    // max line-length for post body text (~65 chars)
        content: '672px',   // max-w-2xl equivalent for editorial column
        shell:   '896px',   // max-w-4xl for wider UI surfaces (explore)
        spread:  '72rem',   // journal back-cover / wide editorial chrome (footer)
      },

      // ─── Custom keyframe animations ──────────────────────────────────────
      // All keyframe definitions live in globals.css — only referenced here.
      keyframes: {
        fadeIn:        { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:       { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        wordReveal:    { '0%': { transform: 'translateY(100%)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        avatarDraw:    { from: { strokeDashoffset: '1000' }, to: { strokeDashoffset: '0' } },
        countOut:      { from: { transform: 'translateY(0)',    opacity: '1' }, to: { transform: 'translateY(-4px)', opacity: '0' } },
        countIn:       { from: { transform: 'translateY(4px)',  opacity: '0' }, to: { transform: 'translateY(0)',    opacity: '1' } },
        skeletonPulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        pageEnter:     { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        overlayIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        overlayOut:    { from: { opacity: '1' }, to: { opacity: '0' } },
      },
      animation: {
        'fade-in':       'fadeIn 300ms var(--ease-out) both',
        'slide-up':      'slideUp 400ms var(--ease-out) both',
        'word-reveal':   'wordReveal 600ms var(--ease-out) both',
        'avatar-draw':   'avatarDraw 1200ms var(--ease-out) forwards',
        'count-out':     'countOut 250ms var(--ease-out) forwards',
        'count-in':      'countIn 250ms var(--ease-out) forwards',
        'skeleton':      'skeletonPulse 1.6s ease-in-out infinite',
        'page-enter':    'pageEnter 400ms var(--ease-out) both',
        'overlay-in':    'overlayIn 250ms var(--ease-standard) both',
        'overlay-out':   'overlayOut 150ms var(--ease-standard) both',
      },

      // ─── Transition durations (referencing CSS tokens) ───────────────────
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast:    'var(--duration-fast)',
        normal:  'var(--duration-normal)',
        slow:    'var(--duration-slow)',
        reveal:  'var(--duration-reveal)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        'ease-out-custom': 'var(--ease-out)',
        'ease-in-out-custom': 'var(--ease-in-out)',
      },
    },
  },
  plugins: [],
};

export default config;
