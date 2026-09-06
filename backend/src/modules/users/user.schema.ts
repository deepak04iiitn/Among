/**
 * user.schema.ts — Zod validation schemas for user/auth routes.
 *
 * These schemas validate req.body directly — the `validate` middleware
 * calls `schema.safeParse(req.body)`, so schemas must match the body shape,
 * NOT wrap it in a `body` key.
 */
import { z } from 'zod';
import {
  ONBOARDING_CATEGORY_MIN,
  ONBOARDING_CATEGORY_MAX,
} from '../../constants/limits';

// ─── POST /api/auth/session ───────────────────────────────────────────────────

export const createSessionSchema = z.object({
  /** Firebase ID token from the client */
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ─── POST /api/users/me/onboarding ───────────────────────────────────────────

export const completeOnboardingSchema = z.object({
  categories: z
    .array(z.string().min(1))
    .min(ONBOARDING_CATEGORY_MIN, `Select at least ${ONBOARDING_CATEGORY_MIN} categories`)
    .max(ONBOARDING_CATEGORY_MAX, `Select at most ${ONBOARDING_CATEGORY_MAX} categories`),
  ageConfirmed: z.literal(true, { errorMap: () => ({ message: 'Age confirmation is required' }) }),
  tosAccepted:  z.literal(true, { errorMap: () => ({ message: 'ToS acceptance is required' }) }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

// ─── PUT /api/users/me/categories ────────────────────────────────────────────

export const updateCategoriesSchema = z.object({
  categories: z
    .array(z.string().min(1))
    .min(ONBOARDING_CATEGORY_MIN, `Minimum ${ONBOARDING_CATEGORY_MIN} categories required`)
    .max(ONBOARDING_CATEGORY_MAX, `Maximum ${ONBOARDING_CATEGORY_MAX} categories allowed`),
});

export type UpdateCategoriesInput = z.infer<typeof updateCategoriesSchema>;

// ─── PUT /api/users/me/settings/sny ──────────────────────────────────────────

export const updateSnyOptInSchema = z.object({
  categoryId: z.string().min(1, 'categoryId is required'),
  optIn:      z.boolean(),
});

export type UpdateSnyOptInInput = z.infer<typeof updateSnyOptInSchema>;

// ─── PUT /api/users/me/settings/notifications ────────────────────────────────

export const updateNotificationSettingsSchema = z.object({
  newMessage:  z.boolean().optional(),
  newResponse: z.boolean().optional(),
  matchFound:  z.boolean().optional(),
});

export type UpdateNotificationSettingsInput =
  z.infer<typeof updateNotificationSettingsSchema>;
