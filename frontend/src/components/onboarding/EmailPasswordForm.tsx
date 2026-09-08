/**
 * EmailPasswordForm.tsx — Email + password fields for create-account and sign-in.
 *
 * Design: unlabeled chrome stays quiet; every input has a real <label>.
 * Confirm-password only appears in create mode.
 */
'use client';

import { useState, type FormEvent, type JSX } from 'react';
import { Input } from '../ui/input';
import { AUTH_COPY, AUTH_ERROR_MESSAGE, AUTH_MODE, type AuthMode } from '../../constants/auth';
import { EMAIL_MAX_CHARS, PASSWORD_MAX_CHARS, PASSWORD_MIN_CHARS } from '../../constants/limits';

export interface EmailPasswordFormProps {
  mode:     AuthMode;
  disabled: boolean;
  loading:  boolean;
  onSubmit: (email: string, password: string) => void;
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

export default function EmailPasswordForm({
  mode,
  disabled,
  loading,
  onSubmit,
}: EmailPasswordFormProps): JSX.Element {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError,      setLocalError]      = useState<string | null>(null);

  const isCreate = mode === AUTH_MODE.CREATE;

  function validate(): string | null {
    if (!isValidEmail(email)) return AUTH_ERROR_MESSAGE.INVALID_EMAIL;
    if (password.length < PASSWORD_MIN_CHARS) return AUTH_ERROR_MESSAGE.PASSWORD_TOO_SHORT;
    if (password.length > PASSWORD_MAX_CHARS) return AUTH_ERROR_MESSAGE.PASSWORD_TOO_LONG;
    if (isCreate && password !== confirmPassword) return AUTH_ERROR_MESSAGE.PASSWORDS_DO_NOT_MATCH;
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (disabled || loading) return;
    const message = validate();
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError(null);
    onSubmit(email.trim(), password);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="auth-email" className="block text-caption text-text-muted mb-1.5">
          {AUTH_COPY.EMAIL_LABEL}
        </label>
        <Input
          id="auth-email"
          type="email"
          name="email"
          autoComplete={isCreate ? 'email' : 'username'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={AUTH_COPY.EMAIL_PLACEHOLDER}
          maxLength={EMAIL_MAX_CHARS}
          disabled={disabled || loading}
          error={localError === AUTH_ERROR_MESSAGE.INVALID_EMAIL}
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="auth-password" className="block text-caption text-text-muted mb-1.5">
          {AUTH_COPY.PASSWORD_LABEL}
        </label>
        <Input
          id="auth-password"
          type="password"
          name="password"
          autoComplete={isCreate ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={PASSWORD_MAX_CHARS}
          disabled={disabled || loading}
          error={
            localError === AUTH_ERROR_MESSAGE.PASSWORD_TOO_SHORT ||
            localError === AUTH_ERROR_MESSAGE.PASSWORD_TOO_LONG
          }
          aria-required="true"
          {...(isCreate ? { 'aria-describedby': 'auth-password-hint' } : {})}
        />
        {isCreate && (
          <p id="auth-password-hint" className="mt-1.5 text-caption text-text-muted">
            At least {PASSWORD_MIN_CHARS} characters.
          </p>
        )}
      </div>

      {isCreate && (
        <div>
          <label htmlFor="auth-confirm-password" className="block text-caption text-text-muted mb-1.5">
            {AUTH_COPY.CONFIRM_PASSWORD_LABEL}
          </label>
          <Input
            id="auth-confirm-password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            maxLength={PASSWORD_MAX_CHARS}
            disabled={disabled || loading}
            error={localError === AUTH_ERROR_MESSAGE.PASSWORDS_DO_NOT_MATCH}
            aria-required="true"
          />
        </div>
      )}

      {localError && (
        <p className="text-caption text-semantic-error" role="alert" aria-live="polite">
          {localError}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled || loading}
        className={[
          'btn-primary w-full',
          disabled || loading ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' ')}
        aria-disabled={disabled || loading}
      >
        {loading
          ? (isCreate ? AUTH_COPY.CREATING_ACCOUNT : AUTH_COPY.SIGNING_IN)
          : (isCreate ? AUTH_COPY.CREATE_WITH_EMAIL : AUTH_COPY.SIGN_IN_WITH_EMAIL)}
      </button>
    </form>
  );
}
