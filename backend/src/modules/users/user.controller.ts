/**
 * user.controller.ts — HTTP request handlers for auth and user routes.
 *
 * Privacy invariants:
 *  - `firebaseUid`, `email`, and internal MongoDB `_id` as `authorAccountId`
 *    are NEVER returned in any response from these controllers.
 *  - All successful responses return only the explicitly listed fields below.
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../../config/firebase';
import * as userService from './user.service';
import type {
  CreateSessionInput,
  CompleteOnboardingInput,
  UpdateCategoriesInput,
  UpdateSnyOptInInput,
} from './user.schema';

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
    const decoded = await verifyFirebaseToken(idToken);
    const user    = await userService.findOrCreateUser(decoded.uid, decoded.email ?? '');

    // Return the minimum needed to hydrate the Redux auth slice
    res.status(200).json({
      accountId:              String(user._id),
      role:                   user.role,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      isBanned:               user.enforcementStatus?.isBanned ?? false,
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
