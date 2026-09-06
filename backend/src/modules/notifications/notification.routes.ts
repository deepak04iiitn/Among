/**
 * notification.routes.ts — Express routes for in-app notifications.
 *
 * GET  /api/notifications            → Get unread notifications (auth)
 * POST /api/notifications/read-all   → Mark all as read (auth)
 * PUT  /api/notifications/:id/read   → Mark one as read (auth)
 */
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import * as controller from './notification.controller';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/',
  requireAuth,
  controller.getUnreadNotifications
);

notificationsRouter.post(
  '/read-all',
  requireAuth,
  controller.markAllRead
);

notificationsRouter.put(
  '/:id/read',
  requireAuth,
  controller.markAsRead
);
