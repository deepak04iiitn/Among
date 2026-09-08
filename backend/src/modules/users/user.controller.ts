/**
 * user.controller.ts — HTTP request handlers for auth and user routes.
 *
 * Privacy invariants:
 *  - `firebaseUid`, `email`, and internal MongoDB `_id` as `authorAccountId`
 *    are NEVER returned in any response from these controllers.
 *  - All successful responses return only the explicitly listed fields below.
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken }              from '../../config/firebase';
import { issueTokenPair, verifyRefreshToken } from '../../services/jwt.service';
import * as userService from './user.service';
import type { IUser } from './user.model';
import type {
  CreateSessionInput,
  EmailPasswordInput,
  CompleteOnboardingInput,
  UpdateCategoriesInput,
  UpdateSnyOptInInput,
} from './user.schema';

function sessionPayload(user: IUser): Record<string, unknown> {
  const isBanned = user.enforcementStatus?.isBanned ?? false;
  const tokens = issueTokenPair({
    accountId:              String(user._id),
    role:                   user.role,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
  });
  return {
    accountId:              String(user._id),
    role:                   user.role,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    isBanned,
    accessToken:            tokens.accessToken,
    refreshToken:           tokens.refreshToken,
    expiresIn:              tokens.expiresIn,
  };
}

// ─── POST /api/auth/session ───────────────────────────────────────────────────

/**
 * Create or resume an AMONG session after Firebase sign-in.
 * Idempotent — safe to call on every app load.
 */
export async function createSession(
  req: Request<object, object, CreateSessionInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idToken } = req.body;

    // Verify Firebase ID token — the ONE place Firebase SDK is called
    const decoded = await verifyFirebaseToken(idToken);
    const user    = await userService.findOrCreateUser(decoded.uid, decoded.email ?? '');

    res.status(200).json(sessionPayload(user));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function registerWithEmail(
  req: Request<object, object, EmailPasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.registerWithEmail(req.body.email, req.body.password);
    res.status(201).json(sessionPayload(user));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function loginWithEmail(
  req: Request<object, object, EmailPasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.loginWithEmail(req.body.email, req.body.password);
    res.status(200).json(sessionPayload(user));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

/**
 * Exchange a valid refresh token for a new access + refresh token pair.
 * No Firebase call — purely backend JWT verification.
 */
export async function refreshSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(401).json({ error: { code: 'ERR_UNAUTHORIZED', message: 'Refresh token required' } });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    // Re-fetch current account state (catches role changes and bans)
    const { UserModel } = await import('../users/user.model');
    const account = await UserModel.findById(payload.sub)
      .select('role hasCompletedOnboarding enforcementStatus')
      .lean();

    if (!account) {
      res.status(401).json({ error: { code: 'ERR_UNAUTHORIZED', message: 'Account not found' } });
      return;
    }

    const isBanned = (account as { enforcementStatus?: { isBanned?: boolean } })
      .enforcementStatus?.isBanned ?? false;

    if (isBanned) {
      res.status(403).json({ error: { code: 'ERR_FORBIDDEN', message: 'Account is banned' } });
      return;
    }

    const tokens = issueTokenPair({
      accountId:            payload.sub,
      role:                 (account as { role?: string }).role ?? payload.role,
      hasCompletedOnboarding: (account as { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding
                               ?? payload.onboarded,
    });

    res.status(200).json({
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn:    tokens.expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/me ───────────────────────────────────────────────────────

/**
 * Get the authenticated user's private profile.
 * Never returns email or Firebase UID.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await userService.getPrivateProfile(req.user!.accountId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/users/me/onboarding ───────────────────────────────────────────

export async function completeOnboarding(
  req: Request<object, object, CompleteOnboardingInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await userService.completeOnboarding(req.user!.accountId, req.body);
    const profile = await userService.getPrivateProfile(req.user!.accountId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/me/alias/rotate ─────────────────────────────────────────

export async function rotateAlias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.rotateAlias(req.user!.accountId);
    res.status(200).json({
      aliasName:          user.currentAlias?.name,
      avatarSeed:         user.currentAlias?.avatarSeed,
      aliasRotationCount: user.aliasRotationCount,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/me/categories ────────────────────────────────────────────

export async function updateCategories(
  req: Request<object, object, UpdateCategoriesInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await userService.updateCategoryInterests(req.user!.accountId, req.body.categories);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/me/settings ──────────────────────────────────────────────

export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await userService.getPrivateProfile(req.user!.accountId);
    const snyOptIns = await userService.getSnyOptIns(req.user!.accountId);
    res.status(200).json({
      categoryInterests: profile.categoryInterests,
      snyOptIns,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/me/settings/sny ──────────────────────────────────────────

export async function updateSnyOptIn(
  req: Request<object, object, UpdateSnyOptInInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await userService.setSnyOptIn(req.user!.accountId, req.body.categoryId, req.body.optIn);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/users/me/export ───────────────────────────────────────────────

export async function requestDataExport(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Phase 9+: implement actual data export job
    // For now, acknowledge and return a placeholder
    res.status(202).json({ success: true, message: 'Data export requested. You will be notified when ready.' });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/users/me ────────────────────────────────────────────────────

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await userService.softDeleteAccount(req.user!.accountId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
