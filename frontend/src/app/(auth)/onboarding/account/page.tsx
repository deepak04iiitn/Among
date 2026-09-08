/**
 * onboarding/account/page.tsx — Onboarding step 3: account creation or sign-in.
 *
 * Email/password is native (POST /api/auth/register or /login).
 * Google still uses Firebase, then POST /api/auth/session.
 * New accounts complete onboarding; returning users go home.
 */
'use client';

import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import type { User } from 'firebase/auth';
import AgeGate from '../../../../components/onboarding/AgeGate';
import TermsAcceptance from '../../../../components/onboarding/TermsAcceptance';
import EmailPasswordForm from '../../../../components/onboarding/EmailPasswordForm';
import { signInWithGoogle } from '../../../../lib/firebaseClient';
import {
  createSession,
  completeOnboarding,
  getMe,
  extractAlias,
  registerWithEmail,
  loginWithEmail,
  type SessionResponse,
} from '../../../../lib/authApi';
import { storeRefreshToken } from '../../../../lib/tokenStorage';
import { authSuccess, onboardingCompleted } from '../../../../features/auth/authSlice';
import { identityLoaded } from '../../../../features/identity/identitySlice';
import { AUTH_COPY, AUTH_ERROR_MESSAGE, AUTH_MODE, messageForAuthError, type AuthMode } from '../../../../constants/auth';
import { ONBOARDING_CATEGORY_MIN } from '../../../../constants/limits';
import { ROUTES } from '../../../../constants/routes';
import type { AppDispatch } from '../../../../store';

const STORAGE_KEY = 'among_onboarding_categories';

export default function OnboardingAccountPage(): JSX.Element {
  const router   = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [mode,         setMode]         = useState<AuthMode>(AUTH_MODE.CREATE);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosAccepted,  setTosAccepted]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [categories,   setCategories]   = useState<string[]>([]);

  const isCreate   = mode === AUTH_MODE.CREATE;
  const canCreate  = ageConfirmed && tosAccepted && !loading;
  const canSignIn  = !loading;
  const formLocked = isCreate ? !canCreate : !canSignIn;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setCategories(JSON.parse(stored) as string[]);
    } catch {
      // Invalid stored value — proceed without categories
    }
  }, []);

  function switchMode(next: AuthMode): void {
    setMode(next);
    setError(null);
  }

  async function finishGoogle(firebaseUser: User, asNewAccount: boolean): Promise<void> {
    const idToken = await firebaseUser.getIdToken();
    const session = await createSession(idToken);
    await afterSession(session, idToken, asNewAccount);
  }

  async function afterSession(
    session: SessionResponse,
    idToken: string,
    asNewAccount: boolean
  ): Promise<void> {
    if (session.isBanned) {
      setError(AUTH_ERROR_MESSAGE.ACCOUNT_SUSPENDED);
      return;
    }

    storeAuth(dispatch, session, idToken);

    if (asNewAccount) {
      if (categories.length < ONBOARDING_CATEGORY_MIN) {
        setError(AUTH_ERROR_MESSAGE.CATEGORIES_REQUIRED);
        return;
      }
      const profile = await completeOnboarding({
        categories,
        ageConfirmed: true,
        tosAccepted:  true,
      });
      dispatch(onboardingCompleted());
      const alias = extractAlias(profile);
      if (alias) dispatch(identityLoaded(alias));
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      const profile = await getMe();
      const alias   = extractAlias(profile);
      if (alias) dispatch(identityLoaded(alias));
    }

    router.push(ROUTES.HOME);
  }

  async function handleEmailSubmit(email: string, password: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const session = isCreate
        ? await registerWithEmail(email, password)
        : await loginWithEmail(email, password);
      await afterSession(session, '', isCreate);
    } catch (err) {
      setError(messageForAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    if (isCreate && !canCreate) return;
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      await finishGoogle(user, isCreate);
    } catch (err) {
      setError(messageForAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="text-caption text-text-muted mb-8 tracking-widest uppercase">
          Step 3 of 3
        </p>

        <h1 className="font-editorial text-title-xl text-text mb-3">
          {isCreate ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-body text-text-secondary mb-10">
          {isCreate
            ? 'Your identity here is anonymous. You will be given a temporary name and abstract avatar — known only to the platform, not to other users.'
            : 'Sign in with the email you used before, or continue with Google.'}
        </p>

        {isCreate && (
          <div className="space-y-5 mb-8">
            <AgeGate confirmed={ageConfirmed} onChange={setAgeConfirmed} />
            <TermsAcceptance accepted={tosAccepted} onChange={setTosAccepted} />
          </div>
        )}

        {error && (
          <p className="text-caption text-semantic-error mb-6" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <EmailPasswordForm
          mode={mode}
          disabled={formLocked}
          loading={loading}
          onSubmit={(email, password) => {
            void handleEmailSubmit(email, password);
          }}
        />

        {isCreate && (!ageConfirmed || !tosAccepted) && (
          <p id="prerequisite-note" className="mt-3 text-caption text-text-muted italic">
            Please confirm your age and accept the guidelines above.
          </p>
        )}

        <div className="relative my-8" role="separator" aria-label={AUTH_COPY.OR_DIVIDER}>
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <p className="relative flex justify-center">
            <span className="bg-[var(--color-bg)] px-3 text-caption text-text-muted uppercase tracking-widest">
              {AUTH_COPY.OR_DIVIDER}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={formLocked}
          className={[
            'btn-secondary w-full flex items-center justify-center gap-3',
            formLocked ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
          aria-disabled={formLocked}
        >
          <GoogleIcon />
          {AUTH_COPY.CONTINUE_WITH_GOOGLE}
        </button>

        <p className="mt-8 text-caption text-text-muted">
          {isCreate ? (
            <button
              type="button"
              onClick={() => switchMode(AUTH_MODE.SIGN_IN)}
              className="underline underline-offset-2 hover:text-accent transition-colors"
            >
              {AUTH_COPY.SWITCH_TO_SIGN_IN}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(AUTH_MODE.CREATE)}
              className="underline underline-offset-2 hover:text-accent transition-colors"
            >
              {AUTH_COPY.SWITCH_TO_CREATE}
            </button>
          )}
        </p>
      </div>
    </main>
  );
}

function storeAuth(dispatch: AppDispatch, session: SessionResponse, idToken: string): void {
  storeRefreshToken(session.refreshToken);
  dispatch(
    authSuccess({
      user: {
        accountId:              session.accountId,
        firebaseUid:            '',
        role:                   session.role,
        isBanned:               false,
        hasCompletedOnboarding: session.hasCompletedOnboarding,
      },
      idToken,
      accessToken:  session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn:    session.expiresIn,
    })
  );
}

function GoogleIcon(): JSX.Element {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
