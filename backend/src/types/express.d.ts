import type { DecodedIdToken } from 'firebase-admin/auth';

// Augment Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      /** Present only on authenticated routes (after requireAuth middleware) */
      user?: DecodedIdToken;
    }
  }
}

export {};
