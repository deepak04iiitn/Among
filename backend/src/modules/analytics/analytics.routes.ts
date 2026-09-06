/**
 * analytics.routes.ts — Client-side analytics event ingestion endpoint.
 *
 * POST /api/analytics/events — receives events from the frontend client.
 *  - Authenticated: requires valid Firebase token (to link accountIdHash).
 *  - Rate-limited: prevent abuse.
 *  - Always returns 202 Accepted — analytics errors must never fail client.
 */
import { Router }         from 'express';
import { requireAuth }    from '../../middleware/auth.middleware';
import { emitEvent }      from './analytics.service';
import type { AnalyticsEventType } from '../../constants/analyticsEvents';
import { ANALYTICS_EVENT }         from '../../constants/analyticsEvents';
import type { Request, Response }  from 'express';

export const analyticsRouter = Router();

const VALID_EVENT_TYPES = new Set<string>(Object.values(ANALYTICS_EVENT));

analyticsRouter.post(
  '/events',
  requireAuth,
  (req: Request, res: Response): void => {
    // Always respond immediately — never wait for write
    res.status(202).json({ accepted: true });

    try {
      const { eventType, sessionId, categoryId, metadata } = req.body as {
        eventType:   string;
        sessionId?:  string;
        categoryId?: string;
        metadata?:   Record<string, unknown>;
      };

      // Only emit known event types — reject unknown strings
      if (!eventType || !VALID_EVENT_TYPES.has(eventType)) return;
      if (!req.user?.accountId) return;

      emitEvent({
        eventType:   eventType as AnalyticsEventType,
        accountId:   req.user.accountId,
        sessionId,
        categoryId,
        metadata,
      });
    } catch {
      // Analytics errors must never propagate
    }
  }
);
