// Frontend-only — design token Tailwind class name references.
// Import these instead of writing Tailwind class strings directly for any design-decision value.

/** Typography class names — use for font-family selection */
export const FONT = {
  EDITORIAL: 'font-editorial',
  UI: 'font-ui',
  BRAND: 'font-brand',
} as const;

/** Type scale class names */
export const TEXT_SIZE = {
  DISPLAY: 'text-display',
  HEADLINE: 'text-headline',
  TITLE_XL: 'text-title-xl',
  TITLE: 'text-title',
  BODY_LG: 'text-body-lg',
  BODY: 'text-body',
  UI: 'text-ui',
  CAPTION: 'text-caption',
} as const;

/** Color class names */
export const COLOR = {
  // Text
  TEXT: 'text-text',
  TEXT_SECONDARY: 'text-text-secondary',
  TEXT_MUTED: 'text-text-muted',
  TEXT_ACCENT: 'text-accent',
  TEXT_ON_DARK: 'text-white',

  // Background
  BG: 'bg-bg',
  BG_SUBTLE: 'bg-bg-subtle',
  BG_ACCENT_SUBTLE: 'bg-accent-subtle',
  BG_TEXT: 'bg-text',       // Inverted — espresso fill, cream type (primary CTA)
  BG_ACCENT: 'bg-accent',

  // Border
  BORDER: 'border-border',
  BORDER_STRONG: 'border-border-strong',
  BORDER_ACCENT: 'border-accent',

  // Semantic
  TEXT_ERROR: 'text-error',
  TEXT_WARN: 'text-warn',
  TEXT_OK: 'text-ok',
} as const;

/** Border radius class names */
export const RADIUS = {
  SM: 'rounded-sm',
  MD: 'rounded-md',
  LG: 'rounded-lg',
  XL: 'rounded-xl',
  PILL: 'rounded-pill',
  FULL: 'rounded-full',
} as const;

/** Animation class names (defined in globals.css) */
export const ANIMATION = {
  FADE_IN: 'animate-fadeIn',
  SLIDE_UP: 'animate-slideUp',
  WORD_STAGGER: 'animate-wordStagger',
  AVATAR_DRAW: 'animate-avatarDraw',
  PULSE: 'animate-pulse',
  LANDING_REVEAL: 'landing-reveal',
  LANDING_INVIEW: 'landing-inview',
  LANDING_RULE: 'landing-rule',
  LANDING_DROP: 'landing-drop',
  LANDING_LINK: 'landing-link',
  LANDING_TOC: 'landing-toc-row',
  LANDING_FAQ: 'landing-faq',
  HOW_FOLIO: 'how-folio',
  HOW_VERSO: 'how-verso',
  HOW_RECTO: 'how-recto',
  HOW_GUTTER: 'how-gutter',
  HOW_VERSO_MARK: 'how-verso-mark',
  HOW_DELAY_2: 'how-delay-2',
  HOW_DELAY_3: 'how-delay-3',
  HERO_KICKER: 'landing-hero-kicker',
  HERO_LEDE: 'landing-hero-lede',
  HERO_ACTIONS: 'landing-hero-actions',
} as const;

/** Scroll-entrance observer — keep sections animating in the visible frame. */
export const IN_VIEW = {
  THRESHOLD: 0.2,
  ROOT_MARGIN: '0px 0px -20% 0px',
} as const;

/** Max width tokens */
export const MAX_WIDTH = {
  READING: 'max-w-reading',   // ~65ch — for post body text
  CONTENT: 'max-w-2xl',       // 672px — for all primary content columns
  UI:      'max-w-4xl',       // 896px — for wider UI surfaces (explore grid)
  SPREAD:  'max-w-spread',    // 72rem — journal back-cover / wide editorial chrome
} as const;
