/**
 * auth.middleware.ts — Request authentication via backend-issued JWT.
 *
 * Token flow:
 *  1. Client signs in with Firebase and calls POST /api/auth/session.
 *  2. Session endpoint verifies Firebase token (once), issues backend JWT pair.
 *  3. All subsequent API calls use the backend JWT as Bearer token.
 *     → No Firebase SDK call on every request.
 *
 * The Bearer token accepted by requireAuth is ALWAYS a backend-issued JWT,
 * not a raw Firebase ID token. Firebase tokens are only accepted at the
 * POST /api/auth/session endpoint.
 *
 * Error mapping:
 *  - Missing / expired / invalid JWT → 401 ERR_UNAUTHORIZED
 *  - Banned account                  → 403 ERR_FORBIDDEN
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken }   from '../services/jwt.service';
import { UserModel }           from '../modules/users/user.model';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { hasMinimumRole }      from '../constants/userRoles';
import type { UserRole }        from '../constants/userRoles';
import { USER_ROLE }            from '../constants/userRoles';

// ─── requireAuth ─────────────────────────────────────────────────────────────

/**
 * Verifies the backend-issued JWT and attaches AuthenticatedUser to req.user.
 * Also re-fetches ban status from DB (so a new ban takes effect within one
 * access-token TTL — 15 minutes).
 */
export async function requireAuth(
  req:  Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    // Verify our own JWT — no network call, uses local secret
    const payload = verifyAccessToken(token);

    // Re-check ban status from DB (catches bans issued mid-session)
    const account = await UserModel.findById(payload.sub)
      .select('role hasCompletedOnboarding enforcementStatus firebaseUid')
      .lean();

    if (!account) {
      throw new UnauthorizedError('Account not found');
    }

    const isBanned = (account as { enforcementStatus?: { isBanned?: boolean } })
      .enforcementStatus?.isBanned ?? false;

    if (isBanned) {
      throw new ForbiddenError('Account is banned');
    }

    const rawRole = (account as { role?: string }).role ?? payload.role;
    const role: UserRole = Object.values(USER_ROLE).includes(rawRole as UserRole)
      ? (rawRole as UserRole)
      : USER_ROLE.USER;

    req.user = {
      accountId:              payload.sub,
      firebaseUid:            (account as { firebaseUid?: string }).firebaseUid ?? '',
      role,
      isBanned,
      hasCompletedOnboarding: (account as { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding
                                ?? payload.onboarded,
    };

    next();
  } catch (err) {
    next(err);
  }
}

// ─── requireOnboarding ───────────────────────────────────────────────────────

/**
 * Must be used AFTER requireAuth.
 * Rejects users who have not completed onboarding with 403.
 */
export function requireOnboarding(
  req:  Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) { next(new UnauthorizedError()); return; }
  if (!req.user.hasCompletedOnboarding) {
    next(new ForbiddenError('Onboarding not completed'));
    return;
  }
  next();
}

// ─── requireRole ─────────────────────────────────────────────────────────────

/**
 * Middleware factory — enforces a minimum role level.
 * Must be used AFTER requireAuth.
 */
export function requireRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(new UnauthorizedError()); return; }
    if (!hasMinimumRole(req.user.role, minimumRole)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}

// ─── optionalAuth ─────────────────────────────────────────────────────────────

/**
 * Attaches user if a valid backend JWT is present, but does NOT reject if missing.
 * Useful for public routes that behave differently for authenticated users.
 */
export async function optionalAuth(
  req:  Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) { next(); return; }

    const payload = verifyAccessToken(token);

    const account = await UserModel.findById(payload.sub)
      .select('role hasCompletedOnboarding enforcementStatus firebaseUid')
      .lean();

    const isBanned = (account as { enforcementStatus?: { isBanned?: boolean } } | null)
      ?.enforcementStatus?.isBanned ?? false;

    if (account && !isBanned) {
      const rawRole2 = (account as { role?: string }).role ?? payload.role;
      const role2: UserRole = Object.values(USER_ROLE).includes(rawRole2 as UserRole)
        ? (rawRole2 as UserRole)
        : USER_ROLE.USER;

      req.user = {
        accountId:              payload.sub,
        firebaseUid:            (account as { firebaseUid?: string }).firebaseUid ?? '',
        role:                   role2,
        isBanned,
        hasCompletedOnboarding: (account as { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding
                                  ?? payload.onboarded,
      };
    }
  } catch {
    // Intentionally swallow — auth is optional here
  }
  next();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}
