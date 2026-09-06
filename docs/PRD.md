# PRODUCT REQUIREMENTS DOCUMENT

# ANONYMOUS INTERNET
### Working product brand: **AMONG**
*A human-experience network built around anonymity, relatability and meaningful connection.*

> **You're not the only one.**
> Say what's on your mind.
> Find people who've been there.
> Talk without having to be someone.
> **Enter Among →**

**Brand positioning:** AMONG is the working product brand. The tagline and homepage copy establish the emotional promise before users encounter feature details: anonymous human connection without identity-driven social pressure.

**Document scope note:** This PRD is intentionally **product-focused, not technical**. It defines *what* must be built and *why*, including detailed functional requirements, data needs, states, and edge cases — but it does not prescribe a technology stack, frameworks, database engine, or hosting provider. Those decisions are left to a separate technical architecture document. **MVP platform target is responsive web only** (no native mobile apps, no PWA-specific requirements at this stage).

Wherever this document proposes content that was not already specified and is a judgment call rather than a stated requirement, it is marked **[ASSUMPTION]** so it can be reviewed, confirmed, or overridden.

---

## Table of Contents

1. Executive Summary
2. Product Vision & Principles
3. Problem Statement
4. Target Users & Jobs to Be Done
5. Competitive Positioning & Differentiation
6. Product Concepts & Core Mechanics
7. User Journeys
8. Feature Requirements
9. Messaging & Temporary Conversations
10. Discovery & Ranking
11. Trust, Safety & Moderation
12. Subscription & Monetization
13. Information Architecture
14. Visual Design Language & Theme
15. MVP Scope
16. V1 / Future Roadmap
17. Metrics & Success Criteria
18. Non-Functional Requirements
19. SEO Requirements (Strict)
20. Admin Dashboard & Internal Tooling
21. Risks & Open Questions
22. Launch Strategy
23. Final Product Definition

---

## 1. Executive Summary

Anonymous Internet is a web platform designed around a simple human need: being understood without having to reveal who you are. Instead of recreating Reddit's community/post/karma model, the product organizes participation around human experiences and emotional states. Users publish an experience, discover people going through something similar, indicate "I'm going through this too," respond through structured reactions, and optionally enter temporary anonymous conversations with people who have lived through the same experience.

The product deliberately prevents conventional social-media status accumulation. There are no public follower counts, karma scores, influencer profiles, or permanent public identities. Identity is temporary and interaction is intentionally constrained. The goal is to make the content and the shared human experience more important than the identity of the poster.

---

## 2. Product Vision & Principles

### Vision
Build a global layer of the internet where people can discover that they are not alone, connect with people who understand, and share lived experience without social-performance pressure.

### Product principles
- **Experience over identity:** the unit of value is what someone has lived, not who they are.
- **Anonymity without unaccountability:** users remain anonymous to one another while the platform maintains enforceable safety controls.
- **Relatability over popularity:** ranking should reward meaningful human resonance, not clout.
- **Finite participation over infinite scrolling:** deliberate limits should encourage return without encouraging compulsive consumption.
- **Temporary connection over permanent networking:** conversations can matter without creating follower relationships.
- **Human-to-human value:** the platform should not require AI to create its core value proposition.
- **Safety is foundational:** moderation, reporting, blocking and abuse prevention are core product features, not add-ons.

---

## 3. Problem Statement

Today's social internet is optimized for identity, audience-building, engagement and public reputation. That creates several gaps:
- People often cannot express sensitive thoughts honestly under a persistent identity.
- Traditional anonymous forums can become toxic because anonymity is combined with persistent reputation and weak accountability.
- People frequently search for advice when what they actually need first is recognition: "someone else has been through this."
- Social platforms encourage users to build audiences rather than discover people with matching lived experiences.
- People who have already survived difficult experiences have no simple mechanism to anonymously help someone currently going through the same thing.
- Infinite feeds provide abundant content but little intentional emotional closure.

---

## 4. Target Users & Jobs to Be Done

### Core JTBD
- When I am experiencing something difficult or unusual, I want to know whether other people have experienced it too.
- When I cannot safely attach my name to a thought, I want to express it without building a public identity.
- When someone is facing something I have already survived, I want to help them without creating a permanent relationship.
- When I return each day, I want to discover one meaningful human experience rather than consume an endless generic feed.

### Primary user segments **[ASSUMPTION — not explicit in source, proposed for clarity]**
- **The Sharer:** currently going through something difficult and needs to say it without consequence to their real identity.
- **The Relater:** browsing to find people who've experienced something similar, mainly for recognition ("I'm not alone"), not necessarily to post.
- **The Helper:** has survived an experience and wants to anonymously support someone currently in it, without becoming their permanent contact.
- **The Explorer:** curious, browses categories casually, low posting frequency, potential future Sharer/Helper.

---

## 5. Competitive Positioning & Differentiation

The product must explicitly avoid becoming "Reddit with anonymous usernames."

| Dimension | Reddit / traditional forums | Anonymous confession apps (e.g. Whisper-style) | AMONG |
|---|---|---|---|
| Identity | Persistent username, karma, history | Fully anonymous, no accountability | Temporary alias, private accountable account behind it |
| Ranking signal | Upvotes/karma, raw popularity | Views/likes | Relatability ("Same"), quality of response, experience match |
| Structure | Topic communities (subreddits) | Free-form feed | Experience taxonomy + structured reactions |
| Connection | Follower graphs, permanent DMs | None or unmoderated DMs | Temporary, consent-based, experience-matched conversations |
| Session shape | Infinite scroll | Infinite scroll | Deliberately finite daily discovery |
| Safety model | Community moderation, uneven | Weak to none | Platform-enforced accountability + moderation as core feature |

**[ASSUMPTION]** This comparison table is proposed to make the differentiation concrete for design and engineering; the underlying claims come directly from the source document's principles and problem statement.

---

## 6. Product Concepts & Core Mechanics

### 6.1 Temporary Identity
- Every session or defined identity window assigns a system-generated alias such as "Blue Fox."
- The alias does not accumulate public followers, karma or permanent reputation.
- Users may optionally have a private internal account for settings, subscription and safety enforcement; this identity is never exposed publicly.
- Identity expiration rules must be configurable during product experimentation. Recommended initial model: temporary public identity with a controlled renewal cycle rather than permanent handles.
- Users should be unable to search for a person by alias as a primary discovery mechanism.

**Alias renewal — open decision, proposed default [ASSUMPTION]:** alias rotates automatically every **7 days**, or immediately if the user explicitly requests "New Identity" from settings (rate-limited to prevent abuse of rotation to evade moderation — see §11). A user's private account persists across alias rotations; their experience history, saved items and active conversations persist and simply become associated with the new alias going forward. Conversations in progress at the moment of rotation keep their existing alias for the life of that conversation so the other participant isn't confused mid-conversation.

### 6.2 Experience-First Posting
- Posting begins by selecting or describing an experience, feeling or situation.
- Suggested experience categories: Relationships, Work, Money, Family, Friendship, Loneliness, Identity, Life Changes, Failure, Success, Fear, Regret, Travel, Health-adjacent life experiences, and "Things I Can't Say."
- Posts should emphasize first-person lived experience rather than news, memes or generic topical debate.
- Users can choose a visibility level: broad experience pool, focused pool, or temporary/private circle.

**Category selection detail [ASSUMPTION]:** a post can be tagged with 1–3 categories max (prevents category-spamming for reach); at least 1 is required to publish, unless the user is in "Things I Can't Say" mode where category tagging is optional to reduce friction for the most sensitive disclosures.

### 6.3 "I'm Going Through This Too"
The signature interaction. A user can indicate that the experience is current or personally familiar. The platform aggregates this into meaningful, privacy-preserving counts.
- **Current:** "I'm going through this now."
- **Past:** "I've been through this."
- **Considering:** "I'm considering this."
- Other structured reactions: "I understand," "I learned something," "I disagree," "Tell me more."
- Show aggregate participation without exposing individual identities.

**Interaction rules [ASSUMPTION]:** a user may select at most one of Current/Past/Considering per post (mutually exclusive, since they describe the user's own relationship to the experience), plus any number of the secondary reactions ("I understand," "I learned something," "I disagree," "Tell me more") which are non-exclusive. A user can change their selection at any time; the aggregate counts update accordingly. Reaction choice is private — never shown to the poster or other users as "who reacted," only as counts.

### 6.4 "Same" / Relatability
A post can surface a "SAME" count rather than a conventional like count. Users can see aggregate statistics such as the number of people who relate, optionally segmented by broad, privacy-safe dimensions.

**Segmentation detail [ASSUMPTION]:** aggregate segments (e.g. by broad age band or region) are only shown when the underlying group size exceeds a minimum privacy threshold (see §11 privacy-by-design; recommended minimum group size of 100 before showing any segmented breakdown) to avoid indirectly identifying small groups of individuals.

### 6.5 "You Are Not Alone"
A recurring experience summary shows how many people have recently reported similar experiences. Example: "12,841 people shared an experience similar to yours this week." Avoid presenting sensitive statistics in a way that could identify individuals.

### 6.6 "Someone Needs You"
Users who have previously marked an experience as survived can receive an optional daily prompt connecting them to an anonymous post from someone currently experiencing that situation. The responder can choose to help, skip or receive another prompt.

**Frequency & consent detail [ASSUMPTION]:** this is opt-in per experience category (a user marking "Past" on an experience is asked, at that moment, "Would you be open to helping someone going through this now?"). At most one "Someone Needs You" prompt is delivered per day per user, to preserve the finite-participation principle. Skipping has no penalty and does not reduce future prompt frequency.

### 6.7 Experience Graph
The system privately maintains a user's experience history so it can identify appropriate peer matches. This is not a public profile. Users should be able to inspect, edit and delete their experience history.

**Detail [ASSUMPTION]:** the experience graph stores, per user: categories/experiences posted about, reaction selections (Current/Past/Considering) per post, and conversations entered — each with timestamps. It is used only for (a) matching in "Someone Needs You" and temporary conversations, and (b) the user's own private "You Are Not Alone" and experience-history views. It is never used to build a public profile, never shown to other users, and is fully exportable and deletable by the user on request (see §18 data rights).

---

## 7. User Journeys

### 7.1 First 60 seconds
1. Landing page communicates: "A place to meet people who understand."
2. User chooses broad intent: Share something / Find people like me / Help someone / Explore.
3. User selects 3–5 experiences or emotional areas of interest.
4. System assigns a temporary public identity.
5. User sees a single high-quality experience rather than an infinite feed.
6. User can select "Same," respond, or start a temporary conversation if eligible.
7. User is invited to create their first post.

### 7.2 Daily return loop
1. Open the site.
2. See one primary daily human experience and a small number of optional discoveries.
3. Receive a "Someone Needs You" prompt if there is a safe, relevant match.
4. Use limited daily participation: one primary post and a small number of meaningful responses.
5. Review "You Are Not Alone" aggregate insights.
6. Return the following day because the experience pool, identity and daily prompts refresh.

### 7.3 Posting journey
1. Tap Share.
2. Select an experience category or start with free text.
3. Write the experience in first person.
4. Choose whether it is current, past, or exploratory.
5. Select audience scope.
6. Review a safety reminder.
7. Publish anonymously.
8. Receive structured responses and "Same" participation.

### 7.4 Temporary conversation journey **[ASSUMPTION — new, to complete the journey set]**
1. User taps "Talk to someone who has been through this" on a post or from a "Someone Needs You" prompt.
2. System checks eligibility (see §9.1) and shows a matching state ("Looking for someone available...").
3. On match, both parties see the context card: "You are connected because both of you selected: [experience]."
4. Optional structured opening prompts are offered to reduce blank-page friction (e.g. "Ask what helped them get through it").
5. Conversation proceeds; either party can report, block or leave at any time.
6. Conversation ends by explicit exit, inactivity timeout, or max-duration limit (see §9.2).
7. On end, each participant is shown a brief, optional feedback prompt ("Was this conversation helpful?") for quality signal — answering is never required.
8. No connection persists afterward; a new conversation requires a new match.

### 7.5 Blocked/no-match journey **[ASSUMPTION — new]**
1. User requests a temporary conversation but no eligible match is currently available.
2. System shows a clear waiting state with an estimated context ("We'll notify you when someone's available") rather than a spinner with no explanation.
3. User can cancel the request at any time.
4. If no match occurs within a defined window (**[ASSUMPTION] 15 minutes**), the request expires and the user is notified, with an invitation to browse existing responses instead.

---

## 8. Feature Requirements

This section defines the functional requirements for every feature area referenced above, in enough detail to build against. **All content in this section is [ASSUMPTION]-derived detail**, expanding the concepts in §6 into buildable requirements; it was empty in the source document.

### 8.1 Onboarding & Private Account
- **FR-1:** System must create a private account on first visit, tied to a device/browser session, without requiring any personally identifying information to browse or post.
- **FR-2:** Account creation requires only an authentication credential sufficient to allow return access — **[ASSUMPTION, requires product decision]**: options are (a) email + password/magic link, (b) phone number, or (c) fully local/anonymous account recoverable only via a recovery code. Recommended default: email or magic link, since it supports account recovery, cross-device access, subscription billing, and moderation enforcement (ban evasion prevention), while never being shown publicly.
- **FR-3:** During onboarding, user selects 3–5 experience categories of interest (required, minimum 3, maximum 5) before reaching first content.
- **FR-4:** System auto-generates a temporary alias immediately after category selection, before any content is shown.
- **FR-5:** Age gate: user must confirm they meet the platform's minimum age (see §11) before onboarding completes; false attestation is subject to enforcement if later discovered.
- **FR-6:** User must accept Terms of Service and a plain-language safety/community-guidelines summary before their first post (not before browsing).

### 8.2 Posting
- **FR-7:** Compose flow requires: experience text (first-person), 1–3 category tags (0 allowed only in "Things I Can't Say"), a state selector (current / past / exploratory), and a visibility/audience scope selector.
- **FR-8:** Character limits — **[ASSUMPTION]**: minimum 20 characters (prevents low-effort noise), maximum 3,000 characters for the main post body.
- **FR-9:** No image, video or file uploads in V1 (text-only), to reduce identifying metadata risk and moderation surface area — **[ASSUMPTION, confirm]**.
- **FR-10:** Before publish, system shows a one-time-per-session safety reminder (e.g. "Don't include names, locations or contact details that could identify you or someone else").
- **FR-11:** System runs an automated pre-publish content check (see §11) for clearly prohibited content (e.g. explicit threats, illegal solicitation, personal identifying info patterns) before the post becomes visible to others.
- **FR-12:** After publishing, the author can edit the post within a limited window (**[ASSUMPTION] 15 minutes**) and can delete it at any time; deletion removes it from all feeds and matching, though existing conversation transcripts referencing it are unaffected.
- **FR-13:** Daily posting limit enforced per the finite-participation principle — **[ASSUMPTION] 1 primary post per day**, to keep the feed high-signal and prevent flooding.

### 8.3 Reactions & "Same"
- **FR-14:** Each post supports one mutually-exclusive primary reaction per user (Current / Past / Considering / none) and any number of secondary reactions (Same, I understand, I learned something, I disagree, Tell me more).
- **FR-15:** Reaction counts are shown as aggregates only; no list of "who reacted" is ever exposed, even to the post author.
- **FR-16:** A user can change or remove their own reaction at any time; counts update in near-real-time.
- **FR-17:** Reaction data feeds the private experience graph (§6.7) and the "You Are Not Alone" aggregate (§6.5), but not any public profile.

### 8.4 Discovery Feed
- **FR-18:** Home surface shows one "primary daily experience" plus a small, bounded number of secondary discoveries (**[ASSUMPTION] up to 5 secondary items**), not an infinite scroll.
- **FR-19:** Feed composition uses the ranking factors in §10; raw reaction counts never solely determine placement.
- **FR-20:** Users can browse an "Explore by category" view showing more posts within a chosen category, still paginated in bounded batches rather than true infinite scroll, to preserve the finite-participation principle.
- **FR-21:** Users can save a post to a private "saved experiences" list, visible only to themselves.
- **FR-22:** System must avoid repeated exposure to the same distressing content across sessions (see §10, §11).

### 8.5 "Someone Needs You"
- **FR-23:** Eligibility to receive prompts requires the user to have marked at least one experience "Past" and opted in when asked.
- **FR-24:** At most one prompt per user per day; user can accept (enter conversation flow), skip (see another candidate, bounded to **[ASSUMPTION] 3 skips per prompt cycle**), or dismiss for the day.
- **FR-25:** Opt-out is available per-category and globally at any time from settings.

### 8.6 Notifications
- **FR-26:** In-app notifications for: new structured reaction on your post, "Someone Needs You" prompt available, new message in an active temporary conversation, conversation ending soon (inactivity warning), moderation action affecting your content or account.
- **FR-27:** Optional email notifications for the same categories, opt-in, off by default for anything except account/security and moderation notices — **[ASSUMPTION]**.
- **FR-28:** No notification ever includes another user's alias-identifying content in a way that could be seen by someone glancing at a device (e.g. lock-screen previews should be generic: "You have a new message on AMONG," not message contents) — **[ASSUMPTION, privacy-by-design]**.

### 8.7 Account & Settings
- **FR-29:** Settings include: notification preferences, category interests (edit anytime), "Someone Needs You" opt-in per category, alias rotation control ("New Identity" button, rate-limited), blocked users list, data export, data/account deletion, subscription management (post-MVP).
- **FR-30:** Data export produces a machine-readable copy of the user's own posts, reactions, saved items and experience history (see §18).
- **FR-31:** Account deletion is self-service, permanently removes the private account and disassociates/anonymizes or deletes authored content per policy (exact retention rule is a §19 open question).

### 8.8 Reporting, Blocking, Moderation Surfaces
- Detailed in §11; the interaction surfaces (report button on every post/response/message, block button on every alias-level interaction) are considered core feature requirements co-equal with posting and messaging, per the product principle "safety is foundational."

---

## 9. Messaging & Temporary Conversations

Messaging is a critical differentiator and must not turn into conventional DMs.

### 9.1 Match initiation
- A user selects "Talk to someone who has been through this."
- The system matches based on experience compatibility, current/past state and safety eligibility.
- Neither party sees identifying profile information.
- Both parties see a simple context card: "You are connected because both of you selected: [experience]."

### 9.2 Conversation rules
- Conversation is temporary and expires after a defined period of inactivity or a maximum duration.
- Either person can end the conversation immediately.
- No follower conversion from a temporary conversation.
- Optional structured prompts can help start the conversation.
- Users can report, block or exit at any time.
- The platform should prevent direct exchange of prohibited personal information where appropriate and provide safety warnings.

**Proposed limits [ASSUMPTION]:** inactivity expiry after **30 minutes** of no messages from either side; hard maximum conversation duration of **48 hours** from start, after which it auto-closes regardless of activity (reinforces "temporary," prevents de facto permanent relationships). A warning is shown to both parties **5 minutes before inactivity expiry** and **1 hour before max-duration expiry**, with an option to send one more message to keep it alive (inactivity case only — max duration is a hard ceiling).

### 9.3 Messaging states
**[ASSUMPTION — full state model, proposed to complete this subsection]**

| State | Description | Available actions |
|---|---|---|
| **Requested** | User has asked to be matched; system is searching for an eligible, available counterpart. | Cancel request |
| **Matched — pending start** | A match has been found; context card shown to both; conversation not yet active until both parties send a first message or an opening prompt is used. | Send opening message, leave without starting (no penalty) |
| **Active** | Both parties have exchanged at least one message; conversation is live. | Send message, report, block, end conversation |
| **Inactivity warning** | No message sent by either party for a defined threshold; expiry imminent. | Send message to continue, allow it to expire |
| **Ended — by user** | Either party explicitly ended the conversation. | View read-only transcript for a limited window (**[ASSUMPTION] 24 hours**) then transcript is removed from the ending user's view; re-contact requires a new match request |
| **Ended — inactivity expiry** | Conversation auto-closed after the inactivity threshold with no response. | Same as above |
| **Ended — max duration reached** | Conversation auto-closed at the hard ceiling. | Same as above |
| **Ended — moderation action** | Conversation closed by the platform due to a report/violation. | Reporting party retains ability to reference it in their report; violating party may lose messaging privileges per §11 enforcement ladder |
| **No match found** | Request expired with no eligible counterpart (see §7.5). | Retry, browse posts instead |

### 9.4 Prohibited-information safeguards **[ASSUMPTION — expands on the source's safety warning requirement]**
- Automated, on-device-or-server pattern detection flags likely phone numbers, email addresses, social handles, or full names typed into a message before it sends, and shows an inline warning ("This looks like contact info — sharing it could compromise your anonymity") with a confirm-or-edit choice, rather than a hard block, to avoid over-blocking legitimate text (e.g. numbers that aren't phone numbers).
- Warning is shown once per conversation per category of flagged content (not on every message) to avoid being naggy.

---

## 10. Discovery & Ranking

The ranking system should optimize for meaningful relevance, not maximum time-on-site.

- Experience similarity
- Recency
- Quality and usefulness of responses
- Diversity of experiences
- User-selected interests
- Safety and moderation confidence
- Avoidance of repeated exposure to distressing content
- Freshness and prevention of popularity monopolies

Do not use raw likes as the primary ranking signal. A post with 20,000 generic reactions should not automatically dominate a highly relevant post with 80 meaningful responses.

**Ranking factor weighting — open decision [ASSUMPTION, flagged also in §19]:** exact weights between these factors (e.g. how much recency should discount vs. relevance) require experimentation and are not fixed here; the requirement is that the ranking function is a weighted composite of the listed factors, none of which is raw popularity count alone, and that weights are configurable server-side without a client release (so they can be tuned post-launch).

---

## 11. Trust, Safety & Moderation

Anonymous Internet must be designed around the principle: anonymous to other users, accountable to the platform.

- Report post, response and message.
- Block user/session/identity.
- Rate limits for posting, replying and messaging.
- Anti-spam and anti-bot controls.
- Abuse detection and moderation queues.
- Rules against threats, harassment, targeted abuse, illegal transactions, exploitation and other prohibited content.
- Crisis-sensitive handling for high-risk content, including escalation pathways appropriate to the product's jurisdiction and policies.
- Age-gating and age-appropriate product controls.
- Moderator tools for reviewing reports, applying sanctions and auditing enforcement.
- Progressive enforcement: warning, cooldown, temporary restriction, permanent ban, depending on severity.
- Privacy-by-design: minimize public metadata and prevent easy deanonymization.

**Requirements to build against these principles [ASSUMPTION, expanded detail]:**
- **Report flow:** every post, response, and message has a report control; reporting requires selecting a reason category (e.g. harassment, self-harm risk, illegal content, spam, impersonation/deanonymization attempt, other) and allows optional free text. Reporting is anonymous to the reported party.
- **Block:** blocking hides all of the blocked alias's current and future content from the blocking user and prevents future matching between the two private accounts (block persists across alias rotations, since it's tied to the private account, not the alias).
- **Rate limits [ASSUMPTION defaults]:** posting 1/day (per §8.2), responses/reactions a generous but bounded daily cap (e.g. 50/day) to blunt scripted abuse, conversation requests capped (e.g. 10/day) to prevent match-flooding.
- **Crisis-sensitive handling:** posts or messages matching high-risk patterns (e.g. explicit self-harm intent) trigger a supportive in-product resource surface (crisis resources) shown to the user in addition to normal moderation review; this is a product requirement independent of the moderation queue and must never be suppressed or delayed pending human review.
- **Age gating:** minimum age enforced at onboarding attestation (§8.1); exact minimum age and any additional verification requirement is a legal/policy decision — flagged in §19.
- **Progressive enforcement ladder:** (1) warning with explanation, (2) temporary cooldown (posting/messaging paused, browsing still allowed), (3) temporary restriction (e.g. 7/30 days), (4) permanent ban of the private account (and reasonable technical measures against trivial re-registration for severe cases).
- **Moderator tooling requirements:** queue of open reports sorted by severity/age; ability to view the reported content plus surrounding context (not the reporting user's identity to the moderator beyond what's needed); action log (who/what/when) for every enforcement action, for auditability (§18).

---

## 12. Subscription & Monetization

### 12.1 Monetization Architecture Principle
The first real release should not monetize users. However, the product architecture should be designed from day one so monetization can be introduced later without major restructuring.

The objective of V1 is to discover what users genuinely value enough to pay for rather than guessing at premium features in advance.

**Free User gets:**
- Experience history
- Connections
- Conversation history
- Saved experiences
- Usage patterns

**Potential premium demand (hypotheses to validate, not commitments):**
- Highly specific matching with people who have experienced a particular situation.
- Longer or richer access to temporary conversations and conversation history.
- A deeper personal experience journey/archive showing how the user's experiences evolve over time.
- Potential premium demand should be validated through observed behavior, user interviews, feature requests and controlled pricing experiments.

**Guiding principle:** Do not guess what users will pay for. Let actual user behavior and repeated demand identify the premium value.

Core participation should remain free enough to create network density. Premium should sell depth, personalization and richer connection — not basic speech. Pricing is a hypothesis and should be validated through experiments. Subscription should be introduced only after evidence that the free product has strong repeat usage.

---

## 13. Information Architecture

**[ASSUMPTION — full IA proposed to complete this section, which was empty in the source]**

### 13.1 Top-level navigation (responsive web)
- **Home** (primary daily experience + secondary discoveries)
- **Explore** (browse by category)
- **Compose / Share** (entry point to posting flow — persistent action, not a nav tab)
- **Conversations** (active/ended temporary conversations, matching requests)
- **You Are Not Alone** (aggregate insight surface)
- **Saved**
- **Settings**

### 13.2 Page/screen inventory
| Page | Purpose | Key states |
|---|---|---|
| Landing (logged-out) | Brand promise, entry CTA | default |
| Onboarding — intent selection | Choose Share / Find / Help / Explore | default |
| Onboarding — category selection | Pick 3–5 categories | validation (min/max) |
| Onboarding — account creation | Credential capture | error (invalid/duplicate) |
| Home / primary feed | One primary experience + secondary discoveries | empty (no eligible content), loading |
| Explore — category view | Paginated bounded browse | empty, end-of-batch |
| Post detail | Full post, reactions, response entry | deleted/removed states |
| Compose | Create/edit a post | draft, safety reminder, publish error |
| Someone Needs You | Prompt surface | none available, skip flow |
| Conversation request/matching | Waiting state | requested, matched-pending, no-match |
| Conversation thread | Active messaging | active, inactivity warning, ended (each ended sub-state per §9.3) |
| You Are Not Alone | Aggregate stats surface | insufficient data (below privacy threshold) |
| Saved experiences | Private saved list | empty |
| Experience history | Private experience graph view | empty |
| Settings — root | Links to sub-settings | default |
| Settings — notifications | Toggle preferences | default |
| Settings — categories/interests | Edit onboarding selections | default |
| Settings — identity | "New Identity" control, rotation status | rate-limited state |
| Settings — blocked users | List/manage blocks | empty |
| Settings — privacy/data | Export, delete account | export-in-progress, deletion-confirmation |
| Report modal | Submit a report | reason selection, confirmation |
| Moderation queue (internal/admin) | Moderator review tool | out of user-facing IA, listed for completeness |

### 13.3 Navigation rules
- No public user-facing profile pages exist anywhere in the IA (no "view alias's posts" page), consistent with §6.1's no-alias-search rule.
- "Compose" is reachable from every primary screen as a persistent action, not buried in a menu, since posting is the core value action.
- Conversations are only reachable from the Conversations tab or directly from a "Talk to someone" action on a post/prompt — never listed publicly.

---

## 14. Visual Design Language & Theme

**Design direction (as specified):** a clean, modern, premium visual theme with a pure white background, deep black/charcoal typography, subtle light-gray borders, and a single solid indigo accent color — completely avoiding gradients. A spacious editorial layout with large expressive typography, soft rounded corners, minimal icons, pill-shaped buttons, subtle micro-interactions, and simple abstract anonymous avatars. The interface stays intentionally uncluttered and calm, with the user's words and experiences as the visual focus rather than colorful cards or dense social-media-style feeds. The overall feeling: quiet, human, intimate, sophisticated, and slightly mysterious — a beautiful modern corner of the internet, not another Reddit or social-media clone.

This section translates that direction into concrete, buildable design-system requirements. Exact values (hex codes, pixel/rem scales) are **[ASSUMPTION]** starting points for a design system, not final brand-locked decisions — a designer/design tool pass should confirm and refine them, but engineering should not invent its own values in the meantime.

### 14.1 Color system
- **Background:** pure white (`#FFFFFF`) as the dominant surface across the entire product — no off-white, no tinted backgrounds, no gradients anywhere in the UI (buttons, headers, cards, empty states, or marketing pages).
- **Primary text:** deep black/charcoal (**[ASSUMPTION]** `#1A1A1A`–`#111111` range) rather than pure `#000000`, for a slightly softer, premium feel while retaining strong contrast.
- **Borders/dividers:** subtle light gray (**[ASSUMPTION]** `#E5E5E5`–`#EDEDED` range), used for card outlines, input borders and section dividers — never a heavy or dark border.
- **Accent color:** a single solid indigo (**[ASSUMPTION]** in the `#4F46E5`–`#4338CA` range), used deliberately and sparingly — primary buttons, active states, the "Same"/reaction highlight, links, and focus rings. No secondary or tertiary accent colors, no multi-color category tagging system (categories are distinguished by label/typography, not by color-coding, to avoid the interface reading as a colorful social app).
- **No gradients, anywhere** — this is a strict constraint, including on buttons, hero sections, avatars, or loading states. Flat color only.
- **Semantic colors (safety/system states) [ASSUMPTION, needed but not in the original brief]:** a small, restrained set of semantic colors is still required for error/warning/success states (e.g. report confirmation, form validation, crisis-resource surfacing) — muted, desaturated tones consistent with the calm palette rather than saturated "alert red/green," so safety-critical states remain legible without breaking the design language's restraint.

### 14.2 Typography
- **Large, expressive, editorial scale:** headings (especially H1 on landing/category pages and the "primary daily experience") use a noticeably large type size and generous line-height, closer to an editorial/publishing feel than a typical dense app UI.
- **Typeface pairing [ASSUMPTION]:** a distinctive serif or high-quality humanist serif for the most expressive editorial moments (hero headlines, the featured daily experience, "You Are Not Alone" statements) paired with a clean, neutral sans-serif for UI chrome, body copy, buttons and forms — giving posts an "editorial/literary" feel that elevates user-written text above a typical feed post, while UI elements stay unobtrusive.
- **Hierarchy:** generous spacing between type sizes (per §14.4) so the hierarchy is felt through scale and whitespace, not through color or heavy borders.
- Heading order/semantics still follow the strict SEO requirements in §19.2 — visual scale is a styling concern layered on top of correct semantic heading levels, never a substitute for them.

### 14.3 Shape language
- **Soft rounded corners** applied consistently across cards, inputs, modals and buttons (**[ASSUMPTION]** a single consistent radius scale, e.g. small/medium/large tokens rather than ad hoc per-component values).
- **Pill-shaped buttons** (fully rounded ends) for primary and secondary actions site-wide — this is the signature interactive shape and should be used consistently rather than mixed with square/slightly-rounded buttons elsewhere.
- **Minimal iconography:** icons are used sparingly and only where they aid clarity (e.g. report, block, settings) — thin-stroke, single-color (charcoal or indigo, never multi-color icon sets), never decorative or filled "social app" style icon clusters.

### 14.4 Layout & spacing
- **Spacious, editorial layout:** generous whitespace/margins around content blocks; the "primary daily experience" (§8.4) is presented with the visual weight of a single editorial feature, not a compact feed card.
- Explicitly **not** a dense, colorful, card-grid social-feed layout — one experience (or a small bounded number) is given room to breathe per screen, consistent with the finite-participation product principle (§2) and the bounded discovery feed requirements (§8.4).
- Consistent, generous spacing scale (**[ASSUMPTION]** an 8px-based spacing system) applied uniformly so the "calm, uncluttered" feeling is systematic rather than left to per-page judgment.

### 14.5 Avatars & identity representation
- **Simple, abstract, anonymous avatars** represent each temporary alias — geometric or abstract forms only, never illustrated faces, silhouettes suggestive of real people, or anything that could imply age/gender/ethnicity, consistent with the anonymity and non-identity-driven product principles (§2, §6.1).
- Avatar generation is deterministic per alias (so the same alias looks the same for the life of that alias) but resets/regenerates on alias rotation (§6.1), and uses only the approved palette (indigo accent plus neutral grays — no rainbow avatar-generator palettes).

### 14.6 Micro-interactions & motion
- **Subtle micro-interactions only:** gentle hover/press states on buttons and reactions (e.g. a soft scale or opacity shift, not bouncy or playful animation), a calm transition when a "Same" or reaction count updates, and smooth (not abrupt) transitions between discovery items — reinforcing "quiet" and "sophisticated" rather than "energetic" or "gamified."
- Motion should never be used to create urgency, streak-pressure, or dopamine-loop patterns (e.g. no celebratory confetti/animation on reactions or posting) — this would conflict with the product's explicit rejection of engagement-maximizing, gamified design (§2, §16 guardrail).
- Loading and empty states follow the same restrained visual language (flat, minimal, no illustrated mascots or playful graphics) so the tone stays consistent even in non-happy-path moments.

### 14.7 Tone through design
- The interface should read as closer to a thoughtfully designed editorial/publishing product or a premium journaling tool than a social network — reinforced by the absence of follower counts, karma badges, colorful category chips, or any UI element that rewards visibility/popularity (consistent with §2's "relatability over popularity" and §6's rejection of status accumulation).
- Every design decision should be evaluated against the stated feeling — **quiet, human, intimate, sophisticated, slightly mysterious** — as a design review checklist, not just the individual component specs above.
- **Accessibility note [ASSUMPTION, ties to §18 NFRs]:** the indigo-on-white and charcoal-on-white palette must meet WCAG AA contrast ratios for text and interactive elements; the light-gray borders are decorative/structural only and must not be the sole means of conveying any functional state (e.g. focus, error, disabled) — those states need an additional non-color signal (e.g. icon, weight change) to remain accessible.

---

## 15. MVP Scope

The MVP should prove one hypothesis: **people will repeatedly return to discover and connect with humans who share their experiences.**

- Responsive web app
- Private account + temporary public identity
- Experience taxonomy
- Anonymous posting
- Experience pool pages
- SAME / current / past structured interactions
- Limited daily discovery feed
- Temporary anonymous 1:1 messaging
- Block/report
- Basic moderation dashboard
- Basic notifications
- Basic analytics
- Landing page and onboarding

**Explicitly out of MVP:** creator economy, follower system, permanent public profiles, complex gamification, advertising, large-scale creator tools and broad general-purpose discussion communities. Also out of MVP per this session's platform decision: native mobile apps, PWA-specific capabilities.

---

## 16. V1 / Future Roadmap

- Someone Needs You matching
- Private experience graph
- Temporary anonymous circles
- Advanced matching
- Geographic and demographic aggregate insights with strict privacy thresholds
- Personal experience timeline
- Premium archives
- Community-led moderation
- Optional verified professional/peer roles where appropriate, without exposing identity by default
- Localized experience pools
- Mobile apps after web retention is validated

---

## 17. Metrics & Success Criteria

### North-star metric
**Weekly Meaningful Connections (WMC):** the number of weekly user interactions that meet a defined quality threshold, such as a meaningful structured response or completed temporary conversation.

**Guardrail:** optimize for meaningful connection and safety, not raw session length. A shorter session that leaves a user feeling understood can be a successful session.

**Supporting metrics — proposed to operationalize WMC [ASSUMPTION]:**
- D1/D7/D30 retention
- % of posts receiving at least one meaningful structured reaction within 24 hours
- Conversation completion rate (reached "Active" state, not abandoned at "Matched — pending start")
- Report rate per 1,000 posts/messages (safety health signal, watched for both spikes and unnaturally-low rates that might indicate under-reporting friction)
- Opt-in rate for "Someone Needs You"
- Average time-to-first-post for new users (onboarding friction signal)

---

## 18. Non-Functional Requirements

- Fast first contentful experience on mobile web.
- Reliable message delivery with clear send/failure states.
- Strong privacy controls and minimal public metadata.
- Auditability of moderation actions.
- Scalable abuse-prevention architecture.
- Secure storage and access controls for private account and experience data.
- Data deletion/export capabilities appropriate to applicable privacy requirements.
- Accessible UI with keyboard navigation, screen-reader labels, sufficient contrast and clear interaction states.

*See §19 for strict SEO requirements (server rendering, structured data, Core Web Vitals) and §20 for the internal admin/moderation dashboard, both of which impose additional non-functional constraints layered on top of the above.*

---

## 19. SEO Requirements (Strict)

**[ASSUMPTION — new section, added per explicit request]** SEO is treated as a strict, non-negotiable engineering requirement, not a post-launch polish item — every page shipped must satisfy the requirements below before it goes live. There is one inherent tension to name up front: the product's anonymity model means there are **no permanent public profile pages** and content can be user-deleted at any time. SEO strategy is therefore built around **evergreen, structural pages** (landing, category/experience pools, static/marketing pages) rather than individual ephemeral posts, which are not the primary SEO surface. Individual posts may still be indexed, but must degrade gracefully (redirect or soft-404 with links onward) when deleted, per the no-dead-end rule below.

### 18.1 Technical SEO foundations
- **FR-SEO-1:** Every page must be server-rendered or pre-rendered (not a client-side-only rendered blank shell) so crawlers receive full HTML content on first response, not a JS-dependent placeholder.
- **FR-SEO-2:** Every indexable page has a unique, descriptive **`<title>`** tag (recommended 50–60 characters) and a unique **meta description** (recommended 140–160 characters) — no two pages ever share identical title/description, and none are left as defaults/placeholders.
- **FR-SEO-3:** Every page declares a single canonical URL (`<link rel="canonical">`) to prevent duplicate-content penalties from pagination, sorting, or tracking parameters.
- **FR-SEO-4:** URLs are human-readable, lowercase, hyphen-separated, and stable (e.g. `/explore/loneliness`, `/experiences/career-uncertainty`) — no exposed internal IDs alone, no unnecessary query-string-only addressing for primary content.
- **FR-SEO-5:** A single `sitemap.xml` (or sitemap index for scale) is generated and kept current, listing all indexable evergreen pages (landing, category pages, static/marketing pages) at minimum; individual post inclusion is a policy decision (see §19.4).
- **FR-SEO-6:** `robots.txt` explicitly allows crawling of public evergreen pages and explicitly disallows all private surfaces (settings, conversations, compose, account, moderation/admin — see §20) so nothing behind the private-account boundary is ever crawlable.
- **FR-SEO-7:** Structured data (schema.org JSON-LD) is implemented where applicable — e.g. `Organization`/`WebSite` on the homepage, `BreadcrumbList` on category and nested pages, `FAQPage` if an FAQ/help section exists.
- **FR-SEO-8:** Open Graph and Twitter Card meta tags are present on every shareable page (landing, category pages, and the "SAME"/aggregate-stat share cards referenced in §20 Launch Strategy) so social shares render properly — with no personally-identifying content ever included in shared previews.
- **FR-SEO-9:** Core Web Vitals targets are treated as SEO requirements, not just performance nice-to-haves: fast Largest Contentful Paint, minimal Cumulative Layout Shift, responsive input handling — aligned with the mobile-web performance requirement already in §18.
- **FR-SEO-10:** All images (where used — e.g. marketing/landing assets; recall §8.2 excludes user-post media in V1) have descriptive `alt` text; this also serves the accessibility requirement in §18.

### 18.2 Heading order & on-page structure
- **FR-SEO-11:** Every page has exactly **one `<h1>`**, matching the page's primary topic (e.g. the category name on a category page, not the brand name repeated on every page).
- **FR-SEO-12:** Headings must descend in strict logical order (H1 → H2 → H3 …) with no skipped levels (e.g. no H2 followed directly by H4) and no heading tags used purely for visual styling — visual size is a CSS concern, not a heading-level concern.
- **FR-SEO-13:** Section content on longer pages (e.g. category pages, help/guidelines pages) is organized so each major subsection has its own appropriately-nested heading, supporting both crawlers and screen readers (shared requirement with §18 accessibility).

### 18.3 Internal linking — no dead ends
- **FR-SEO-14:** **No page may be a crawler dead end.** Every indexable page must contain at least one internal link forward to another indexable page of the site (e.g. a category page links to related categories and back to Explore; the landing page links into category pages; a help/guidelines page links to related help topics and back to landing).
- **FR-SEO-15:** Primary navigation (§13.1) and a site-wide footer (with links to key evergreen pages: About, Guidelines/Safety, Help, and all top-level categories) are present on every public page, guaranteeing baseline internal linking depth regardless of page-specific content.
- **FR-SEO-16:** Category/experience pool pages cross-link to related/adjacent categories (e.g. "Loneliness" links to "Relationships" and "Identity") to build topical link density and give crawlers multiple paths to every page — target minimum **3 contextual internal links per evergreen page**, beyond global nav/footer.
- **FR-SEO-17:** A user-facing HTML sitemap page (distinct from the XML sitemap) is included in the footer, linking to every top-level category and static page, as a crawlable, human-usable index that further guarantees every page is reachable within a small number of clicks from the homepage.
- **FR-SEO-18:** Breadcrumb navigation is present on nested pages (e.g. Explore → Category → Post) both for users and as a crawlable internal-linking signal, paired with the `BreadcrumbList` structured data in FR-SEO-7.

### 18.4 Individual post pages & content lifecycle
- **FR-SEO-19:** If individual post pages are indexed **[open decision, see §21]**, a deleted or expired post must never return a bare 404 with no path forward: it must either 301-redirect to its parent category page, or render a lightweight "This experience is no longer available" page that still includes full site navigation and links to related, currently-live content in the same category — satisfying FR-SEO-14 even for removed content.
- **FR-SEO-20:** Because posts can rotate out of relevance quickly, evergreen category/experience pages (not individual posts) should be treated as the primary long-term SEO asset and given the most on-page optimization investment (FR-SEO-1 through FR-SEO-13).

### 18.5 Keyword strategy
- **FR-SEO-21:** Each evergreen page (landing, each category, help/guidelines pages) is mapped to a primary keyword theme reflecting real user search intent around that experience/emotion (e.g. "feeling alone," "career change anxiety," "anonymous support for X") — **[ASSUMPTION]** exact keyword research/target list is a marketing/content deliverable outside this PRD's scope, but the requirement is that every evergreen page is built around a deliberate, documented primary keyword and 2–4 secondary keywords, not left unoptimized.
- **FR-SEO-22:** Keyword usage follows standard best practice — present naturally in the H1, one early paragraph, at least one subheading, the meta title, and the URL slug — without keyword stuffing, which search engines penalize and which would also conflict with the product's authentic, non-manipulative tone.

---

## 20. Admin Dashboard & Internal Tooling

**[ASSUMPTION — new section, added per explicit request]** This expands the single "Moderation queue (internal/admin)" line item from §13.2 into full functional requirements. This is internal-only tooling: none of it is part of the public Information Architecture in §13, is never crawlable (see FR-SEO-6), and requires its own authenticated, role-gated access separate from regular user accounts.

### 19.1 Roles & access control
- **FR-ADM-1:** At minimum two internal roles: **Moderator** (handles reports and enforcement) and **Admin** (moderator capabilities plus user/account-level actions, configuration, and access to analytics/metrics).
- **FR-ADM-2:** All admin/moderator access requires separate authentication from regular user accounts, with **[ASSUMPTION]** multi-factor authentication required given the sensitivity of the data accessible.
- **FR-ADM-3:** Every action taken in the dashboard is attributed to the specific internal user who took it (supports the auditability requirement in §11 and §18).

### 19.2 Moderation queue
- **FR-ADM-4:** Unified queue of all open reports (post, response, message) — see §11 — sortable/filterable by severity, content type, age, and report reason category.
- **FR-ADM-5:** Opening a report shows the reported content plus reasonable surrounding context (e.g. the post a reported response is attached to, or the conversation context card for a reported message) — without exposing the reporting user's identity to the moderator beyond what's operationally necessary.
- **FR-ADM-6:** Moderators can take direct action from the queue: dismiss report, remove content, issue warning, apply cooldown/temporary restriction, escalate to Admin for permanent ban consideration (permanent bans reserved for Admin role per FR-ADM-1) — matching the progressive enforcement ladder in §11.
- **FR-ADM-7:** Crisis-flagged content (§11) is visually distinguished and prioritized at the top of the queue regardless of report age, and does not block or wait on the standard queue order.
- **FR-ADM-8:** Every enforcement action is logged with timestamp, acting admin/moderator, action taken, and reference to the triggering report, forming the audit log required in §11/§18.

### 19.3 User/account management
- **FR-ADM-9:** Admin can look up a private account (by internal ID or account credential, never by public alias, since aliases aren't a stable identifier) to view its enforcement history, current restriction status, and take manual action (suspend, ban, lift restriction, force alias rotation).
- **FR-ADM-10:** Admin can process account-deletion and data-export requests that require manual verification or fall outside the self-service flow (§8.7), and can confirm completion for compliance record-keeping (§18).

### 19.4 Analytics & metrics dashboard
- **FR-ADM-11:** Dashboard surfaces the core metrics defined in §17: Weekly Meaningful Connections, retention (D1/D7/D30), conversation completion rate, report rate per 1,000 posts/messages, "Someone Needs You" opt-in rate, and time-to-first-post.
- **FR-ADM-12:** Report-rate and enforcement metrics are broken out separately from growth/engagement metrics, so a spike in abuse is visible independently of overall usage trends (supports the safety-guardrail principle in §17, distinct from optimizing for raw engagement).
- **FR-ADM-13:** Basic content/category-level breakdowns (e.g. volume and report-rate by experience category) to inform both product decisions (§10 ranking tuning) and moderation staffing/prioritization.

### 19.5 Configuration
- **FR-ADM-14:** Ranking-factor weights (§10) are adjustable from the admin tooling without requiring a client release, per the requirement already noted in §10.
- **FR-ADM-15:** Rate limits (§11 — posting, reactions, conversation requests) and enforcement-ladder thresholds are configurable server-side, since these will need tuning as real abuse patterns emerge post-launch.
- **FR-ADM-16:** Feature flags/toggles for major features (e.g. enabling/disabling "Someone Needs You," subscription surfaces once introduced per §12) to support staged rollout without redeploying.

---

## 21. Risks & Open Questions

**[ASSUMPTION — this entire section was empty in the source; the items below are proposed as the key open questions worth resolving before/while building]**

### Risks
- **Toxic-content risk in an anonymous, emotionally-charged product:** the core value proposition (safe disclosure) is directly at odds with the primary risk (abuse of anonymity). Moderation and crisis-handling must ship with V1, not follow it.
- **Cold-start / empty-pool risk:** experience categories with too few participants produce a poor first experience (no relatable content, no match availability for conversations). Needs a seeding strategy (see §20).
- **Re-identification risk:** even without public profiles, writing style, timing patterns, or repeated details in a post could make a user identifiable to someone who knows them. Product cannot fully prevent this but should message the risk clearly (§8.2 FR-10) and avoid design choices that add identifying metadata.
- **Ban-evasion via alias rotation:** since aliases rotate, enforcement must be tied to the private account, not the alias, or bad actors could rotate to reset moderation standing.
- **Regulatory exposure:** crisis-content handling, age-gating, and data deletion/export obligations vary by jurisdiction; legal review is needed before launch, not assumed to be solved by this PRD.
- **Ranking-gaming risk:** if ranking weights become predictable, bad actors could optimize for reach the same way "farmed" content does on other platforms; weights should not be publicly documented in detail and should be tunable without a release.

### Open questions requiring a decision
- What is the exact minimum age for the platform, and does it require verification beyond self-attestation?
- What is the exact data retention policy after account deletion (immediate purge vs. grace period vs. anonymized retention for safety/legal record-keeping)?
- Should account creation require email, phone, or neither (§8.1 FR-2)? This affects abuse-prevention capability and recovery UX.
- What are the initial exact ranking-factor weights (§10), and who owns tuning them post-launch?
- Should "Things I Can't Say" (the most sensitive category) have additional safeguards beyond the general posting flow (e.g. mandatory human review before publish rather than automated-only)?
- Should moderation be entirely centralized in V1, or should any lightweight community-flagging signal (short of community-led moderation, which is explicitly V1.5+) be used to prioritize the queue?
- What is the legal/support process for a genuine imminent-danger disclosure (e.g. explicit, credible self-harm or harm-to-others intent) — does the crisis-resource surface (§11) need to be paired with any human escalation path, and if so, who staffs it at MVP stage with a small team?

---

## 22. Launch Strategy

### Beachhead
Start with a narrow set of highly relatable experiences where anonymity provides clear value: career uncertainty, loneliness, relationships, major life transitions, money anxiety and personal failure/success.

### Launch loop
1. Seed high-quality first-person experiences.
2. Invite users through "Someone else is going through this too" share cards.
3. Make "SAME" counts and aggregate experience statistics shareable without exposing identities.
4. Introduce daily limited discovery to establish a return habit.
5. Introduce temporary messaging after sufficient matching density exists.
6. Introduce subscription only after D30 retention and meaningful-connection metrics demonstrate product-market signal.

---

## 23. Final Product Definition

Anonymous Internet is not intended to be a better Reddit. It is a different category: an anonymous human-experience network. Its defensibility comes from the combination of temporary identity, experience-first discovery, structured relatability, temporary peer messaging, and an ecosystem designed to make users feel understood rather than popular.

The product should consistently answer one question better than any conventional social network:

**"Who else has lived what I'm living?"**
