// Frontend-only — all page route strings.
// Never use raw route strings in components or hooks — always import from here.

export const ROUTES = {
  // ─── Public routes (crawlable) ─────────────────────────────────────────────
  LANDING: '/',
  EXPLORE: '/explore',
  EXPLORE_CATEGORY: (slug: string) => `/explore/${slug}` as const,
  POST_DETAIL: (id: string) => `/post/${id}` as const,
  ABOUT: '/about',
  GUIDELINES: '/guidelines',
  HELP: '/help',
  SITEMAP: '/sitemap',

  // ─── Onboarding ────────────────────────────────────────────────────────────
  ONBOARDING_INTENT: '/onboarding/intent',
  ONBOARDING_CATEGORIES: '/onboarding/categories',
  ONBOARDING_ACCOUNT: '/onboarding/account',

  // ─── Authenticated app ─────────────────────────────────────────────────────
  HOME: '/home',
  COMPOSE: '/compose',
  CONVERSATIONS: '/conversations',
  CONVERSATION_DETAIL: (id: string) => `/conversations/${id}` as const,
  YOU_ARE_NOT_ALONE: '/you-are-not-alone',
  SAVED: '/saved',
  SOMEONE_NEEDS_YOU: '/someone-needs-you',

  // ─── Settings ──────────────────────────────────────────────────────────────
  SETTINGS: '/settings',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_CATEGORIES: '/settings/categories',
  SETTINGS_IDENTITY: '/settings/identity',
  SETTINGS_BLOCKED: '/settings/blocked',
  SETTINGS_PRIVACY: '/settings/privacy',

  // ─── Admin (internal only) ─────────────────────────────────────────────────
  ADMIN: '/admin',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_REPORT_DETAIL: (id: string) => `/admin/reports/${id}` as const,
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}` as const,
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_CONFIG: '/admin/config',
} as const;

/** Routes included in sitemap.xml (public, evergreen) */
export const PUBLIC_SITEMAP_ROUTES: readonly string[] = [
  ROUTES.LANDING,
  ROUTES.EXPLORE,
  ROUTES.ABOUT,
  ROUTES.GUIDELINES,
  ROUTES.HELP,
  ROUTES.SITEMAP,
];

/** Routes disallowed in robots.txt (never crawlable) */
export const ROBOTS_DISALLOWED_ROUTES: readonly string[] = [
  '/home',
  '/compose',
  '/conversations',
  '/you-are-not-alone',
  '/saved',
  '/someone-needs-you',
  '/settings',
  '/admin',
  '/onboarding',
];
