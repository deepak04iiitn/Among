import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    extend: {
      // ─── Color palette ─────────────────────────────────────────────────
      // All colors reference CSS custom properties defined in globals.css
      // Do NOT use raw hex or rgb values here — always go through the token.
      colors: {
        // Semantic surface colors
        bg: {
          DEFAULT: 'hsl(var(--color-bg))',
          subtle: 'hsl(var(--color-bg-subtle))',
        },
        text: {
          DEFAULT: 'hsl(var(--color-text))',
          secondary: 'hsl(var(--color-text-secondary))',
          muted: 'hsl(var(--color-text-muted))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent))',
          subtle: 'hsl(var(--color-accent-subtle))',
          foreground: 'hsl(var(--color-accent-foreground))',
        },
        border: {
          DEFAULT: 'hsl(var(--color-border))',
          strong: 'hsl(var(--color-border-strong))',
        },
        // Semantic feedback
        error: 'hsl(var(--color-error))',
        warn: 'hsl(var(--color-warn))',
        ok: 'hsl(var(--color-ok))',
        // shadcn/ui compatibility aliases
        background: 'hsl(var(--color-bg))',
        foreground: 'hsl(var(--color-text))',
        card: { DEFAULT: 'hsl(var(--color-bg-subtle))', foreground: 'hsl(var(--color-text))' },
        popover: { DEFAULT: 'hsl(var(--color-bg))', foreground: 'hsl(var(--color-text))' },
        primary: { DEFAULT: 'hsl(var(--color-text))', foreground: 'hsl(var(--color-bg))' },
        secondary: { DEFAULT: 'hsl(var(--color-bg-subtle))', foreground: 'hsl(var(--color-text))' },
        muted: { DEFAULT: 'hsl(var(--color-bg-subtle))', foreground: 'hsl(var(--color-text-muted))' },
        destructive: { DEFAULT: 'hsl(var(--color-error))', foreground: 'white' },
        input: 'hsl(var(--color-border))',
        ring: 'hsl(var(--color-accent))',
      },

      // ─── Typography ────────────────────────────────────────────────────
      fontFamily: {
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'],
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display:    ['clamp(2.5rem, 8vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        headline:   ['clamp(1.75rem, 5vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'title-xl': ['clamp(1.375rem, 3vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        title:      ['clamp(1.125rem, 2vw, 1.375rem)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'body-lg':  ['1.125rem', { lineHeight: '1.7', letterSpacing: '0' }],
        body:       ['1rem', { lineHeight: '1.65', letterSpacing: '0' }],
        ui:         ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        caption:    ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },

      // ─── Border radius ─────────────────────────────────────────────────
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },

      // ─── Max widths ────────────────────────────────────────────────────
      maxWidth: {
        reading: '65ch',
        content: '672px',
      },

      // ─── Spacing ───────────────────────────────────────────────────────
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },

      // ─── Custom animations ─────────────────────────────────────────────
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        wordStagger: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        avatarDraw: {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        wordStagger: 'wordStagger 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        avatarDraw: 'avatarDraw 0.6s ease-out forwards',
      },
    },
  },
  plugins: [
    // Add @tailwindcss/typography when installed for rich text content
  ],
};

export default config;
