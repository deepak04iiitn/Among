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
 * Encode an arbitrary cursor payload as a URL-safe base64 string.
 */
export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Decode a base64url cursor string back to its payload.
 * Returns `null` if the string is invalid or malformed.
 */
export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed: unknown = JSON.parse(json);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
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
