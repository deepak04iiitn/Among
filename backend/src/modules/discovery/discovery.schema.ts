/**
 * discovery.schema.ts — Zod schemas for discovery route query params.
 */
import { z } from 'zod';
import { CATEGORY_PAGE_BATCH_SIZE } from '../../constants/limits';

export const categoryFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(CATEGORY_PAGE_BATCH_SIZE).optional(),
});

export const savedPostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(50).optional(),
});

export type CategoryFeedQuery = z.infer<typeof categoryFeedQuerySchema>;
export type SavedPostsQuery   = z.infer<typeof savedPostsQuerySchema>;
