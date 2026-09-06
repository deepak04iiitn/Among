/**
 * pagination.ts — Cursor-based pagination utilities.
 *
 * AMONG uses cursor-based (keyed) pagination everywhere — not offset/page.
 * This prevents the "moving window" problem when new posts are inserted.
 */
import { z } from 'zod';

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CursorPaginationParams = z.infer<typeof CursorPaginationSchema>;

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Builds a cursor page response from a raw query result.
 * Pass (limit + 1) items to the query to detect if more pages exist.
 */
export function buildCursorPage<T extends { _id: unknown }>(
  items: T[],
  limit: number
): CursorPage<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem ? String(lastItem._id) : null;

  return { items: pageItems, nextCursor, hasMore };
}
