// MIRRORED — keep in sync with frontend/src/constants/featureFlags.ts

export const FEATURE_FLAG = {
  SOMEONE_NEEDS_YOU: 'someoneNeedsYou',
  SUBSCRIPTION_SURFACES: 'subscriptionSurfaces',
  EXPERIENCE_GRAPH_VIEW: 'experienceGraphView',
  GEOGRAPHIC_AGGREGATES: 'geographicAggregates',
  INDEX_POST_PAGES: 'indexPostPages',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAG)[keyof typeof FEATURE_FLAG];

export const DEFAULT_ENABLED_FLAGS: ReadonlySet<FeatureFlag> = new Set([]);

export const DEFAULT_DISABLED_FLAGS: ReadonlySet<FeatureFlag> = new Set([
  FEATURE_FLAG.SOMEONE_NEEDS_YOU,
  FEATURE_FLAG.SUBSCRIPTION_SURFACES,
  FEATURE_FLAG.EXPERIENCE_GRAPH_VIEW,
  FEATURE_FLAG.GEOGRAPHIC_AGGREGATES,
  FEATURE_FLAG.INDEX_POST_PAGES,
]);
