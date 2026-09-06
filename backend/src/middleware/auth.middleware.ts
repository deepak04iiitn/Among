import type { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the decoded token to `req.user`.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const idToken = authHeader.slice(7);
    const decoded = await getFirebaseAuth().verifyIdToken(idToken, /* checkRevoked */ true);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
      return;
    }
    logger.debug('Firebase token verification failed', { err });
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/** Attaches user if token is present, but does NOT throw if missing */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }
    const idToken = authHeader.slice(7);
    const decoded = await getFirebaseAuth().verifyIdToken(idToken, true);
    req.user = decoded;
  } catch {
    // Intentionally ignore errors — auth is optional here
  }
  next();
}
