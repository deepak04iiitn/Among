/**
 * reaction.service.ts — Business logic for reactions.
 *
 * Privacy invariants (hard contracts):
 *  1. No function EVER returns a list of accountIds who reacted.
 *  2. `getUserReactionForPost` only returns data for the calling user — never for others.
 *  3. `getAggregateCounts` returns only numeric counts — no user references.
 *  4. Primary reactions are EXCLUSIVE — setting one removes the previous primary.
 *  5. Secondary reactions are ADDITIVE — a user can hold multiple simultaneously.
 */
import { ReactionModel, type IReaction } from './reaction.model';
import { PostModel } from '../posts/post.model';
import {
  VALID_PRIMARY_REACTION_IDS,
  VALID_SECONDARY_REACTION_IDS,
  type PrimaryReactionId,
  type SecondaryReactionId,
} from '../../constants/reactionTypes';
import { ERR_POST_NOT_FOUND } from '../../constants/errorCodes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import type { Types } from 'mongoose';
import type { IReactionCounts } from '../posts/post.model';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface SetReactionInput {
  primaryReaction?:    PrimaryReactionId | null;
  secondaryReactions?: SecondaryReactionId[];
}

/** Public shape of a user's own reaction — safe to return to the reacting user only */
export interface UserReaction {
  readonly postId:             string;
  readonly primaryReaction:    PrimaryReactionId | null;
  readonly secondaryReactions: SecondaryReactionId[];
}

/** Aggregate counts — no user identifiers, ever */
export type AggregateCounts = IReactionCounts;

export interface SetReactionResult {
  readonly counts:      AggregateCounts;
  readonly myReaction:  UserReaction;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Upsert a reaction for a user on a post.
 * - Primary reactions are exclusive: setting a new primary removes the old one.
 * - Secondary reactions are additive: they accumulate unless explicitly set.
 * - After upsert, recomputes Post.reactionCounts via aggregation.
 * - Returns only aggregate counts — never individual reaction records.
 */
export async function setReaction(
  accountId: string,
  postId:    string,
  input:     SetReactionInput
): Promise<SetReactionResult> {
  await assertPostExists(postId);

  // Validate reaction IDs
  if (
    input.primaryReaction !== undefined &&
    input.primaryReaction !== null &&
    !VALID_PRIMARY_REACTION_IDS.has(input.primaryReaction)
  ) {
    throw new ValidationError(`Invalid primary reaction: ${input.primaryReaction}`);
  }

  for (const id of input.secondaryReactions ?? []) {
    if (!VALID_SECONDARY_REACTION_IDS.has(id)) {
      throw new ValidationError(`Invalid secondary reaction: ${id}`);
    }
  }

  // Build the update object
  const update: Partial<IReaction> = {};

  if (input.primaryReaction !== undefined) {
    // Explicit set (including null to clear)
    update.primaryReaction = input.primaryReaction;
  }

  if (input.secondaryReactions !== undefined) {
    // Replace the whole secondary set (caller provides the full desired list)
    update.secondaryReactions = [...new Set(input.secondaryReactions)] as SecondaryReactionId[];
  }

  const reaction = await ReactionModel.findOneAndUpdate(
    {
      accountId: accountId as unknown as Types.ObjectId,
      postId:    postId    as unknown as Types.ObjectId,
    },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Recompute counts from the Reaction collection (authoritative source)
  const counts = await recomputePostCounts(postId);

  const myReaction: UserReaction = {
    postId,
    primaryReaction:    reaction.primaryReaction,
    secondaryReactions: [...reaction.secondaryReactions],
  };

  return { counts, myReaction };
}

/**
 * Remove all reactions for a user on a post.
 * Recomputes Post.reactionCounts after deletion.
 */
export async function removeReaction(
  accountId: string,
  postId:    string
): Promise<AggregateCounts> {
  await assertPostExists(postId);

  await ReactionModel.deleteOne({
    accountId: accountId as unknown as Types.ObjectId,
    postId:    postId    as unknown as Types.ObjectId,
  });

  return recomputePostCounts(postId);
}

/**
 * Get the calling user's own reaction for a post.
 * Only safe to return to the user who made the reaction — never to others.
 */
export async function getUserReactionForPost(
  accountId: string,
  postId:    string
): Promise<UserReaction | null> {
  const reaction = await ReactionModel.findOne({
    accountId: accountId as unknown as Types.ObjectId,
    postId:    postId    as unknown as Types.ObjectId,
  }).lean();

  if (!reaction) return null;

  return {
    postId,
    primaryReaction:    reaction.primaryReaction,
    secondaryReactions: [...reaction.secondaryReactions],
  };
}

/**
 * Get aggregate reaction counts for a post.
 * Returns only numbers — no user references, ever.
 */
export async function getAggregateCounts(postId: string): Promise<AggregateCounts> {
  const post = await PostModel.findById(postId as unknown as Types.ObjectId)
    .select('reactionCounts')
    .lean();

  if (!post) throw new NotFoundError('Post', ERR_POST_NOT_FOUND);

  return { ...post.reactionCounts } as AggregateCounts;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function assertPostExists(postId: string): Promise<void> {
  const exists = await PostModel.exists({ _id: postId as unknown as Types.ObjectId });
  if (!exists) throw new NotFoundError('Post', ERR_POST_NOT_FOUND);
}

/**
 * Recompute Post.reactionCounts from the Reaction collection.
 * Uses an aggregation pipeline — authoritative, consistent on every write.
 */
async function recomputePostCounts(postId: string): Promise<AggregateCounts> {
  // Aggregate all reactions for this post
  const results = await ReactionModel.aggregate([
    { $match: { postId: postId as unknown as Types.ObjectId } },
    {
      $group: {
        _id: null,
        // Primary counts
        current:    { $sum: { $cond: [{ $eq: ['$primaryReaction', 'current'] },    1, 0] } },
        past:       { $sum: { $cond: [{ $eq: ['$primaryReaction', 'past'] },       1, 0] } },
        considering:{ $sum: { $cond: [{ $eq: ['$primaryReaction', 'considering'] }, 1, 0] } },
        // Secondary counts (each doc can have multiple in the array)
        same:        { $sum: { $size: { $filter: { input: '$secondaryReactions', cond: { $eq: ['$$this', 'same'] } } } } },
        iUnderstand: { $sum: { $size: { $filter: { input: '$secondaryReactions', cond: { $eq: ['$$this', 'i-understand'] } } } } },
        iLearned:    { $sum: { $size: { $filter: { input: '$secondaryReactions', cond: { $eq: ['$$this', 'i-learned'] } } } } },
        iDisagree:   { $sum: { $size: { $filter: { input: '$secondaryReactions', cond: { $eq: ['$$this', 'i-disagree'] } } } } },
        tellMeMore:  { $sum: { $size: { $filter: { input: '$secondaryReactions', cond: { $eq: ['$$this', 'tell-me-more'] } } } } },
      },
    },
  ]);

  const agg = results[0] ?? {};
  const counts: AggregateCounts = {
    current:     agg.current     ?? 0,
    past:        agg.past        ?? 0,
    considering: agg.considering ?? 0,
    same:        agg.same        ?? 0,
    iUnderstand: agg.iUnderstand ?? 0,
    iLearned:    agg.iLearned    ?? 0,
    iDisagree:   agg.iDisagree   ?? 0,
    tellMeMore:  agg.tellMeMore  ?? 0,
  };

  // Persist to Post document so single-post reads don't need to aggregate
  await PostModel.updateOne(
    { _id: postId as unknown as Types.ObjectId },
    { $set: { reactionCounts: counts } }
  );

  return counts;
}
