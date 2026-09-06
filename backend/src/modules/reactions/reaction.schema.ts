/**
 * reaction.schema.ts — Zod validation schemas for reaction routes.
 */
import { z } from 'zod';
import {
  PRIMARY_REACTION_IDS,
  SECONDARY_REACTION_IDS,
} from '../../constants/reactionTypes';

// ─── PUT /api/posts/:postId/reactions ─────────────────────────────────────────

export const setReactionSchema = z.object({
  /** Exclusive primary reaction — null to clear */
  primaryReaction: z.enum(
    Object.values(PRIMARY_REACTION_IDS) as [string, ...string[]],
    { errorMap: () => ({ message: 'Invalid primary reaction type' }) }
  ).nullable().optional(),

  /** Additive secondary reactions — provide the full desired set */
  secondaryReactions: z
    .array(
      z.enum(
        Object.values(SECONDARY_REACTION_IDS) as [string, ...string[]],
        { errorMap: () => ({ message: 'Invalid secondary reaction type' }) }
      )
    )
    .max(Object.keys(SECONDARY_REACTION_IDS).length, 'Too many secondary reactions')
    .optional(),
});

export type SetReactionInput = z.infer<typeof setReactionSchema>;
