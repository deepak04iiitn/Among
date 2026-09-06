/**
 * conversation.schema.ts — Zod validation schemas for conversation API endpoints.
 */
import { z } from 'zod';
import { EXPERIENCE_CATEGORY_IDS } from '../../constants/experienceCategories';
import { MESSAGE_MAX_CHARS } from '../../constants/limits';

const validCategoryIds = Object.values(EXPERIENCE_CATEGORY_IDS) as [string, ...string[]];

// ─── Match request ────────────────────────────────────────────────────────────

export const matchRequestSchema = z.object({
  contextPostId:     z.string().optional(),
  contextCategoryId: z.enum(validCategoryIds, {
    errorMap: () => ({ message: 'Invalid experience category' }),
  }),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;

// ─── Send message ─────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  body: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(MESSAGE_MAX_CHARS, `Message exceeds ${MESSAGE_MAX_CHARS} characters`),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const feedbackSchema = z.object({
  helpful: z.boolean(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

// ─── Get messages query ───────────────────────────────────────────────────────

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(100).optional(),
});

export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
