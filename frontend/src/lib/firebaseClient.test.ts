/**
 * Firebase client tests.
 * Mocks the Firebase SDK so no real network calls are made.
 */

// ── Mock firebase/app ──────────────────────────────────────────────────────
const mockApp = {};
const mockGetApps   = jest.fn().mockReturnValue([]);
const mockGetApp    = jest.fn().mockReturnValue(mockApp);
const mockInitApp   = jest.fn().mockReturnValue(mockApp);

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitApp(...args),
  getApps:       () => mockGetApps(),
  getApp:        () => mockGetApp(),
}));

// ── Mock firebase/auth ─────────────────────────────────────────────────────
const mockUser = {
  getIdToken: jest.fn().mockResolvedValue('mock_id_token'),
};
const mockAuth = {
  currentUser: null as typeof mockUser | null,
};
const mockGetAuth              = jest.fn().mockReturnValue(mockAuth);
const mockSignInWithPopup      = jest.fn().mockResolvedValue({ user: mockUser });
const mockFirebaseSignOut      = jest.fn().mockResolvedValue(undefined);
const mockOnAuthStateChanged   = jest.fn().mockReturnValue(() => {});
const mockGoogleAuthProvider   = jest.fn().mockImplementation(() => ({
  addScope: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth:              () => mockGetAuth(),
  GoogleAuthProvider:   function () { return mockGoogleAuthProvider(); },
  signInWithPopup:      (...a: unknown[]) => mockSignInWithPopup(...a),
  signOut:              (...a: unknown[]) => mockFirebaseSignOut(...a),
  onAuthStateChanged:   (...a: unknown[]) => mockOnAuthStateChanged(...a),
}));

// ── Import after mocks ─────────────────────────────────────────────────────
import {
  signInWithGoogle,
  signOut,
  onAuthStateChanged,
  getIdToken,
  getCurrentUser,
} from './firebaseClient';

describe('firebaseClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);
    mockAuth.currentUser = null;
  });

  describe('getFirebaseApp (re-initialization guard)', () => {
    it('calls initializeApp when no app exists', async () => {
      mockGetApps.mockReturnValue([]);
      await signOut(); // triggers getFirebaseApp
      expect(mockInitApp).toHaveBeenCalledTimes(1);
    });

    it('calls getApp instead of initializeApp when app already exists', async () => {
      mockGetApps.mockReturnValue([mockApp]);
      await signOut(); // triggers getFirebaseApp
      expect(mockInitApp).not.toHaveBeenCalled();
      expect(mockGetApp).toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('calls signInWithPopup with a GoogleAuthProvider', async () => {
      const user = await signInWithGoogle();
      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(user).toBe(mockUser);
    });

    it('propagates errors from signInWithPopup', async () => {
      mockSignInWithPopup.mockRejectedValueOnce(new Error('popup_closed'));
      await expect(signInWithGoogle()).rejects.toThrow('popup_closed');
    });
  });

  describe('signOut', () => {
    it('calls firebase signOut', async () => {
      await signOut();
      expect(mockFirebaseSignOut).toHaveBeenCalled();
    });
  });

  describe('onAuthStateChanged', () => {
    it('subscribes to auth state changes and returns unsubscribe', () => {
      const cb = jest.fn();
      const mockUnsub = jest.fn();
      mockOnAuthStateChanged.mockReturnValueOnce(mockUnsub);
      const unsub = onAuthStateChanged(cb);
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        expect.anything(),
        cb
      );
      expect(unsub).toBe(mockUnsub);
    });
  });

  describe('getIdToken', () => {
    it('returns null when no current user', async () => {
      mockAuth.currentUser = null;
      const token = await getIdToken();
      expect(token).toBeNull();
    });

    it('returns token from current user', async () => {
      mockAuth.currentUser = mockUser;
      const token = await getIdToken();
      expect(token).toBe('mock_id_token');
    });

    it('passes forceRefresh to getIdToken', async () => {
      mockAuth.currentUser = mockUser;
      await getIdToken(true);
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user is signed in', () => {
      mockAuth.currentUser = null;
      expect(getCurrentUser()).toBeNull();
    });

    it('returns current user when signed in', () => {
      mockAuth.currentUser = mockUser;
      expect(getCurrentUser()).toBe(mockUser);
    });
  });
});
