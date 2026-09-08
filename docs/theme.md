# AMONG — Visual Theme: "Afterhours"

> **Status: locked.** This is the single source of truth for color, type, spacing, shape, and motion across the AMONG product. Every component redesign from this point forward — new or rebuilt — must be built exclusively from the tokens documented here. No ad hoc hex values, no inline styles, no one-off font sizes. If a value you need isn't in this document, add it here first, then use it.
>
> This supersedes the light/indigo palette described in `CLAUDE.md` §7–8 and the Implementation Plan §7B. Those sections' *structural* rules (no gradients, single accent used sparingly, no card grids, pill buttons, 8px spacing, `prefers-reduced-motion`, etc.) still apply in full — only the concrete color values and font families below replace theirs.

---

## 1. Concept

**Afterhours** — the confession booth at midnight. Warm lamplight against deep ink. AMONG exists because some things are easier to say when it's late, you're alone, and no one can see your face. The interface should feel like that hour: dark, quiet, unhurried, with exactly one warm point of light — the accent — reserved for the thing that matters most on a given screen.

This is a **deliberately committed dark theme** — not a "dark mode" toggle alongside a light default. There is currently one visual world for AMONG. (A future light companion theme, if built, should reuse the same structural rules and a warm-neutral/forest-ink palette rather than inventing a new language — see §8.)

**Design test:** does this screen feel like a quiet room with one lamp on, or does it feel like a dashboard? If it's the latter, it needs more restraint.

---

## 2. Color Tokens

All colors are CSS custom properties defined once in `frontend/src/app/globals.css` under `:root`, and exposed to Tailwind as semantic class names in `frontend/tailwind.config.ts`. **Components never reference a hex value directly** — always the token class (`bg-bg`, `text-text-muted`, `border-accent`, etc.).

| Role | Token (CSS var) | Tailwind class | Hex / value | Usage |
|---|---|---|---|---|
| Background | `--color-bg` | `bg-bg` | `#15161C` | Dominant surface everywhere — the page itself |
| Surface (subtle) | `--color-bg-subtle` | `bg-bg-subtle` | `#1D1F27` | Nested surfaces only: cards, inputs, nav bar, modals |
| Text (primary) | `--color-text` | `text-text` | `#EDE9E2` | Body copy, headings, primary labels |
| Text (secondary) | `--color-text-secondary` | `text-text-secondary` | `#B7B4AE` | Supporting copy, secondary lines |
| Text (muted) | `--color-text-muted` | `text-text-muted` | `#9B9AA3` | Captions, timestamps, aliases, placeholders |
| Border | `--color-border` | `border-border` | `#2C2F3A` | Card outlines, dividers, input borders |
| Border (strong) | `--color-border-strong` | `border-border-strong` | `#3B3E4C` | Hover states, emphasized dividers |
| **Accent (ember)** | `--color-accent` | `text-accent` / `bg-accent` / `border-accent` | `#E3A64F` | The single accent. Primary CTAs, active nav item, SAME button, focus rings, links |
| Accent (hover) | `--color-accent-hover` | `hover:bg-accent-hover` | `#EEB768` | Hover/active state of accent-colored elements |
| Accent (subtle) | `--color-accent-subtle` | `bg-accent-subtle` | `rgba(227,166,79,0.14)` | Selected-state washes, focus ring halos — never a solid fill |
| Surface (glass) | `--color-surface-glass` | `bg-[var(--color-surface-glass)]` | `rgba(38,41,51,0.82)` | **Floating/detached chrome only** — currently just the nav capsule. Deliberately lighter than `--color-bg-subtle`, not that token reused at low alpha — a glass surface sitting on a background of nearly the same hue is invisible except for its shadow, which reads as a vague blob instead of a defined edge. Never used for content surfaces |
| Surface (glass, strong) | `--color-surface-glass-strong` | `bg-[var(--color-surface-glass-strong)]` | `rgba(42,45,56,0.94)` | Same element once the page has scrolled — needs to stay legible over any content behind it |

### Semantic (safety / system states)

Muted and desaturated by design — none of these should read as a saturated "alert" color. They exist for validation, banners, and status, never for decoration.

| Role | Token | Hex | Usage |
|---|---|---|---|
| Error | `--color-error` | `#E0645A` | Form validation failures, destructive confirmations |
| Warn | `--color-warn` | `#C08A3E` | Non-blocking warnings (e.g. contact-info soft warning) |
| Ok | `--color-ok` | `#5FA671` | Success confirmations — **and the crisis resource banner** (see below) |
| Info | `--color-info` | `#6C8FC7` | Neutral informational states (e.g. conversation expiry notice) |

**Crisis resource banner rule:** the banner is never styled with `--color-error`. Per `CLAUDE.md` §6.4, it must read as warm and supportive, never as an alarm. It uses `--color-ok` on a soft wash (`rgba(95,166,113,0.10)`) with primary text color — see `.crisis-banner` in `globals.css`.

### The 20% rule

The ember accent must appear on fewer than 20% of any screen's elements. It is a spotlight, not a paint bucket: the one thing that matters most (an active nav link, the SAME button when it's been pressed, the primary CTA, a focus ring) gets it. Everything else — secondary buttons, supporting UI, chrome — stays in text/border/muted tones.

### No gradients

Flat color only. No gradients on buttons, headers, avatars, backgrounds, or loading states, anywhere in the product.

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

- **Primary CTA** (`.btn-primary`): solid `--color-accent` fill is reserved for the single most important action per screen (e.g. "Enter Among →"). Most primary actions instead use the *inverted* pill — light fill (`--color-text`) on the dark page, dark text — since the accent itself must stay under the 20% ceiling.
- **Secondary/outline buttons** (`.btn-secondary`): `border-border`, transparent fill, inverts to solid on hover.
- **SAME button**: pill, `border-border` at rest, `border-accent text-accent bg-accent-subtle` when active. No icon — the word is the action.
- **Cards**: no shadows, ever. Separation comes from `border-border` or a left rule (`border-l-2`), never elevation.

### Navigation — "Floating Capsule" (locked pattern)

The primary nav is a detached, floating pill — not an edge-to-edge bar. This is the one piece of chrome in the product allowed a shadow and a blurred glass surface, because it is a physically separate, elevated object, not page content.

- **Shape**: `rounded-full` capsule, inset from the viewport edge, `sticky top-4` (desktop) / `fixed bottom-4` (mobile), centered, `max-w-[720px]`.
- **Surface**: `--color-surface-glass` + `backdrop-blur` at rest, swapping to `--color-surface-glass-strong` and slightly tighter padding once the page has scrolled (`isScrolled` state, threshold ~12px). This is the **only** place `box-shadow` is used outside form controls — kept tight (`0 6px 20px -6px`), not a wide halo, so the pill's own edge (border in `--color-border-strong`, not the default `--color-border`) defines the shape rather than the shadow's blur.
- **Layout**: three columns — brand lockup left, primary links (`Home`, `Explore`, `Conversations`, `You`) truly centered in the capsule, actions (notifications / Share / Log out) right. Grid: `grid-cols-[1fr_auto_1fr]`.
- **Brand mark**: the capsule shows `Logo` — `/Among_Logo.png` with lowercase Comfortaa `among` to its right (`BRAND_LOGO.NAV_HEIGHT_PX`). Never inline the image path or the wordmark string.
- **Active/hover indicator**: a single pill (`bg-accent-subtle border border-accent`) that physically slides and resizes (via measured `left`/`width`, `transition: 300ms cubic-bezier(.4,0,.2,1)`) to whichever link is hovered, and eases back to the active route on mouse-leave. This is the one recurring "ember" element in the nav — everything else in the capsule (logo, links, Compose outline pill) stays neutral to hold the 20% accent ceiling.
- **Compose**: `.btn-secondary` (outline pill, inverts to solid on hover) — the only other emphasized element, but still not accent-colored.
- **Mobile**: same floating capsule shape, moved to `fixed bottom-4`, collapsed to icon-only buttons plus a filled ember circle for Compose (the one place a solid accent fill is used, since it's the single most important action in that cramped layout).

### Footer — "Letter / Typesetter" (locked pattern)

The footer is the end of a letter, set like a printer's strip — not a sitemap, and not a journal back-cover spread. It uses `.spread-column` (`max-w-spread`) so the P.S. field can breathe.

- **Structure**: generous air above a hairline (`border-t`). Then a short Fraunces italic letter (`text-title`) and the AMONG lockup as the signature (`Logo` at `BRAND_LOGO.FOOTER_HEIGHT_PX` — mark, then Comfortaa `among` to its right). Then a **P.S.** field: the label and ember dot on their own row; every experience category as a wrapping constellation of italic names (`font-editorial italic text-body`, generous `gap-x-8`, no commas, no chips), indented with `border-l-2 border-border` like a postscript in the margin. A second hairline. A tiny right-aligned stamp: platform + legal links + copyright, all `text-caption`.
- **Accent**: one 6px ember dot after `P.S.` — the lamp. Links stay secondary text; hover shifts to primary text, not accent (holds the 20% ceiling).
- **No card, no numbered contents, no comma ticker, no colorful chips, no icon set.**
- **Brand mark**: `Logo` (`frontend/src/components/layout/Logo.tsx`) — the same shared component the nav uses. Never duplicate the `<Image>` inline; import it.
- **Copy and labels**: `frontend/src/constants/footer.ts`. No inline user-facing strings in the component.
- **One shared component, everywhere.** `Footer.tsx` is the only footer in the product. No page — including the landing page — renders its own inline `<footer>`. If a page needs different visibility, use `AppShell`'s `showFooter` prop, never a hand-rolled substitute.

---

## 8. Future: Light Companion Theme

If a light mode is ever introduced, do not invent a new palette from scratch. Reuse the **Quiet Paper** direction explored alongside Afterhours: stone-sage paper (`#EDEFE9`) with a forest-ink accent (`#2F5D50`), Newsreader + IBM Plex Sans. It shares Afterhours' quiet, unhurried register and was designed as a compatible pair, not a rejected alternative.

---

## 9. Where This Lives in Code

- `frontend/src/app/globals.css` — all CSS custom properties (`:root`), base resets, keyframes, and shared utility classes (`.btn-primary`, `.same-pill` equivalents, `.crisis-banner`, etc.).
- `frontend/tailwind.config.ts` — Tailwind theme extension mapping token names to the CSS variables above. Never add a raw hex value here.
- `frontend/src/app/layout.tsx` — `next/font/google` loading of Fraunces (`--font-editorial`), Karla (`--font-ui`), and Comfortaa (`--font-brand`).

Any new component must be built entirely from these token classes. If a design need isn't covered by an existing token, extend this document and the CSS variables together, in the same commit — never invent a one-off value inline.
