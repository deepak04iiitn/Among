/**
 * authApi.ts — API client functions for auth and user endpoints.
 *
 * These functions map directly to the backend routes in
 * `backend/src/modules/users/user.routes.ts`.
 *
 * Privacy: responses never include email, firebaseUid, or passwordHash.
 * Email is sent only on register/login request bodies.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';
import type { AliasIdentity } from '../features/identity/identitySlice';

// ─── Response types ───────────────────────────────────────────────────────────

export interface SessionResponse {
  readonly accountId:              string;
  readonly role:                   string;
  readonly hasCompletedOnboarding: boolean;
  readonly isBanned:               boolean;
  /** Backend-issued access token (15 min TTL) */
  readonly accessToken:            string;
  /** Backend-issued refresh token (30 day TTL) */
  readonly refreshToken:           string;
  /** Access token TTL in seconds */
  readonly expiresIn:              number;
}

export interface RefreshResponse {
  readonly accessToken:  string;
  readonly refreshToken: string;
  readonly expiresIn:    number;
}

export interface PrivateProfile {
  readonly accountId:              string;
  readonly role:                   string;
  readonly hasCompletedOnboarding: boolean;
  readonly categoryInterests:      string[];
  readonly currentAlias:           {
    name:       string;
    avatarSeed: string;
    issuedAt:   string;
    expiresAt:  string | null;
  } | null;
  readonly aliasRotationCount:     number;
  readonly snyOptIns:              string[];
}

export interface AliasRotateResponse {
  readonly aliasName:          string;
  readonly avatarSeed:         string;
  readonly aliasRotationCount: number;
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Create or resume an AMONG session after Firebase sign-in.
 * Sends the Firebase ID token; receives a minimal session payload.
 */
export async function createSession(idToken: string): Promise<SessionResponse> {
  const response = await apiClient.post<SessionResponse>(
    API.AUTH_SESSION,
    { idToken }
  );
  return response.data;
}

/**
 * Exchange a refresh token for a new backend JWT pair.
 * Called automatically by the apiClient interceptor — not called directly by UI code.
 */
export async function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>(
    API.AUTH_REFRESH,
    { refreshToken }
  );
  return response.data;
}

export async function registerWithEmail(
  email: string,
  password: string
): Promise<SessionResponse> {
  const response = await apiClient.post<SessionResponse>(
    API.AUTH_REGISTER,
    { email, password }
  );
  return response.data;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<SessionResponse> {
  const response = await apiClient.post<SessionResponse>(
    API.AUTH_LOGIN,
    { email, password }
  );
  return response.data;
}

/**
 * Fetch the authenticated user's private profile.
 * Requires the Firebase ID token in the Authorization header (handled by interceptor).
 */
export async function getMe(): Promise<PrivateProfile> {
  const response = await apiClient.get<PrivateProfile>(API.USERS_ME);
  return response.data;
}

/**
 * Complete onboarding (step 3 of the onboarding flow).
 */
export async function completeOnboarding(input: {
  categories:   string[];
  ageConfirmed: true;
  tosAccepted:  true;
}): Promise<PrivateProfile> {
  const response = await apiClient.post<PrivateProfile>(
    API.USERS_ME_ONBOARDING,
    input
  );
  return response.data;
}

/**
 * Request an alias rotation.
 * Returns the new alias data on success.
 */
export async function rotateAlias(): Promise<AliasRotateResponse> {
  const response = await apiClient.put<AliasRotateResponse>(
    API.USERS_ME_ALIAS_ROTATE
  );
  return response.data;
}

/**
 * Update the user's category interests (3–5 required).
 */
export async function updateCategories(categories: string[]): Promise<void> {
  await apiClient.put(API.USERS_ME_CATEGORIES, { categories });
}

/**
 * Soft-delete the authenticated user's account.
 */
export async function deleteAccount(): Promise<void> {
  await apiClient.delete(API.USERS_ME);
}

// ─── Helper: map PrivateProfile to AliasIdentity ─────────────────────────────

export function extractAlias(profile: PrivateProfile): AliasIdentity | null {
  if (!profile.currentAlias) return null;
  return {
    name:       profile.currentAlias.name,
    avatarSeed: profile.currentAlias.avatarSeed,
    createdAt:  profile.currentAlias.issuedAt,
    expiresAt:  profile.currentAlias.expiresAt,
  };
}
