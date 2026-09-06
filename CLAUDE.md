# AMONG — Developer Reference (CLAUDE.md)

> This file is the **always-on developer rulebook** for the AMONG project. Every rule here applies to every file, every commit, and every feature — regardless of phase or scope. Read this before writing any code. Re-read it when in doubt.

---

## 1. What Is AMONG?

AMONG is an **anonymous human-experience network** — not a better Reddit, not a confession app, not a social network. It is a platform organized around shared lived experiences, temporary identity, and meaningful human connection without social-performance pressure.

**Core product promise:** *"You're not the only one."*

**The single question the product must answer better than any other platform:**
> "Who else has lived what I'm living?"

**North-star metric:** Weekly Meaningful Connections (WMC) — not session duration, not pageviews, not raw engagement.

---

## 2. Product Principles (Engineering Must Honour These)

Every technical decision should be evaluated against these principles:

| Principle | What it means for code |
|---|---|
| **Experience over identity** | Never build features that accumulate public reputation or status |
| **Anonymity without unaccountability** | Users are anonymous to each other, accountable to the platform — enforce this at every data boundary |
| **Relatability over popularity** | Ranking must never use raw like/reaction counts as the primary signal |
| **Finite participation** | Do not build infinite scroll, streak mechanics, or engagement loops |
| **Temporary connection** | Conversations expire; no persistent follower relationships, ever |
| **Safety is foundational** | Moderation, reporting, blocking, and crisis handling are core features — never optional post-MVP polish |
| **Human-to-human value** | The core value proposition must not depend on AI content generation |

---

## 3. Technology Stack (Non-Negotiable)

| Layer | Technology |
|---|---|
| Frontend framework | Next.js (App Router) |
| UI components | shadcn/ui |
| Styling | Tailwind CSS |
| Icons | lucide-react only |
| State management | Redux Toolkit |
| Schema validation | Zod (frontend and backend, shared schemas) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | Firebase Authentication + Google Sign-In |
| Real-time | Socket.IO |
| Caching / rate limiting | Redis |
| Job scheduling | Agenda (MongoDB-backed) |
| Language | TypeScript (strict mode, full-stack) |

Do not introduce alternative libraries for any of these layers without an explicit decision. Do not mix patterns (e.g., do not use Fetch directly in a component that already has an API client).

---

## 4. Repository Structure (Top-Level)

```
/docs        → All documentation (PRD, implementation plan, API, database, security, deployment)
/backend     → Complete server-side application (Node.js + Express)
/frontend    → Complete Next.js application
/shared      → Constants, schemas, and types shared between frontend and backend
```

There is no fourth top-level directory. All code lives under one of these four.

---

## 5. Absolute Code Rules

### 5.1 File Size

- **Hard maximum: 1,000 lines per file.** This is a ceiling, not a target.
- **Practical target: 600–700 lines.** Proactively split any file approaching 700 lines.
- This rule applies to source files, test files, config files, and constants files equally.
- If a module is getting large, split by responsibility — not arbitrarily.

### 5.2 No Hardcoded Constants — Ever

**Never** inline any of the following values directly in a component, service, controller, hook, or utility. All must be imported from `shared/constants/` or a centralized config file.

**Prohibited categories of inline values:**

- Colors, hex codes, color names
- Typography values, font families, font sizes
- Spacing values used as design decisions
- API base URLs and endpoint paths
- Frontend route strings (page paths)
- Feature flag names or default values
- Experience category IDs, slugs, or display names
- Reaction type IDs or labels
- User role names
- Subscription tier names
- Conversation state values
- Post state values
- Report reason values
- Enforcement action values
- Crisis resource links or texts
- Rate limit numbers (daily caps, request caps)
- Timeout durations (inactivity expiry, edit window, match expiry)
- Validation limits (min/max characters, min/max categories)
- Error message strings
- Error code strings
- User-facing UI label strings
- Status strings
- Socket event names
- Notification type strings
- Any numeric limit that appears in business logic

**There is no `/shared` folder. Only `/docs`, `/backend`, `/frontend` exist at the root.**

Constants live inside the project that uses them. When the same constant is needed in both backend and frontend it is defined in both files — intentional duplication, always updated together in one commit.

**Where constants live:**

| Constant type | Backend | Frontend | Notes |
|---|---|---|---|
| Experience categories | `backend/src/constants/experienceCategories.ts` | `frontend/src/constants/experienceCategories.ts` | Mirrored — keep in sync |
| Reaction types | `backend/src/constants/reactionTypes.ts` | `frontend/src/constants/reactionTypes.ts` | Mirrored |
| Conversation states | `backend/src/constants/conversationStates.ts` | `frontend/src/constants/conversationStates.ts` | Mirrored |
| Post states | `backend/src/constants/postStates.ts` | `frontend/src/constants/postStates.ts` | Mirrored |
| Limits | `backend/src/constants/limits.ts` | `frontend/src/constants/limits.ts` | Mirrored |
| Error codes | `backend/src/constants/errorCodes.ts` | `frontend/src/constants/errorCodes.ts` | Mirrored |
| Socket event names | `backend/src/constants/socketEvents.ts` | `frontend/src/constants/socketEvents.ts` | Mirrored |
| Feature flags | `backend/src/constants/featureFlags.ts` | `frontend/src/constants/featureFlags.ts` | Mirrored |
| User roles | `backend/src/constants/userRoles.ts` | — | Backend only |
| Subscription tiers | `backend/src/constants/subscriptionTiers.ts` | — | Backend only |
| Timeouts | `backend/src/constants/timeouts.ts` | — | Backend only |
| Report reasons | `backend/src/constants/reportReasons.ts` | — | Backend only |
| Crisis resources | `backend/src/constants/crisisResources.ts` | — | Backend only |
| Content/crisis patterns | `backend/src/constants/contentPatterns.ts` | — | Backend only |
| Page routes | — | `frontend/src/constants/routes.ts` | Frontend only |
| API endpoint paths | — | `frontend/src/constants/apiEndpoints.ts` | Frontend only |
| Design token names | — | `frontend/src/constants/design.ts` | Frontend only |
| Color/spacing/font tokens | — | `tailwind.config.ts` + `globals.css` | Frontend only |

**Sync rule:** Any change to a mirrored constant must update both files in the same commit. Each mirrored file starts with: `// MIRRORED — keep in sync with [backend|frontend]/src/constants/<file>.ts`

### 5.3 TypeScript Strict Mode

- `strict: true` in all `tsconfig.json` files.
- No `any` types. Use proper types or `unknown` with type guards.
- No non-null assertions (`!`) on values that can genuinely be null — handle the null case explicitly.
- All function return types explicitly declared for exported functions.

### 5.4 Module Boundaries

- No circular dependencies between modules.
- Cross-module access goes through the module's exported service/interface, never by importing internal model files directly from another module.
- External service adapters (Firebase, Redis, email provider) are always wrapped behind a service abstraction — product code never calls the SDK directly.

---

## 6. Privacy & Safety Rules (First-Class, Always)

These rules are absolute. They are never "post-MVP." They apply to every endpoint, every API response, and every UI component from day one.

### 6.1 Identity boundaries

- A user's `firebaseUid`, `email`, and internal MongoDB `_id` (as `authorAccountId`) are **never** included in any public API response.
- The only public identity surface is the temporary alias name and avatar data (geometric, abstract, deterministic per alias).
- No "view this alias's posts" public profile page exists anywhere in the app.
- Alias search as a primary discovery mechanism does not exist.
- Block and enforcement are always tied to the **private account ID**, not the alias. Alias rotation never resets a block or restriction.

### 6.2 Aggregate counts and privacy threshold

- Individual reaction identities are **never** exposed — not to the post author, not to other users.
- All reaction data is shown as aggregate counts only.
- "You Are Not Alone" segmented stats are only shown when the underlying group size exceeds **100 users** (`PRIVACY_THRESHOLD_MIN_GROUP_SIZE`). Below this threshold, display `"< 100"` or `"Not enough data"` — never the exact count.

### 6.3 Messaging privacy

- Message content is never included in push notification payloads or email subjects.
- Lock-screen/notification preview text is always generic: `"You have a new message on AMONG"` — never message content or the other party's alias.
- Sender's `accountId` is never included in message API responses — only the alias snapshot.
- No read receipts (prevents presence inference).

### 6.4 Crisis detection — non-negotiable behavior

- Crisis resource surfacing fires **immediately and unconditionally** when crisis patterns are detected.
- It is never delayed, batched, or suppressed pending human moderation review.
- The function must never throw — it must always return a safe result.
- Crisis resources are defined in `shared/constants/crisisResources.ts` — never hardcoded in the service.

### 6.5 Content scanning — pre-publish

- Every post goes through automated content scanning before it becomes visible.
- `hasCriticalViolations: true` → block publish.
- `hasWarnings: true` → show safety reminder, do not block.
- Crisis detection runs in parallel — post is still created, but `crisisDetected: true` is returned so the UI can surface resources.

### 6.6 Report privacy

- The reporting user's identity is never exposed to the moderator beyond what is operationally necessary.
- Report outcomes are never communicated back to the reporter (prevents harassment via report-watching).
- Always return `{ success: true }` on report submission, regardless of outcome.

### 6.7 Data export and deletion

- Data export produces: user's own posts, reactions, saved items, and experience history — no other users' data.
- Account deletion self-service must exist. Deletion sets `deletedAt` (soft delete) and schedules full anonymization.
- Experience graph is fully deletable and exportable by the user on request.

---

## 7. Creative UI/UX Direction — The AMONG Look & Feel

AMONG must never look like a social app, a SaaS product, a template, or an AI-generated UI. It must look and feel like a beautiful, handcrafted literary corner of the internet.

**The single design test:** Does this surface feel like it belongs in a thoughtfully designed literary journal, a premium editorial publication, or a quietly sophisticated indie product? If it resembles a typical social feed, a Figma template, or a shadcn default — it needs more design work.

### 7.1 The Fundamental Design Principles

| Principle | What it means in practice |
|---|---|
| **Words are the UI** | The user's text is always the most visually prominent element. Chrome (nav, buttons, metadata) is invisible by comparison |
| **Earned color** | The indigo accent appears on fewer than 20% of any screen's elements. When everything is accented, nothing is. The accent is a spotlight |
| **No card grids** | All primary content is single-column, editorial width (`max-w-2xl`). No card grids for main content |
| **Typographic hierarchy** | Hierarchy is communicated through type size and weight — not through color, borders, or backgrounds |
| **Quiet intimacy** | The feeling is closer to reading a letter someone wrote than scrolling a feed |

### 7.2 What Is Explicitly Forbidden in the UI

- ❌ Gradients anywhere (buttons, headers, avatars, backgrounds, loading states)
- ❌ Card grids for primary content
- ❌ Colorful category/tag chips
- ❌ Heart or thumbs-up icons for the SAME reaction — the word "SAME" is the button
- ❌ Left/right chat-bubble style for conversations — use indented paragraph style
- ❌ Illustrated mascots, characters, or playful graphics in empty or loading states
- ❌ Drop shadows on cards — cards use a single `1px border-border` only
- ❌ Bouncy, springy, or celebratory animations
- ❌ Confetti, fireworks, particle effects, or streak visuals
- ❌ Progress bars, achievement rings, karma counters, or any gamification visual
- ❌ Stock photography or hero images
- ❌ Multiple accent colors — single indigo, that's it
- ❌ Modal-based safety reminders during compose — use a marginal-note style instead

### 7.3 Signature Design Patterns

**Primary experience card (home feed):**
- No card border. No card background. The post text IS the page.
- Body text in `font-editorial text-headline` — reading weight, editorial scale.
- Author alias is the smallest text on the screen (bottom, `text-caption text-text-muted`).

**SAME button:**
- A borderless pill with the word `"SAME"` + count. On activation: `border-accent text-accent bg-accent-subtle`. No icon.

**Compose flow:**
- Borderless text area on white — feels like a blank notebook page.
- Safety reminder appears as a `text-caption italic text-text-muted` marginal note, not a modal.
- Character count only visible when within 200 chars of the limit.

**Conversation thread:**
- Own messages: full-width text, no bubble.
- Other party's messages: `pl-5 border-l-2 border-border` indented block quote style.
- Alias shown once per message group, not on every message.

**Landing page hero:**
- Full-viewport height. Centered. Pure white.
- Single large `font-editorial text-display` H1. No image.
- Only one CTA: `"Enter Among →"` — deep black pill button, white text.

**Alias reveal:**
- Full-screen dark overlay (the only non-white background in the product).
- Alias name in `font-editorial text-display text-white`. Avatar SVG draws itself.
- Dismissed by a single white pill button: `"Begin →"`.

**Empty states:**
- Typographic only. Maintain the product's emotional voice.
- Example: *"Nothing new today. Come back tomorrow — the pool refreshes."*
- Font: `font-editorial text-title text-text-muted`.

**Navigation:**
- Desktop: text-only link list (`font-ui text-ui`). Active link: `font-medium text-text` (weight only, no color).
- Mobile: bottom bar with thin-stroke lucide-react icons (`stroke-width={1.5}`).
- Compose button: the single visually emphasized element in nav — inverted pill.

### 7.4 Typography Tokens (Quick Reference)

| Token | Size | Font | Use |
|---|---|---|---|
| `text-display` | 80px | editorial serif | Landing hero, alias reveal |
| `text-headline` | 44px | editorial serif | Primary experience card body |
| `text-title-xl` | 32px | editorial serif | Category page H1 |
| `text-title` | 24px | editorial serif | Section headings, SNY prompt |
| `text-body-lg` | 18px | UI sans | Post body, secondary content |
| `text-body` | 16px | UI sans | Responses, descriptions |
| `text-ui` | 14px | UI sans | All UI labels, buttons, nav |
| `text-caption` | 12px | UI sans | Counts, timestamps, metadata, aliases |

### 7.5 Avatar System

- Abstract geometric SVGs only (circles, rectangles, triangles, diagonal forms).
- Colors: grays from the border palette + optional 6px indigo dot.
- Never: faces, silhouettes, people, age/gender suggestions.
- Deterministic: same alias seed → same avatar. Alias rotation → new seed → new avatar.
- Sizes: `sm`=24px (inline), `md`=40px (cards), `lg`=96px (reveal).

### 7.6 Motion Rules (Quick Reference)

| Use | Duration | Easing |
|---|---|---|
| Button hover/press | 80–150ms | `ease-standard` |
| SAME activate, reaction count update | 250ms | `ease-out` |
| Route transitions | 400ms | `ease-out` |
| Modal open/close | 250ms / 150ms | `ease-standard` |
| Landing word stagger | 600ms + 150ms stagger | `ease-out` |
| Alias reveal + avatar draw | 400ms / 1200ms | custom |

All animations respect `prefers-reduced-motion`. All keyframes live in `globals.css`. No inline keyframes.

## 8. Design System Rules (Technical)

### 8.1 Color system — strict constraints

| Token | Value | Usage |
|---|---|---|
| Background | `#FFFFFF` pure white | Dominant surface everywhere |
| Primary text | `#1A1A1A`–`#111111` | Body text, headings |
| Muted text | Defined in CSS vars | Secondary text |
| Border / divider | `#E5E5E5`–`#EDEDED` | Card borders, input borders, dividers |
| Accent (single) | `#4F46E5`–`#4338CA` indigo | Primary buttons, active states, links, SAME highlight, focus rings |
| Semantic (error/warning/success) | Muted, desaturated tones | Form validation, safety states — never saturated "alert red/green" |

**Absolute prohibitions on color:**
- ❌ No gradients, anywhere — not on buttons, not on hero sections, not on avatars, not on loading states.
- ❌ No secondary or tertiary accent colors.
- ❌ No multi-color category tagging. Categories are distinguished by label/typography only.
- ❌ No rainbow avatar palettes. Avatars use indigo accent + neutral grays only.
- ❌ No off-white, tinted, or colored backgrounds. Pure white only.

### 8.2 Typography

- Editorial/serif typeface: for hero headlines, the featured daily experience, "You Are Not Alone" statements.
- Clean sans-serif: for all UI chrome, body copy, buttons, forms.
- Heading scale: generous, editorial — not a dense social-app UI scale.
- Heading semantics are always correct HTML (`h1`→`h2`→`h3`) regardless of visual scale. Visual size is CSS only.

### 8.3 Shape language

- Rounded corners: consistent radius scale from design tokens — never ad hoc per-component values.
- **Pill-shaped buttons** (fully rounded ends) for all primary and secondary actions — applied consistently site-wide, never mixed with square buttons.
- Icons: thin-stroke, single-color (charcoal or indigo), never multi-color, never decorative.

### 8.4 Spacing

- 8px-base spacing system. All spacing values use the design token scale, not arbitrary pixel values.

### 8.5 Avatars

- Geometric / abstract forms only.
- Never illustrated faces, silhouettes, or anything suggesting age, gender, or ethnicity.
- Deterministic per alias seed (same alias = same avatar). Alias rotation changes the seed and therefore the avatar.

### 8.6 Motion & micro-interactions

- Subtle only: gentle hover/press states (soft scale or opacity shift), calm count-update transitions.
- ❌ No bouncy, playful, or celebratory animations.
- ❌ No confetti on reactions or posting.
- ❌ No streak-pressure animations or urgency-creating motion.
- ❌ No illustrated mascots or playful graphics in loading or empty states.
- All keyframe definitions live in `globals.css`. No inline keyframes in component files.
- All animations wrap in `@media (prefers-reduced-motion: no-preference)`.

### 8.7 Layout feel

- Spacious, editorial. Generous whitespace. Content breathes.
- The primary daily experience is presented with the visual weight of a single editorial feature — not a compact feed card.
- Explicitly NOT a dense, card-grid, colorful social-feed layout.
- Design review checklist: **quiet, human, intimate, sophisticated, slightly mysterious**.
- Reading column max-width: `max-w-2xl` (672px) for all post/reading content.

---

## 9. SEO Requirements (All Are Strict — Non-Negotiable)

SEO is an engineering requirement, not a launch-day polish item. Every page ships satisfying these before it goes live.

### 9.1 Technical foundations

| Rule | Requirement |
|---|---|
| **FR-SEO-1** | Every public page must be server-rendered or pre-rendered (SSR/ISR). No client-side-only rendered blank shells for crawlable pages. |
| **FR-SEO-2** | Every indexable page has a unique `<title>` (50–60 chars) and unique `<meta description>` (140–160 chars). No two pages share identical values. No placeholder defaults. |
| **FR-SEO-3** | Every page declares exactly one `<link rel="canonical">` pointing to its canonical URL. |
| **FR-SEO-4** | URLs are human-readable, lowercase, hyphen-separated, stable. No exposed raw IDs alone. No query-string-only addressing for primary content. Examples: `/explore/loneliness`, `/experiences/career-uncertainty`. |
| **FR-SEO-5** | A `sitemap.xml` is generated and kept current. It lists all indexable evergreen pages: landing, all category pages, static/marketing pages. |
| **FR-SEO-6** | `robots.txt` explicitly **allows** public evergreen pages and explicitly **disallows**: `/settings`, `/conversations`, `/compose`, `/account`, `/admin`, `/home`, `/saved`, `/you-are-not-alone`, `/someone-needs-you`. Nothing behind the auth boundary is ever crawlable. |
| **FR-SEO-7** | Structured data (schema.org JSON-LD) is implemented: `Organization` + `WebSite` on homepage; `BreadcrumbList` on category and nested pages; `FAQPage` on help pages if they exist. |
| **FR-SEO-8** | Open Graph and Twitter Card meta tags on every shareable public page. **No personally-identifying content** ever included in OG/TC previews. |
| **FR-SEO-9** | Core Web Vitals are SEO requirements: LCP < 2.5s, CLS < 0.1, INP < 200ms. Measured via Lighthouse CI in the pipeline. |
| **FR-SEO-10** | All images have descriptive `alt` text. (Also serves accessibility.) |

### 9.2 Heading structure

| Rule | Requirement |
|---|---|
| **FR-SEO-11** | Every page has exactly **one `<h1>`** matching the page's primary topic. Never use the brand name as the `<h1>` on every page. |
| **FR-SEO-12** | Headings descend in strict logical order: H1 → H2 → H3. No skipped levels. Heading tags are never used for visual styling — use CSS for that. |
| **FR-SEO-13** | Longer pages (category pages, help pages) have each major subsection under its own appropriately-nested heading. |

### 9.3 Internal linking — no dead ends

| Rule | Requirement |
|---|---|
| **FR-SEO-14** | **No indexable page is a dead end.** Every indexable page must contain at least one forward internal link to another indexable page. |
| **FR-SEO-15** | A global site-wide footer (links to About, Guidelines/Safety, Help, all top-level categories) is present on every public page. Primary navigation is present on every public page. |
| **FR-SEO-16** | Category/experience pages cross-link to related categories using `relatedCategoryIds` from the experience categories constant. **Minimum 3 contextual internal links per evergreen page**, beyond global nav and footer. |
| **FR-SEO-17** | A user-facing HTML sitemap page at `/sitemap` is included in the footer. It links to every top-level category and static page. |
| **FR-SEO-18** | Breadcrumb navigation on all nested pages (e.g. Explore → Category → Post). Paired with `BreadcrumbList` JSON-LD. |

### 9.4 Individual post pages & content lifecycle

| Rule | Requirement |
|---|---|
| **FR-SEO-19** | A deleted or expired post must **never** return a bare 404. It must either: (a) 301-redirect to its parent category page, or (b) render a soft-404 page with full navigation and links to related live content in the same category. |
| **FR-SEO-20** | Evergreen category pages are the primary SEO assets — not individual posts. Invest the most on-page optimization effort there. |

### 9.5 Keyword strategy

| Rule | Requirement |
|---|---|
| **FR-SEO-21** | Every evergreen page is built around a deliberate, documented primary keyword and 2–4 secondary keywords reflecting real user search intent around that experience/emotion. Never leave a page unoptimized. |
| **FR-SEO-22** | Keywords appear naturally in: H1, one early paragraph, at least one subheading, meta title, and URL slug. No keyword stuffing. |

### 9.6 SEO — what is and is not crawlable

**Public / crawlable:**
- `/` (landing)
- `/explore`
- `/explore/[category]`
- `/post/[id]` (if indexed — see open decision in PRD §21)
- `/about`, `/guidelines`, `/help`, `/sitemap`

**Private / never crawlable:**
- `/home`, `/conversations`, `/conversations/[id]`, `/compose`
- `/settings` and all sub-settings
- `/saved`, `/you-are-not-alone`, `/someone-needs-you`
- `/admin` and all admin sub-routes
- Any URL containing user-specific data

---

## 9. Accessibility Rules (WCAG AA — Required, Not Optional)

- **Contrast:** all text and interactive elements meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Indigo-on-white and charcoal-on-white must pass.
- **Color alone:** no information conveyed by color alone. Error, focus, and disabled states always have a non-color indicator (icon, weight change, pattern, text).
- **Labels:** all form inputs have associated `<label>` elements (not just placeholders). All interactive elements have descriptive `aria-label` attributes.
- **Focus management:** modals trap focus. After modal close, focus returns to the triggering element. After route navigation, focus moves to the `<main>` heading.
- **Keyboard navigation:** all primary flows are completable without a mouse.
- **Screen reader:** `aria-live="polite"` for loading states. `aria-live="assertive"` for the crisis resource banner. Semantic HTML used throughout.
- **Tap targets:** minimum 44×44px for all interactive elements.
- **Heading structure:** enforced as both an SEO rule (§8.2) and an accessibility requirement.
- **`CrisisResourceBanner`:** always an `aria-live="assertive"` region. Cannot be dismissed until it has been visible for at least 3 seconds. Warm, supportive tone — never styled as an error.

---

## 10. Authentication & Authorization Rules

- Firebase Authentication manages credentials. The Firebase UID is the stable link to the AMONG private account.
- Firebase UID is **never** included in any public API response, log entry, or URL.
- Every protected route has `auth.middleware` applied. Check this explicitly before shipping any new route.
- Admin routes have `adminAuth.middleware`. Moderators cannot issue permanent bans (admin only).
- Banned accounts: `auth.middleware` returns `403 ERR_FORBIDDEN` — never `401`.
- Auth tokens are validated server-side on every request (via Firebase Admin SDK) — no trusted client-side claims.
- Every auth-related function has high test coverage (minimum 95%).

---

## 11. API Design Rules

- All request bodies are validated with Zod middleware before reaching controllers.
- Error responses always use `{ error: { code, message } }` shape with codes from `shared/constants/errorCodes.ts`.
- Stack traces are never included in production error responses.
- Rate-limited endpoints return `Retry-After` header.
- Pagination uses cursor-based pagination — not offset — for feed and list endpoints.
- Response objects are always audited to strip private fields before returning.
- All user-generated content responses strip: `authorAccountId`, `moderationNotes`, `contentFlags`, `firebaseUid`, `email`.

---

## 12. Ranking & Discovery Rules

The ranking system optimizes for **meaningful relevance**, not maximum time-on-site.

**Ranking factors (all weighted, none dominant alone):**
1. Experience similarity (category match to user's interests)
2. Recency (time-decay function)
3. Meaningful response quality (ratio of meaningful secondary reactions — not raw count)
4. Diversity signal (underrepresented categories in user's recent feed)
5. Safety confidence (penalizes posts with open reports or flagged accounts)
6. Anti-repeat (posts already reacted to or seen today are excluded entirely)
7. Anti-popularity-monopoly (log-dampen raw reaction counts)

**Hard rules:**
- Raw reaction count alone never determines ranking.
- A post with 20,000 generic reactions must not automatically dominate a post with 80 meaningful responses.
- Ranking weights are **never hardcoded** — they live in the admin-configurable `Config` collection and are loaded at runtime.
- Ranking weights are configurable from the admin dashboard without a code deployment.
- Feed is always bounded: 1 primary + up to 5 secondary items on the home feed. Not infinite scroll.

---

## 13. Conversation System Rules

- Conversations are **always temporary**. No follower conversion from a conversation.
- Inactivity expiry: 30 minutes of no messages.
- Max duration: 48 hours hard ceiling (no exceptions, no extension).
- Inactivity warning: shown 5 minutes before expiry.
- Max duration warning: shown 1 hour before expiry.
- Match request expiry: 15 minutes with no eligible match.
- Conversation states are exhaustively defined in `shared/constants/conversationStates.ts`. Never introduce ad hoc state strings.
- Sender `accountId` is never included in message responses — alias snapshot only.
- No read receipts.
- Contact info detection (phone, email, social handles) fires a **soft warning** — message is sent, but `contactInfoWarning: true` is set. Never a hard block on the message.
- Contact info warning is shown once per conversation per category of flagged content.
- Block is always on private account ID — persists across alias rotations.

---

## 14. "Someone Needs You" Rules

- Entirely opt-in per experience category.
- At most **one** SNY prompt per user per day.
- At most **3 skips** per prompt cycle.
- Skipping has no penalty and does not reduce future prompt frequency.
- The feature is behind a **feature flag** — disabled at MVP until matching density is sufficient.
- The matched post in an SNY prompt does not surface the original post author's alias (only the experience context).

---

## 15. What Is Explicitly Out of Scope (Never Build These)

The following are explicitly excluded from MVP and must not be introduced:

- ❌ Creator economy features
- ❌ Follower system or follower counts
- ❌ Permanent public profile pages
- ❌ Karma scores or public reputation
- ❌ Complex gamification (streaks, badges, leaderboards)
- ❌ Advertising or ad-targeting features
- ❌ Large-scale creator tooling
- ❌ Broad general-purpose discussion communities (this is not Reddit)
- ❌ Native mobile apps (responsive web only for MVP)
- ❌ PWA-specific capabilities (not required at this stage)
- ❌ "Who reacted" lists — individual reaction identity is never exposed to anyone
- ❌ Public alias search as a discovery mechanism
- ❌ Persistent DM relationships that outlast a conversation session
- ❌ Any UI element that signals popularity (follower count, karma badge, colorful category chips)
- ❌ Confetti, celebratory animations, or anything that creates dopamine-loop patterns

---

## 16. Unit Testing Rules

### 16.1 Core principles

- Every phase ships with tests for all code produced in that phase. Testing is never deferred.
- Tests are deterministic — same inputs always produce the same result.
- Tests are isolated — no test depends on another test's state or execution order.
- External services (MongoDB, Firebase, Redis, Socket.IO, email) are always mocked/stubbed in unit tests.
- Test observable behavior and business rules — not internal implementation details.
- Include both happy-path and error/edge-path tests for every function.
- Authorization logic is tested explicitly: authenticated succeeds, unauthenticated fails, wrong role fails.
- Privacy invariants are tested explicitly: functions that must not return PII are verified to not return it in any path.

### 16.2 Coverage minimums

| Module type | Minimum coverage |
|---|---|
| Authentication & authorization | 95% |
| Privacy controls (block, report, PII detection) | 95% |
| Anonymous identity (alias, avatar, rotation) | 90% |
| Matching logic | 90% |
| Conversation state machine | 90% |
| Moderation & enforcement | 90% |
| Rate limiting | 90% |
| Validation schemas | 90% |
| Subscription entitlements | 90% |
| Ranking logic | 85% |
| Discovery service | 85% |
| Utility functions | 85% |
| Redux slices & selectors | 85% |
| Notification service | 80% |
| Analytics event generation | 80% |
| Frontend hooks | 80% |
| All other modules | 75% |
| **Overall project minimum** | **80%** |

### 16.3 Test file rules

- Test files co-locate with source files: `service.ts` → `service.test.ts`.
- Test files follow the same 1,000-line hard cap as source files.
- Large test suites are split by responsibility — not just by line count.
- Shared test factories and mocks live in `backend/src/test/` and `frontend/src/test/`.

### 16.4 What must always be tested

- Boundary conditions: minimum/maximum length, exactly-at-limit and just-over-limit.
- Empty inputs and null inputs.
- Invalid/malformed inputs.
- Duplicate actions (reacting twice, blocking twice).
- Unauthorized access (wrong user, wrong role, no auth).
- Expired states (edit window passed, conversation expired, alias expired).
- Privacy invariants (no PII in response objects).
- Rate limit enforcement at the exact boundary.
- Crisis detection: explicit crisis language detected; general sadness language NOT flagged.

---

## 17. Feature Flags

Major features are gated by server-side feature flags. Flags are toggled from the admin dashboard without a code deployment. When building any major feature, wrap it in a `useFeatureFlag(flagName)` check on the frontend and a `featureFlags.isEnabled(flagName)` check on the backend.

Features that are feature-flagged:
- "Someone Needs You" (disabled at MVP, enabled post-matching-density)
- Subscription surfaces (disabled at MVP)
- Any staged-rollout feature

Feature flag names live in `shared/constants/featureFlags.ts`.

---

## 18. Analytics Rules

- The analytics system is an **event bus** — product code emits domain events; analytics subscribes. Product business logic must never depend on analytics.
- Analytics must never block or delay user-facing requests (fire-and-forget, async).
- Analytics events never contain: Firebase UID, email, raw account ID, message body content.
- `accountIdHash` in analytics events is an HMAC hash of the account ID — not the raw ID.
- The north-star metric is **Weekly Meaningful Connections (WMC)** — not session duration.
- Safety/report-rate metrics are always broken out separately from growth/engagement metrics.

---

## 19. Admin Dashboard Rules

- All admin routes live under `/api/admin/` and `/admin` (frontend). Both are protected by `adminAuth.middleware`.
- Admin is never part of the public IA — never linked from any public page, never in `sitemap.xml`, always in `robots.txt` Disallow.
- Every action in the admin dashboard is attributed to the acting internal user with a timestamp (audit log).
- Moderators cannot issue permanent bans — only admins can.
- Crisis-flagged reports always appear at the top of the moderation queue regardless of age or sort order.
- Ranking weights, rate limits, and feature flags are all configurable via the admin dashboard — never require a code deployment to change.

---

## 20. Subscription Architecture Rules

- No subscription product exists in MVP. All users are on the free tier.
- The entitlement architecture exists from day one — `getEntitlements(accountId)` is the single choke point.
- All entitlements return `false` for all users at MVP.
- Product services call `getEntitlements` — they never check `subscriptionTier` inline.
- This means enabling a premium tier later requires zero product service changes.

---

## 21. Definition of Done (Per Feature, Per Phase)

A feature is not complete until all of the following are true:

- [ ] All unit tests pass
- [ ] Coverage targets for the module are met
- [ ] Zero TypeScript errors
- [ ] ESLint and Prettier pass with zero warnings
- [ ] No hardcoded constants — all values imported from centralized files
- [ ] No file exceeds 1,000 lines
- [ ] All API responses audited: no private fields (`firebaseUid`, `email`, `authorAccountId`, `moderationNotes`, `contentFlags`) in public responses
- [ ] All user-facing strings use constants/labels from centralized files
- [ ] All new interactive UI elements have accessible labels, keyboard support, and correct focus management
- [ ] Auth middleware applied to all routes requiring authentication
- [ ] Rate limiting applied to all applicable routes
- [ ] All error paths handled and tested
- [ ] Privacy invariants tested
- [ ] SEO requirements met for any new public page (FR-SEO-1 through FR-SEO-22)
- [ ] CI pipeline passes

---

## 22. Quick Anti-Pattern Reference

| If you are about to... | Stop. Instead... |
|---|---|
| Hardcode a hex color in a component | Use the Tailwind design token class (`text-brand-text`, `bg-brand-accent`) |
| Write `'/explore'` as a string in a component | Import from `shared/constants/routes.ts` |
| Write `3000` (max chars) inline in a validator | Import `POST_MAX_CHARS` from `shared/constants/limits.ts` |
| Add `authorAccountId` to an API response | Remove it. Never expose the internal account ID publicly |
| Use `reaction.count > 0` to rank content | Use the composite ranking score — never a raw count |
| Build an infinite scroll feed | Use bounded pagination (1 primary + 5 secondary, or paginated batches) |
| Show "who reacted" to a post | Do not. Aggregate counts only, never individual identity |
| Create a public "view user's profile" page | The product has no public profile pages |
| Use heading tags for visual sizing | Use CSS/Tailwind classes for visual size. Headings are semantic only |
| Ship a public page without `<h1>`, canonical, and meta description | Add all three before the page goes live (FR-SEO-2, FR-SEO-3, FR-SEO-11) |
| Return a 404 with no navigation for a deleted post | Implement the soft-404 with category links (FR-SEO-19) |
| Check `user.subscriptionTier` inline in a service | Call `getEntitlements(accountId)` instead |
| Add a feature flag name as a string inline | Add it to `shared/constants/featureFlags.ts` and import it |
| Delay crisis resource surfacing for human review | Crisis resources fire immediately and unconditionally — always |
| Add a gradient to any UI element | Remove it. No gradients anywhere in this product |
| Add follower counts, karma, or streak UI | These are explicitly out of scope — do not build them |
