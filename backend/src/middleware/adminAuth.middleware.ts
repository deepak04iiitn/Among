import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from './auth.middleware';
import { USER_ROLE } from '../constants/userRoles';

/**
 * requireModerator
 *
 * Convenience composed middleware: requireAuth + role ≥ MODERATOR.
 * Apply to all moderator-accessible admin routes.
 */
export async function requireModerator(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, (authErr) => {
    if (authErr) { next(authErr); return; }
    requireRole(USER_ROLE.MODERATOR)(req, res, next);
  });
}

/**
 * requireAdmin
 *
 * Convenience composed middleware: requireAuth + role = ADMIN.
 * Apply to admin-only routes (permanent bans, config changes, etc.).
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, (authErr) => {
    if (authErr) { next(authErr); return; }
    requireRole(USER_ROLE.ADMIN)(req, res, next);
  });
}
