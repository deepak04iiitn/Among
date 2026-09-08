/**
 * Firebase client-side initialization — Google Sign-In only.
 *
 * Email/password auth is native (POST /api/auth/register and /login).
 * Do not create Firebase accounts for email users.
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

const firebaseConfig = {
  apiKey:            process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] ?? '',
  authDomain:        process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] ?? '',
  projectId:         process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] ?? '',
  storageBucket:     process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] ?? '',
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
  appId:             process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] ?? '',
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export async function signInWithGoogle(): Promise<User> {
  const auth     = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  const auth = getFirebaseAuth();
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

export { getFirebaseAuth };
