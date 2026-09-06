import type { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase';
import { UserModel } from '../modules/users/user.model';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { hasMinimumRole } from '../constants/userRoles';
import type { UserRole } from '../constants/userRoles';

/**
 * requireAuth
 *
 * Verifies the Firebase ID token, looks up the AMONG account,
 * and attaches a typed AuthenticatedUser to req.user.
 *
 * Rejects:
 * - Missing / invalid token → 401 ERR_UNAUTHORIZED
 * - Account not found      → 401 ERR_UNAUTHORIZED
 * - Banned account         → 403 ERR_FORBIDDEN
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idToken = extractBearerToken(req);
    if (!idToken) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const decoded = await verifyFirebaseToken(idToken);

    const account = await UserModel.findOne({ firebaseUid: decoded.uid }).lean();
    if (!account) {
      throw new UnauthorizedError('Account not found');
    }

    if (account.isBanned) {
      throw new ForbiddenError('Account is banned');
    }

    req.user = {
      accountId: String(account._id),
      firebaseUid: account.firebaseUid,
      role: account.role,
      isBanned: account.isBanned,
      hasCompletedOnboarding: account.hasCompletedOnboarding,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireOnboarding
 *
 * Must be used AFTER requireAuth.
 * Rejects users who have not completed onboarding with 403.
 */
export function requireOnboarding(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  if (!req.user.hasCompletedOnboarding) {
    next(new ForbiddenError('Onboarding not completed'));
    return;
  }
  next();
}

/**
 * requireRole(minimumRole)
 *
 * Middleware factory — enforces a minimum role level.
 * Must be used AFTER requireAuth.
 */
export function requireRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!hasMinimumRole(req.user.role, minimumRole)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}

/**
 * optionalAuth
 *
 * Attaches user if a valid token is present, but does NOT reject if missing.
 * Useful for public routes that behave differently for authenticated users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idToken = extractBearerToken(req);
    if (!idToken) {
      next();
      return;
    }
    const decoded = await verifyFirebaseToken(idToken);
    const account = await UserModel.findOne({ firebaseUid: decoded.uid }).lean();
    if (account && !account.isBanned) {
      req.user = {
        accountId: String(account._id),
        firebaseUid: account.firebaseUid,
        role: account.role,
        isBanned: account.isBanned,
        hasCompletedOnboarding: account.hasCompletedOnboarding,
      };
    }
  } catch {
    // Intentionally swallow — auth is optional here
  }
  next();
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}
