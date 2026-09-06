/**
 * analyticsClient.ts — Frontend analytics event emitter.
 *
 * Architecture rules (PRD §18):
 *  - Product code emits events; analytics subscribes. Never the reverse.
 *  - Never blocks user interactions — all calls are fire-and-forget.
 *  - Never includes: Firebase UID, email, raw accountId, message body, alias name.
 *  - Events are sent to the backend analytics endpoint which handles HMAC hashing.
 *
 * This client is intentionally thin — it mirrors the server-side event bus
 * concept so analytics can be swapped without touching product code.
 */
import type { AnalyticsEventType } from '../../constants/analyticsEvents';

export interface AnalyticsEventPayload {
  eventType:   AnalyticsEventType;
  sessionId?:  string;
  categoryId?: string;
  /** Non-identifying context only — no content body, no PII */
  metadata?:   Record<string, unknown>;
}

// ─── Session ID ───────────────────────────────────────────────────────────────
// Anonymous session identifier — generated per browser session, not tied to account

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  // Use sessionStorage if available (browser only)
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem('_asid');
    if (stored) { _sessionId = stored; return stored; }
    const fresh = `s-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('_asid', fresh);
    _sessionId = fresh;
    return fresh;
  }
  _sessionId = `s-${Math.random().toString(36).slice(2)}`;
  return _sessionId;
}

// ─── Emit ─────────────────────────────────────────────────────────────────────

const ANALYTICS_ENDPOINT = '/api/analytics/events';

/**
 * Track a client-side analytics event.
 * Fire-and-forget — never awaited by product code.
 * Silently swallows errors — analytics must never affect UX.
 */
export function trackEvent(payload: AnalyticsEventPayload): void {
  if (typeof window === 'undefined') return; // SSR guard

  const body: AnalyticsEventPayload & { sessionId: string } = {
    ...payload,
    sessionId: payload.sessionId ?? getSessionId(),
  };

  // Use sendBeacon when available (survives page unload); fall back to fetch
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(
      ANALYTICS_ENDPOINT,
      JSON.stringify(body)
    );
  } else {
    fetch(ANALYTICS_ENDPOINT, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(body),
      keepalive:   true,
    }).catch(() => {
      // Analytics errors are intentionally swallowed
    });
  }
}
