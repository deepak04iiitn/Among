/**
 * analytics.middleware.ts — Post-response analytics event emitter.
 *
 * This middleware attaches a `res.on('finish')` listener that:
 *  - Inspects the matched route and method.
 *  - Maps route patterns to analytics events.
 *  - Emits the event AFTER the response is sent (never delays user-facing requests).
 *  - Is always fire-and-forget — product code is never coupled to analytics.
 *
 * PRD §18 rules:
 *  - Never include Firebase UID, email, raw accountId, or message body.
 *  - accountIdHash only (via hashAccountId).
 *  - Analytics must never block or delay user requests.
 */
import type { Request, Response, NextFunction } from 'express';
import { emitEvent }          from './analytics.service';
import { ANALYTICS_EVENT }    from '../../constants/analyticsEvents';

// ─── Route → event mapping ────────────────────────────────────────────────────

interface RoutePattern {
  method:    string;
  pathRegex: RegExp;
  getEvent:  (req: Request, res: Response) => {
    eventType:         (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];
    metadata?:         Record<string, unknown>;
    categoryId?:       string;
    conversationState?: string;
  } | null;
}

const ROUTE_PATTERNS: RoutePattern[] = [
  // POST /api/posts → POST_CREATED
  {
    method:    'POST',
    pathRegex: /^\/api\/posts$/,
    getEvent:  (_req, res) => {
      if (res.statusCode !== 201) return null;
      return { eventType: ANALYTICS_EVENT.POST_CREATED };
    },
  },

  // PUT /api/posts/:id/reactions → REACTION_SET
  {
    method:    'PUT',
    pathRegex: /^\/api\/posts\/[^/]+\/reactions$/,
    getEvent:  (req, res) => {
      if (res.statusCode !== 200) return null;
      const reactionType = (req.body as { reactionType?: string }).reactionType;
      return {
        eventType: ANALYTICS_EVENT.REACTION_SET,
        metadata:  { reactionType },
      };
    },
  },

  // POST /api/conversations/request → CONVERSATION_REQUESTED
  {
    method:    'POST',
    pathRegex: /^\/api\/conversations\/request$/,
    getEvent:  (_req, res) => {
      if (res.statusCode !== 201 && res.statusCode !== 200) return null;
      return { eventType: ANALYTICS_EVENT.CONVERSATION_REQUESTED };
    },
  },

  // POST /api/conversations/:id/end → CONVERSATION_ENDED
  {
    method:    'POST',
    pathRegex: /^\/api\/conversations\/[^/]+\/end$/,
    getEvent:  (req, res) => {
      if (res.statusCode !== 200) return null;
      const reason = (req.body as { reason?: string }).reason;
      return {
        eventType: ANALYTICS_EVENT.CONVERSATION_ENDED,
        metadata:  { reason },
      };
    },
  },

  // POST /api/reports → REPORT_SUBMITTED
  {
    method:    'POST',
    pathRegex: /^\/api\/reports$/,
    getEvent:  (_req, res) => {
      if (res.statusCode !== 200) return null;
      return { eventType: ANALYTICS_EVENT.REPORT_SUBMITTED };
    },
  },

  // POST /api/users/me/blocks → BLOCK_CREATED
  {
    method:    'POST',
    pathRegex: /^\/api\/users\/me\/blocks$/,
    getEvent:  (_req, res) => {
      if (res.statusCode !== 200) return null;
      return { eventType: ANALYTICS_EVENT.BLOCK_CREATED };
    },
  },

  // POST /api/sny/accept → SNY_PROMPT_ACCEPTED
  {
    method:    'POST',
    pathRegex: /^\/api\/sny\/accept$/,
    getEvent:  (_req, res) => {
      if (res.statusCode !== 200) return null;
      return { eventType: ANALYTICS_EVENT.SNY_PROMPT_ACCEPTED };
    },
  },

  // POST /api/sny/skip → SNY_PROMPT_SKIPPED
  {
    method:    'POST',
    pathRegex: /^\/api\/sny\/skip$/,
    getEvent:  (_req, res) => {
      if (res.statusCode !== 200) return null;
      return { eventType: ANALYTICS_EVENT.SNY_PROMPT_SKIPPED };
    },
  },
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export function analyticsMiddleware(
  req:  Request,
  res:  Response,
  next: NextFunction
): void {
  res.on('finish', () => {
    try {
      // Only emit for authenticated requests with a known accountId
      const accountId = req.user?.accountId;
      if (!accountId) return;

      const path = req.path;

      for (const pattern of ROUTE_PATTERNS) {
        if (req.method !== pattern.method) continue;
        if (!pattern.pathRegex.test(path)) continue;

        const eventData = pattern.getEvent(req, res);
        if (!eventData) break;

        const sessionHeader = req.headers['x-session-id'];
        emitEvent({
          eventType:         eventData.eventType,
          accountId,
          sessionId:         Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader,
          categoryId:        eventData.categoryId,
          conversationState: eventData.conversationState,
          metadata:          eventData.metadata,
        });
        break;
      }
    } catch {
      // Analytics must never crash or interfere with responses
    }
  });

  next();
}
