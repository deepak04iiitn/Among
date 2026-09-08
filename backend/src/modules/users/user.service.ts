/**
 * user.service.ts — User business logic for Phase 3.
 *
 * Privacy invariants:
 *  - `getPublicProfile` returns ONLY alias name + avatar seed. Never email or UID.
 *  - All service methods operate on accountId — never on firebaseUid directly.
 *  - Response objects are audited before returning.
 */
import { UserModel, type IUser } from './user.model';
import { generateAlias, isAliasExpired, canRequestRotation } from '../../utils/aliasGenerator';
import { generateAvatarData, type AvatarData } from '../../utils/avatarGenerator';
import { hashPassword, verifyPassword } from '../../services/password.service';
import {
  ALIAS_ROTATION_CYCLE_MS,
} from '../../constants/timeouts';
import {
  ONBOARDING_CATEGORY_MIN,
  ONBOARDING_CATEGORY_MAX,
} from '../../constants/limits';
import {
  ERR_USER_NOT_FOUND,
  ERR_ALIAS_ROTATION_RATE_LIMITED,
  ERR_EMAIL_IN_USE,
  ERR_INVALID_CREDENTIALS,
  ERR_GOOGLE_SIGN_IN_REQUIRED,
  ERR_ACCOUNT_BANNED,
} from '../../constants/errorCodes';
import {
  ValidationError,
  NotFoundError,
  RateLimitError,
  ConflictError,
  AppError,
} from '../../utils/errors';
import type { Types } from 'mongoose';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface PublicProfile {
  readonly aliasName:   string;
  readonly avatarSeed:  string;
  readonly avatarData:  AvatarData;
}

export interface PrivateProfile {
  readonly accountId:             string;
  readonly role:                  string;
  readonly hasCompletedOnboarding: boolean;
  readonly categoryInterests:     string[];
  readonly currentAlias:          { name: string; avatarSeed: string; issuedAt: Date; expiresAt: Date | null } | null;
  readonly aliasRotationCount:    number;
  readonly snyOptIns:             string[];
}

export interface OnboardingInput {
  readonly categories:   string[];
  readonly ageConfirmed: boolean;
  readonly tosAccepted:  boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Find an existing AMONG account by Firebase UID, or create a new one.
 * Idempotent — safe to call on every sign-in.
 */
export async function findOrCreateUser(
  firebaseUid: string,
  email: string
): Promise<IUser> {
  const existing = await UserModel.findOne({ firebaseUid });
  if (existing) return existing;

  const user = new UserModel({
    firebaseUid,
    email: email.trim().toLowerCase(),
    enforcementStatus: {
      isBanned:             false,
      bannedAt:             null,
      restrictionType:      null,
      restrictionExpiresAt: null,
      warningCount:         0,
    },
  });
  await user.save();
  return user;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Create a native email/password account. Password is hashed before storage.
 */
export async function registerWithEmail(email: string, password: string): Promise<IUser> {
  const normalized = normalizeEmail(email);
  const existing = await UserModel.findOne({ email: normalized });
  if (existing) {
    throw new ConflictError('An account with this email already exists. Sign in instead.', ERR_EMAIL_IN_USE);
  }

  const passwordHash = await hashPassword(password);
  const user = new UserModel({
    email: normalized,
    passwordHash,
    enforcementStatus: {
      isBanned:             false,
      bannedAt:             null,
      restrictionType:      null,
      restrictionExpiresAt: null,
      warningCount:         0,
    },
  });
  await user.save();
  return user;
}

/**
 * Look up an email/password account and verify the password.
 * Does not reveal whether the email exists when the password is wrong.
 */
export async function loginWithEmail(email: string, password: string): Promise<IUser> {
  const normalized = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalized, deletedAt: null }).select('+passwordHash');

  if (!user) {
    throw new AppError('Email or password is incorrect.', 401, ERR_INVALID_CREDENTIALS);
  }

  if (!user.passwordHash) {
    throw new AppError('This account uses Google sign-in.', 401, ERR_GOOGLE_SIGN_IN_REQUIRED);
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw new AppError('Email or password is incorrect.', 401, ERR_INVALID_CREDENTIALS);
  }

  const isBanned = user.enforcementStatus?.isBanned ?? false;
  if (isBanned) {
    throw new AppError('This account has been suspended.', 403, ERR_ACCOUNT_BANNED);
  }

  return user;
}

/**
 * Complete onboarding for a user.
 * Validates categories (3–5), age confirmation, and ToS acceptance.
 * Creates the user's first alias on success.
 */
export async function completeOnboarding(
  accountId: string,
  input: OnboardingInput
): Promise<IUser> {
  const { categories, ageConfirmed, tosAccepted } = input;

  if (!ageConfirmed) {
    throw new ValidationError('Age confirmation is required to create an account');
  }
  if (!tosAccepted) {
    throw new ValidationError('Terms of Service acceptance is required');
  }
  if (categories.length < ONBOARDING_CATEGORY_MIN) {
    throw new ValidationError(
      `Select at least ${ONBOARDING_CATEGORY_MIN} categories to personalise your experience`
    );
  }
  if (categories.length > ONBOARDING_CATEGORY_MAX) {
    throw new ValidationError(`You can select at most ${ONBOARDING_CATEGORY_MAX} categories`);
  }

  const user = await findUserOrThrow(accountId);

  const { name, avatarSeed } = generateAlias();
  const expiresAt = new Date(Date.now() + ALIAS_ROTATION_CYCLE_MS);

  user.categoryInterests     = [...categories];
  user.ageConfirmed          = true;
  user.tosAccepted           = true;
  user.tosAcceptedAt         = new Date();
  user.hasCompletedOnboarding = true;
  user.currentAlias = {
    name,
    avatarSeed,
    issuedAt:  new Date(),
    expiresAt,
  };

  await user.save();
  return user;
}

/**
 * Rotate a user's alias.
 * Enforces the rate limit (`ALIAS_ROTATION_RATE_LIMIT_MS` between requests).
 * Returns the user with the new alias applied.
 */
export async function rotateAlias(accountId: string): Promise<IUser> {
  const user = await findUserOrThrow(accountId);

  if (!canRequestRotation(user)) {
    throw new RateLimitError(ERR_ALIAS_ROTATION_RATE_LIMITED);
  }

  const { name, avatarSeed } = generateAlias();
  const expiresAt = new Date(Date.now() + ALIAS_ROTATION_CYCLE_MS);

  user.currentAlias = {
    name,
    avatarSeed,
    issuedAt:  new Date(),
    expiresAt,
  };
  user.aliasRotationCount         = (user.aliasRotationCount ?? 0) + 1;
  user.lastAliasRotationRequestAt = new Date();

  await user.save();
  return user;
}

/**
 * Set the expiry date on the current alias (used by the rotation job).
 */
export async function scheduleAliasRotation(accountId: string): Promise<void> {
  await UserModel.updateOne(
    { _id: accountId, currentAlias: { $ne: null } },
    { $set: { 'currentAlias.expiresAt': new Date(Date.now() + ALIAS_ROTATION_CYCLE_MS) } }
  );
}

/**
 * Get the public-facing profile for a user.
 * Returns ONLY alias name + avatar seed/data. Never email or Firebase UID.
 */
export async function getPublicProfile(accountId: string): Promise<PublicProfile> {
  const user = await findUserOrThrow(accountId);

  if (!user.currentAlias) {
    throw new ValidationError('User does not have an alias yet');
  }

  const avatarData = generateAvatarData(user.currentAlias.avatarSeed);

  return {
    aliasName:  user.currentAlias.name,
    avatarSeed: user.currentAlias.avatarSeed,
    avatarData,
  };
}

/**
 * Get the private (self-only) profile for the authenticated user.
 * Strips all internal fields.
 */
export async function getPrivateProfile(accountId: string): Promise<PrivateProfile> {
  const user = await findUserOrThrow(accountId);

  return {
    accountId:              String(user._id),
    role:                   user.role,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    categoryInterests:      [...user.categoryInterests],
    currentAlias:           user.currentAlias
      ? {
          name:       user.currentAlias.name,
          avatarSeed: user.currentAlias.avatarSeed,
          issuedAt:   user.currentAlias.issuedAt,
          expiresAt:  user.currentAlias.expiresAt,
        }
      : null,
    aliasRotationCount: user.aliasRotationCount,
    snyOptIns:          [...user.snyOptIns],
  };
}

/**
 * Update the user's category interests (3–5 required).
 */
export async function updateCategoryInterests(
  accountId: string,
  categories: string[]
): Promise<IUser> {
  if (categories.length < ONBOARDING_CATEGORY_MIN) {
    throw new ValidationError(`Select at least ${ONBOARDING_CATEGORY_MIN} categories`);
  }
  if (categories.length > ONBOARDING_CATEGORY_MAX) {
    throw new ValidationError(`You can select at most ${ONBOARDING_CATEGORY_MAX} categories`);
  }

  const user = await findUserOrThrow(accountId);
  user.categoryInterests = [...categories];
  await user.save();
  return user;
}

/**
 * Get the SNY opt-in category IDs for a user.
 */
export async function getSnyOptIns(accountId: string): Promise<string[]> {
  const user = await findUserOrThrow(accountId);
  return [...user.snyOptIns];
}

/**
 * Set or clear a user's SNY opt-in for a specific category.
 */
export async function setSnyOptIn(
  accountId: string,
  categoryId: string,
  optIn: boolean
): Promise<void> {
  const user = await findUserOrThrow(accountId);
  const existing = user.snyOptIns.includes(categoryId);

  if (optIn && !existing) {
    user.snyOptIns.push(categoryId);
    await user.save();
  } else if (!optIn && existing) {
    user.snyOptIns = user.snyOptIns.filter((id) => id !== categoryId);
    await user.save();
  }
}

/**
 * Soft-delete the account.
 * Sets `deletedAt`. Full data anonymization is scheduled as a background job.
 * Does NOT delete the document immediately — preserves moderation history.
 */
export async function softDeleteAccount(accountId: string): Promise<void> {
  const result = await UserModel.updateOne(
    { _id: accountId, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
  if (result.matchedCount === 0) {
    throw new NotFoundError('User', ERR_USER_NOT_FOUND);
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function findUserOrThrow(accountId: string): Promise<IUser> {
  const user = await UserModel.findById(accountId as unknown as Types.ObjectId);
  if (!user) throw new NotFoundError('User', ERR_USER_NOT_FOUND);
  return user;
}

// Re-export utilities used by the rotation job
export { isAliasExpired, canRequestRotation };
