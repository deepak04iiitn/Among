/**
 * Persist the backend refresh token so email/password sessions survive reload.
 * Access tokens stay in memory (Redux). Never store passwords.
 */
import { AUTH_STORAGE_KEY } from '../constants/auth';

export function readStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function storeRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, token);
}

export function clearStoredRefreshToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
