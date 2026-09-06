/**
 * Firebase client-side initialization and authentication helpers.
 *
 * This module wraps the Firebase Web SDK so that:
 * 1. Product code never calls Firebase SDK methods directly.
 * 2. The app is initialized exactly once (guard against hot-reload re-init).
 * 3. All auth actions go through typed helper functions.
 *
 * IMPORTANT: This file is a browser-only module. Never import it in
 * server-side code (Server Components, API route handlers, etc.).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';

// ─── Firebase configuration ──────────────────────────────────────────────────
// Values come from Next.js public env vars — safe to expose client-side.

const firebaseConfig = {
  apiKey:            process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] ?? '',
  authDomain:        process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] ?? '',
  projectId:         process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] ?? '',
  storageBucket:     process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] ?? '',
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
  appId:             process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] ?? '',
};

// ─── App initialization — guard against hot-reload double-init ──────────────

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

// ─── Exported helpers ────────────────────────────────────────────────────────

/**
 * Sign in with Google using a popup.
 * Returns the Firebase User on success.
 * Throws on cancellation or error — callers should catch.
 */
export async function signInWithGoogle(): Promise<User> {
  const auth     = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  // Request profile and email scopes (required for the AMONG account creation)
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Sign out the currently authenticated Firebase user.
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function — call it to stop listening (cleanup on unmount).
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  const auth = getFirebaseAuth();
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Get the current user's Firebase ID token.
 * Pass `forceRefresh: true` if you need a fresh token (e.g. after a role change).
 *
 * Returns `null` if there is no authenticated user.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

/**
 * Get the currently signed-in Firebase User, or null.
 * Synchronous — does not wait for auth state to be determined.
 * Use `onAuthStateChanged` for reactive auth state.
 */
export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

export { getFirebaseAuth };
