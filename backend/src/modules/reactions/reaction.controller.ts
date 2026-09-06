/**
 * reaction.controller.ts — HTTP handlers for reaction routes.
 *
 * Privacy invariants:
 *  - No handler ever returns accountIds or individual reaction identities.
 *  - GET /reactions returns aggregate counts + the calling user's own reaction.
 *  - The "my reaction" field is only populated when authenticated.
 */
import type { Request, Response, NextFunction } from 'express';
import * as reactionService from './reaction.service';
import type { SetReactionInput } from './reaction.schema';
import type {
  PrimaryReactionId,
  SecondaryReactionId,
} from '../../constants/reactionTypes';

// ─── PUT /api/posts/:postId/reactions ─────────────────────────────────────────

export async function setReaction(
  req: Request<{ postId: string }, object, SetReactionInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bodyPrimary    = req.body.primaryReaction;
    const bodySecondary  = req.body.secondaryReactions;

    // Build input object conditionally to satisfy exactOptionalPropertyTypes
    const serviceInput: reactionService.SetReactionInput = {
      ...(bodyPrimary    !== undefined && { primaryReaction:    bodyPrimary    as PrimaryReactionId | null }),
      ...(bodySecondary  !== undefined && { secondaryReactions: bodySecondary  as SecondaryReactionId[] }),
    };

    const result = await reactionService.setReaction(
      req.user!.accountId,
      req.params.postId,
      serviceInput
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/posts/:postId/reactions ─────────────────────────────────────

export async function removeReaction(
  req: Request<{ postId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const counts = await reactionService.removeReaction(
      req.user!.accountId,
      req.params.postId
    );
    res.status(200).json({ counts });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/posts/:postId/reactions ─────────────────────────────────────────

export async function getReactions(
  req: Request<{ postId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { postId } = req.params;
    const accountId  = req.user?.accountId ?? null;

    const counts = await reactionService.getAggregateCounts(postId);

    // Include the caller's own reaction if authenticated
    let myReaction: reactionService.UserReaction | null = null;
    if (accountId) {
      myReaction = await reactionService.getUserReactionForPost(accountId, postId);
    }

    res.status(200).json({ counts, myReaction });
  } catch (err) {
    next(err);
  }
}
