// MIRRORED — keep in sync with backend/src/constants/featureFlags.ts

export const FEATURE_FLAG = {
  SOMEONE_NEEDS_YOU: 'someoneNeedsYou',
  SUBSCRIPTION_SURFACES: 'subscriptionSurfaces',
  EXPERIENCE_GRAPH_VIEW: 'experienceGraphView',
  GEOGRAPHIC_AGGREGATES: 'geographicAggregates',
  INDEX_POST_PAGES: 'indexPostPages',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAG)[keyof typeof FEATURE_FLAG];
