# AMONG — Implementation Plan

> **Document purpose:** This is the single engineering implementation blueprint for the AMONG anonymous human-experience network. It is derived directly from the Product Requirements Document (`docs/PRD.md`) and converts every PRD requirement into a concrete, dependency-aware, phase-by-phase engineering plan. Development teams must execute phases sequentially unless sub-tasks within a phase are explicitly noted as parallelizable.

---

## Table of Contents

1. [Architectural Constraints & Global Rules](#1-architectural-constraints--global-rules)
2. [Technology Stack & Integration Strategy](#2-technology-stack--integration-strategy)
3. [Repository Structure](#3-repository-structure)
4. [Constants & Configuration Architecture](#4-constants--configuration-architecture)
5. [Phase 0 — Repository Scaffolding & Tooling](#5-phase-0--repository-scaffolding--tooling)
6. [Phase 1 — Core Backend Infrastructure](#6-phase-1--core-backend-infrastructure)
7. [Phase 2 — Core Frontend Infrastructure](#7-phase-2--core-frontend-infrastructure)
7B. [Phase 2B — Creative UI/UX Design Language & Component Patterns](#7b-phase-2b--creative-uiux-design-language--component-patterns)
8. [Phase 3 — Authentication & Anonymous Identity System](#8-phase-3--authentication--anonymous-identity-system)
9. [Phase 4 — Posting System](#9-phase-4--posting-system)
10. [Phase 5 — Reactions & "Same" System](#10-phase-5--reactions--same-system)
11. [Phase 6 — Discovery Feed & Ranking](#11-phase-6--discovery-feed--ranking)
12. [Phase 7 — Messaging & Temporary Conversations](#12-phase-7--messaging--temporary-conversations)
13. [Phase 8 — "Someone Needs You" & Experience Graph](#13-phase-8--someone-needs-you--experience-graph)
14. [Phase 9 — Trust, Safety & Moderation](#14-phase-9--trust-safety--moderation)
15. [Phase 10 — Notifications](#15-phase-10--notifications)
16. [Phase 11 — Admin Dashboard & Internal Tooling](#16-phase-11--admin-dashboard--internal-tooling)
17. [Phase 12 — SEO, Accessibility & Performance](#17-phase-12--seo-accessibility--performance)
18. [Phase 13 — Analytics & Metrics](#18-phase-13--analytics--metrics)
19. [Phase 14 — Subscription Architecture (Future-Proof Shell)](#19-phase-14--subscription-architecture-future-proof-shell)
20. [Phase 15 — Final Testing, QA & Deployment Readiness](#20-phase-15--final-testing-qa--deployment-readiness)
21. [Unit Testing Strategy](#21-unit-testing-strategy)
22. [Definition of Done](#22-definition-of-done)

---

## 1. Architectural Constraints & Global Rules

These rules apply to every file, phase, and decision in the project. They are non-negotiable.

### 1.1 File Size Rule

- **Hard maximum:** 1,000 lines of code per file.
- **Practical target:** 600–700 lines per file.
- Any file approaching 700 lines must be proactively split into smaller, cohesive modules.
- This rule applies equally to source files, test files, configuration files, and documentation.

### 1.2 No Hardcoded Constants

All application-wide constants must live in centralized configuration/constants files (see §4). Components, services, controllers, and utilities must import from those files. The following categories are explicitly prohibited from being hardcoded inline:

- Colors, typography tokens, spacing tokens
- API endpoints and base URLs
- Route definitions
- Feature flags
- Experience category definitions and IDs
- Reaction type definitions
- User role definitions
- Subscription tier definitions
- Message/conversation state values
- Limits (post length, daily caps, rate limits)
- Timeout values
- Validation rules and error messages
- UI labels and display strings (all user-facing text)
- Status values and enumerated states
- Configuration values

### 1.3 Modular, Feature-Bounded Architecture

- Both frontend and backend are organized into feature modules.
- Cross-cutting concerns (logging, error handling, validation, auth, analytics) live in dedicated shared layers.
- No circular dependencies between modules.
- External service adapters are encapsulated behind interface/service abstractions so the underlying provider can be replaced.

### 1.4 Privacy & Safety as First-Class Concerns

- No user's real identity is ever exposed to another user.
- Authentication credentials (email, phone) are never stored in public-facing documents, logs, or API responses.
- Every API response is audited to ensure no private fields leak.
- Safety-critical paths (crisis detection, report submission, block) must be tested with higher coverage targets and must never fail silently.

### 1.5 Scalability & Future Extensibility

- Data models must accommodate PRD V1 roadmap features (advanced matching, personal experience timeline, subscription entitlements, geographic aggregates) without schema migrations that break existing data.
- Ranking weights, rate limits, and feature flags must be configurable at runtime via the admin dashboard without a code deployment.
- All async work (notification delivery, matching jobs, abuse scanning) must be designed for a message-queue architecture, even if the MVP implementation uses an in-process job queue.

### 1.6 Testing in Every Phase

Every phase concludes with unit tests for all code produced in that phase. No feature is complete until its tests pass. See §21 for the full testing strategy.

---

## 2. Technology Stack & Integration Strategy

| Layer | Technology | Role |
|---|---|---|
| Frontend framework | Next.js (App Router) | SSR/SSG pages, API routes for BFF patterns |
| UI components | shadcn/ui | Accessible, unstyled-base component library |
| Styling | Tailwind CSS | Utility-first styling, design token integration |
| Icons | lucide-react | Thin-stroke, single-color icon set |
| State management | Redux Toolkit | Global client state, async thunks |
| Schema validation | Zod | Forms, API payloads, runtime type safety |
| Backend framework | Node.js + Express.js | REST API server |
| Database | MongoDB (Mongoose ODM) | Primary data store |
| Authentication | Firebase Authentication + Google Sign-In | Credential management, JWT issuance |
| Real-time messaging | Socket.IO (on Express) | Temporary conversation message delivery |
| Job scheduling | Agenda (MongoDB-backed) | Conversation expiry, daily prompts, alias rotation |
| Caching | Redis | Session cache, rate-limit counters, feed cache |
| Testing (backend) | Jest + Supertest | Unit and integration tests |
| Testing (frontend) | Jest + React Testing Library | Unit tests for components, hooks, slices |
| Linting | ESLint + Prettier | Code quality and formatting |
| TypeScript | Full-stack TypeScript | Type safety across frontend and backend |

### 2.1 Integration Principles

**Firebase Authentication:**
- Used only for credential storage and JWT issuance.
- On the backend, every request is validated against the Firebase Admin SDK to verify the token.
- The Firebase UID is the stable internal identifier linking a user's credential to their AMONG private account.
- The Firebase UID is never exposed in any public API response.

**MongoDB:**
- All schemas defined via Mongoose with strict mode enabled.
- Indexes designed from the start for primary query patterns (experience category, creation date, user account reference).
- Soft deletes used for user-generated content to support moderation workflows and data-export obligations.

**Redux:**
- Used only for genuinely global UI state: auth state, current alias, notification badge counts, active conversation state, and feature flags.
- Server-derived data (posts, reactions, conversations) fetched via RTK Query or async thunks and stored in feature slices.
- Component-local UI state (form inputs, modal open/close) stays in local React state.

**Zod:**
- Backend defines Zod schemas in `backend/src/schemas/` — used to validate all API request bodies.
- Frontend defines its own Zod schemas in `frontend/src/schemas/` — used to validate form inputs.
- Both sets of schemas cover the same domain rules; they are intentionally co-located in their respective projects. Keep them in sync when validation rules change.

**Socket.IO:**
- Used exclusively for the messaging feature.
- Each conversation is a private Socket.IO room identified by the conversation ID.
- All socket event names are defined as typed constants in `backend/src/constants/socketEvents.ts` (backend) and `frontend/src/constants/socketEvents.ts` (frontend) — kept identical.

---

## 3. Repository Structure

> **Top-level rule:** Only three root folders exist — `/docs`, `/backend`, `/frontend`.
> There is no `/shared` folder. Constants, types, and schemas live inside the project that uses them.
> Where the same constant is needed in both projects (e.g. error codes, socket events, limits),
> it is defined in both and kept in sync — intentional, explicit duplication is preferred over
> a hidden coupling through a shared package.

```
/
├── docs/
│   ├── PRD.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
│
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express app factory
│   │   ├── server.ts                 # HTTP + Socket.IO server entry point
│   │   ├── constants/                # All backend constants (single source of truth for server)
│   │   │   ├── index.ts
│   │   │   ├── experienceCategories.ts
│   │   │   ├── reactionTypes.ts
│   │   │   ├── conversationStates.ts
│   │   │   ├── postStates.ts
│   │   │   ├── userRoles.ts
│   │   │   ├── subscriptionTiers.ts
│   │   │   ├── limits.ts
│   │   │   ├── timeouts.ts
│   │   │   ├── reportReasons.ts
│   │   │   ├── errorCodes.ts
│   │   │   ├── socketEvents.ts
│   │   │   ├── featureFlags.ts
│   │   │   ├── crisisResources.ts
│   │   │   ├── contentPatterns.ts
│   │   │   └── crisisPatterns.ts
│   │   ├── schemas/                  # Zod schemas for API request validation
│   │   │   ├── index.ts
│   │   │   ├── post.schema.ts
│   │   │   ├── reaction.schema.ts
│   │   │   ├── conversation.schema.ts
│   │   │   ├── message.schema.ts
│   │   │   ├── user.schema.ts
│   │   │   ├── report.schema.ts
│   │   │   └── onboarding.schema.ts
│   │   ├── types/                    # Backend TypeScript interfaces
│   │   │   ├── index.ts
│   │   │   ├── express.d.ts          # Augmented Express Request (req.user)
│   │   │   ├── user.types.ts
│   │   │   ├── post.types.ts
│   │   │   ├── conversation.types.ts
│   │   │   ├── reaction.types.ts
│   │   │   ├── notification.types.ts
│   │   │   ├── analytics.types.ts
│   │   │   └── api.types.ts
│   │   ├── config/
│   │   │   ├── index.ts
│   │   │   ├── database.ts
│   │   │   ├── firebase.ts
│   │   │   ├── redis.ts
│   │   │   └── environment.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── adminAuth.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   ├── requestLogger.middleware.ts
│   │   │   └── sanitize.middleware.ts
│   │   ├── modules/
│   │   │   ├── users/
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   ├── alias.service.ts
│   │   │   │   ├── user.service.test.ts
│   │   │   │   ├── user.controller.test.ts
│   │   │   │   └── alias.service.test.ts
│   │   │   ├── posts/
│   │   │   │   ├── post.model.ts
│   │   │   │   ├── post.service.ts
│   │   │   │   ├── post.controller.ts
│   │   │   │   ├── post.routes.ts
│   │   │   │   ├── post.service.test.ts
│   │   │   │   └── post.controller.test.ts
│   │   │   ├── reactions/
│   │   │   │   ├── reaction.model.ts
│   │   │   │   ├── reaction.service.ts
│   │   │   │   ├── reaction.controller.ts
│   │   │   │   ├── reaction.routes.ts
│   │   │   │   ├── reaction.service.test.ts
│   │   │   │   └── reaction.controller.test.ts
│   │   │   ├── conversations/
│   │   │   │   ├── conversation.model.ts
│   │   │   │   ├── conversation.service.ts
│   │   │   │   ├── conversation.controller.ts
│   │   │   │   ├── conversation.routes.ts
│   │   │   │   ├── message.model.ts
│   │   │   │   ├── message.service.ts
│   │   │   │   ├── matching.service.ts
│   │   │   │   ├── conversation.gateway.ts
│   │   │   │   ├── conversation.service.test.ts
│   │   │   │   ├── matching.service.test.ts
│   │   │   │   ├── message.service.test.ts
│   │   │   │   └── conversation.controller.test.ts
│   │   │   ├── discovery/
│   │   │   │   ├── discovery.service.ts
│   │   │   │   ├── ranking.service.ts
│   │   │   │   ├── discovery.controller.ts
│   │   │   │   ├── discovery.routes.ts
│   │   │   │   ├── discovery.service.test.ts
│   │   │   │   └── ranking.service.test.ts
│   │   │   ├── experienceGraph/
│   │   │   │   ├── experienceGraph.model.ts
│   │   │   │   ├── experienceGraph.service.ts
│   │   │   │   ├── experienceGraph.controller.ts
│   │   │   │   ├── experienceGraph.routes.ts
│   │   │   │   ├── experienceGraph.service.test.ts
│   │   │   │   └── experienceGraph.controller.test.ts
│   │   │   ├── someoneNeedsYou/
│   │   │   │   ├── someoneNeedsYou.service.ts
│   │   │   │   ├── someoneNeedsYou.controller.ts
│   │   │   │   ├── someoneNeedsYou.routes.ts
│   │   │   │   ├── someoneNeedsYou.service.test.ts
│   │   │   │   └── someoneNeedsYou.controller.test.ts
│   │   │   ├── moderation/
│   │   │   │   ├── report.model.ts
│   │   │   │   ├── report.service.ts
│   │   │   │   ├── report.controller.ts
│   │   │   │   ├── report.routes.ts
│   │   │   │   ├── block.model.ts
│   │   │   │   ├── block.service.ts
│   │   │   │   ├── contentScanner.service.ts
│   │   │   │   ├── crisisDetection.service.ts
│   │   │   │   ├── enforcement.service.ts
│   │   │   │   ├── report.service.test.ts
│   │   │   │   ├── block.service.test.ts
│   │   │   │   ├── contentScanner.service.test.ts
│   │   │   │   ├── crisisDetection.service.test.ts
│   │   │   │   └── enforcement.service.test.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notification.model.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── notification.routes.ts
│   │   │   │   ├── notification.service.test.ts
│   │   │   │   └── notification.controller.test.ts
│   │   │   ├── admin/
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.routes.ts
│   │   │   │   ├── adminAnalytics.service.ts
│   │   │   │   ├── adminConfig.service.ts
│   │   │   │   ├── adminUser.service.ts
│   │   │   │   ├── admin.controller.test.ts
│   │   │   │   ├── adminAnalytics.service.test.ts
│   │   │   │   └── adminConfig.service.test.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── analytics.model.ts
│   │   │   │   ├── analytics.middleware.ts
│   │   │   │   └── analytics.service.test.ts
│   │   │   └── subscription/
│   │   │       ├── subscription.model.ts
│   │   │       ├── subscription.service.ts
│   │   │       ├── subscription.controller.ts
│   │   │       ├── subscription.routes.ts
│   │   │       └── subscription.service.test.ts
│   │   ├── jobs/
│   │   │   ├── jobScheduler.ts
│   │   │   ├── conversationExpiry.job.ts
│   │   │   ├── aliasRotation.job.ts
│   │   │   ├── dailyPrompt.job.ts
│   │   │   ├── feedRefresh.job.ts
│   │   │   ├── conversationExpiry.job.test.ts
│   │   │   ├── aliasRotation.job.test.ts
│   │   │   └── dailyPrompt.job.test.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── errors.ts
│   │       ├── pagination.ts
│   │       ├── hash.ts
│   │       ├── dateUtils.ts
│   │       ├── aliasGenerator.ts
│   │       ├── avatarGenerator.ts
│   │       ├── privacyUtils.ts
│   │       ├── logger.test.ts
│   │       ├── errors.test.ts
│   │       ├── aliasGenerator.test.ts
│   │       ├── avatarGenerator.test.ts
│   │       └── privacyUtils.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── constants/                # All frontend constants
    │   │   ├── index.ts
    │   │   ├── experienceCategories.ts   # Mirrors backend — kept in sync
    │   │   ├── reactionTypes.ts          # Mirrors backend — kept in sync
    │   │   ├── conversationStates.ts     # Mirrors backend — kept in sync
    │   │   ├── postStates.ts             # Mirrors backend — kept in sync
    │   │   ├── limits.ts                 # Mirrors backend — kept in sync
    │   │   ├── errorCodes.ts             # Mirrors backend — kept in sync
    │   │   ├── socketEvents.ts           # Mirrors backend — kept in sync
    │   │   ├── featureFlags.ts           # Mirrors backend — kept in sync
    │   │   ├── routes.ts                 # Frontend page routes (frontend only)
    │   │   ├── apiEndpoints.ts           # API URL paths (frontend only)
    │   │   └── design.ts                 # Design token class names (frontend only)
    │   ├── schemas/                  # Zod schemas for form validation
    │   │   ├── index.ts
    │   │   ├── post.schema.ts
    │   │   ├── reaction.schema.ts
    │   │   ├── conversation.schema.ts
    │   │   ├── message.schema.ts
    │   │   ├── user.schema.ts
    │   │   ├── report.schema.ts
    │   │   └── onboarding.schema.ts
    │   ├── types/                    # Frontend TypeScript interfaces
    │   │   ├── index.ts
    │   │   ├── user.types.ts
    │   │   ├── post.types.ts
    │   │   ├── conversation.types.ts
    │   │   ├── reaction.types.ts
    │   │   ├── notification.types.ts
    │   │   └── api.types.ts
    │   ├── app/                      # Next.js App Router
    │   │   ├── layout.tsx
    │   │   ├── page.tsx              # Landing (logged-out)
    │   │   ├── (auth)/
    │   │   │   ├── onboarding/
    │   │   │   │   ├── intent/page.tsx
    │   │   │   │   ├── categories/page.tsx
    │   │   │   │   └── account/page.tsx
    │   │   │   └── layout.tsx
    │   │   ├── (app)/
    │   │   │   ├── layout.tsx        # Authenticated shell with nav
    │   │   │   ├── home/page.tsx
    │   │   │   ├── explore/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── [category]/page.tsx
    │   │   │   ├── compose/page.tsx
    │   │   │   ├── post/[id]/page.tsx
    │   │   │   ├── conversations/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── [id]/page.tsx
    │   │   │   ├── you-are-not-alone/page.tsx
    │   │   │   ├── saved/page.tsx
    │   │   │   ├── settings/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── notifications/page.tsx
    │   │   │   │   ├── categories/page.tsx
    │   │   │   │   ├── identity/page.tsx
    │   │   │   │   ├── blocked/page.tsx
    │   │   │   │   └── privacy/page.tsx
    │   │   │   └── someone-needs-you/page.tsx
    │   │   ├── sitemap.ts            # Next.js sitemap generation
    │   │   ├── robots.ts             # Next.js robots.txt generation
    │   │   └── not-found.tsx
    │   ├── components/
    │   │   ├── ui/                   # shadcn/ui primitives (auto-generated)
    │   │   ├── layout/
    │   │   │   ├── AppShell.tsx
    │   │   │   ├── Navigation.tsx
    │   │   │   ├── Footer.tsx
    │   │   │   └── Breadcrumb.tsx
    │   │   ├── auth/
    │   │   │   ├── GoogleSignInButton.tsx
    │   │   │   ├── AgeGate.tsx
    │   │   │   └── TermsAcceptance.tsx
    │   │   ├── onboarding/
    │   │   │   ├── IntentSelector.tsx
    │   │   │   ├── CategorySelector.tsx
    │   │   │   └── AliasReveal.tsx
    │   │   ├── posts/
    │   │   │   ├── PostCard.tsx
    │   │   │   ├── PostDetail.tsx
    │   │   │   ├── ComposeForm.tsx
    │   │   │   ├── SafetyReminder.tsx
    │   │   │   ├── CategoryTag.tsx
    │   │   │   ├── PostStateSelector.tsx
    │   │   │   └── DeletedPostFallback.tsx
    │   │   ├── reactions/
    │   │   │   ├── ReactionBar.tsx
    │   │   │   ├── SameButton.tsx
    │   │   │   ├── PrimaryReactionSelector.tsx
    │   │   │   └── ReactionCounts.tsx
    │   │   ├── discovery/
    │   │   │   ├── PrimaryExperienceCard.tsx
    │   │   │   ├── SecondaryDiscoveryList.tsx
    │   │   │   ├── YouAreNotAlone.tsx
    │   │   │   └── CategoryBrowse.tsx
    │   │   ├── conversations/
    │   │   │   ├── ConversationList.tsx
    │   │   │   ├── ConversationThread.tsx
    │   │   │   ├── MessageBubble.tsx
    │   │   │   ├── MatchingState.tsx
    │   │   │   ├── ConversationContextCard.tsx
    │   │   │   ├── ExpiryWarning.tsx
    │   │   │   ├── ContactInfoWarning.tsx
    │   │   │   └── ConversationEndedView.tsx
    │   │   ├── someoneNeedsYou/
    │   │   │   ├── PromptCard.tsx
    │   │   │   └── SkipControls.tsx
    │   │   ├── moderation/
    │   │   │   ├── ReportModal.tsx
    │   │   │   ├── BlockConfirmation.tsx
    │   │   │   └── CrisisResourceBanner.tsx
    │   │   ├── notifications/
    │   │   │   ├── NotificationBell.tsx
    │   │   │   └── NotificationList.tsx
    │   │   ├── identity/
    │   │   │   ├── AliasDisplay.tsx
    │   │   │   └── AnonymousAvatar.tsx
    │   │   └── common/
    │   │       ├── LoadingSpinner.tsx
    │   │       ├── EmptyState.tsx
    │   │       ├── ErrorState.tsx
    │   │       ├── ConfirmationDialog.tsx
    │   │       ├── SafeHtml.tsx
    │   │       └── PrivacySafeCount.tsx
    │   ├── features/                 # Redux slices co-located with feature logic
    │   │   ├── auth/
    │   │   │   ├── authSlice.ts
    │   │   │   ├── authThunks.ts
    │   │   │   ├── authSelectors.ts
    │   │   │   ├── authSlice.test.ts
    │   │   │   ├── authThunks.test.ts
    │   │   │   └── authSelectors.test.ts
    │   │   ├── identity/
    │   │   │   ├── identitySlice.ts
    │   │   │   ├── identityThunks.ts
    │   │   │   ├── identitySelectors.ts
    │   │   │   ├── identitySlice.test.ts
    │   │   │   └── identitySelectors.test.ts
    │   │   ├── posts/
    │   │   │   ├── postsSlice.ts
    │   │   │   ├── postsThunks.ts
    │   │   │   ├── postsSelectors.ts
    │   │   │   ├── postsSlice.test.ts
    │   │   │   ├── postsThunks.test.ts
    │   │   │   └── postsSelectors.test.ts
    │   │   ├── reactions/
    │   │   │   ├── reactionsSlice.ts
    │   │   │   ├── reactionsThunks.ts
    │   │   │   ├── reactionsSlice.test.ts
    │   │   │   └── reactionsThunks.test.ts
    │   │   ├── discovery/
    │   │   │   ├── discoverySlice.ts
    │   │   │   ├── discoveryThunks.ts
    │   │   │   ├── discoverySelectors.ts
    │   │   │   ├── discoverySlice.test.ts
    │   │   │   └── discoverySelectors.test.ts
    │   │   ├── conversations/
    │   │   │   ├── conversationsSlice.ts
    │   │   │   ├── conversationsThunks.ts
    │   │   │   ├── conversationsSelectors.ts
    │   │   │   ├── conversationsSlice.test.ts
    │   │   │   └── conversationsSelectors.test.ts
    │   │   ├── notifications/
    │   │   │   ├── notificationsSlice.ts
    │   │   │   ├── notificationsThunks.ts
    │   │   │   ├── notificationsSlice.test.ts
    │   │   │   └── notificationsThunks.test.ts
    │   │   └── featureFlags/
    │   │       ├── featureFlagsSlice.ts
    │   │       ├── featureFlagsThunks.ts
    │   │       └── featureFlagsSlice.test.ts
    │   ├── store/
    │   │   ├── index.ts              # Redux store configuration
    │   │   ├── rootReducer.ts
    │   │   └── middleware.ts
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useAlias.ts
    │   │   ├── usePost.ts
    │   │   ├── useReaction.ts
    │   │   ├── useConversation.ts
    │   │   ├── useSocket.ts
    │   │   ├── useNotifications.ts
    │   │   ├── useFeatureFlag.ts
    │   │   ├── useConversationExpiry.ts
    │   │   ├── useScrollBounded.ts
    │   │   ├── useAuth.test.ts
    │   │   ├── useConversation.test.ts
    │   │   └── useConversationExpiry.test.ts
    │   ├── lib/
    │   │   ├── apiClient.ts          # Axios/fetch wrapper with auth headers
    │   │   ├── firebaseClient.ts     # Firebase SDK initialization
    │   │   ├── socketClient.ts       # Socket.IO client setup
    │   │   ├── queryClient.ts        # React Query setup (if adopted)
    │   │   ├── apiClient.test.ts
    │   │   └── socketClient.test.ts
    │   │   # (constants/, schemas/, types/ are at src/ root — see above)
    │   ├── styles/
    │   │   ├── globals.css           # Tailwind directives + CSS custom properties
    │   │   └── tokens.css            # Design token CSS variables
    │   └── utils/
    │       ├── formatDate.ts
    │       ├── formatCount.ts
    │       ├── privacySafeCount.ts
    │       ├── conversationStateUtils.ts
    │       ├── aliasDisplay.ts
    │       ├── avatarUtils.ts
    │       ├── seoUtils.ts
    │       ├── formatDate.test.ts
    │       ├── formatCount.test.ts
    │       ├── privacySafeCount.test.ts
    │       ├── conversationStateUtils.test.ts
    │       └── aliasDisplay.test.ts
    ├── public/
    │   └── assets/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.ts
    ├── jest.config.ts
    └── .env.example
```

---

## 4. Constants & Configuration Architecture

### 4.1 Principle: Constants Live In Their Project

There is no shared package. Constants are defined in the project that owns them.

**Backend-only constants** (`backend/src/constants/`):
- `userRoles.ts` — USER, MODERATOR, ADMIN
- `subscriptionTiers.ts` — FREE, PREMIUM + Entitlements
- `reportReasons.ts` — HARASSMENT, SELF_HARM_RISK, ILLEGAL_CONTENT, SPAM, etc.
- `crisisResources.ts` — Hotlines and resource links
- `contentPatterns.ts` — Regex patterns for content scanning
- `crisisPatterns.ts` — Regex patterns for crisis detection
- `featureFlags.ts` — Feature flag names + defaults *(also in frontend)*

**Frontend-only constants** (`frontend/src/constants/`):
- `routes.ts` — All page route strings
- `apiEndpoints.ts` — API URL paths
- `design.ts` — Design token Tailwind class name references

**Mirrored in both** (kept manually in sync — identical values, defined independently):

| File | Backend | Frontend | Why both need it |
|---|---|---|---|
| `experienceCategories.ts` | ✓ | ✓ | Backend: ranking, matching. Frontend: category selector, browse, SEO |
| `reactionTypes.ts` | ✓ | ✓ | Backend: validation. Frontend: reaction bar labels |
| `conversationStates.ts` | ✓ | ✓ | Backend: state machine. Frontend: UI state rendering |
| `postStates.ts` | ✓ | ✓ | Backend: persistence. Frontend: display logic |
| `limits.ts` | ✓ | ✓ | Backend: enforcement. Frontend: form validation |
| `errorCodes.ts` | ✓ | ✓ | Backend: API responses. Frontend: error handling |
| `socketEvents.ts` | ✓ | ✓ | Backend: gateway. Frontend: socket client |
| `featureFlags.ts` | ✓ | ✓ | Backend: guards. Frontend: `useFeatureFlag` hook |

> **Sync rule:** When a mirrored constant is changed, update both files in the same commit. Add a comment at the top of each mirrored file: `// MIRRORED — keep in sync with [backend|frontend]/src/constants/<file>.ts`

### 4.2 Backend Configuration (`backend/src/config/`)

- `environment.ts`: Validates all environment variables at startup using Zod; throws on missing required values.
- `featureFlags.ts`: Loads feature flag values from a persistent store (admin-configurable MongoDB document). Feature flags are refreshed on a configurable interval and exposed via a typed accessor.
- `database.ts`: MongoDB connection configuration with connection pooling settings.
- `redis.ts`: Redis client initialization, used for rate limiting and caching.

### 4.3 Frontend Constants (`frontend/src/constants/`)

- `design.ts`: Maps design token names to Tailwind CSS variable references.
- `routes.ts`: All frontend page route strings as typed constants.
- `apiEndpoints.ts`: Typed API endpoint path constants; never construct endpoint strings inline in components or hooks.
- Mirrored constants (see table above) also live here with a sync comment at the top.

### 4.4 Tailwind Design Tokens (`frontend/tailwind.config.ts`)

All design values are defined as Tailwind theme extensions, not hardcoded in component class strings:

```typescript
// theme.extend.colors: brand-primary (indigo), brand-text, brand-border, semantic colors
// theme.extend.fontFamily: editorial (serif), ui (sans)
// theme.extend.borderRadius: sm, md, lg, pill
// theme.extend.spacing: 8px-base scale
// No raw hex codes in component files — all via design token class names
```

---

## 5. Phase 0 — Repository Scaffolding & Tooling

**Goal:** Establish a working monorepo with all tooling configured before a single line of product code is written.

**Dependencies:** None.

**Expected outcome:** Empty but properly scaffolded repo with linting, TypeScript, testing infrastructure, and CI pipeline ready.

### 5.1 Repository initialization

1. Create root `package.json` as workspace root (npm/yarn workspaces or Turborepo).
2. Create `/docs`, `/backend`, `/frontend`, `/shared` directories.
3. Initialize Git with a `.gitignore` covering `node_modules`, `.env`, build artifacts, and test coverage artifacts.
4. Add `README.md` at root with project overview, setup instructions, and links to `docs/`.

### 5.2 Shared package setup

1. Initialize `/shared` as a TypeScript package (`tsconfig.json`, `package.json`).
2. Create all directories under `shared/constants/`, `shared/schemas/`, `shared/types/` as empty modules with index re-exports.
3. Populate all constants files listed in §4.1 with complete, typed values — **do this before any backend or frontend code is written**, so neither side ever hardcodes a value.

**Unit tests for Phase 0:**
- `shared/constants/*.test.ts`: Assert that all exported constant objects/arrays are non-empty, all required keys exist, and no duplicate IDs exist within enumerated sets.
- `shared/schemas/*.test.ts`: Assert that each Zod schema validates a known-good fixture and rejects a known-bad fixture.

### 5.3 Backend scaffolding

1. Initialize `/backend` with `package.json` and install all dependencies: `express`, `mongoose`, `firebase-admin`, `ioredis`, `socket.io`, `zod`, `agenda`, `winston`, `helmet`, `cors`, `express-rate-limit`.
2. Install dev dependencies: `typescript`, `ts-node`, `jest`, `@types/*`, `supertest`, `ts-jest`.
3. Configure `tsconfig.json` with strict mode, path aliases (`@modules`, `@utils`, `@config`, `@middleware`).
4. Configure `jest.config.ts`: coverage thresholds, test match patterns, module name mappers.
5. Create `backend/src/app.ts` (Express factory — no routes yet) and `backend/src/server.ts` (HTTP + Socket.IO bootstrap).
6. Create `backend/.env.example` with all required environment variable keys.

### 5.4 Frontend scaffolding

1. Initialize `/frontend` with `create-next-app` using TypeScript and Tailwind CSS.
2. Install additional dependencies: `redux`, `@reduxjs/toolkit`, `react-redux`, `zod`, `lucide-react`, `socket.io-client`, `axios`.
3. Install dev dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `jest`, `jest-environment-jsdom`.
4. Initialize shadcn/ui: `npx shadcn@latest init` with the design system colors from §4.4.
5. Configure `tailwind.config.ts` with all design tokens from §4.4.
6. Create `frontend/src/styles/globals.css` with CSS custom properties for design tokens.
7. Configure path aliases: `@components`, `@features`, `@hooks`, `@lib`, `@utils`, `@constants`, `@store`.
8. Create `frontend/.env.example`.

### 5.5 CI pipeline

1. Create `.github/workflows/ci.yml` with steps: install dependencies, lint, type-check, run unit tests, report coverage.
2. Configure branch protection: all PRs must pass CI before merge.
3. Add coverage thresholds to Jest configs (see §21 for values).

---

## 6. Phase 1 — Core Backend Infrastructure

**Goal:** Working Express server with MongoDB, Redis, Firebase Admin, logging, error handling, validation middleware, and rate limiting operational. No product features yet.

**Dependencies:** Phase 0 complete.

**Expected outcome:** Backend starts, connects to all services, handles errors gracefully, and enforces auth on protected routes.

### 6.1 Environment configuration

1. Implement `backend/src/config/environment.ts`:
   - Use Zod to declare and validate all required env vars: `MONGODB_URI`, `REDIS_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `JWT_AUDIENCE`.
   - Export a typed `env` object.
   - Throw a descriptive error at startup if any required variable is missing or fails validation.
2. Wire `environment.ts` as the first import in `server.ts` so startup fails fast with a clear message.

### 6.2 Database connection

1. Implement `backend/src/config/database.ts`:
   - Mongoose connection with `useNewUrlParser`, `useUnifiedTopology`.
   - Connection pool configuration.
   - Mongoose error and disconnect event handlers with structured logging.
   - Export `connectDatabase()` and `disconnectDatabase()` functions.
2. Wire into `server.ts` startup sequence.

**Unit tests:** Mock `mongoose.connect`, assert connection is called with correct URI, assert error is thrown and logged on failure, assert `disconnectDatabase` calls `mongoose.disconnect`.

### 6.3 Firebase Admin SDK initialization

1. Implement `backend/src/config/firebase.ts`:
   - Initialize Firebase Admin SDK with service account credentials from environment.
   - Export `verifyFirebaseToken(idToken: string)` that returns a typed `DecodedToken`.
   - Wrap all Firebase SDK errors in internal `AppError` (see §6.6).

**Unit tests:** Mock Firebase Admin SDK, assert `verifyFirebaseToken` returns decoded payload on valid token, throws `AppError` with `ERR_UNAUTHORIZED` on invalid token.

### 6.4 Redis connection

1. Implement `backend/src/config/redis.ts`:
   - ioredis client with reconnect strategy.
   - Export `redisClient` and helper functions: `get`, `set`, `del`, `incr`, `expire`.
   - Graceful degradation: if Redis is unavailable, rate limiting falls back to in-memory (log a warning — do not crash).

**Unit tests:** Mock ioredis, assert helper functions call the correct underlying commands, assert fallback triggers when Redis throws.

### 6.5 Logging

1. Implement `backend/src/utils/logger.ts`:
   - Winston-based structured logger with levels: `error`, `warn`, `info`, `debug`.
   - JSON format in production, human-readable in development.
   - Log every request: method, path, status, duration (no request bodies in production logs — risk of PII leakage).
   - Never log: passwords, tokens, Firebase UIDs in query strings, email addresses, user content.

**Unit tests:** Assert logger outputs correct level labels, assert sensitive fields are redacted.

### 6.6 Error handling

1. Implement `backend/src/utils/errors.ts`:
   - `AppError` class extending `Error` with `statusCode`, `errorCode` (from `shared/constants/errorCodes.ts`), `isOperational` flag.
   - Factory functions for common errors: `notFound()`, `unauthorized()`, `forbidden()`, `rateLimited()`, `validationError()`, `internalError()`.
2. Implement `backend/src/middleware/errorHandler.middleware.ts`:
   - Catches all errors passed to `next(error)`.
   - Operational errors: return structured JSON `{ error: { code, message } }` with appropriate status.
   - Unexpected errors: log the full error, return generic `{ error: { code: 'ERR_INTERNAL' } }` — never expose stack traces in production.
   - Always strips private fields from error responses.

**Unit tests:** Assert `AppError` has correct properties, assert middleware sends correct status codes, assert stack traces are not included in production responses.

### 6.7 Request validation middleware

1. Implement `backend/src/middleware/validate.middleware.ts`:
   - Generic `validate(schema: ZodSchema)` middleware factory.
   - Validates `req.body`, `req.query`, or `req.params` against the provided Zod schema.
   - On failure: pass `validationError(errors)` to `next()`.

**Unit tests:** Assert valid body passes through, assert invalid body returns 400 with field-level error details, assert errors use codes from `errorCodes.ts`.

### 6.8 Auth middleware

1. Implement `backend/src/middleware/auth.middleware.ts`:
   - Extract Bearer token from `Authorization` header.
   - Verify via `verifyFirebaseToken`.
   - Look up AMONG private account by Firebase UID.
   - Attach `req.user` (typed `AuthenticatedUser`) to request.
   - Reject with `ERR_UNAUTHORIZED` if token is missing, invalid, or account not found.
   - Reject with `ERR_FORBIDDEN` if account is banned.
2. Implement `backend/src/middleware/adminAuth.middleware.ts`:
   - Extends `auth.middleware.ts`.
   - Additionally checks that `req.user.role` is `MODERATOR` or `ADMIN`.
   - Uses role from `shared/constants/userRoles.ts`.

**Unit tests (high coverage required):** Valid token → user attached. Missing token → 401. Invalid token → 401. Banned account → 403. Valid token + non-admin role on admin route → 403. Moderator accessing admin-only action → 403. Admin accessing admin route → passes.

### 6.9 Rate limiting middleware

1. Implement `backend/src/middleware/rateLimiter.middleware.ts`:
   - Redis-backed sliding window rate limiter.
   - Configurable `windowMs` and `max` parameters, loaded from `shared/constants/limits.ts` (never hardcoded).
   - Rate limits are keyed by internal account ID (not IP address alone — IP can be shared/spoofed).
   - On limit exceeded: return `ERR_RATE_LIMITED` with `Retry-After` header.
   - Separate limiter instances for: posting, reactions, conversation requests, alias rotation, report submission.

**Unit tests:** Assert counter increments correctly, assert limit is enforced at the threshold, assert `Retry-After` is present, assert counter resets after window.

### 6.10 Sanitization middleware

1. Implement `backend/src/middleware/sanitize.middleware.ts`:
   - Strip any HTML tags from user-supplied text fields.
   - Normalize whitespace in user-supplied text.
   - Applied globally to all routes accepting user-generated content.

**Unit tests:** Assert HTML is stripped, assert script tags are stripped, assert content otherwise preserved.

### 6.11 Security headers

1. Apply `helmet()` middleware in `app.ts`.
2. Configure CORS with explicit allowed origins from `env.CORS_ORIGIN`.
3. Apply `express.json()` with a request-body size limit (configurable via env).

---

## 7. Phase 2 — Core Frontend Infrastructure

**Goal:** Next.js app with Redux store, API client, Firebase client, design system, routing shell, and shared layout components working. No product features yet.

**Dependencies:** Phase 0 complete.

**Expected outcome:** Frontend starts, Redux store initialized, API client configured, design tokens applied, all layout routes exist as stubs.

### 7.1 Next.js configuration

1. Configure `next.config.ts`:
   - Enable App Router.
   - Configure image domains if needed.
   - Set `NEXT_PUBLIC_*` env prefixes for frontend-safe env vars.
   - Configure security headers via `headers()` function.
2. Create `frontend/.env.example` with: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_SOCKET_URL`.

### 7.2 Design system initialization

1. Complete shadcn/ui setup with the `among` theme:
   - Override CSS variables in `globals.css` to match design token values from §4.4 and PRD §14.
   - Define color tokens: `--color-background: #FFFFFF`, `--color-text: #1A1A1A`, `--color-border: #E5E5E5`, `--color-accent: #4F46E5`, `--color-text-muted: ...`, semantic colors.
   - Define all typographic and spacing tokens as CSS custom properties.
   - No gradients in any token value.
2. Update `tailwind.config.ts`:
   - Extend colors with token names mapped to CSS variables.
   - Extend font families: `editorial` (serif), `ui` (sans-serif).
   - Extend border radius: `sm`, `md`, `lg`, `pill` tokens.
   - Extend spacing with 8px-base scale: `1 = 8px`, `2 = 16px`, etc.
3. Install and configure fonts (Google Fonts or local — no external font provider in production for performance/privacy).

### 7.3 Redux store setup

1. Implement `frontend/src/store/index.ts`:
   - Combine all feature slice reducers.
   - Add Redux DevTools in development.
   - Export typed `RootState` and `AppDispatch`.
2. Implement `frontend/src/store/rootReducer.ts` with all slice imports.
3. Create Redux provider in `frontend/src/app/layout.tsx`.
4. Implement `frontend/src/store/middleware.ts` with RTK default middleware + any custom middleware.

**Unit tests:** Assert store initializes with correct initial state for each slice.

### 7.4 Firebase client

1. Implement `frontend/src/lib/firebaseClient.ts`:
   - Initialize Firebase app with env vars (guard against re-initialization in hot-reload).
   - Export `auth` (Firebase Auth instance).
   - Export `signInWithGoogle()` function using `GoogleAuthProvider`.
   - Export `signOut()` function.
   - Export `onAuthStateChanged` wrapper that returns an unsubscribe function.
   - Export `getIdToken()` helper.

**Unit tests:** Mock Firebase SDK. Assert `signInWithGoogle` calls the correct provider. Assert `getIdToken` returns token from mock user. Assert re-initialization guard works.

### 7.5 API client

1. Implement `frontend/src/lib/apiClient.ts`:
   - Axios instance with `baseURL` from `NEXT_PUBLIC_API_BASE_URL` env.
   - Request interceptor: attaches `Authorization: Bearer {firebase_id_token}` on every request.
   - Response interceptor: normalizes errors into `AppError`-shaped objects.
   - Timeout configured from `shared/constants/timeouts.ts`.
   - All endpoint paths use constants from `frontend/src/constants/apiEndpoints.ts`.

**Unit tests:** Mock Axios. Assert Authorization header is attached. Assert error responses are normalized correctly. Assert timeout is set.

### 7.6 Socket client

1. Implement `frontend/src/lib/socketClient.ts`:
   - Socket.IO client factory.
   - Attaches auth token in socket handshake for server-side verification.
   - Exports `createSocket(conversationId)` and `destroySocket()`.
   - All emitted/received event names from `shared/constants/socketEvents.ts`.

**Unit tests:** Mock socket.io-client. Assert auth token is attached on connect. Assert event listeners are registered with correct event names. Assert disconnect cleans up.

### 7.7 Layout components

1. Implement `AppShell.tsx` — outer wrapper with navigation and footer.
2. Implement `Navigation.tsx` — top nav with links to all primary routes; highlights active route; includes Compose persistent action; notification bell.
3. Implement `Footer.tsx` — site-wide footer with links to key evergreen pages (required for SEO §19.2).
4. Implement `Breadcrumb.tsx` — accepts path segments, renders structured navigation breadcrumbs with aria-label.
5. Implement `EmptyState.tsx`, `LoadingSpinner.tsx`, `ErrorState.tsx` — shared across all features; accept typed props for message, icon, and CTA.
6. Create route stubs for all pages in `frontend/src/app/` — each returns a `<main>` with a placeholder heading.

**Unit tests:** `Navigation.tsx`: Assert active route is highlighted. Assert all nav links render. Assert accessibility landmarks present. `Breadcrumb.tsx`: Assert correct links are rendered for given path segments. Assert `BreadcrumbList` structured data rendered.

---

## 7B. Phase 2B — Creative UI/UX Design Language & Component Patterns

**Goal:** Establish AMONG's distinctive visual and interaction identity before any product feature is built. This phase defines exactly how every surface, state, and interaction looks and feels — creating a design language that is editorial, intimate, and handcrafted. Nothing here should resemble a generic social app, a template, or an AI-generated UI kit.

**Dependencies:** Phase 2 complete (design tokens, Tailwind config, shadcn/ui initialized).

**Expected outcome:** A living component system (`/frontend/src/components/`) where every primitive has been designed with intention. Any developer building a feature in later phases should be able to assemble it from these components without making ad hoc visual decisions.

**The single design test:** Does this look and feel like it could have been published in a beautifully designed literary journal, a premium print magazine, or a thoughtfully crafted indie web product? If it looks like it came out of a Figma template, a shadcn default, or a typical SaaS UI kit — it needs more design work.

---

### 7B.1 Core Visual Philosophy & What Makes AMONG Different

AMONG's UI must feel like stepping into a quiet, intimate room — not opening another app. The design achieves this through three deliberate tensions:

1. **Scale vs. restraint** — Typography is large and expressive for content; chrome is invisible. The user's words are the most visually prominent element on any screen.
2. **Warmth vs. sophistication** — Pure white, deep charcoal, single indigo accent. No color vibrancy, yet the product never feels cold.
3. **Presence vs. anonymity** — Every interaction feels considered and human even though no identities are shown.

**Design anti-patterns to actively avoid:**
- Dashboard-style card grids with colored headers.
- Icon-heavy navigation bars.
- Colorful category/tag chips.
- Progress bars, achievement badges, streaks, or any gamification visual language.
- Chat-bubble-style conversation UI (left/right blocks with tails).
- Generic hero images with stock photography.
- Animated gradients or glassmorphism.
- Any pattern that signals "social media app."

---

### 7B.2 Typography System (Implementation-Specific)

Define typography scales in `tailwind.config.ts` and `globals.css`. All sizes and families are design tokens — never hardcoded in component files.

#### Type scale tokens

```
// tailwind.config.ts — extend fontSize
'display':   ['5rem',   { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '400' }]   // 80px — alias reveal, landing hero
'headline':  ['2.75rem',{ lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '400' }]   // 44px — primary daily experience
'title-xl':  ['2rem',   { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '400' }]  // 32px — category page h1
'title':     ['1.5rem', { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '500' }]   // 24px — section headings
'body-lg':   ['1.125rem',{ lineHeight: '1.7', letterSpacing: '0',       fontWeight: '400' }]   // 18px — post body text
'body':      ['1rem',   { lineHeight: '1.65', letterSpacing: '0',       fontWeight: '400' }]   // 16px — secondary body
'ui':        ['0.875rem',{ lineHeight: '1.5', letterSpacing: '0.005em', fontWeight: '400' }]   // 14px — labels, UI text
'caption':   ['0.75rem',{ lineHeight: '1.4', letterSpacing: '0.01em',  fontWeight: '400' }]   // 12px — counts, timestamps, metadata
```

#### Font pairing rationale

- **Editorial serif** (`font-editorial`): Used for `display`, `headline`, `title-xl` — only on content that deserves typographic weight: the hero, the primary experience card, the "You Are Not Alone" statement, the alias name on reveal, category page H1s. This typeface makes the user's words feel like they belong in a book, not a feed.
- **UI sans-serif** (`font-ui`): Used for everything else — navigation, buttons, labels, body of secondary content, forms. Clean, invisible, supportive.

**Recommended typefaces** (validate licensing before final use):
- Editorial: `Playfair Display`, `Lora`, or `DM Serif Display` — each has a literary, warm quality without feeling old-fashioned.
- UI: `Inter` or `DM Sans` — both are highly legible at small sizes with good number tabular figures.

Load via `next/font` with `display: swap`. Never load from external CDN at runtime — fonts are self-hosted.

#### Reading width constraint

Post body text must never exceed **65 characters per line** (`max-w-prose` or a custom `max-w-reading` token). This is the typographic rule that makes the product feel like reading, not scanning. Enforce via a wrapper utility class used on all post body text.

---

### 7B.3 Color System — Implementation Details

All colors are CSS custom properties in `globals.css`, extended into Tailwind as semantic token names.

```css
/* globals.css — :root */
--color-bg:            #FFFFFF;
--color-bg-subtle:     #FAFAFA;        /* only for innermost nested surfaces, used sparingly */
--color-text:          #111111;
--color-text-secondary:#555555;
--color-text-muted:    #999999;
--color-border:        #E8E8E8;
--color-border-strong: #D0D0D0;
--color-accent:        #4F46E5;        /* indigo — single accent color */
--color-accent-hover:  #4338CA;
--color-accent-subtle: #EEF2FF;        /* used ONLY for focus rings and very light selected states */
--color-semantic-error:#C0392B;        /* muted, not saturated */
--color-semantic-warn: #B7791F;
--color-semantic-ok:   #276749;
--color-semantic-info: #2B6CB0;
```

```js
// tailwind.config.ts — extend colors
colors: {
  bg:              'var(--color-bg)',
  'bg-subtle':     'var(--color-bg-subtle)',
  text:            'var(--color-text)',
  'text-secondary':'var(--color-text-secondary)',
  'text-muted':    'var(--color-text-muted)',
  border:          'var(--color-border)',
  'border-strong': 'var(--color-border-strong)',
  accent:          'var(--color-accent)',
  'accent-hover':  'var(--color-accent-hover)',
  'accent-subtle': 'var(--color-accent-subtle)',
  error:           'var(--color-semantic-error)',
  warn:            'var(--color-semantic-warn)',
  ok:              'var(--color-semantic-ok)',
  info:            'var(--color-semantic-info)',
}
```

**Rule on indigo (accent) usage:** The accent color should appear on fewer than 20% of any given screen's interactive elements. When everything is accented, nothing is. The correct mental model: the indigo accent is a spotlight — used for the one thing that matters most on a given screen (the SAME button when a post resonates, the active nav item, the primary CTA, focus rings). Secondary/ghost buttons and supporting UI are charcoal/border colored, not indigo.

---

### 7B.4 Spacing & Layout System

```js
// tailwind.config.ts — base spacing is 8px × n
spacing: {
  '0.5': '4px',
  '1':   '8px',
  '2':   '16px',
  '3':   '24px',
  '4':   '32px',
  '5':   '40px',
  '6':   '48px',
  '8':   '64px',
  '10':  '80px',
  '12':  '96px',
  '16':  '128px',
  '20':  '160px',
}
```

**Page-level layout rules:**
- Max content width: `max-w-2xl` (672px) for all reading content. Editorial products enforce a reading column — the internet is too wide.
- Max UI shell width: `max-w-4xl` (896px) for wider surfaces like Explore category grid.
- Outer horizontal padding: `px-5` (mobile) / `px-8` (tablet+) — generous breathing room.
- Vertical rhythm: section spacing uses multiples of `8` only (`space-y-8`, `space-y-12`, `space-y-16`).
- No card grids. All primary content surfaces are single-column.

---

### 7B.5 Shape & Border System

```js
// tailwind.config.ts — borderRadius
borderRadius: {
  'none':  '0',
  'sm':    '6px',
  'md':    '10px',
  'lg':    '16px',
  'xl':    '24px',
  'pill':  '9999px',   // primary buttons, tags, badges
  'full':  '50%',      // avatar containers only
}
```

- **Primary action buttons:** always `rounded-pill`. This is a signature shape — never use `rounded-md` for CTAs.
- **Cards and surface containers:** `rounded-lg` (16px). Cards have `border border-border` — single-pixel, light gray. No drop shadows (shadows break the flat, pure-white aesthetic).
- **Input fields:** `rounded-md` (10px). Subtle distinction from cards.
- **Avatar containers:** `rounded-full`. Always circular.
- **Tags/category labels:** `rounded-pill` with `px-3 py-1 text-ui font-ui` — minimal typographic chips, no color fill, just a border.

---

### 7B.6 Page-by-Page UI Specifications

#### Landing Page (`/`)

The landing page is the only part of the product that uses large-scale editorial design. It must feel like the cover of a literary magazine combined with a quiet manifesto.

**Layout structure:**
1. **Hero section** — full viewport height. Centered vertically and horizontally.
   - `<h1>` in `font-editorial text-display text-text` — the tagline: *"You're not the only one."*
   - Below the H1: a secondary line in `font-ui text-body-lg text-text-secondary` — *"Find people who've been there."*
   - Below that: a single pill CTA button: **"Enter Among →"** in `bg-text text-bg` (inverted — deep black button, white text). This is the only dark element on the page.
   - No hero image. No illustration. The words are the visual.
2. **Scrollable sections** — staggered two-column editorial blocks:
   - Each block: one large left-aligned typographic statement + a small right-aligned elaboration.
   - Example: `"Say what's on your mind."` (large serif) | `"Your words. Your experience. No name attached."` (small sans).
3. **Experience category preview strip** — a horizontal flowing list of category names in `font-editorial text-title` that scrolls on hover/touch. Text only, no cards. Creates curiosity about the experience taxonomy.
4. **The tagline footer** — *"A human-experience network built around anonymity, relatability and meaningful connection."* in `text-caption text-text-muted`. Small, honest, not marketed.

**CSS animation for hero text:** Words in the hero H1 appear one at a time with a 150ms stagger, `opacity 0 → 1` and `translateY(8px) → 0`. Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`. Subtle. Like someone speaking.

#### Onboarding — Category Selection

This is the user's first meaningful decision. It should feel considered, not form-like.

**Layout:** Full-width centered grid of category tiles. Each tile is:
- A large typographic label in `font-editorial text-title` on a white surface.
- A thin border (`border-border`), `rounded-lg`.
- A single subtle descriptor line in `text-caption text-text-muted` below the label.
- On selection: border changes to `border-accent`, background shifts to `bg-accent-subtle`, and a small indigo dot appears in the top-right corner (no checkmark icon — a dot feels more human, less form-checkbox).
- Selection count indicator: *"3 of 5 selected"* in `text-caption text-text-muted` — bottom center, updates live.

#### Alias Reveal (after account creation)

This is a theatrical moment. The user is about to be given an anonymous identity. It should feel like an event.

**Full-screen overlay** (route transition, not a modal):
- Black background (`bg-text`) — the only time the background is not white.
- Centered vertically:
  - Small caption: *"Your identity, for now"* in `text-caption font-ui text-text-muted` (on dark: `text-white/50`).
  - The alias name in `font-editorial text-display text-white` — e.g. *"Blue Fox"*
  - The abstract avatar renders in using a CSS `path` draw animation (stroke-dashoffset trick). Takes 1.2 seconds. Feels like the avatar is being constructed.
  - Below: *"This is you until you choose a new one. No one knows it's you."* — `text-body font-ui text-white/70`.
  - A pill button: **"Begin →"** in `bg-white text-text` — the color flip from the landing page CTA. The button is white on black instead of black on white.
- On dismiss: the black overlay fades out over 400ms, revealing the home feed.

#### Home Feed — Primary Experience Card

This is the most important surface in the product. A user sees this first every day. It must feel like opening to the right page in a book.

**Layout:**
- The primary card is NOT a card. It has no border, no shadow, no container. It IS the page.
- Post body text in `font-editorial text-headline text-text` with `max-w-reading`. Large. The words fill space.
- Below the text: a thin `1px border-border` divider line.
- Below the divider: the reaction row — minimal, typographic:
  - **"SAME"** button: a pill with `border border-border` + the count in `text-caption`. On activation: `border-accent text-accent bg-accent-subtle`. No icon. The word is the action.
  - Other reactions: small, text-only links in `text-caption text-text-muted`. E.g., *"I understand (12)"*, *"Tell me more (4)"*. No icon buttons in a row.
- Below reactions: a single link in `text-ui text-accent` — *"Talk to someone who's been through this →"*
- The author alias at the very bottom: `text-caption text-text-muted font-ui` — the smallest text on the card. *"Shared by Silver Moth · 2h ago"*. No avatar on the primary card — the alias alone is enough.

**What the primary card does NOT have:**
- A card border or background.
- A profile avatar next to the text.
- A "like" or heart button.
- A share button.
- A comment count.
- A menu/overflow button.

#### Secondary Discovery List

Five smaller entries below the primary card. These are real cards — with a left border accent, not a full border.

**Each secondary card:**
- A `2px` solid `border-l-2` left border in `border-border`. On hover: `border-accent`. This left border grows proportionally taller as the SAME count increases — a visual resonance meter. Implemented via inline style `height: clamp(24px, ${Math.log(sameCount + 1) * 16}px, 100%)` on a positioned pseudo-element.
- Post body: truncated to 2 lines with `line-clamp-2` in `text-body text-text`.
- Below: `text-caption text-text-muted` — *"Relationships · 48 SAME"*.
- No reaction bar. Reactions are for the detail view.
- No author alias visible on secondary cards.
- Entire card is a link to the post detail page.

#### Compose Page

Writing should feel like opening a blank notebook, not filling out a form.

**Layout:**
- The text area is borderless on white. Cursor appears directly on the page. `placeholder="Say what's on your mind..."` in `text-text-muted`.
- Text renders in `font-editorial text-body-lg` as the user types — the text already looks editorial while writing.
- A character count appears in the bottom-right in `text-caption text-text-muted`. It only shows when within 200 characters of the limit. Before that, it is invisible — let the writer write.
- Category selection appears below the text area as minimal typographic buttons: each category name in `font-ui text-ui rounded-pill border border-border px-3 py-1`. Selected state: `border-accent text-accent bg-accent-subtle`. No colored chips.
- The state selector (Current / Past / Exploratory) is a segmented pill control — three options in a single pill outline, the active one filled with `bg-text text-bg`. Feels like a sophisticated selector, not a radio group.
- The safety reminder does NOT appear as a modal. It appears as a marginal note — a `text-caption text-text-muted italic` line that slides up from below the compose area on first focus: *"Tip: no names, locations, or contact details."* It vanishes when the user starts typing.
- The submit button: **"Share anonymously"** — a full-width `rounded-pill bg-text text-bg font-ui` button at the bottom. Inverted (black/white) to signal the weight of the action.

#### Post Detail Page

- Same layout as the primary experience card on home, but adds:
  - The full reaction bar (all secondary reactions).
  - A response text area below reactions: `"Write a response..."` — same borderless compose style, smaller.
  - Response list: each response styled as an indented typographic paragraph below the post, with a thin left border in `border-border`. Like marginalia in a book.
  - No threading/nesting beyond one level.

#### Conversation Thread

The conversation UI is the biggest departure from convention. It should feel like a private letter exchange, not a messaging app.

**Layout:**
- The context card at the top: a `rounded-lg border border-border` container with the text: *"You are connected because both of you selected: [experience name]."* — `font-ui text-body text-text-secondary`. This card is pinned but minimal.
- Messages are NOT left-right chat bubbles. They appear as a **continuous, indented document**:
  - Own messages: full-width, `font-ui text-body text-text`, no bubble.
  - Other party's messages: `pl-5 border-l-2 border-border` — indented with a left border, like a block quote in a letter. A soft visual distinction without the binary left/right of a chat app.
  - Sender alias in `text-caption text-text-muted font-ui` above each message block. Groups consecutive messages from the same sender — alias shown only once per group.
  - Timestamp: `text-caption text-text-muted` — shown only once per group, right-aligned at the bottom of the group.
- The message input: same borderless composer as the compose page, but single-line with `Enter` to send. A small `font-ui text-caption text-text-muted` hint: *"Press Enter to send"* — appears only on first focus.
- The expiry warning appears as a calm banner at the top in `bg-accent-subtle border border-accent text-accent text-caption rounded-md` — no urgency, just information.

**What the conversation thread does NOT have:**
- Read receipts.
- Typing indicators.
- Message timestamps next to every bubble.
- Online presence indicators.
- Message reactions.
- A video/audio call button.

#### "You Are Not Alone" Surface

This is one of the most emotionally important screens. It should feel like a moment of quiet acknowledgment.

**Layout:**
- A single centered typographic statement, large: `"12,841 people shared an experience similar to yours this week."` — `font-editorial text-headline text-text max-w-reading`.
- Below: a list of experience area breakdowns in `text-body font-ui text-text-secondary` — typographic list only, no bars or charts.
- Empty/threshold state: *"Not enough data yet — but you're not alone."* — `font-editorial text-title text-text-muted`. The words carry the emotional weight.

#### "Someone Needs You" Prompt Card

- A `rounded-xl border border-border` card, generously padded.
- Top line: *"Someone is going through this now."* in `font-editorial text-title text-text`.
- The experience name in `text-body text-text-secondary` — the only context given.
- Two pill buttons: **"I can help"** in `bg-text text-bg rounded-pill` and **"Skip"** in `border border-border text-text rounded-pill`. The skip button is deliberately understated — it is always okay to skip.
- Skip counter: *"You have 2 more opportunities today"* in `text-caption text-text-muted` — below the buttons, only visible after first skip.

#### Navigation

The navigation is almost invisible. That is intentional.

**Desktop:**
- Top bar: `border-b border-border`. White background, no shadow.
- Logo/brand: `"Among"` in `font-editorial text-title text-text`. No icon.
- Navigation links: text only — `"Home · Explore · Conversations · You"` — in `font-ui text-ui text-text-secondary`. Active link: `text-text font-medium`. No color on active — just weight. Subtle.
- Compose: a single `rounded-pill border border-border font-ui text-ui` button — *"Share"*. No fill, no color, until hovered: `hover:bg-text hover:text-bg` — inverts on hover. Elegant.
- Notification bell: a lucide-react `Bell` icon in `text-text-muted`. Badge if unread: a small `rounded-full bg-accent` dot — 6px, no number unless count > 9.

**Mobile:**
- Bottom navigation bar (standard mobile pattern). Four icon+label pairs.
- Icons: lucide-react, `stroke-width={1.5}` — thin, not bold.
- Active state: icon and label in `text-accent`. Inactive: `text-text-muted`.
- The Compose button in the mobile nav: a slightly larger pill in the center — `bg-text text-bg` — the single heavy element in the nav.

#### Empty States

No illustrated mascots. No generic "nothing here" copy. Every empty state is typographic and maintains the product's emotional voice.

**Examples by screen:**
- Home feed: *"Nothing new today. Come back tomorrow — the pool refreshes."*
- Saved experiences: *"You haven't saved anything yet. Something will speak to you."*
- Conversations: *"No conversations yet. When the moment feels right, reach out."*
- Category browse (no posts): *"Quiet here for now. Be the first to share something."*
- Blocked users (empty): *"No one blocked."*

All empty states use `font-editorial text-title text-text-muted` for the main line and `font-ui text-body text-text-muted` for any supporting line.

#### Loading States

Loading skeletons follow the layout of the content they replace — no generic gray bars that bear no resemblance to the actual content.

- Primary experience card loading: a `rounded-none` skeleton block at `text-headline` height + three `text-body` lines.
- Secondary list loading: five skeleton entries matching the left-border card pattern.
- Skeleton color: `bg-border` (the same light gray as borders) with a gentle `animate-pulse`.
- No spinner on the primary experience card load — the skeleton is the placeholder.
- `LoadingSpinner` (the rotating icon) is used only for action-in-progress states (submitting a post, sending a message, requesting a match) — never as a page-level loader.

---

### 7B.7 Anonymous Avatar System — Implementation

Avatars are deterministic abstract geometric constructions. They are rendered as SVG, generated from a seed string (the alias seed), and use only the design palette (indigo + neutral grays).

**Implementation in `frontend/src/utils/avatarUtils.ts`:**

1. `seedToParams(seed: string): AvatarParams` — hash the seed string into a series of deterministic numbers using a simple, fast seeded PRNG (e.g., `mulberry32`). Output: `{ shape: 0–3, rotation: 0–359, primaryGray: 0–3, hasIndigoDot: boolean, patternIndex: 0–5 }`.
2. `AvatarParams` drives a set of SVG templates:
   - **Shape 0:** A circle with an off-center inner circle.
   - **Shape 1:** Two overlapping rectangles at different rotations.
   - **Shape 2:** A triangle inside a circle.
   - **Shape 3:** An abstract diagonal slash with a small square.
3. Colors come only from: `['#E8E8E8', '#D0D0D0', '#999999', '#555555']` for fills, with the indigo dot (`#4F46E5`, 8px circle) shown when `hasIndigoDot: true`.
4. `AvatarSVG` React component: accepts `seed: string`, `size: 'sm' | 'md' | 'lg'`, renders deterministically.
5. Sizes: `sm` = 24px (inline/nav), `md` = 40px (cards, conversation context), `lg` = 96px (alias reveal).
6. The SVG has `aria-label={aliasName}` and `role="img"`.

**Key rule:** The same seed always produces exactly the same SVG. Different seeds always produce visually distinguishable results. There must be no two aliases with identical avatars in a list of 20.

---

### 7B.8 Micro-Interactions & Motion

All motion is defined in `frontend/src/styles/globals.css` as CSS custom property durations and a set of named Tailwind animation classes. Never define keyframes inline in component files.

```css
/* globals.css */
--duration-instant:  80ms;
--duration-fast:    150ms;
--duration-normal:  250ms;
--duration-slow:    400ms;
--duration-reveal:  600ms;
--ease-standard:    cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-out:         cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);
```

**Defined interactions (these are the only animations in the product):**

| Interaction | Behavior | Duration |
|---|---|---|
| Button hover | `opacity: 1 → 0.85` + `scale(0.98)` | `--duration-fast` |
| Button press (active) | `scale(0.96)` | `--duration-instant` |
| SAME button activate | border/background color transition + count number `translateY(-4px) → 0` fade in | `--duration-normal` |
| Reaction count update | Number fades out `opacity 1→0, translateY 0→-4px`, new number fades in `opacity 0→1, translateY 4px→0` | `--duration-normal` |
| Route transition | Page content `opacity 0→1` + `translateY 8px→0` | `--duration-slow` + `--ease-out` |
| Modal open | Overlay `opacity 0→1`, modal `scale(0.97)→1 + opacity 0→1` | `--duration-normal` |
| Modal close | Reverse, faster — `--duration-fast` |
| Alias reveal (dark screen appear) | Overlay `opacity 0→1` | `--duration-slow` |
| Avatar draw (alias reveal) | SVG stroke-dashoffset animation — 1200ms | Custom, defined in `globals.css` |
| Hero text word stagger (landing) | `opacity 0→1 + translateY 8px→0` per word, `150ms` stagger | `--duration-slow` |
| Category tile select | `border-color` + `background-color` transition | `--duration-fast` |
| Skeleton pulse | Standard `animate-pulse` | Tailwind default |
| Crisis banner appear | `translateY(-8px)→0 + opacity 0→1` as `aria-live` | `--duration-normal` |

**Hard prohibition list for motion:**
- ❌ No spring/bounce physics.
- ❌ No confetti, particle, or celebratory effects.
- ❌ No animations triggered by streak milestones or reaction thresholds.
- ❌ No parallax scrolling.
- ❌ No marquee/ticker elements.
- ❌ No auto-playing anything.
- ❌ No motion that lasts longer than 600ms (except the alias reveal draw, which is a one-time event).
- Respect `prefers-reduced-motion`: all animations wrap in `@media (prefers-reduced-motion: no-preference)`. Reduced-motion users get instant transitions.

---

### 7B.9 shadcn/ui Customization Strategy

shadcn/ui provides unstyled primitives. Every shadcn component that ships in AMONG must be restyled to match the design language. Do not ship any shadcn component in its default visual state.

**Components and their AMONG-specific overrides:**

| Component | Default shadcn feel | AMONG override |
|---|---|---|
| `Button` | Rounded, colored variants | Re-define: `default` = inverted pill (`bg-text text-bg`), `outline` = pill with `border-border`, `ghost` = no border, `destructive` = muted red | 
| `Input` | Small-radius, generic | `rounded-md border-border focus:border-accent focus:ring-1 focus:ring-accent-subtle` — no colored ring flood |
| `Textarea` | Same as Input | Borderless variant for compose flow. Standard bordered variant for admin forms |
| `Dialog` | Drop-shadow heavy | No shadow. `border border-border rounded-xl`. Overlay is `bg-text/20` (light, not dark blocking) |
| `Badge` | Colorful filled | Text-only, `border border-border rounded-pill text-caption text-text-secondary`. No fill colors |
| `Skeleton` | Generic gray block | Uses `bg-border` to match the actual border color — feels like a real placeholder, not a loading bar |
| `Separator` | `bg-border` | Keep — already correct |
| `Tooltip` | Dark pill | `bg-text text-bg text-caption rounded-md` — consistent with the inverted button language |
| `Alert` | Colored left-border | Left-border style retained, but uses `var(--color-semantic-*)` palette — muted, not saturated |

---

### 7B.10 Responsive Design Implementation

AMONG is responsive web first. All layouts are mobile-first in Tailwind class order.

**Breakpoints (Tailwind defaults — don't customize):**
- `sm`: 640px — tablet portrait
- `md`: 768px — tablet landscape
- `lg`: 1024px — desktop
- `xl`: 1280px — wide desktop (max useful content width reached before this)

**Layout behavior per breakpoint:**

| Surface | Mobile (default) | md+ |
|---|---|---|
| Navigation | Bottom fixed bar, icon+label | Top horizontal bar, text-only links |
| Primary experience card | Full-width, body at `text-body-lg` | Centered column `max-w-2xl`, body at `text-headline` |
| Secondary discovery list | Full-width single column | `max-w-2xl` centered |
| Category browse | 2-column tile grid | 3-column tile grid |
| Compose | Full-screen route | Centered column `max-w-xl` |
| Conversation thread | Full-screen route | Centered column `max-w-lg` |
| Landing hero | `text-title-xl` headline | `text-display` headline |

**Mobile-specific rules:**
- Touch targets: minimum `44px × 44px` for all interactive elements — use `min-h-[44px] min-w-[44px]` utilities.
- No hover-dependent interactions on mobile — all hover effects must have equivalent tap states.
- Bottom navigation replaces top nav on mobile — implemented via a `useBreakpoint()` hook.
- Font sizes on mobile: never smaller than `14px` (`text-ui`) for interactive labels, never smaller than `12px` (`text-caption`) for any visible text.

---

### 7B.11 Component File Conventions

Every component file in `frontend/src/components/` follows this structure:

```typescript
// 1. Imports (external, then internal)
// 2. Types/Props interface (local to this file, not exported unless reused)
// 3. Constants (design values referenced by name, imported from tokens)
// 4. The component (single default export)
// 5. Sub-components (private to this file if small enough, else extracted)
// 6. No inline styles — all styling via Tailwind utility classes
// 7. cn() utility for conditional class merging (from shadcn/utils)
```

- Use `cn()` (from `lib/utils.ts`) for conditional class composition — never string interpolation of class names.
- All user-facing string labels are imported from `shared/constants/` or a `labels.ts` file — never hardcoded.
- No component imports a Tailwind color value directly — all colors via design token class names.

**Unit tests for UI components:** Use React Testing Library. Test behavior (what the user sees and can do), not implementation. Key patterns:
- `getByRole`, `getByLabelText`, `getByText` — accessible queries only.
- `userEvent` for interactions — not `fireEvent`.
- Assert ARIA attributes are present on all interactive and live-region elements.
- Assert design-token class names are applied (not hex values).

---

### 7B.12 Phase 2B Definition of Done

- [ ] All typography tokens defined in `tailwind.config.ts` and verifiable in a component storyboard.
- [ ] Color tokens defined as CSS custom properties and Tailwind extensions — no raw hex in any component file.
- [ ] shadcn/ui components overridden to match the AMONG design language.
- [ ] `AvatarSVG` component renders deterministically from seed — verified by unit test.
- [ ] All motion defined in `globals.css` — no keyframes inline in component files.
- [ ] `prefers-reduced-motion` wrapper applied to all animations.
- [ ] All interactive elements meet 44×44px minimum tap target size.
- [ ] Landing page hero implemented with word-stagger animation.
- [ ] Alias reveal full-screen overlay implemented with avatar draw animation.
- [ ] Primary experience card renders without card border/shadow — the text IS the page.
- [ ] Compose text area is borderless with the marginal-note safety reminder.
- [ ] Conversation thread uses indented paragraph style, not left/right chat bubbles.
- [ ] All empty states use the AMONG voice — no generic "nothing here" copy.
- [ ] Skeleton loaders match the actual content layout.
- [ ] All components pass `jest-axe` accessibility checks.

---

## 8. Phase 3 — Authentication & Anonymous Identity System

**Goal:** Complete sign-in/sign-up flow, private account creation, temporary alias system, onboarding flow, age gate, and alias rotation. This is the identity foundation all other features depend on.

**Dependencies:** Phases 1 and 2 complete.

**Expected outcome:** A new user can sign in with Google, complete onboarding, receive a temporary alias, and log in again from another device. Alias rotation is available and rate-limited.

### 8.1 Backend — User model

Define `backend/src/modules/users/user.model.ts` (Mongoose schema):

```
User {
  _id: ObjectId
  firebaseUid: String (unique, indexed)
  email: String (private, never in API responses)
  role: UserRole (from constants)
  subscriptionTier: SubscriptionTier
  onboardingComplete: Boolean
  ageConfirmed: Boolean
  tosAccepted: Boolean
  tosAcceptedAt: Date
  categoryInterests: [CategoryId] (3–5 required post-onboarding)
  currentAlias: {
    name: String
    avatarSeed: String
    issuedAt: Date
    expiresAt: Date
  }
  aliasRotationCount: Number
  lastAliasRotationRequestAt: Date
  enforcementStatus: {
    isBanned: Boolean
    bannedAt: Date
    restrictionType: String (from constants)
    restrictionExpiresAt: Date
    warningCount: Number
  }
  snyOptIns: [CategoryId]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date (soft delete)
}
```

Indexes: `firebaseUid` (unique), `currentAlias.expiresAt` (for alias rotation job), `enforcementStatus.isBanned`.

### 8.2 Backend — Alias generator

Implement `backend/src/utils/aliasGenerator.ts`:

1. Maintain a word list: adjective array + noun array (minimum 100 each).
2. `generateAlias(seed?: string): { name: string, avatarSeed: string }` — deterministic if seed provided (for regeneration), random otherwise.
3. Alias format: `"[Adjective] [Noun]"` — e.g. `"Blue Fox"`.
4. `isAliasExpired(user: User): boolean` — checks `currentAlias.expiresAt` against `now`.
5. `canRequestRotation(user: User): boolean` — checks `lastAliasRotationRequestAt` is more than `ALIAS_ROTATION_RATE_LIMIT_HOURS` ago.

**Unit tests:** Assert deterministic output for same seed. Assert uniqueness across random calls (statistical). Assert `isAliasExpired` returns true/false correctly. Assert `canRequestRotation` enforces the rate limit. Assert name is `"Adjective Noun"` format.

### 8.3 Backend — Avatar generator

Implement `backend/src/utils/avatarGenerator.ts`:

1. `generateAvatarData(seed: string): AvatarData` — returns a set of deterministic abstract geometric parameters (shape type, size, rotation, color from the approved palette — indigo accent + neutral grays only, no rainbow palette).
2. Avatar is fully abstract (no faces, silhouettes, or human-suggestive forms).
3. Same seed always produces the same avatar data.
4. Alias rotation changes the seed, changing the avatar.

**Unit tests:** Assert same seed → same output. Assert different seed → different output. Assert all returned colors are from the approved palette. Assert no face/humanoid descriptors in output.

### 8.4 Backend — User service

Implement `backend/src/modules/users/user.service.ts`:

1. `findOrCreateUser(firebaseUid, email)` — idempotent user creation on first sign-in.
2. `completeOnboarding(userId, { categories, ageConfirmed, tosAccepted })` — validates inputs (3–5 categories, age confirmed, tos accepted), creates initial alias, marks `onboardingComplete: true`.
3. `rotateAlias(userId)` — checks rate limit, generates new alias+avatar, persists, returns new alias.
4. `scheduleAliasRotation(userId)` — sets `currentAlias.expiresAt` to `now + ALIAS_ROTATION_CYCLE_DAYS`.
5. `getPublicProfile(userId)` — returns ONLY: alias name, avatar data. Never returns email, Firebase UID, enforcement history.
6. `updateCategoryInterests(userId, categories)` — validates 3–5 categories.
7. `getSnyOptIns(userId)` — returns category IDs user has opted into for SNY.
8. `setSnyOptIn(userId, categoryId, optIn)`.
9. `softDeleteAccount(userId)` — sets `deletedAt`, schedules full data anonymization job.

**Unit tests (high coverage):** `findOrCreateUser` — new user created, existing user returned unchanged. `completeOnboarding` — valid input succeeds, <3 categories fails, ageConfirmed=false fails, tosAccepted=false fails. `rotateAlias` — rate limit enforced, new alias differs from old. `getPublicProfile` — never returns email or Firebase UID. `softDeleteAccount` — sets deletedAt, does not purge immediately.

### 8.5 Backend — Auth routes

Implement `backend/src/modules/users/user.routes.ts`:

```
POST /api/auth/session       → Create/resume session after Firebase sign-in
GET  /api/users/me           → Get current user's private profile (auth required)
POST /api/users/me/onboarding → Complete onboarding
PUT  /api/users/me/alias/rotate → Request alias rotation (rate-limited)
PUT  /api/users/me/categories → Update category interests
GET  /api/users/me/settings  → Get settings bundle
PUT  /api/users/me/settings/notifications → Update notification preferences
PUT  /api/users/me/settings/sny → Update SNY opt-ins
POST /api/users/me/export    → Trigger data export
DELETE /api/users/me         → Delete account
```

All routes except `POST /api/auth/session` require `auth.middleware`.

**Unit tests (controller):** Assert `POST /auth/session` creates user on first call, returns existing on subsequent. Assert `GET /users/me` returns no email/UID. Assert rotation is rate-limited. Assert onboarding validation rejects bad input.

### 8.6 Frontend — Auth Redux slice

Implement `frontend/src/features/auth/`:

1. `authSlice.ts`:
   - State: `{ status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated', user: PrivateUser | null, error: string | null }`.
   - Reducers: `setUser`, `clearUser`, `setError`.
2. `authThunks.ts`:
   - `signInWithGoogleThunk`: calls Firebase Google sign-in → calls `POST /api/auth/session` → dispatches `setUser`.
   - `signOutThunk`: calls Firebase sign-out → dispatches `clearUser`.
   - `restoreSessionThunk`: on app load, checks Firebase `onAuthStateChanged`, calls `GET /users/me` if token present.
3. `authSelectors.ts`: `selectIsAuthenticated`, `selectCurrentUser`, `selectAuthStatus`, `selectOnboardingComplete`.

**Unit tests:** All slice reducers return correct state. `signInWithGoogleThunk` — mock Firebase → mock API → assert `setUser` dispatched. `restoreSessionThunk` — no Firebase user → `clearUser`. API error → `setError`.

### 8.7 Frontend — Identity Redux slice

Implement `frontend/src/features/identity/`:

1. `identitySlice.ts`:
   - State: `{ alias: Alias | null, avatar: AvatarData | null, isRotating: boolean }`.
   - Reducers: `setAlias`, `setRotating`.
2. `identityThunks.ts`:
   - `fetchIdentityThunk`: calls `GET /users/me` and extracts alias + avatar.
   - `rotateAliasThunk`: calls `PUT /users/me/alias/rotate`, updates slice, shows success toast.
3. `identitySelectors.ts`: `selectAlias`, `selectAvatarData`, `selectAliasName`.

**Unit tests:** Alias rotation success → new alias in state. Rotation rate-limited → error state with `ERR_RATE_LIMITED`. Active conversations preserve old alias display (test the utility that resolves alias per conversation).

### 8.8 Frontend — Onboarding flow

Implement pages and components:

1. `IntentSelector.tsx` — Choose: Share / Find / Help / Explore (4 cards). On select, navigate to category selection.
2. `CategorySelector.tsx` — Grid of all experience categories from `shared/constants/experienceCategories.ts`. Min 3, max 5 selectable. Validation inline. Submit → navigate to account creation.
3. `AgeGate.tsx` — Checkbox: "I confirm I meet the minimum age requirement." Blocks progression if unchecked.
4. `TermsAcceptance.tsx` — Links to Terms and Safety Guidelines. Checkbox required. Not shown on every page — only on first post (FR-6), wired into compose flow.
5. `AliasReveal.tsx` — After account creation, shown once: "Your identity is: [Blue Fox]" with avatar. Explains temporality and anonymity.
6. `account/page.tsx` — Google Sign-In button, age gate, continues onboarding.

**Unit tests:** `CategorySelector`: selecting < 3 shows validation message, selecting > 5 blocks additional selection, submit with valid selection calls thunk. `AgeGate`: unchecked blocks progression. `IntentSelector`: all 4 intents render, clicking routes correctly.

### 8.9 Frontend — Auth guard

1. Implement `useAuth.ts` hook:
   - Subscribes to Firebase `onAuthStateChanged`.
   - Dispatches `restoreSessionThunk` on mount.
   - Returns `{ isAuthenticated, isLoading, user }`.
2. Implement route guards in the `(app)/layout.tsx`:
   - Redirect unauthenticated users to landing page.
   - Redirect authenticated users without `onboardingComplete` to onboarding.
3. Implement route guards in the `(auth)/layout.tsx`:
   - Redirect authenticated users with `onboardingComplete` to home.

**Unit tests:** `useAuth`: Unauthenticated state → redirect. `restoreSessionThunk` called on mount. Loading state shown while restoring.

### 8.10 Backend — Alias rotation job

Implement `backend/src/jobs/aliasRotation.job.ts`:

1. Runs daily (Agenda cron job).
2. Queries users whose `currentAlias.expiresAt < now` and `onboardingComplete = true`.
3. For each, calls `user.service.rotateAlias()`.
4. Does NOT rotate aliases for users with active conversations (alias persists for life of conversation per PRD §6.1).
5. Logs rotation count.

**Unit tests:** Assert rotation only fires for expired aliases. Assert users with active conversations are skipped. Assert rotation count is logged.

---

## 9. Phase 4 — Posting System

**Goal:** Full post creation, editing, deletion, and retrieval. Safety reminder, automated pre-publish content check, daily post limit enforcement, edit window enforcement.

**Dependencies:** Phase 3 complete (auth, user accounts).

**Expected outcome:** Users can publish posts, edit within the window, delete at any time, see their own posts. Posts are persisted with correct states.

### 9.1 Backend — Post model

Define `backend/src/modules/posts/post.model.ts`:

```
Post {
  _id: ObjectId
  authorAccountId: ObjectId (ref: User, never in public API responses)
  authorAlias: String (snapshot of alias at time of post — alias name only)
  authorAvatarSeed: String (snapshot for consistent avatar display)
  body: String (min 20, max 3000 chars)
  categoryIds: [CategoryId] (1–3, 0 allowed for Things I Can't Say)
  state: PostState (CURRENT | PAST | EXPLORATORY)
  visibilityScope: String (BROAD | FOCUSED | PRIVATE)
  status: PostStatus (PUBLISHED | DELETED_BY_USER | REMOVED_BY_MODERATION | EXPIRED)
  publishedAt: Date
  editableUntil: Date (publishedAt + POST_EDIT_WINDOW_MS)
  editedAt: Date (nullable)
  deletedAt: Date (nullable, soft delete)
  moderationNotes: String (internal, never in public API)
  contentFlags: [String] (internal, automated scan results, never in public API)
  reactionCounts: {
    current: Number
    past: Number
    considering: Number
    same: Number
    iUnderstand: Number
    iLearned: Number
    iDisagree: Number
    tellMeMore: Number
  }
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `authorAccountId + createdAt`, `categoryIds + publishedAt`, `status`, `deletedAt`.

### 9.2 Backend — Content scanner

Implement `backend/src/modules/moderation/contentScanner.service.ts`:

1. `scanPost(body: string): ScanResult` — checks for:
   - Phone number patterns (regex).
   - Email address patterns (regex).
   - Social handle patterns (`@username`-style).
   - Explicit threat keywords.
   - URL patterns.
2. Returns `{ hasCriticalViolations: boolean, hasWarnings: boolean, detectedPatterns: PatternType[] }`.
3. `hasCriticalViolations = true` blocks publish (e.g. explicit illegal solicitation).
4. `hasWarnings = true` triggers safety reminder display but does not block.
5. All pattern definitions live in `shared/constants/contentPatterns.ts` (not inline regex in service).

**Unit tests:** Assert phone number patterns detected. Assert email patterns detected. Assert handle patterns detected. Assert clean content returns no violations. Assert critical vs. warning distinction is correct. Assert false-positive rate is low for common number strings (e.g. years).

### 9.3 Backend — Crisis detection

Implement `backend/src/modules/moderation/crisisDetection.service.ts`:

1. `detectCrisisContent(text: string): CrisisResult` — checks for high-risk patterns: explicit self-harm intent, explicit harm-to-others intent.
2. Returns `{ isCrisis: boolean, crisisType: string | null }`.
3. Crisis detection result triggers crisis resource surfacing in the API response — it does NOT delay or block the content from being processed through the normal moderation queue.
4. Pattern definitions in `shared/constants/crisisPatterns.ts`.

**Unit tests (critical coverage required):** Assert explicit self-harm phrases are detected. Assert general sadness language does NOT trigger crisis. Assert crisis result includes correct `crisisType`. Assert function never throws — must always return a result.

### 9.4 Backend — Post service

Implement `backend/src/modules/posts/post.service.ts`:

1. `createPost(authorId, { body, categoryIds, state, visibilityScope })`:
   - Validate daily post limit: check `DAILY_POST_LIMIT` posts by `authorId` today; reject with `ERR_RATE_LIMITED` if exceeded.
   - Run `contentScanner.scanPost(body)`.
   - If `hasCriticalViolations`, reject with `ERR_CONTENT_VIOLATION`.
   - Run `crisisDetection.detectCrisisContent(body)`.
   - Create `Post` document with `status: PUBLISHED`.
   - Set `editableUntil = now + POST_EDIT_WINDOW_MS`.
   - Update `experienceGraph` for author (see Phase 8).
   - Return `{ post, crisisDetected, safetyWarnings }`.
2. `editPost(authorId, postId, { body })`:
   - Verify author owns post.
   - Verify `now < editableUntil`.
   - Run content scan on new body.
   - Update `post.body`, `post.editedAt`.
3. `deletePost(authorId, postId)`:
   - Verify author owns post.
   - Set `status: DELETED_BY_USER`, `deletedAt: now`.
   - Remove from all feeds and matching indices.
4. `getPostById(postId, requestingUserId)`:
   - Returns post if status is PUBLISHED.
   - If DELETED or REMOVED, return `{ status, redirectCategoryId }` for SEO fallback (FR-SEO-19).
   - Strips `authorAccountId`, `moderationNotes`, `contentFlags` from response.
   - Attaches the requesting user's own reaction (if any) for the reaction bar.
5. `getPostsByCategory(categoryId, { cursor, limit })` — paginated, bounded.
6. `getPostsByAuthor(authorId, { cursor, limit })` — for the user's own post history only.

**Unit tests (critical):** Daily limit enforced at boundary. Edit window enforced: before window passes, after passes. Author verification: cannot edit/delete other user's post. Content scanner integration: critical violation blocks creation. Crisis detection: post created even if crisis detected, response includes flag. Response stripping: `authorAccountId` never in returned object. Deleted post returns redirect info. Cursor pagination returns correct page.

### 9.5 Backend — Post routes

```
POST /api/posts            → Create post (auth, rate limit: posting)
GET  /api/posts/:id        → Get single post (auth optional for public posts)
PUT  /api/posts/:id        → Edit post (auth, must be author, within edit window)
DELETE /api/posts/:id      → Delete post (auth, must be author)
GET  /api/posts/my         → Get current user's own posts (auth, paginated)
```

### 9.6 Frontend — Compose feature

1. Implement `ComposeForm.tsx`:
   - Text area with character count (live). Minimum 20 / maximum 3000 from `shared/constants/limits.ts`.
   - `CategorySelector` subcomponent (reuse from onboarding, parameterized for 1–3 range).
   - "Things I Can't Say" mode: category requirement drops to 0.
   - `PostStateSelector` (CURRENT / PAST / EXPLORATORY) — radio group with accessible labels.
   - Visibility scope selector (BROAD / FOCUSED / PRIVATE).
   - Zod schema validation inline (imported from `shared/schemas/post.schema.ts`).
   - Safety reminder displayed once per session on submit attempt (stored in local state, not Redux — session-scoped).
   - Submit button disabled until valid.
2. Implement `SafetyReminder.tsx`:
   - Modal shown before first submit each session.
   - Displays: "Don't include names, locations or contact details."
   - User must confirm to proceed.
   - Shown once per session; `sessionStorage` prevents re-show.
3. `compose/page.tsx` — route that renders `ComposeForm` with submission handling.

**Unit tests:** Character count updates in real time. Submit blocked when <20 chars. Submit blocked when >3000 chars. Category validation: requires 1–3 (except Things I Can't Say mode). Safety reminder shown on first submit, not on second. Form reset after successful submission. Zod schema: test all boundary conditions.

### 9.7 Frontend — Posts Redux slice

1. `postsSlice.ts`:
   - State: `{ byId: Record<string, Post>, myPosts: string[], draftPost: Partial<Post> | null, submitting: boolean, error: string | null }`.
2. `postsThunks.ts`:
   - `createPostThunk`: API call → on success dispatches to slice and discovery slice.
   - `editPostThunk`: API call → updates byId.
   - `deletePostThunk`: API call → removes from byId.
   - `fetchPostThunk(postId)`: API call → adds to byId.
3. Handle `crisisDetected: true` in `createPostThunk` response → dispatch to show `CrisisResourceBanner`.

**Unit tests:** `createPostThunk` success → post in state. `createPostThunk` failure → error in state. `deletePostThunk` → post removed from byId. `editPostThunk` → post body updated. Crisis flag → crisis banner action dispatched.

---

## 10. Phase 5 — Reactions & "Same" System

**Goal:** Complete reaction system. Primary (exclusive) and secondary (non-exclusive) reactions. Aggregate counts only. No individual reaction identity exposed. Real-time count updates.

**Dependencies:** Phase 4 complete (posts).

**Expected outcome:** Users can react to posts with any combination of allowed reactions, counts update in near-real-time, no "who reacted" data is ever exposed.

### 10.1 Backend — Reaction model

Define `backend/src/modules/reactions/reaction.model.ts`:

```
Reaction {
  _id: ObjectId
  accountId: ObjectId (ref: User, never in public API)
  postId: ObjectId (ref: Post)
  primaryReaction: PrimaryReactionType | null (CURRENT | PAST | CONSIDERING)
  secondaryReactions: [SecondaryReactionType] (SAME | I_UNDERSTAND | I_LEARNED | I_DISAGREE | TELL_ME_MORE)
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `accountId + postId` (unique compound — one reaction record per user per post), `postId`.

### 10.2 Backend — Reaction service

Implement `backend/src/modules/reactions/reaction.service.ts`:

1. `setReaction(accountId, postId, { primaryReaction, secondaryReactions })`:
   - Upsert the `Reaction` document for `accountId + postId`.
   - After upsert, recompute `Post.reactionCounts` by running an aggregation query (or incrementing with a delta approach for performance).
   - Update `ExperienceGraph` for the user (see Phase 8).
   - Return updated aggregate counts only — never return individual reaction records.
2. `removeReaction(accountId, postId)`:
   - Delete `Reaction` document.
   - Recompute counts.
3. `getUserReactionForPost(accountId, postId)`:
   - Returns the user's own `Reaction` record — used only to populate the author's own reaction bar state, never shared with others.
4. `getAggregateCounts(postId)`:
   - Returns `Post.reactionCounts` — all numeric, no user references.
5. Privacy invariant (enforced in service, not just controller): no function returns a list of `accountIds` who reacted. This is a hard contract.

**Unit tests (critical — privacy):** `setReaction` upserts correctly. Primary reaction is exclusive — setting PAST removes any previous CURRENT. Secondary reactions are additive — can hold multiple. `getAggregateCounts` never returns user identifiers. `getUserReactionForPost` returns only the caller's own data. Count recomputation is accurate after multiple set/remove cycles. Reaction on non-existent post returns 404. Reaction by banned user returns 403.

### 10.3 Backend — Reaction routes

```
PUT  /api/posts/:postId/reactions   → Set/update reaction (auth, rate limit: reactions)
DELETE /api/posts/:postId/reactions → Remove reaction (auth)
GET  /api/posts/:postId/reactions   → Get aggregate counts + caller's own reaction (auth)
```

### 10.4 Frontend — Reaction components

1. `ReactionBar.tsx`:
   - Shows all reaction buttons (primary group + secondary group).
   - Highlights user's current selections using their own reaction from `getUserReactionForPost` (loaded with the post).
   - Emits `setReactionThunk` on interaction.
   - Optimistic updates: update local count immediately, rollback on API error.
2. `SameButton.tsx`:
   - Prominent "SAME" button from secondary reactions.
   - Count displayed as privacy-safe formatted number (e.g. "12.8k" not "12,841 people with names").
3. `PrimaryReactionSelector.tsx`:
   - Radio-style (mutually exclusive) buttons for CURRENT / PAST / CONSIDERING.
   - Labels from `shared/constants/reactionTypes.ts`.
4. `ReactionCounts.tsx`:
   - Displays all aggregate counts.
   - Numbers formatted via `formatCount.ts` utility.
   - Animated count update (gentle, no confetti per PRD §14.6).
   - `PrivacySafeCount.tsx`: Wraps count display — if count is below `PRIVACY_THRESHOLD_MIN_GROUP_SIZE`, shows "< {threshold}" rather than the exact number.

**Unit tests:** `ReactionBar`: Selecting a primary reaction deselects previous primary. Multiple secondary reactions can be selected simultaneously. Optimistic update reverts on error. `PrivacySafeCount`: Counts below threshold display masked value. Counts above threshold display formatted value. `SameButton`: Aria-label is descriptive. `ReactionCounts`: Correct reaction labels used (from constants, not hardcoded strings).

### 10.5 Frontend — Reactions Redux slice

1. `reactionsSlice.ts`:
   - State: `{ byPostId: Record<string, { counts: ReactionCounts, myReaction: UserReaction | null }>, loading: Record<string, boolean> }`.
2. `reactionsThunks.ts`:
   - `setReactionThunk(postId, reaction)` — optimistic update → API call → confirm or rollback.
   - `removeReactionThunk(postId)` — optimistic update → API call.
   - `fetchReactionForPostThunk(postId)` — loads counts + own reaction.

**Unit tests:** Optimistic update applies before API resolves. Rollback applies on API failure. Primary reaction exclusivity enforced in thunk (not just server-side — UX must be consistent).

---

## 11. Phase 6 — Discovery Feed & Ranking

**Goal:** Home feed with one primary daily experience and up to 5 secondary discoveries. Category browse. Saved experiences. Ranking engine with configurable weights.

**Dependencies:** Phases 4 and 5 complete.

**Expected outcome:** Home feed shows relevant, diverse, non-repeated content. Ranking is weighted composite. Weights are admin-configurable at runtime.

### 11.1 Backend — Ranking service

Implement `backend/src/modules/discovery/ranking.service.ts`:

1. Load ranking weights from `adminConfig.service.ts` (admin-configurable, cached with a short TTL — never hardcoded).
2. `scorePost(post, user, weights): number` — composite score based on:
   - **Experience similarity** (how closely post categories match user's `categoryInterests`): weight W1.
   - **Recency** (time-decay function, configurable half-life): weight W2.
   - **Meaningful response quality** (ratio of meaningful secondary reactions to total reactions, not raw count): weight W3.
   - **Diversity signal** (posts in categories underrepresented in user's recent feed): weight W4.
   - **Safety confidence** (penalize posts with open reports, posts from accounts with enforcement history): weight W5.
   - **Anti-repeat** (posts the user has already reacted to or seen today are excluded entirely).
   - **Anti-popularity-monopoly** (log-dampen raw reaction counts so a post with 20k reactions doesn't solely dominate).
3. `getRankedFeed(userId, { primaryCount: 1, secondaryCount: 5 })`:
   - Query candidate posts (PUBLISHED, not seen today by user, not from blocked accounts).
   - Score each with `scorePost`.
   - Return top 1 as primary, top 5 of the remainder as secondary.
4. `getCategoryFeed(userId, categoryId, { cursor, limit })`:
   - Paginated, bounded (not infinite scroll).
   - Applies reduced ranking (recency + safety + anti-repeat).

**Unit tests (critical):** Blocked accounts' posts excluded. Previously seen posts excluded. Popularity dampening: post with 20k raw reactions does not always outrank post with 80 meaningful responses (verify with test fixtures). Safety penalty applies to flagged posts. Category match boosts relevant posts. Weights configurable: changing weights changes score order (test with two posts where score order reverses under different weights).

### 11.2 Backend — Discovery service & routes

Implement `backend/src/modules/discovery/discovery.service.ts` and routes:

```
GET /api/discovery/feed              → Primary (1) + Secondary (up to 5) posts for home
GET /api/discovery/category/:slug    → Bounded paginated category browse
GET /api/posts/:id/similar           → Similar posts by experience (for SEO internal linking)
POST /api/posts/:id/saved            → Save a post (auth)
DELETE /api/posts/:id/saved          → Unsave a post (auth)
GET /api/users/me/saved              → Get saved post list (auth, paginated)
GET /api/users/me/you-are-not-alone  → Aggregate stats for the user's experience areas
```

`/api/discovery/feed` uses `ranking.service.getRankedFeed`.

**Unit tests:** Feed response contains exactly 1 primary and ≤5 secondary items. Category feed is bounded (does not return infinite items per call). Saved list is private (auth required, other users cannot access). `you-are-not-alone` aggregate respects `PRIVACY_THRESHOLD_MIN_GROUP_SIZE` (groups below threshold are masked).

### 11.3 Backend — "You Are Not Alone" aggregate

1. `getYouAreNotAloneStats(userId)`:
   - For each of the user's `categoryInterests`, count how many other users posted in that category in the last 7 days.
   - For any category where the count < `PRIVACY_THRESHOLD_MIN_GROUP_SIZE`, do not return the count — return `{ belowThreshold: true }` instead.
   - Return a list of experience area stats: `{ categoryId, count | belowThreshold }`.
   - Never return individual user data.

**Unit tests (privacy-critical):** Categories below threshold return masked response. Categories above threshold return count. No individual user data included in aggregation pipeline result.

### 11.4 Frontend — Discovery components

1. `PrimaryExperienceCard.tsx`:
   - Displays the single primary post with editorial-weight layout.
   - Full body text visible (no truncation for primary post).
   - Shows reaction bar and "Talk to someone" CTA.
   - Generous whitespace per PRD §14.4 design direction.
2. `SecondaryDiscoveryList.tsx`:
   - List of up to 5 secondary cards.
   - Truncated body preview (2–3 lines max).
   - Each links to post detail.
3. `YouAreNotAlone.tsx`:
   - Displays aggregate stats: "12,841 people shared a similar experience this week."
   - Uses `PrivacySafeCount.tsx` — never shows precise count if below threshold.
   - Empty/below-threshold state: "Not enough data to show this yet."
4. `CategoryBrowse.tsx`:
   - Grid or list of all categories (from `shared/constants/experienceCategories.ts`).
   - Each links to `explore/[category]` route.
   - Cross-links to related categories per PRD §19.2 FR-SEO-16.

**Unit tests:** `PrimaryExperienceCard`: renders full body, not truncated. `SecondaryDiscoveryList`: renders max 5 items. `YouAreNotAlone`: below-threshold shows masked text; above-threshold shows formatted count. `CategoryBrowse`: all categories render, links are correct slugs.

### 11.5 Frontend — Discovery Redux slice

1. `discoverySlice.ts`:
   - State: `{ primaryPost: string | null, secondaryPosts: string[], categoryFeed: Record<string, string[]>, feedFetched: boolean, loading: boolean }`.
   - Secondary post IDs reference `postsSlice.byId`.
2. `discoveryThunks.ts`:
   - `fetchHomeFeedThunk` — loads primary + secondary, populates both discovery and posts slices.
   - `fetchCategoryFeedThunk(categoryId, cursor)` — paginated category browse.

---

## 12. Phase 7 — Messaging & Temporary Conversations

**Goal:** Complete temporary anonymous 1:1 conversation system: match request, matching, active conversation, inactivity expiry, max-duration expiry, all state transitions, prohibited-info detection, feedback prompt on end. No persistent connections.

**Dependencies:** Phase 3 (identity), Phase 4 (posts, for experience context), Phase 9 (moderation — report/block in messaging).

**Expected outcome:** Two users can be matched based on experience, have a real-time conversation, have it automatically expire or end it manually. No contact info or persistent relationship.

### 12.1 Backend — Conversation model

Define `backend/src/modules/conversations/conversation.model.ts`:

```
Conversation {
  _id: ObjectId
  participantAccountIds: [ObjectId] (exactly 2, never in API response — hidden behind aliases)
  participantAliasSnapshots: [{ accountId: ObjectId, aliasName: String, avatarSeed: String }]
  contextPostId: ObjectId (ref: Post, nullable — can also start from SNY prompt)
  contextCategoryId: CategoryId
  state: ConversationState (from constants)
  requestedAt: Date
  matchedAt: Date (nullable)
  startedAt: Date (first message sent, nullable)
  lastActivityAt: Date (nullable)
  inactivityWarningAt: Date (nullable)
  expiresAt: Date (startedAt + MAX_DURATION_MS, nullable until started)
  endedAt: Date (nullable)
  endReason: String (from constants)
  feedbackA: Boolean | null (was this helpful — for initiating party)
  feedbackB: Boolean | null (for receiving party)
  matchRequestExpiresAt: Date (requestedAt + MATCH_REQUEST_EXPIRY_MS)
  createdAt: Date
}
```

Define `backend/src/modules/conversations/message.model.ts`:

```
Message {
  _id: ObjectId
  conversationId: ObjectId (ref: Conversation)
  senderAccountId: ObjectId (ref: User, never in API — show as alias)
  senderAliasSnapshot: String
  body: String (max from limits.ts)
  contactInfoWarning: Boolean (flagged by prohibited-info detector)
  deletedAt: Date (for moderation removal)
  sentAt: Date
}
```

Indexes: `conversationId + sentAt`, `participantAccountIds + state`.

### 12.2 Backend — Matching service

Implement `backend/src/modules/conversations/matching.service.ts`:

1. `createMatchRequest(accountId, { contextPostId | contextCategoryId })`:
   - Validate user is not banned or restricted from messaging.
   - Check `DAILY_CONVERSATION_REQUEST_LIMIT`.
   - Check no active conversation already in progress.
   - Create `Conversation` with `state: REQUESTED`.
   - Set `matchRequestExpiresAt`.
   - Add to matching queue (Redis sorted set, sorted by wait time for fairness).
   - Attempt immediate match (see below).
2. `findMatch(newRequest: Conversation)`:
   - Query Redis queue for eligible requests in compatible categories.
   - Eligibility: same (or related) `contextCategoryId`, not the same account, not blocked by either party.
   - On match found: update both conversations to `state: MATCHED_PENDING`, set `matchedAt`, notify both via socket.
   - On no match: leave in queue until `matchRequestExpiresAt`, then run `expireMatchRequest`.
3. `expireMatchRequest(conversationId)`:
   - Set `state: NO_MATCH_FOUND`, `endedAt: now`.
   - Notify requesting user.
4. `cancelMatchRequest(accountId, conversationId)`:
   - Validate requester is participant.
   - Set `state: NO_MATCH_FOUND`, `endedAt: now`.
   - Remove from matching queue.

**Unit tests (critical):** Two compatible requests → matched. Same account cannot match with itself. Blocked users not matched. Rate limit enforced. Match queue ordered by wait time (fairness). Expired request transitions to `NO_MATCH_FOUND`. Cancel request removes from queue.

### 12.3 Backend — Conversation service

Implement `backend/src/modules/conversations/conversation.service.ts`:

1. `getConversationForUser(accountId, conversationId)`:
   - Verify user is a participant.
   - Return conversation data with alias snapshots (not raw account IDs).
   - Include messages paginated.
2. `listConversationsForUser(accountId)`:
   - Returns all non-expired active and recent ended conversations.
3. `endConversation(accountId, conversationId)`:
   - Verify user is a participant.
   - Set `state: ENDED_BY_USER`, `endedAt: now`.
   - Notify other participant via socket.
4. `submitFeedback(accountId, conversationId, helpful: boolean)`:
   - Optional, cannot be changed after submission.
   - Stores in `feedbackA` or `feedbackB` depending on which participant.

### 12.4 Backend — Message service

Implement `backend/src/modules/conversations/message.service.ts`:

1. `sendMessage(accountId, conversationId, body)`:
   - Verify conversation is `ACTIVE` or `MATCHED_PENDING`.
   - If `MATCHED_PENDING` and this is the first message, transition to `ACTIVE`, set `startedAt`, set `expiresAt`.
   - Run prohibited-info check: `detectContactInfo(body)`.
   - If contact info detected: persist message with `contactInfoWarning: true`, emit warning to sender via socket but still send the message (per PRD §9.4 — soft warning, not hard block).
   - Persist message.
   - Update `conversation.lastActivityAt`.
   - If inactivity warning was active, clear it.
   - Emit message to conversation room via Socket.IO.
2. `detectContactInfo(body: string): ContactInfoResult`:
   - Detects phone numbers, email addresses, social handles.
   - Per PRD: show warning once per conversation per category of detected content.
3. `getMessages(accountId, conversationId, { cursor, limit })`:
   - Verify participant.
   - Return messages with sender alias (not account ID).

**Unit tests (critical):** First message transitions state from `MATCHED_PENDING` to `ACTIVE`. Message to non-active conversation is rejected. Contact info detected → message sent but `contactInfoWarning: true`. Contact info warning shown once per category per conversation. Non-participant cannot read messages. Sender account ID never in returned message data.

### 12.5 Backend — Conversation expiry jobs

Implement `backend/src/jobs/conversationExpiry.job.ts`:

1. **Inactivity warning job** — runs every minute:
   - Queries `ACTIVE` conversations where `lastActivityAt < now - CONVERSATION_INACTIVITY_WARNING_MS`.
   - For each, set `inactivityWarningAt = now`, emit `INACTIVITY_WARNING` socket event to both participants.
2. **Inactivity expiry job** — runs every minute:
   - Queries conversations where `inactivityWarningAt < now - (CONVERSATION_INACTIVITY_EXPIRY_MS - CONVERSATION_INACTIVITY_WARNING_MS)`.
   - Set `state: ENDED_INACTIVITY`, `endedAt: now`, emit `CONVERSATION_ENDED`.
3. **Max duration expiry job** — runs every hour:
   - Queries `ACTIVE` conversations where `expiresAt < now + 1 hour` (warn) and `expiresAt < now` (expire).
   - Warning: emit `INACTIVITY_WARNING` event with type `MAX_DURATION`.
   - Expire: set `state: ENDED_MAX_DURATION`, `endedAt: now`, emit `CONVERSATION_ENDED`.
4. **Match request expiry job** — runs every minute:
   - Queries `REQUESTED` conversations where `matchRequestExpiresAt < now`.
   - Calls `matching.service.expireMatchRequest`.

**Unit tests:** Inactivity warning fires at correct threshold. Inactivity expiry fires after warning + gap. Max duration warning fires 1 hour before limit. Max duration expiry fires at limit. Match expiry fires at correct time. Jobs are idempotent (running twice does not double-expire).

### 12.6 Backend — Socket.IO gateway

Implement `backend/src/modules/conversations/conversation.gateway.ts`:

1. Auth middleware on socket connection: verify Firebase token from handshake.
2. On `JOIN_CONVERSATION` event: verify user is participant, join room.
3. On `SEND_MESSAGE` event: validate body (Zod), call `message.service.sendMessage`.
4. On `END_CONVERSATION` event: call `conversation.service.endConversation`.
5. On `LEAVE_CONVERSATION` event: leave room (does not end conversation — just disconnects socket).
6. Emit `MESSAGE_RECEIVED`, `CONVERSATION_ENDED`, `INACTIVITY_WARNING`, `CONTACT_INFO_WARNING` to appropriate room participants.
7. All event names from `shared/constants/socketEvents.ts`.

**Unit tests:** Unauthorized socket connection rejected. Non-participant cannot join room. Message from valid participant emitted to room. Disconnect from socket does not end conversation.

### 12.7 Backend — Conversation routes

```
POST /api/conversations/request          → Create match request (auth, rate limit: conversations)
DELETE /api/conversations/:id/request    → Cancel match request (auth)
GET  /api/conversations                  → List user's conversations (auth)
GET  /api/conversations/:id              → Get conversation detail (auth, participant only)
POST /api/conversations/:id/end          → End conversation (auth, participant only)
POST /api/conversations/:id/feedback     → Submit feedback (auth, participant only)
GET  /api/conversations/:id/messages     → Get messages (auth, participant only)
```

### 12.8 Frontend — Conversation components

1. `MatchingState.tsx`:
   - Shown when `state: REQUESTED`.
   - Displays "Looking for someone available..." with elapsed time.
   - Cancel button.
   - Shows estimated wait context ("We'll notify you when someone's available").
   - If `NO_MATCH_FOUND`: shows clear message, invites to browse existing responses.
2. `ConversationContextCard.tsx`:
   - Shown when `state: MATCHED_PENDING`.
   - Displays: "You are connected because both of you selected: [experience category]."
   - Structured opening prompt suggestions (from constants — not hardcoded).
3. `ConversationThread.tsx`:
   - Message list with `MessageBubble.tsx` per message.
   - Own messages right-aligned, other party's left-aligned.
   - `ExpiryWarning.tsx` shown at top when inactivity or max-duration warning received.
   - `ContactInfoWarning.tsx` shown inline when server flags contact info in a message.
   - Report and End Conversation controls always visible.
4. `MessageBubble.tsx`:
   - Renders sender alias (not "You" — because alias is the identity).
   - Timestamps.
   - No read receipts (prevents presence inference).
5. `ExpiryWarning.tsx`:
   - Shows warning: "Conversation will end in 5 minutes due to inactivity" / "1 hour remaining."
   - Inactivity case: "Send a message to keep it going."
6. `ConversationEndedView.tsx`:
   - Read-only transcript view.
   - "Was this conversation helpful?" prompt (optional).
   - Transcript available for `TRANSCRIPT_RETENTION_MS`, then hidden.
   - No re-contact option — new match required.

**Unit tests:** `MatchingState`: Cancel button calls cancel thunk. `NO_MATCH_FOUND` state shows correct message and CTA. `ConversationThread`: Messages render in correct order. Own messages vs. other-party messages have correct alignment. `ExpiryWarning` renders on inactivity warning state. `ContactInfoWarning` renders when message has `contactInfoWarning: true`. `ConversationEndedView`: transcript shown within retention window, hidden after (mock date to test boundary).

### 12.9 Frontend — Conversations Redux slice

1. `conversationsSlice.ts`:
   - State: `{ byId: Record<string, Conversation>, messagesByConversationId: Record<string, Message[]>, activeConversationId: string | null, matchingRequestId: string | null, loading: boolean }`.
2. `conversationsThunks.ts`:
   - `requestMatchThunk`, `cancelMatchRequestThunk`, `endConversationThunk`, `sendMessageThunk`, `fetchConversationThunk`, `fetchMessagesThunk`, `submitFeedbackThunk`.
3. `useSocket.ts` hook:
   - Connects socket on conversation page mount.
   - Listens for `MESSAGE_RECEIVED` → dispatch to slice.
   - Listens for `CONVERSATION_ENDED` → update state.
   - Listens for `INACTIVITY_WARNING` → dispatch warning to slice.
   - Disconnects on unmount.

**Unit tests:** Socket event `MESSAGE_RECEIVED` → message added to slice. `CONVERSATION_ENDED` → state updated. `INACTIVITY_WARNING` → warning state set. Thunks handle API errors correctly.

### 12.10 Frontend — `useConversationExpiry` hook

Implement `frontend/src/hooks/useConversationExpiry.ts`:

1. Takes `conversation` object.
2. Computes time remaining to inactivity expiry and max duration expiry.
3. Returns `{ inactivityWarning: boolean, maxDurationWarning: boolean, minutesRemaining: number }`.
4. Updates on a ticker (every 30 seconds is sufficient — avoid unnecessary re-renders).

**Unit tests:** Returns correct warning flags at boundary times. Does not return warnings before threshold. Returns correct minutes remaining.

---

## 13. Phase 8 — "Someone Needs You" & Experience Graph

**Goal:** Private experience graph tracking each user's category/reaction history. "Someone Needs You" daily prompt matching users with past experience to users with current experience.

**Dependencies:** Phases 4, 5, and 7 complete (posting, reactions, conversations).

**Expected outcome:** Users who have marked an experience as "Past" and opted in receive one daily "Someone Needs You" prompt connecting them to someone currently experiencing it.

### 13.1 Backend — Experience Graph model

Define `backend/src/modules/experienceGraph/experienceGraph.model.ts`:

```
ExperienceGraphEntry {
  _id: ObjectId
  accountId: ObjectId (unique, ref: User)
  experiences: [{
    categoryId: CategoryId
    hasPostedAbout: Boolean
    primaryReactionHistory: [{ postId: ObjectId, reaction: PrimaryReactionType, reactedAt: Date }]
    conversationsEntered: [{ conversationId: ObjectId, enteredAt: Date }]
    snyOptIn: Boolean
    lastUpdatedAt: Date
  }]
  updatedAt: Date
}
```

This is a private document — never returned in any public API response, never used to build a public profile. Used only for:
1. "Someone Needs You" matching.
2. The user's own private experience history view.
3. "You Are Not Alone" aggregate (anonymized counts only).

Indexes: `accountId` (unique).

### 13.2 Backend — Experience Graph service

Implement `backend/src/modules/experienceGraph/experienceGraph.service.ts`:

1. `recordPostCreated(accountId, post)` — updates experience entry for post's categories.
2. `recordReaction(accountId, postId, categoryIds, primaryReaction)` — updates `primaryReactionHistory` for relevant categories.
3. `recordConversationEntered(accountId, conversationId, categoryId)`.
4. `getSurvivedCategories(accountId)` — returns categoryIds where user has at least one PAST reaction and `snyOptIn: true`.
5. `getExperienceHistory(accountId)` — returns full graph for the user's own private view.
6. `deleteExperienceGraph(accountId)` — removes all entries (for account deletion).
7. `exportExperienceData(accountId)` — returns machine-readable copy for data export.

**Unit tests:** `getSurvivedCategories`: returns only categories with PAST reaction AND snyOptIn. Categories with snyOptIn=false excluded. `deleteExperienceGraph`: all entries removed. `exportExperienceData`: returns all data fields without other users' data.

### 13.3 Backend — "Someone Needs You" service

Implement `backend/src/modules/someoneNeedsYou/someoneNeedsYou.service.ts`:

1. `getDailyPromptForUser(accountId)`:
   - Check if user has already received/used their daily prompt today (`MAX_SNY_PROMPTS_PER_DAY`).
   - Get `getSurvivedCategories(accountId)`.
   - For each survived category, find a recently posted (PUBLISHED, within last 48h) post with `state: CURRENT` in that category — not by the same user, not blocked by either party.
   - Select the best match (most recent, highest need based on meaningful reactions).
   - Return the matched post and context for the prompt card.
2. `skipPrompt(accountId, promptPostId)`:
   - Increment skip count for today.
   - Find next eligible match from the same category (if under `DAILY_SNY_SKIP_LIMIT`).
   - If skip limit reached, mark prompt dismissed for the day.
3. `acceptPrompt(accountId, promptPostId)`:
   - Triggers conversation match request for the matched post/category.

**Unit tests (critical):** Prompt not sent if user has no survived categories with opt-in. Prompt not sent if same user posted the target. Blocked users excluded. Daily limit of 1 prompt enforced. Skip limit of 3 enforced. After skip limit, dismissed for day. Accepting prompt creates conversation request.

### 13.4 Backend — Daily prompt job

Implement `backend/src/jobs/dailyPrompt.job.ts`:

1. Runs once daily (configurable time via admin).
2. For each eligible user (onboarding complete, at least one SNY opt-in category), calls `getDailyPromptForUser`.
3. If a prompt is found, creates a notification of type `SNY_PROMPT_AVAILABLE`.
4. Does not pre-generate prompts for all users — lazy generation on request is preferred to avoid stale prompts.

**Unit tests:** Job runs once daily. Users without opt-ins are skipped. Notification created for eligible users.

### 13.5 Frontend — Someone Needs You

1. `PromptCard.tsx`:
   - Displays the matched post (anonymized — no original author alias surfaced in this context, only experience context).
   - Shows: "Someone is going through this now. Would you like to help?"
   - Accept (→ conversation request flow) / Skip / Dismiss for today.
   - Skip counter visible if user has used 1+ skips.
2. `SkipControls.tsx` — handles skip flow, shows "See another" until limit.
3. `someone-needs-you/page.tsx` — fetches and displays daily prompt.
4. `useFeatureFlag('someoneNeedsYou')` — SNY is a feature-flaggable feature (disabled at MVP until matching density is sufficient, per PRD §22 Launch Strategy).

**Unit tests:** `PromptCard`: Accept → calls accept thunk. Skip → calls skip thunk and loads next. Dismiss → day dismissed. `useFeatureFlag('someoneNeedsYou')`: When flag is off, component returns null. Skip counter shows correct number.

---

## 14. Phase 9 — Trust, Safety & Moderation

**Goal:** Complete report flow, block flow, crisis detection surface, progressive enforcement ladder, content scanning, moderation queue, audit log.

**Dependencies:** Phases 4, 7, and 8 (reports can be on posts, messages, and conversations).

**Expected outcome:** Users can report and block. Moderators have a queue. Crisis resources surface immediately. Enforcement is progressive and auditable.

### 14.1 Backend — Report model

Define `backend/src/modules/moderation/report.model.ts`:

```
Report {
  _id: ObjectId
  reporterAccountId: ObjectId (never exposed to moderator in queue — hidden for reporter safety)
  reportedContentType: 'post' | 'response' | 'message'
  reportedContentId: ObjectId
  reportedAccountId: ObjectId
  reason: ReportReason (from constants)
  additionalDetails: String (optional, free text)
  status: 'open' | 'actioned' | 'dismissed'
  severity: 'critical' | 'high' | 'medium' | 'low' (auto-classified)
  isCrisisFlagged: Boolean
  moderatorId: ObjectId (nullable, assigned on review)
  actionTaken: String (nullable)
  actionLog: [{ actorId: ObjectId, action: String, timestamp: Date, notes: String }]
  createdAt: Date
  resolvedAt: Date (nullable)
}
```

### 14.2 Backend — Block model

Define `backend/src/modules/moderation/block.model.ts`:

```
Block {
  _id: ObjectId
  blockerAccountId: ObjectId
  blockedAccountId: ObjectId (not the alias — persists across rotations)
  createdAt: Date
}
```

Indexes: `blockerAccountId + blockedAccountId` (unique compound), `blockerAccountId`, `blockedAccountId`.

### 14.3 Backend — Report service

Implement `backend/src/modules/moderation/report.service.ts`:

1. `submitReport(reporterAccountId, { contentType, contentId, reason, details })`:
   - Validate content exists.
   - Classify severity: `isCrisis` → `critical`, threats → `high`, spam → `low`, etc.
   - Create `Report` document.
   - If `isCrisisFlagged: true`, immediately create a crisis notification for the reported user (in addition to normal moderation queue placement).
   - Return `{ success: true }` — never reveal report outcome to reporter (prevents harassment via report-watching).
2. `getOpenReportsQueue(moderatorId, { sortBy, filterBy, cursor })`:
   - For moderators only.
   - Crisis-flagged reports always at top regardless of sort.
   - Returns reports with associated content context (not reporter identity).
3. `actionReport(moderatorId, reportId, action)`:
   - Actions: `DISMISS`, `REMOVE_CONTENT`, `WARN_USER`, `COOLDOWN_USER`, `RESTRICT_USER`, `ESCALATE_TO_ADMIN`.
   - `ESCALATE_TO_ADMIN` and `PERMANENT_BAN` are Admin-only.
   - Appends to `actionLog`.
   - Calls `enforcement.service` if applicable.

**Unit tests (critical):** Reporter identity never returned in queue results. Crisis-flagged reports appear at top of queue. Dismiss does not trigger enforcement. Remove content marks content as REMOVED_BY_MODERATION. Moderator cannot issue permanent ban (only admin can). Action log entry created for every action. Report on non-existent content returns 404.

### 14.4 Backend — Block service

Implement `backend/src/modules/moderation/block.service.ts`:

1. `blockUser(blockerAccountId, blockedAccountId)`:
   - Creates `Block` record.
   - Block is on private account ID, not alias (persists across rotations — FR requirement).
   - Ends any active conversation between the two accounts.
   - Removes any pending match requests between the two.
2. `unblockUser(blockerAccountId, blockedAccountId)`.
3. `isBlocked(accountId1, accountId2): boolean` — checks both directions.
4. `getBlockedAccounts(accountId)` — for settings page and for filtering in feed/matching.

**Unit tests (critical):** Block on account ID (not alias). Blocking ends active conversation. Blocking removes match requests. `isBlocked` checks both directions. Block persists after alias rotation (test by creating block, rotating alias, re-checking).

### 14.5 Backend — Enforcement service

Implement `backend/src/modules/moderation/enforcement.service.ts`:

1. `applyWarning(targetAccountId, reportId)`.
2. `applyCooldown(targetAccountId, reportId)` — pauses posting and messaging, browsing still allowed.
3. `applyTemporaryRestriction(targetAccountId, durationDays, reportId)`.
4. `applyPermanentBan(targetAccountId, reportId)` — Admin only.
5. `liftRestriction(targetAccountId, adminId)`.
6. `forceAliasRotation(targetAccountId, adminId)`.
7. All actions append to the user's `enforcementStatus.actionLog` and create an audit record.

**Unit tests:** Each enforcement level sets correct fields. Banned user's auth middleware returns 403. Cooldown allows browsing, blocks posting (test `createPost` while in cooldown). `forceAliasRotation` changes alias. Lifted restriction allows posting again.

### 14.6 Backend — Crisis resource surface

Implement in `crisisDetection.service.ts`:

1. `getCrisisResources(crisisType: string): CrisisResource[]`:
   - Returns a list of crisis resources (hotlines, links) relevant to the crisis type.
   - Resources defined in `shared/constants/crisisResources.ts` — never hardcoded inline.
2. Resources are surfaced in API responses whenever `isCrisis: true` in the content scan result.
3. This is never delayed by human review — it fires immediately and unconditionally on detection.

**Unit tests (critical):** Crisis resources returned for all defined crisis types. Resources not returned when no crisis detected. Function never throws — must always return a safe result even if crisis type is unknown.

### 14.7 Frontend — Moderation components

1. `ReportModal.tsx`:
   - Accessible modal (focus trap, escape to close, aria-labelledby).
   - Reason selector using values from `shared/constants/reportReasons.ts` (not hardcoded).
   - Optional free text.
   - Submit → `submitReportThunk`.
   - Confirmation state: "Thank you. Your report has been received." (never reveals outcome).
   - Report button on every `PostCard`, `MessageBubble`, and in `ConversationThread`.
2. `BlockConfirmation.tsx`:
   - Confirmation dialog before blocking.
   - Explains: block hides all of this person's content and prevents future matching.
   - On confirm → `blockUserThunk`.
3. `CrisisResourceBanner.tsx`:
   - Rendered when API response includes `crisisDetected: true` (post creation) or `isCrisis: true` (message).
   - Shows supportive message and resource links from `shared/constants/crisisResources.ts`.
   - Cannot be dismissed until user has seen it (minimum 3 seconds visible).
   - Never shown as an error — warm, supportive tone.
   - Accessible: aria-live region, screen reader announcement.

**Unit tests:** `ReportModal`: reason is required, submit blocked without reason. Submit calls correct thunk. Confirmation state shown after submit. `BlockConfirmation`: Cancel does not block. Confirm calls block thunk. `CrisisResourceBanner`: Renders when crisis flag true. Not rendered when no crisis. Aria-live attribute present.

### 14.8 Moderation routes

```
POST /api/reports                    → Submit report (auth, rate limited)
GET  /api/users/me/blocks            → Get user's block list (auth)
POST /api/users/me/blocks            → Block a user (auth)
DELETE /api/users/me/blocks/:accountId → Unblock (auth)

// Admin-only:
GET  /api/admin/reports              → Moderator queue (admin auth)
POST /api/admin/reports/:id/action   → Take action (admin auth)
GET  /api/admin/users/:id            → User account lookup (admin auth)
POST /api/admin/users/:id/action     → Apply enforcement action (admin auth)
```

---

## 15. Phase 10 — Notifications

**Goal:** In-app notification system for: reactions on posts, SNY prompt, new conversation message, expiry warning, moderation actions. Optional email notifications. No PII in notification content.

**Dependencies:** Phases 4, 7, 8, 9 (all content-generating events).

**Expected outcome:** Users receive timely in-app notifications for relevant events. Lock-screen/notification previews never reveal message content or aliases.

### 15.1 Backend — Notification model

Define `backend/src/modules/notifications/notification.model.ts`:

```
Notification {
  _id: ObjectId
  recipientAccountId: ObjectId
  type: NotificationType (from constants: REACTION_ON_POST, SNY_PROMPT, NEW_MESSAGE, EXPIRY_WARNING, MODERATION_ACTION)
  referenceId: ObjectId (postId | conversationId)
  referenceType: String
  isRead: Boolean
  emailSent: Boolean
  genericText: String (safe for lock-screen: "You have a new notification on AMONG")
  createdAt: Date
}
```

### 15.2 Backend — Notification service

1. `createNotification(recipientAccountId, type, referenceId, referenceType)`.
2. `getUnreadNotifications(accountId)`.
3. `markAsRead(accountId, notificationId)`.
4. `markAllRead(accountId)`.
5. Email notification dispatch (opt-in, async): call email provider (abstract behind `emailProvider.service.ts`) with generic text only — no message content, no alias in email body.

**Unit tests:** Notification created with correct type. `getUnreadNotifications` returns only unread. `markAllRead` marks all. Email sent only if user opted in. Email body contains no message content or PII.

### 15.3 Frontend — Notifications components

1. `NotificationBell.tsx`:
   - Shows unread count badge.
   - Opens `NotificationList` dropdown.
   - Polls for new notifications (or receives via socket push).
2. `NotificationList.tsx`:
   - List of notifications with type-based icons (lucide-react, from constants).
   - Tapping navigates to relevant context (post/conversation).
   - "Mark all read" control.

**Unit tests:** Unread count updates when new notification arrives. Tapping navigates to correct route. Mark all read clears badge.

---

## 16. Phase 11 — Admin Dashboard & Internal Tooling

**Goal:** Internal admin dashboard for moderation queue, user account management, analytics, and runtime configuration. Role-gated (Moderator / Admin). Not part of public IA, not crawlable.

**Dependencies:** Phase 9 (moderation), Phase 13 (analytics).

**Expected outcome:** Moderators can review and action reports. Admins can manage accounts, tune config, and view metrics.

### 16.1 Backend — Admin routes

All routes under `/api/admin/` protected by `adminAuth.middleware.ts`.

```
GET    /api/admin/reports                          → Queue (sorted, filtered)
GET    /api/admin/reports/:id                      → Report detail with context
POST   /api/admin/reports/:id/action               → Take action
GET    /api/admin/users/:id                        → User account detail
POST   /api/admin/users/:id/action                 → Enforcement action
GET    /api/admin/analytics/metrics                → Core metrics dashboard data
GET    /api/admin/analytics/safety                 → Safety/report rate metrics
GET    /api/admin/analytics/categories             → Category-level breakdown
GET    /api/admin/config/ranking-weights           → Get current weights
PUT    /api/admin/config/ranking-weights           → Update weights (Admin only)
GET    /api/admin/config/rate-limits               → Get current rate limits
PUT    /api/admin/config/rate-limits               → Update rate limits (Admin only)
GET    /api/admin/config/feature-flags             → Get feature flags
PUT    /api/admin/config/feature-flags/:flag       → Toggle feature flag (Admin only)
```

### 16.2 Admin dashboard frontend

The admin dashboard is a separate Next.js route group at `/admin` with its own layout:

```
app/
└── (admin)/
    ├── layout.tsx        → Admin auth guard (checks admin/moderator role)
    ├── reports/page.tsx  → Moderation queue
    ├── reports/[id]/page.tsx → Report detail
    ├── users/[id]/page.tsx   → User account detail
    ├── analytics/page.tsx    → Metrics dashboard
    └── config/page.tsx       → Runtime configuration
```

Admin pages are excluded from `sitemap.xml` and disallowed in `robots.txt`.

Admin auth guard: verifies Firebase token AND checks that `req.user.role` is `MODERATOR` or `ADMIN`. Redirects to landing on failure.

### 16.3 Admin analytics service

Implement `backend/src/modules/admin/adminAnalytics.service.ts`:

1. `getWeeklyMeaningfulConnections()` — count of conversations that reached `ACTIVE` state in the last 7 days.
2. `getRetentionMetrics()` — D1/D7/D30 return rates (cohort-based).
3. `getConversationCompletionRate()` — ratio of ACTIVE to all MATCHED_PENDING in last 7 days.
4. `getReportRatePer1000()` — total reports / (total posts + messages) × 1000 in last 7 days.
5. `getSnyOptInRate()` — % of eligible users with at least one SNY opt-in.
6. `getTimeToFirstPost()` — median time from account creation to first post.
7. `getCategoryBreakdown()` — post volume and report rate per category.

**Unit tests:** Each metric function returns correctly shaped data. Report rate computed correctly with sample data. Retention cohort logic returns correct percentages.

### 16.4 Admin configuration service

Implement `backend/src/modules/admin/adminConfig.service.ts`:

1. `getRankingWeights()` — reads from `Config` MongoDB collection.
2. `updateRankingWeights(weights, adminId)` — validates all weights sum to 1.0, updates, logs audit entry.
3. `getRateLimits()`, `updateRateLimits(limits, adminId)`.
4. `getFeatureFlags()`, `toggleFeatureFlag(flag, enabled, adminId)`.
5. All changes are logged with actor ID and timestamp (audit requirement).
6. Config changes take effect within `CONFIG_CACHE_TTL` (configurable, e.g. 60s) without a server restart.

**Unit tests:** Weight validation rejects weights that don't sum to 1.0. Audit log entry created for every change. Config changes reflected in `ranking.service` within cache TTL. Feature flag toggle enables/disables the feature.

---

## 17. Phase 12 — SEO, Accessibility & Performance

**Goal:** Every public page meets all FR-SEO-1 through FR-SEO-22 requirements. All interactive elements meet WCAG AA accessibility. Core Web Vitals are optimized.

**Dependencies:** All product phases complete. SEO work layers on top of complete pages.

### 17.1 Server-side rendering

1. All public pages (`/`, `/explore`, `/explore/[category]`, `/post/[id]`) use Next.js SSR or ISR (Incremental Static Regeneration):
   - Landing page: fully static (regenerate on deploy).
   - Category pages: ISR with revalidate every 5 minutes.
   - Post pages: SSR (content changes too frequently for ISR).
2. Authenticated pages (`/home`, `/conversations`, `/settings`, etc.) are client-rendered behind the auth guard (not crawlable).
3. Verify that all crawlable pages return full HTML content in the first response (no skeleton-only SSR).

### 17.2 Meta tags & structured data

Implement `frontend/src/utils/seoUtils.ts`:

1. `generatePageMeta(page, data)` — returns `{ title, description, canonical, ogTags }` for each page type.
2. Title and description templates for each page type — from `frontend/src/constants/seo.ts` (not hardcoded in page files).
3. Every page exports `generateMetadata()` (Next.js App Router metadata API).
4. Structured data (JSON-LD) components for: `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage`.

### 17.3 Internal linking & navigation

1. `Footer.tsx` must link to: About, Guidelines/Safety, Help, all top-level categories, and the HTML sitemap page.
2. Category pages must link to at least 3 related categories (from `relatedCategoryIds` in `experienceCategories.ts`).
3. HTML sitemap page at `/sitemap` listing all categories and static pages.
4. `Breadcrumb.tsx` rendered on all nested pages.
5. Deleted post pages must render a soft-404 with navigation links, not a blank 404 (FR-SEO-19).

### 17.4 `robots.txt` and `sitemap.xml`

1. `frontend/src/app/robots.ts`:
   - Allow: `/`, `/explore`, `/explore/*`, `/about`, `/guidelines`, `/sitemap`.
   - Disallow: `/home`, `/conversations`, `/settings`, `/compose`, `/admin`, `/someone-needs-you`, `/saved`, `/you-are-not-alone`.
2. `frontend/src/app/sitemap.ts`:
   - Generates XML sitemap including: landing, all category pages, static/marketing pages.
   - Does not include individual post pages (policy decision — ephemeral content, not primary SEO asset).
   - Submits to Google Search Console on deploy (CI step).

### 17.5 Heading structure

Implement heading audit across all pages:

1. Every page has exactly one `<h1>` matching the page's primary topic.
2. Heading levels descend without skipping.
3. Heading tags are never used purely for visual sizing — CSS handles visual scale.
4. Audit implemented as a Jest accessibility test using `jest-axe`.

### 17.6 Accessibility requirements

1. All interactive elements have descriptive `aria-label` attributes.
2. Focus management:
   - Modals trap focus (`ReportModal`, `ConfirmationDialog`, `BlockConfirmation`).
   - After modal close, focus returns to the triggering element.
   - After route navigation, focus moves to the `<main>` content heading.
3. Color contrast: all text/interactive elements meet WCAG AA (4.5:1 for normal text, 3:1 for large text).
4. No information conveyed by color alone — error states, focus states, and disabled states have non-color indicators (icon, weight, pattern).
5. All form inputs have associated `<label>` elements (not just placeholders).
6. Loading states announced via `aria-live="polite"`.
7. `CrisisResourceBanner` is an `aria-live="assertive"` region.
8. Keyboard navigation: all flows completable without a mouse.
9. Sufficient tap target sizes (minimum 44×44px) for all interactive elements.

### 17.7 Performance

1. Implement `next/image` for all images with explicit `width`, `height`, and `alt`.
2. Code splitting: lazy load heavy components (conversation thread, admin dashboard).
3. Font loading: `next/font` with `display: swap` to prevent FOIT.
4. Minimal JavaScript in initial bundle: defer non-critical JS.
5. Core Web Vitals targets (measured via Lighthouse CI in the CI pipeline):
   - LCP < 2.5s.
   - CLS < 0.1.
   - INP < 200ms.

---

## 18. Phase 13 — Analytics & Metrics

**Goal:** Event tracking architecture that is decoupled from product functionality. Capture all PRD metrics without coupling analytics to business logic.

**Dependencies:** All product phases complete.

### 18.1 Analytics architecture

The analytics system is an **event bus**, not inline tracking. Product code emits domain events; the analytics layer subscribes and records them. This ensures:
- Product business logic never depends on analytics.
- Analytics never blocks or delays user-facing requests.
- Analytics provider can be swapped without touching product code.

### 18.2 Backend — Analytics middleware

Implement `backend/src/modules/analytics/analytics.middleware.ts`:

1. Express middleware that fires after response.
2. Emits events for: `POST_CREATED`, `REACTION_SET`, `CONVERSATION_REQUESTED`, `CONVERSATION_MATCHED`, `CONVERSATION_STARTED`, `CONVERSATION_ENDED`, `REPORT_SUBMITTED`, `BLOCK_CREATED`, `SNY_PROMPT_ACCEPTED`, `SNY_PROMPT_SKIPPED`, `USER_CREATED`, `FIRST_POST_CREATED`.
3. All events include: timestamp, event type, and non-identifying context fields (no Firebase UID, no email, no content body).
4. Events are written asynchronously (fire-and-forget) to the `AnalyticsEvent` collection.

### 18.3 Analytics event model

```
AnalyticsEvent {
  _id: ObjectId
  eventType: String
  accountIdHash: String (HMAC hash of accountId — not the raw ID — for cohort analysis without raw ID exposure)
  sessionId: String (anonymous session identifier)
  categoryId: String (where relevant)
  conversationState: String (where relevant)
  timestamp: Date
  metadata: Object (event-specific non-identifying fields)
}
```

### 18.4 Metric computations

All metrics in §17 of the PRD are computed from `AnalyticsEvent` aggregations:

| Metric | Implementation |
|---|---|
| Weekly Meaningful Connections (WMC) | Count `CONVERSATION_STARTED` events in last 7 days |
| D1 retention | % of cohort with any event on day 2 |
| D7 retention | % of cohort with any event on days 6–8 |
| D30 retention | % of cohort with any event on days 28–32 |
| Posts per active user | `POST_CREATED` count / distinct active users |
| SAME rate | `REACTION_SET(SAME)` count / total posts |
| Meaningful response rate | % of posts with ≥1 meaningful reaction within 24h |
| Conversation start rate | `CONVERSATION_STARTED` / `CONVERSATION_MATCHED` |
| Conversation completion rate | `CONVERSATION_ENDED(reason=user or inactivity)` where duration > threshold |
| Report rate | `REPORT_SUBMITTED` / (posts + messages) × 1000 |
| Block rate | `BLOCK_CREATED` per 1,000 interactions |
| SNY opt-in rate | Users with `snyOptIn: true` / eligible users |
| Time to first post | Median `FIRST_POST_CREATED.timestamp - USER_CREATED.timestamp` |

**Unit tests:** Each metric computation function returns correct value given sample event fixtures. Cohort retention logic is correct at D1/D7/D30 boundaries. Report rate formula is correct.

---

## 19. Phase 14 — Subscription Architecture (Future-Proof Shell)

**Goal:** No subscription product ships in MVP. However, the data model and entitlement architecture must be in place so subscription can be introduced without a major restructuring.

**Dependencies:** All previous phases.

**Expected outcome:** `subscriptionTier` field exists on `User` model, entitlement checks exist in services, subscription model is defined — but all users are on the free tier. No payment integration.

### 19.1 Subscription model (data only — no product)

Define `backend/src/modules/subscription/subscription.model.ts`:

```
Subscription {
  _id: ObjectId
  accountId: ObjectId
  tier: SubscriptionTier (FREE | PREMIUM — from shared/constants/subscriptionTiers.ts)
  status: String (ACTIVE | CANCELLED | EXPIRED)
  startedAt: Date
  expiresAt: Date
  paymentProvider: String (nullable — for future Stripe integration)
  paymentProviderId: String (nullable)
  createdAt: Date
}
```

### 19.2 Entitlement checks

Implement `backend/src/modules/subscription/subscription.service.ts`:

1. `getEntitlements(accountId): Entitlements`:
   - Returns `{ canAccessPremiumMatching: false, canAccessConversationHistory: false, ... }`.
   - All entitlements are `false` for all users at MVP (everything is free tier).
   - This function is the single choke point for all premium-feature access checks — never check subscription tier inline in product services.
2. All services that will eventually gate premium features call `getEntitlements` — they just always get `false` now.
3. The architecture means enabling a premium tier later requires only: updating `getEntitlements` to return true for `PREMIUM` tier users, and adding payment integration. Zero product service changes needed.

**Unit tests:** `getEntitlements` returns all `false` for free-tier users. Structure of returned entitlements matches defined interface (no missing fields). Would-be premium checks call `getEntitlements`, not raw tier checks.

---

## 20. Phase 15 — Final Testing, QA & Deployment Readiness

**Goal:** Full test suite verification, coverage analysis, regression testing, CI pipeline validation, and pre-production readiness.

**Dependencies:** All phases complete.

### 20.1 Unit test suite verification

1. Run full test suite: `npm test` in both `/backend` and `/frontend`.
2. Verify all tests pass.
3. Verify coverage thresholds are met (see §21).
4. Identify and fix any flaky tests (tests that fail non-deterministically).

### 20.2 Coverage analysis

1. Run coverage reports: `npm run test:coverage`.
2. Review uncovered critical paths — especially:
   - Auth middleware edge cases.
   - Privacy invariants (no PII leakage).
   - Matching eligibility edge cases.
   - Conversation state transitions.
   - Crisis detection.
3. Add missing tests for any gap in critical business logic.

### 20.3 Integration & regression testing

1. Set up integration tests for primary user journeys (separate from unit tests):
   - Onboarding flow: account creation → alias assignment → category selection.
   - Posting flow: compose → content scan → publish → reaction → feed appearance.
   - Conversation flow: request → match → active → expiry → feedback.
   - Report flow: submit → queue → action.
2. Regression suite runs on every PR.

### 20.4 Security pre-flight

1. Audit every API endpoint: verify auth middleware is applied where required.
2. Audit every `GET` response: verify no private fields (`firebaseUid`, `email`, `authorAccountId`, `moderationNotes`) leak.
3. Audit every collection: verify no unauthenticated read access.
4. Run `npm audit` on all packages; address `high` and `critical` vulnerabilities.
5. Verify `robots.txt` disallows all private routes.
6. Verify `sitemap.xml` includes only public evergreen pages.

### 20.5 Performance pre-flight

1. Run Lighthouse CI on: landing page, category page, home feed, conversation thread.
2. Verify LCP < 2.5s, CLS < 0.1, INP < 200ms.
3. Verify no unoptimized images in production build.

### 20.6 Accessibility audit

1. Run `jest-axe` tests on all page-level components.
2. Run manual keyboard navigation test for all primary flows.
3. Run screen reader test (NVDA or VoiceOver) on: onboarding, compose, conversation thread, report modal, crisis resource banner.

### 20.7 Deployment checklist

1. Backend:
   - All environment variables documented in `.env.example`.
   - Database indexes verified.
   - MongoDB connection pooling configured for production load.
   - Redis connection configured.
   - Agenda job scheduler starts with the server.
   - Helmet security headers active.
   - CORS configured to production domain only.
   - Logging level set to `info` in production (not `debug`).
2. Frontend:
   - `NEXT_PUBLIC_*` env vars set correctly.
   - `next build` completes with no TypeScript errors.
   - `robots.txt` and `sitemap.xml` generated correctly.
   - No `console.log` statements in production bundle.
3. CI/CD:
   - All unit tests pass on `main` branch.
   - Coverage thresholds enforced.
   - Lighthouse CI passes.
   - No dependency audit failures.

---

## 21. Unit Testing Strategy

### 21.1 Principles

1. Tests must be **deterministic** — same inputs always produce the same result.
2. Tests must be **isolated** — no test relies on another test's state.
3. **Mock external services** — MongoDB (use `mongodb-memory-server` for integration-adjacent tests), Firebase Admin SDK, Redis, Socket.IO, email provider.
4. **Test observable behavior** — what the function does, not how it does it internally.
5. **Include both happy-path and edge/error-path** tests for every function.
6. **Test authorization** explicitly — not just "authenticated user succeeds," but "unauthenticated user fails," "wrong-role user fails," and "correct-role user succeeds."
7. **Test privacy invariants** — no function that must not return PII should return it even in error paths.
8. **Test boundary conditions** — minimum/maximum lengths, exactly-at-limit and just-over-limit, empty inputs, null inputs.

### 21.2 Coverage targets

| Module | Minimum Coverage |
|---|---|
| Authentication & authorization | 95% |
| Anonymous identity (alias, avatar, rotation) | 90% |
| Privacy controls (block, report, PII detection) | 95% |
| Matching logic | 90% |
| Messaging & conversation state machine | 90% |
| Moderation & enforcement | 90% |
| Rate limiting | 90% |
| Validation schemas | 90% |
| Subscription entitlements | 90% |
| Ranking logic | 85% |
| Discovery service | 85% |
| Notification service | 80% |
| Analytics event generation | 80% |
| Utility functions | 85% |
| Redux slices & selectors | 85% |
| Frontend hooks (auth, conversation, expiry) | 80% |
| All other modules | 75% |
| **Overall project minimum** | **80%** |

### 21.3 Test organization

Tests co-locate with source files:

```
module/
├── service.ts
├── service.test.ts
├── controller.ts
├── controller.test.ts
```

Test file naming: `[unit].test.ts` for unit tests, `[unit].integration.test.ts` for integration-adjacent tests that use in-memory MongoDB.

Test files follow the same 1000-line hard cap as source files. Large test suites are split by responsibility:

```
conversation.service.test.ts          → sendMessage, getMessages
conversation.state-machine.test.ts    → state transitions, expiry logic
conversation.matching.test.ts         → match eligibility, blocking, rate limits
```

### 21.4 Shared test utilities

Create `backend/src/test/` and `frontend/src/test/` directories:

- `backend/src/test/factories.ts` — typed factory functions for creating test fixtures (user, post, reaction, conversation, message) with sensible defaults.
- `backend/src/test/mocks.ts` — shared mock implementations for Firebase Admin, Redis, email provider.
- `backend/src/test/dbSetup.ts` — `beforeAll`/`afterAll` for `mongodb-memory-server` startup.
- `frontend/src/test/renderWithProviders.tsx` — renders component wrapped in Redux Provider + theme with default test store state.
- `frontend/src/test/storeFactory.ts` — creates a test Redux store with overridable slice state.

### 21.5 Testing in each phase (summary)

Every phase above includes inline testing tasks. The sequence for each feature is:

1. Define expected behavior and edge cases (write as test descriptions before code).
2. Implement Zod validation schemas; write schema tests.
3. Implement business logic; write unit tests.
4. Run tests — they should mostly fail (TDD optional but preferred for critical paths).
5. Implement the feature to make tests pass.
6. Add edge case and error path tests.
7. Integrate with dependent modules.
8. Verify integration doesn't break existing tests.

---

## 22. Definition of Done

A feature or phase is not complete until:

- [ ] All unit tests for the phase pass.
- [ ] Coverage thresholds for the phase are met.
- [ ] No TypeScript errors in the phase's files.
- [ ] ESLint and Prettier pass with zero warnings.
- [ ] No hardcoded constants — all values imported from `shared/constants/` or config.
- [ ] No file exceeds 1,000 lines.
- [ ] All API responses audited for PII leakage.
- [ ] All user-facing strings use constants/labels from centralized files (not inline hardcoded).
- [ ] All new interactive UI elements have accessible labels, keyboard support, and focus management.
- [ ] Auth middleware applied to all routes requiring it.
- [ ] Rate limiting applied to all applicable routes.
- [ ] Error paths handled and tested.
- [ ] Privacy invariants tested (no PII in public API responses).
- [ ] CI pipeline passes.

---

*This implementation plan is the single engineering blueprint for the AMONG repository. All product features, architectural decisions, data models, API contracts, and testing requirements are derived directly from `docs/PRD.md`. Questions on product intent should be resolved against the PRD; questions on implementation approach should be resolved against this document.*
