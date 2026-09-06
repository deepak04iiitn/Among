import type { AuthenticatedUser } from './auth.types';

// Augment Express Request to carry the authenticated AMONG account
declare global {
  namespace Express {
    interface Request {
      /** Present only on routes protected by requireAuth / requireAdmin middleware */
      user?: AuthenticatedUser;
    }
  }
}

export {};
