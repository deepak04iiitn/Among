/**
 * onboarding/account/page.tsx — Onboarding step 3: account creation.
 *
 * Google Sign-In button + age gate + ToS acceptance.
 * On successful sign-in, calls /api/auth/session + /api/users/me/onboarding,
 * then redirects to home where the AliasReveal overlay will be shown.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import AgeGate from '../../../components/onboarding/AgeGate';
import TermsAcceptance from '../../../components/onboarding/TermsAcceptance';
import { signInWithGoogle } from '../../../lib/firebaseClient';
import { createSession, completeOnboarding } from '../../../lib/authApi';
import { authSuccess, onboardingCompleted } from '../../../features/auth/authSlice';
import { identityLoaded } from '../../../features/identity/identitySlice';
import { extractAlias } from '../../../lib/authApi';
import { ROUTES } from '../../../constants/routes';
import type { AppDispatch } from '../../../store';

const STORAGE_KEY = 'among_onboarding_categories';

export default function OnboardingAccountPage() {
  const router   = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosAccepted,  setTosAccepted]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [categories,   setCategories]   = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[];
          setCategories(parsed);
        } catch {
          // Invalid stored value — silently proceed without categories
        }
      }
    }
  }, []);

  const canProceed = ageConfirmed && tosAccepted && !loading;

  async function handleSignIn() {
    if (!canProceed) return;
    if (categories.length < 3) {
      setError('Please go back and select your experience categories first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Firebase Google sign-in
      const firebaseUser = await signInWithGoogle();
      const idToken      = await firebaseUser.getIdToken();

      // Step 2: Create / find AMONG account
      const session = await createSession(idToken);

      if (session.isBanned) {
        setError('This account has been suspended.');
        setLoading(false);
        return;
      }

      dispatch(
        authSuccess({
          user: {
            accountId:              session.accountId,
            firebaseUid:            '',
            role:                   session.role,
            isBanned:               false,
            hasCompletedOnboarding: false,
          },
          idToken,
          accessToken:  session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn:    session.expiresIn,
        })
      );

      // Step 3: Complete onboarding
      const profile = await completeOnboarding({
        categories,
        ageConfirmed: true,
        tosAccepted:  true,
      });

      dispatch(onboardingCompleted());

      // Step 4: Load identity into Redux
      const alias = extractAlias(profile);
      if (alias) {
        dispatch(identityLoaded(alias));
      }

      // Step 5: Clean up localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }

      // Step 6: Navigate to home — AliasReveal overlay will show there
      router.push(ROUTES.HOME);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <p className="text-caption text-text-muted mb-8 tracking-widest uppercase">
          Step 3 of 3
        </p>

        <h1 className="font-editorial text-title-xl text-text mb-3">
          Create your account
        </h1>
        <p className="text-body text-text-secondary mb-10">
          Your identity here is anonymous. You will be given a temporary name
          and abstract avatar — known only to the platform, not to other users.
        </p>

        <div className="space-y-5 mb-8">
          <AgeGate confirmed={ageConfirmed} onChange={setAgeConfirmed} />
          <TermsAcceptance accepted={tosAccepted} onChange={setTosAccepted} />
        </div>

        {/* Error state */}
        {error && (
          <p
            className="text-caption text-semantic-error mb-6"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        {/* Sign-in button */}
        <button
          type="button"
          onClick={() => void handleSignIn()}
          disabled={!canProceed}
          className={[
            'btn-primary w-full flex items-center justify-center gap-3',
            !canProceed ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
          aria-disabled={!canProceed}
          aria-describedby={!ageConfirmed || !tosAccepted ? 'prerequisite-note' : undefined}
        >
          {loading ? (
            <span aria-live="polite">Creating your account…</span>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {(!ageConfirmed || !tosAccepted) && (
          <p
            id="prerequisite-note"
            className="mt-3 text-caption text-text-muted italic"
          >
            Please confirm your age and accept the guidelines above.
          </p>
        )}

        <p className="mt-8 text-caption text-text-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => void handleExistingSignIn({ dispatch, router, setError, setLoading })}
            className="underline underline-offset-2 hover:text-accent transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}

// ─── Existing user sign-in (returning users) ─────────────────────────────────

interface SignInContext {
  dispatch:   AppDispatch;
  router:     ReturnType<typeof useRouter>;
  setError:   (msg: string | null) => void;
  setLoading: (v: boolean) => void;
}

async function handleExistingSignIn({
  dispatch,
  router,
  setError,
  setLoading,
}: SignInContext) {
  setLoading(true);
  setError(null);

  try {
    const firebaseUser = await signInWithGoogle();
    const idToken      = await firebaseUser.getIdToken();
    const session      = await createSession(idToken);

    if (session.isBanned) {
      setError('This account has been suspended.');
      return;
    }

    const { getMe: getMeApi } = await import('../../../lib/authApi');
    const profile = await getMeApi();
    const alias   = extractAlias(profile);

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

    if (alias) dispatch(identityLoaded(alias));

    router.push(ROUTES.HOME);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-in failed.';
    setError(message);
  } finally {
    setLoading(false);
  }
}

// ─── Google logo SVG ─────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

