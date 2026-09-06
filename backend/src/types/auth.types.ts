import type { UserRole } from '../constants/userRoles';

/**
 * The authenticated user object attached to every protected request.
 * This is the AMONG account — not the raw Firebase DecodedIdToken.
 * Never expose firebaseUid or email in API responses.
 */
export interface AuthenticatedUser {
  /** MongoDB ObjectId as string — AMONG internal account identifier */
  readonly accountId: string;
  /** Firebase UID — server-side only, never in public responses */
  readonly firebaseUid: string;
  /** User role — controls access to admin/moderator routes */
  readonly role: UserRole;
  /** Whether the account is soft-banned (returns 403 on every protected route) */
  readonly isBanned: boolean;
  /** Whether the user has completed the onboarding flow */
  readonly hasCompletedOnboarding: boolean;
}
