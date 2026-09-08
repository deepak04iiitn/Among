/**
 * Auth UI copy. Frontend-only — never send these strings to the API.
 */
import {
  ERR_EMAIL_IN_USE,
  ERR_INVALID_CREDENTIALS,
  ERR_GOOGLE_SIGN_IN_REQUIRED,
  ERR_ACCOUNT_BANNED,
} from './errorCodes';

export const AUTH_STORAGE_KEY = 'among_refresh_token';

export const AUTH_MODE = {
  CREATE:  'create',
  SIGN_IN: 'sign-in',
} as const;

export type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE];

export const AUTH_COPY = {
  EMAIL_LABEL:             'Email',
  PASSWORD_LABEL:          'Password',
  CONFIRM_PASSWORD_LABEL:  'Confirm password',
  EMAIL_PLACEHOLDER:       'you@example.com',
  CREATE_WITH_EMAIL:       'Create account',
  SIGN_IN_WITH_EMAIL:      'Sign in',
  CONTINUE_WITH_GOOGLE:    'Continue with Google',
  OR_DIVIDER:              'or',
  SWITCH_TO_SIGN_IN:       'Already have an account? Sign in',
  SWITCH_TO_CREATE:        'New here? Create an account',
  CREATING_ACCOUNT:        'Creating your account…',
  SIGNING_IN:              'Signing in…',
} as const;

export const AUTH_ERROR_MESSAGE = {
  INVALID_EMAIL:           'Enter a valid email address.',
  PASSWORD_TOO_SHORT:      'Password must be at least 8 characters.',
  PASSWORD_TOO_LONG:       'Password is too long.',
  PASSWORDS_DO_NOT_MATCH:  'Passwords do not match.',
  EMAIL_IN_USE:            'An account with this email already exists. Sign in instead.',
  WRONG_PASSWORD:          'Email or password is incorrect.',
  GOOGLE_SIGN_IN_REQUIRED: 'This account uses Google sign-in.',
  GENERIC:                 'Something went wrong. Please try again.',
  SIGN_IN_FAILED:          'Sign-in failed.',
  ACCOUNT_SUSPENDED:       'This account has been suspended.',
  CATEGORIES_REQUIRED:     'Please go back and select your experience categories first.',
} as const;

export const AUTH_ERROR_BY_CODE: Record<string, string> = {
  [ERR_EMAIL_IN_USE]:            AUTH_ERROR_MESSAGE.EMAIL_IN_USE,
  [ERR_INVALID_CREDENTIALS]:     AUTH_ERROR_MESSAGE.WRONG_PASSWORD,
  [ERR_GOOGLE_SIGN_IN_REQUIRED]: AUTH_ERROR_MESSAGE.GOOGLE_SIGN_IN_REQUIRED,
  [ERR_ACCOUNT_BANNED]:          AUTH_ERROR_MESSAGE.ACCOUNT_SUSPENDED,
};

export function messageForAuthError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as { code: unknown }).code);
    const mapped = AUTH_ERROR_BY_CODE[code];
    if (mapped) return mapped;
  }
  if (err instanceof Error && err.message) return err.message;
  return AUTH_ERROR_MESSAGE.GENERIC;
}
