/**
 * useAnalytics.ts — React hook for analytics event tracking.
 *
 * Returns a `track` function that components can call after meaningful actions.
 * Product logic must NEVER depend on analytics — only call track AFTER the
 * primary action completes.
 *
 * Usage:
 *   const { track } = useAnalytics();
 *   // After creating a post:
 *   track({ eventType: ANALYTICS_EVENT.POST_CREATED, categoryId: cat.id });
 */
'use client';

import { useCallback } from 'react';
import { trackEvent, type AnalyticsEventPayload } from '../lib/analytics/analyticsClient';

export interface UseAnalyticsReturn {
  /**
   * Emit an analytics event — fire-and-forget.
   * Safe to call from any event handler or useEffect cleanup.
   * Never throws, never delays the caller.
   */
  track: (payload: AnalyticsEventPayload) => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const track = useCallback((payload: AnalyticsEventPayload) => {
    // Wrap in setTimeout to ensure it never runs synchronously
    // in the same call stack as the primary action
    setTimeout(() => {
      try {
        trackEvent(payload);
      } catch {
        // Analytics must never affect product UX — swallow silently
      }
    }, 0);
  }, []);

  return { track };
}
