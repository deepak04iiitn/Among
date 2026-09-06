/**
 * conversation.model.ts — Mongoose schema for temporary conversations.
 *
 * Privacy invariants:
 *  - `participantAccountIds` NEVER included in public API responses.
 *  - Only `participantAliasSnapshots` (name + avatarSeed) are exposed to participants.
 *  - `participantAccountIds` are used server-side only for auth/block checks.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import {
  CONVERSATION_STATE,
  type ConversationState,
} from '../../constants/conversationStates';
import { MATCH_REQUEST_EXPIRY_MS } from '../../constants/timeouts';

// ─── Sub-document interface ───────────────────────────────────────────────────

export interface IAliasSnapshot {
  accountId:  Types.ObjectId;  // Private — never in API response
  aliasName:  string;
  avatarSeed: string;
}

// ─── Main document interface ─────────────────────────────────────────────────

export interface IConversation extends Document {
  _id:                   Types.ObjectId;
  /** Never in API response */
  participantAccountIds: [Types.ObjectId, Types.ObjectId];
  participantAliasSnapshots: IAliasSnapshot[];
  contextPostId:         Types.ObjectId | null;
  contextCategoryId:     string;
  state:                 ConversationState;
  requestedAt:           Date;
  matchedAt:             Date | null;
  startedAt:             Date | null;
  lastActivityAt:        Date | null;
  inactivityWarningAt:   Date | null;
  expiresAt:             Date | null;
  endedAt:               Date | null;
  endReason:             string | null;
  feedbackA:             boolean | null;
  feedbackB:             boolean | null;
  matchRequestExpiresAt: Date;
  createdAt:             Date;
  updatedAt:             Date;
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const AliasSnapshotSchema = new Schema<IAliasSnapshot>(
  {
    accountId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    aliasName:  { type: String, required: true },
    avatarSeed: { type: String, required: true },
  },
  { _id: false }
);

// ─── Main schema ─────────────────────────────────────────────────────────────

const ConversationSchema = new Schema<IConversation>(
  {
    participantAccountIds:     { type: [Schema.Types.ObjectId], required: true },
    participantAliasSnapshots: { type: [AliasSnapshotSchema], required: true },
    contextPostId:             { type: Schema.Types.ObjectId, ref: 'Post',    default: null },
    contextCategoryId:         { type: String, required: true },
    state: {
      type:     String,
      enum:     Object.values(CONVERSATION_STATE),
      default:  CONVERSATION_STATE.REQUESTED,
      index:    true,
    },
    requestedAt:           { type: Date, default: () => new Date() },
    matchedAt:             { type: Date, default: null },
    startedAt:             { type: Date, default: null },
    lastActivityAt:        { type: Date, default: null },
    inactivityWarningAt:   { type: Date, default: null },
    expiresAt:             { type: Date, default: null },
    endedAt:               { type: Date, default: null },
    endReason:             { type: String, default: null },
    feedbackA:             { type: Boolean, default: null },
    feedbackB:             { type: Boolean, default: null },
    matchRequestExpiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + MATCH_REQUEST_EXPIRY_MS),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        // Privacy: strip private fields
        delete ret['participantAccountIds'];
        delete ret['__v'];
        // Strip accountId from alias snapshots
        const snapshots = ret['participantAliasSnapshots'] as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(snapshots)) {
          ret['participantAliasSnapshots'] = snapshots.map(({ accountId: _a, ...safe }) => safe);
        }
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Fast lookup of conversations for a user
ConversationSchema.index({ participantAccountIds: 1, state: 1 });
// Match queue: find waiting REQUESTED conversations by category
ConversationSchema.index({ state: 1, contextCategoryId: 1, matchRequestExpiresAt: 1 });
// Expiry jobs
ConversationSchema.index({ state: 1, lastActivityAt: 1 });
ConversationSchema.index({ state: 1, expiresAt: 1 });

export const ConversationModel: Model<IConversation> = model<IConversation>(
  'Conversation',
  ConversationSchema
);
