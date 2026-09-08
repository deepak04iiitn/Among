# AMONG — Visual Theme: "Warm Linen"

> **Status: locked.** This is the single source of truth for color, type, spacing, shape, and motion across the AMONG product. Every component redesign from this point forward — new or rebuilt — must be built exclusively from the tokens documented here. No ad hoc hex values, no inline styles, no one-off font sizes. If a value you need isn't in this document, add it here first, then use it.
>
> This supersedes the light/indigo palette described in `CLAUDE.md` §7–8, the Implementation Plan §7B, and the previous **Afterhours** dark theme. Those sections' *structural* rules (no gradients, single accent used sparingly, no card grids, pill buttons, 8px spacing, `prefers-reduced-motion`, etc.) still apply in full — only the concrete color values below replace theirs.

---

## 1. Concept

**Warm Linen** — a daylight atelier. Cream paper, espresso ink, one dried-rose mark. AMONG exists because some things are easier to say when the room is quiet and no one is performing. The interface should feel like that room: soft, calm, unhurried, with exactly one warm point of color — the accent — reserved for the thing that matters most on a given screen.

This is a **deliberately committed light theme** — not a "light mode" toggle alongside a dark default. There is currently one visual world for AMONG. (A future dark companion theme, if built, should reuse the same structural rules and the **Afterhours** ink/ember direction rather than inventing a new language — see §8.)

**Design test:** does this screen feel like a quiet studio with afternoon light on paper, or does it feel like a dashboard? If it's the latter, it needs more restraint.

---

## 2. Color Tokens

All colors are CSS custom properties defined once in `frontend/src/app/globals.css` under `:root`, and exposed to Tailwind as semantic class names in `frontend/tailwind.config.ts`. **Components never reference a hex value directly** — always the token class (`bg-bg`, `text-text-muted`, `border-accent`, etc.).

Exceptions (documented, not freeform):

- `themeColor` in `layout.tsx` must be the literal hex of `--color-bg` (Next.js viewport API).
- Generated avatar SVGs fill with the hex values in the avatar palette table below (SVG strings cannot use CSS variables reliably). Those hexes must match this document.

| Role | Token (CSS var) | Tailwind class | Hex / value | Usage |
|---|---|---|---|---|
| Background | `--color-bg` | `bg-bg` | `#F5F0E8` | Dominant surface everywhere — cream paper |
| Surface (subtle) | `--color-bg-subtle` | `bg-bg-subtle` | `#EBE4D8` | Nested surfaces only: cards, inputs, nested panels |
| Text (primary) | `--color-text` | `text-text` | `#2A2622` | Body copy, headings, primary labels — espresso |
| Text (secondary) | `--color-text-secondary` | `text-text-secondary` | `#4F4A44` | Supporting copy, secondary lines |
| Text (muted) | `--color-text-muted` | `text-text-muted` | `#6F6960` | Captions, timestamps, aliases, placeholders (WCAG AA on cream) |
| Border | `--color-border` | `border-border` | `#E0D6C8` | Card outlines, dividers, input borders |
| Border (strong) | `--color-border-strong` | `border-border-strong` | `#C9B9A8` | Hover states, emphasized dividers, capsule edge |
| **Accent (dried rose)** | `--color-accent` | `text-accent` / `bg-accent` / `border-accent` | `#9B5360` | The single accent. Active nav, SAME, focus rings, links. Darkened from raw rose so it passes AA as text on cream — never use `#B76E79` for text |
| Accent (hover) | `--color-accent-hover` | `hover:bg-accent-hover` | `#8A4754` | Hover/active state of accent-colored elements |
| Accent (subtle) | `--color-accent-subtle` | `bg-accent-subtle` | `rgba(155, 83, 96, 0.12)` | Selected-state washes, focus ring halos — never a solid fill |
| Surface (glass) | `--color-surface-glass` | `bg-[var(--color-surface-glass)]` | `rgba(255, 252, 247, 0.80)` | **Floating/detached chrome only** — currently just the nav capsule. Frosted cream, not `--color-bg-subtle` reused at low alpha. Never used for content surfaces |
| Surface (glass, strong) | `--color-surface-glass-strong` | `bg-[var(--color-surface-glass-strong)]` | `rgba(255, 252, 247, 0.95)` | Same element once the page has scrolled — needs to stay legible over any content behind it |
| Capsule shadow | `--shadow-capsule` | `.shadow-capsule` | `0 6px 24px -8px rgba(42, 38, 34, 0.14)` | **Nav capsule only.** Soft espresso, not a black halo |

### Semantic (safety / system states)

Muted and desaturated by design — none of these should read as a saturated "alert" color. They exist for validation, banners, and status, never for decoration.

| Role | Token | Hex | Usage |
|---|---|---|---|
| Error | `--color-error` | `#C45C52` | Form validation failures, destructive confirmations |
| Warn | `--color-warn` | `#B8894A` | Non-blocking warnings (e.g. contact-info soft warning) |
| Ok | `--color-ok` | `#5F8F6A` | Success confirmations — **and the crisis resource banner** (see below) |
| Ok (wash) | `--color-ok-subtle` | `rgba(95, 143, 106, 0.12)` | Crisis banner background wash |
| Info | `--color-info` | `#6B7FA3` | Neutral informational states (e.g. conversation expiry notice) |

**Crisis resource banner rule:** the banner is never styled with `--color-error`. Per `CLAUDE.md` §6.4, it must read as warm and supportive, never as an alarm. It uses `--color-ok` on `--color-ok-subtle` with primary text color — see `.crisis-banner` in `globals.css`.

### The 20% rule

The dried-rose accent must appear on fewer than 20% of any screen's elements. It is a spotlight, not a paint bucket: the one thing that matters most (an active nav link, the SAME button when it's been pressed, the primary CTA, a focus ring) gets it. Everything else — secondary buttons, supporting UI, chrome — stays in espresso/border/muted tones.

### No gradients

Flat color only. No gradients on buttons, headers, avatars, backgrounds, or loading states, anywhere in the product.

### Contrast notes

- Espresso `#2A2622` on cream `#F5F0E8` is the primary reading pair.
- Muted `#6F6960` is the lightest caption tone that still meets WCAG AA (4.5:1) on cream.
- Accent `#9B5360` is usable as **text** on cream. The prettier unsullied rose `#B76E79` is **not** — do not use it.
- Text sitting on a solid accent fill uses cream (`text-bg` / `--color-bg`), not espresso.

---

## 3. Typography

| Role | Font | Loaded via | Fallback stack |
|---|---|---|---|
| Editorial (display/content) | **Fraunces** (italic for expressive moments) | `next/font/google` → `--font-editorial` | `Fraunces, Georgia, serif` |
| UI (chrome/body) | **Karla** | `next/font/google` → `--font-ui` | `Karla, system-ui, sans-serif` |
| Brand lockup | **Comfortaa** (medium, lowercase) | `next/font/google` → `--font-brand` | `Comfortaa, system-ui, sans-serif` |

Fraunces is used **only** where content deserves typographic weight: the landing hero, the primary daily experience card, the alias reveal, "You Are Not Alone" statements, category page H1s. Karla handles everything else — navigation, buttons, forms, secondary body copy, timestamps. Comfortaa is **only** for the `among` word next to the logo mark (`Logo.tsx`). Never mix the two within a single line of text.

### Type scale (`tailwind.config.ts` → `fontSize`)

| Token | Size | Line-height | Letter-spacing | Weight | Use |
|---|---|---|---|---|---|
| `text-display` | 80px | 1.05 | -0.03em | 400 | Landing hero, alias reveal |
| `text-headline` | 44px | 1.15 | -0.02em | 400 | Primary daily experience body |
| `text-title-xl` | 32px | 1.2 | -0.015em | 400 | Category page H1 |
| `text-title` | 24px | 1.3 | -0.01em | 500 | Section headings |
| `text-body-lg` | 18px | 1.7 | 0 | 400 | Post body, secondary content |
| `text-body` | 16px | 1.65 | 0 | 400 | Responses, descriptions |
| `text-ui` | 14px | 1.5 | 0.005em | 400 | UI labels, buttons, nav |
| `text-caption` | 12px | 1.4 | 0.01em | 400 | Counts, timestamps, aliases |

Reading width constraint: post body text never exceeds **65 characters per line** (`max-w-reading` / `.reading-column`).

---

## 4. Spacing & Layout

8px-base spacing scale (`tailwind.config.ts` → `spacing`), unchanged from the structural rules in the Implementation Plan §7B.4:

- Reading content: `max-w-2xl` (672px)
- Wider UI shells (Explore grid, admin tables): `max-w-shell` / `max-w-4xl` (896px)
- Journal back-cover / wide editorial chrome (footer): `max-w-spread` (72rem) via `.spread-column`
- Outer padding: `px-5` mobile / `px-8` tablet+
- Vertical rhythm: multiples of 8 only (`space-y-8`, `space-y-12`, `space-y-16`)
- No card grids for primary content — single column, editorial layout

---

## 5. Shape

| Element | Radius | Notes |
|---|---|---|
| Primary/secondary buttons | `rounded-pill` (9999px) | Always pill-shaped — the signature interactive shape |
| Cards / surfaces | `rounded-lg` (16px) | `border border-border`, **no drop shadow** — flat only |
| Inputs | `rounded-md` (10px) | Subtly distinct from cards |
| Avatars | `rounded-full` | Always circular |
| Tags / category chips | `rounded-pill` | Typographic only — border, no color fill |

> **`rounded-pill` vs `rounded-full` — do not confuse these.** In this project's `tailwind.config.ts`, `full` is deliberately mapped to `50%` ("avatar containers only" — a true circle/ellipse), while `pill` maps to the literal `9999px` value. `border-radius: 50%` on anything wider than it is tall renders as an **ellipse**, not a pill — this exact bug shipped in the first cut of the floating-capsule nav. Rule: any rectangular, pill-shaped element (buttons, tag chips, the nav capsule itself, sliding highlight indicators) must use `rounded-pill`. Only genuinely square elements meant to be perfect circles (avatars, icon-only buttons, small status dots) use `rounded-full`.

---

## 6. Motion

Tokens live in `globals.css` (`--duration-*`, `--ease-*`) and are surfaced as Tailwind `transitionDuration` / `animation` utilities. All animations wrap in `@media (prefers-reduced-motion: no-preference)`.

| Interaction | Duration |
|---|---|
| Button hover/press | 80–150ms |
| SAME activate / count update | 250ms |
| Route transition | 400ms |
| Modal open/close | 250ms / 150ms |
| Alias reveal + avatar draw | 400ms / 1200ms |

No spring/bounce physics, no confetti, no celebratory or streak-triggered animation, nothing longer than 600ms except the one-time alias-reveal draw.

---

## 7. Component Conventions

- **Primary CTA** (`.btn-primary`): solid `--color-accent` fill is reserved for the single most important action per screen when a rose spotlight is needed (e.g. mobile Compose). Most primary actions instead use the *inverted* pill — espresso fill (`--color-text`) on cream type (`--color-bg`) — since the accent itself must stay under the 20% ceiling.
- **Secondary/outline buttons** (`.btn-secondary`): `border-border`, transparent fill, inverts to solid espresso on hover.
- **SAME button**: pill, `border-border` at rest, `border-accent text-accent bg-accent-subtle` when active. No icon — the word is the action.
- **Cards**: no shadows, ever. Separation comes from `border-border` or a left rule (`border-l-2`), never elevation.
- **Text on accent fills**: always cream (`text-bg`), never espresso and never raw white.

### Navigation — "Floating Capsule" (locked pattern)

The primary nav is a detached, floating pill — not an edge-to-edge bar. This is the one piece of chrome in the product allowed a shadow and a blurred glass surface, because it is a physically separate, elevated object, not page content.

- **Shape**: `rounded-pill` capsule, inset from the viewport edge, `sticky top-4` (desktop) / `fixed bottom-4` (mobile), centered.
- **Surface**: `--color-surface-glass` + `backdrop-blur` at rest, swapping to `--color-surface-glass-strong` and slightly tighter padding once the page has scrolled (`isScrolled` state, threshold ~12px). This is the **only** place `box-shadow` is used outside form controls — `.shadow-capsule`, kept tight, so the pill's own edge (border in `--color-border-strong`) defines the shape rather than the shadow's blur.
- **Layout**: three columns — brand lockup left, primary links (`Home`, `Explore`, `Conversations`, `You`) truly centered in the capsule, actions (notifications / Share / Log out) right. Grid: `grid-cols-[1fr_auto_1fr]`.
- **Brand mark**: the capsule shows `Logo` — `/Among_Logo.png` with lowercase Comfortaa `among` to its right (`BRAND_LOGO.NAV_HEIGHT_PX`). Never inline the image path or the wordmark string.
- **Active/hover indicator**: a single pill (`bg-accent-subtle border border-accent`) that physically slides and resizes (via measured `left`/`width`, `transition: 300ms cubic-bezier(.4,0,.2,1)`) to whichever link is hovered, and eases back to the active route on mouse-leave. This is the one recurring rose element in the nav — everything else in the capsule (logo, links, Compose outline pill) stays neutral to hold the 20% accent ceiling.
- **Compose (desktop)**: `.btn-secondary` (outline pill, inverts to solid espresso on hover) — the only other emphasized element, but still not accent-colored.
- **Mobile**: same floating capsule shape, moved to `fixed bottom-4`, collapsed to icon-only buttons plus a filled rose circle for Compose (the one place a solid accent fill is used, since it's the single most important action in that cramped layout). Icon color on that fill is cream (`text-bg`).

### Footer — "Letter / Typesetter" (locked pattern)

The footer is the end of a letter, set like a printer's strip — not a sitemap, and not a journal back-cover spread. It uses `.spread-column` (`max-w-spread`) so the P.S. field can breathe.

- **Structure**: generous air above a hairline (`border-t`). Then a short Fraunces italic letter (`text-title`) and the AMONG lockup as the signature (`Logo` at `BRAND_LOGO.FOOTER_HEIGHT_PX` — mark, then Comfortaa `among` to its right). Then a **P.S.** field: the label and rose lamp on their own row; every experience category as a wrapping constellation of italic names (`font-editorial italic text-body`, generous `gap-x-8`, no commas, no chips), indented with `border-l-2 border-border` like a postscript in the margin. A second hairline. A tiny right-aligned stamp: platform + legal links + copyright, all `text-caption`.
- **Accent**: one 6px rose dot after `P.S.` — the lamp. Links stay secondary text; hover shifts to primary text, not accent (holds the 20% ceiling).
- **No card, no numbered contents, no comma ticker, no colorful chips, no icon set.**
- **Brand mark**: `Logo` (`frontend/src/components/layout/Logo.tsx`) — the same shared component the nav uses. Never duplicate the `<Image>` inline; import it.
- **Copy and labels**: `frontend/src/constants/footer.ts`. No inline user-facing strings in the component.
- **One shared component, everywhere.** `Footer.tsx` is the only footer in the product. No page — including the landing page — renders its own inline `<footer>`. If a page needs different visibility, use `AppShell`'s `showFooter` prop, never a hand-rolled substitute.

### Landing hero

Full-viewport height. Centered. Cream linen — not pure white. Single large `font-editorial` H1. No image. The primary CTA is the inverted espresso pill (`.btn-primary`), not a rose fill.

### Alias reveal

The one non-linen surface in the product: a full-screen dark overlay. Alias name in `font-editorial text-display` on white. This overlay is a ceremony, not a second theme — it dismisses back to cream.

### Avatars

Abstract geometric SVGs only. Fills from the warm-neutral palette below + optional 6px rose accent dot. Never faces, silhouettes, or rainbow palettes. Deterministic per alias seed.

| Role | Hex | Matches token |
|---|---|---|
| Light fill | `#E0D6C8` | `--color-border` |
| Mid fill | `#C9B9A8` | `--color-border-strong` |
| Dark fill | `#6F6960` | `--color-text-muted` |
| Ink fill | `#4F4A44` | `--color-text-secondary` |
| Accent dot | `#9B5360` | `--color-accent` |

The boolean field `hasIndigoDot` is a historical name in avatar data — it means "has accent dot." Do not introduce a second accent color.

---

## 8. Future: Dark Companion Theme

If a dark mode is ever introduced, do not invent a new palette from scratch. Reuse the **Afterhours** direction previously explored: deep ink (`#15161C`) with a warm ember accent (`#E3A64F`), Fraunces + Karla. It shares Warm Linen's quiet, unhurried register and was designed as a compatible pair, not a rejected alternative. Do not revive Quiet Paper, Porcelain, Mist, or Dawn Glass as competing light themes.

---

## 9. Where This Lives in Code

- `frontend/src/app/globals.css` — all CSS custom properties (`:root`), base resets, keyframes, and shared utility classes (`.btn-primary`, `.shadow-capsule`, `.crisis-banner`, etc.).
- `frontend/tailwind.config.ts` — Tailwind theme extension mapping token names to the CSS variables above. Never add a raw hex value here.
- `frontend/src/app/layout.tsx` — `next/font/google` loading of Fraunces (`--font-editorial`), Karla (`--font-ui`), and Comfortaa (`--font-brand`). `themeColor` is `#F5F0E8`.
- `frontend/src/constants/design.ts` — Tailwind class-name constants for components that must not inline token class strings.

Any new component must be built entirely from these token classes. If a design need isn't covered by an existing token, extend this document and the CSS variables together, in the same commit — never invent a one-off value inline.
