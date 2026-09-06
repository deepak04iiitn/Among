/**
 * notification.controller.ts — HTTP handlers for in-app notifications.
 */
import type { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service';

export async function getUnreadNotifications(
  req: Request<object, object, object, { cursor?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.getUnreadNotifications(
      req.user!.accountId,
      req.query.cursor
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await notificationService.markAsRead(req.user!.accountId, req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await notificationService.markAllRead(req.user!.accountId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
