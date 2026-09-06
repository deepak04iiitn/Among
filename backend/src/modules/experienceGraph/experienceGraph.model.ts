/**
 * experienceGraph.model.ts — Private per-user experience graph.
 *
 * Privacy invariants (PRD §8):
 *  - This document is NEVER returned in any public API response.
 *  - It is NEVER used to build a public profile.
 *  - Used ONLY for: SNY matching, user's own private history view, YANA aggregate counts.
 *  - `accountId` links to the internal account — never exposed externally.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { type PrimaryReactionId } from '../../constants/reactionTypes';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IReactionHistoryEntry {
  postId:     Types.ObjectId;
  reaction:   PrimaryReactionId;
  reactedAt:  Date;
}

export interface IConversationEntry {
  conversationId: Types.ObjectId;
  enteredAt:      Date;
}

export interface IExperienceEntry {
  categoryId:              string;
  hasPostedAbout:          boolean;
  primaryReactionHistory:  IReactionHistoryEntry[];
  conversationsEntered:    IConversationEntry[];
  /** User has opted in to receive SNY prompts for this category */
  snyOptIn:                boolean;
  lastUpdatedAt:           Date;
}

// ─── Main document interface ──────────────────────────────────────────────────

export interface IExperienceGraph extends Document {
  _id:         Types.ObjectId;
  accountId:   Types.ObjectId;
  experiences: IExperienceEntry[];
  updatedAt:   Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const ReactionHistoryEntrySchema = new Schema<IReactionHistoryEntry>(
  {
    postId:    { type: Schema.Types.ObjectId, required: true },
    reaction:  { type: String, required: true },
    reactedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const ConversationEntrySchema = new Schema<IConversationEntry>(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true },
    enteredAt:      { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const ExperienceEntrySchema = new Schema<IExperienceEntry>(
  {
    categoryId:             { type: String, required: true },
    hasPostedAbout:         { type: Boolean, default: false },
    primaryReactionHistory: { type: [ReactionHistoryEntrySchema], default: [] },
    conversationsEntered:   { type: [ConversationEntrySchema], default: [] },
    snyOptIn:               { type: Boolean, default: false },
    lastUpdatedAt:          { type: Date, default: () => new Date() },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const ExperienceGraphSchema = new Schema<IExperienceGraph>(
  {
    accountId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    experiences: { type: [ExperienceEntrySchema], default: [] },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// unique index already applied via schema-level `unique: true` on accountId field
// For SNY matching: find users who have PAST reactions with opt-in
ExperienceGraphSchema.index({ 'experiences.categoryId': 1, 'experiences.snyOptIn': 1 });

export const ExperienceGraphModel: Model<IExperienceGraph> = model<IExperienceGraph>(
  'ExperienceGraph',
  ExperienceGraphSchema
);
