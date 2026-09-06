/**
 * someoneNeedsYou.schema.ts — Zod validation for SNY endpoints.
 */
import { z } from 'zod';

export const snyAcceptSchema = z.object({
  promptPostId: z.string().min(1, 'Prompt post ID required'),
});

export type SNYAcceptInput = z.infer<typeof snyAcceptSchema>;

export const snySkipSchema = z.object({
  skippedPostId: z.string().min(1, 'Skipped post ID required'),
});

export type SNYSkipInput = z.infer<typeof snySkipSchema>;

export const snyOptInSchema = z.object({
  categoryId: z.string().min(1, 'Category ID required'),
  optIn:      z.boolean(),
});

export type SNYOptInInput = z.infer<typeof snyOptInSchema>;
