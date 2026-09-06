import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { env } from './environment';
import { logger } from '../utils/logger';
import { UnauthorizedError } from '../utils/errors';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseApp(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Firebase private key comes with literal \n in env — replace them
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  logger.info('Firebase Admin SDK initialized');
  return firebaseApp;
}

export function getFirebaseAuth(): admin.auth.Auth {
  return getFirebaseApp().auth();
}

/**
 * Verifies a Firebase ID token.
 * Throws an UnauthorizedError (AppError) on any failure — never raw Firebase errors.
 */
export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken, /* checkRevoked */ true);
    return decoded;
  } catch (err) {
    logger.debug('Firebase token verification failed', { err });

    // Map Firebase error codes to our error types
    if (err instanceof Error && 'code' in err) {
      const code = (err as Error & { code: string }).code;
      if (code === 'auth/id-token-expired' || code === 'auth/session-cookie-expired') {
        throw new UnauthorizedError('Token has expired');
      }
      if (code === 'auth/id-token-revoked' || code === 'auth/user-disabled') {
        throw new UnauthorizedError('Token has been revoked');
      }
    }

    throw new UnauthorizedError('Invalid or malformed token');
  }
}
