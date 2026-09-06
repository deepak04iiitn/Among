/**
 * reaction.model.ts — Mongoose schema for user reactions to posts.
 *
 * Privacy invariants:
 *  - `accountId` is NEVER included in any public API response.
 *  - No endpoint ever returns a list of accountIds who reacted.
 *  - Only aggregate counts are ever returned to clients.
 *  - A user can only fetch their own reaction — never another user's.
 *
 * One reaction document per (accountId × postId) — upsert pattern enforced
 * at the database level via unique compound index.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import {
  VALID_PRIMARY_REACTION_IDS,
  VALID_SECONDARY_REACTION_IDS,
  type PrimaryReactionId,
  type SecondaryReactionId,
} from '../../constants/reactionTypes';

// ─── Document interface ───────────────────────────────────────────────────────

export interface IReaction extends Document {
  _id:                Types.ObjectId;
  /** Never exposed in public API */
  accountId:          Types.ObjectId;
  postId:             Types.ObjectId;
  /** Exclusive — only one primary at a time, or null */
  primaryReaction:    PrimaryReactionId | null;
  /** Additive — can hold multiple */
  secondaryReactions: SecondaryReactionId[];
  createdAt:          Date;
  updatedAt:          Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ReactionSchema = new Schema<IReaction>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    postId:    { type: Schema.Types.ObjectId, ref: 'Post',  required: true },

    primaryReaction: {
      type:    String,
      enum:    [...VALID_PRIMARY_REACTION_IDS, null],
      default: null,
    },

    secondaryReactions: {
      type:    [String],
      enum:    [...VALID_SECONDARY_REACTION_IDS],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        // Strip private fields — account identity must never leak
        delete ret['__v'];
        delete ret['accountId'];
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// One reaction record per user per post — enforced at DB level
ReactionSchema.index({ accountId: 1, postId: 1 }, { unique: true });
// Efficient count aggregations by post
ReactionSchema.index({ postId: 1 });

export const ReactionModel: Model<IReaction> = model<IReaction>('Reaction', ReactionSchema);
