/**
 * post.model.ts — Mongoose schema for user posts.
 *
 * Privacy invariants enforced here:
 *  - `authorAccountId` is stripped from all toJSON output (never exposed in public API).
 *  - `moderationNotes` and `contentFlags` are internal — stripped from toJSON.
 *  - `authorAlias` is a snapshot — the alias name at time of post (not linked to current alias).
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import {
  POST_STATUS,
  POST_EXPERIENCE_STATE,
  POST_VISIBILITY,
  type PostStatus,
  type PostExperienceState,
  type PostVisibility,
} from '../../constants/postStates';

// ─── Reaction counts sub-document ────────────────────────────────────────────

export interface IReactionCounts {
  current:    number;
  past:       number;
  considering: number;
  same:        number;
  iUnderstand: number;
  iLearned:    number;
  iDisagree:   number;
  tellMeMore:  number;
}

// ─── Main document interface ─────────────────────────────────────────────────

export interface IPost extends Document {
  _id:             Types.ObjectId;
  /** Never included in public API responses */
  authorAccountId: Types.ObjectId;
  /** Snapshot of alias name at time of post */
  authorAlias:     string;
  /** Snapshot of avatar seed at time of post */
  authorAvatarSeed: string;

  body:            string;
  categoryIds:     string[];
  state:           PostExperienceState;
  visibilityScope: PostVisibility;
  status:          PostStatus;

  publishedAt:     Date;
  editableUntil:   Date;
  editedAt:        Date | null;
  deletedAt:       Date | null;

  /** Internal moderation notes — never in public API */
  moderationNotes: string | null;
  /** Automated scan results — internal only */
  contentFlags:    string[];

  reactionCounts:  IReactionCounts;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Reaction counts sub-schema ───────────────────────────────────────────────

const ReactionCountsSchema = new Schema<IReactionCounts>(
  {
    current:     { type: Number, default: 0 },
    past:        { type: Number, default: 0 },
    considering: { type: Number, default: 0 },
    same:        { type: Number, default: 0 },
    iUnderstand: { type: Number, default: 0 },
    iLearned:    { type: Number, default: 0 },
    iDisagree:   { type: Number, default: 0 },
    tellMeMore:  { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Main schema ─────────────────────────────────────────────────────────────

const PostSchema = new Schema<IPost>(
  {
    authorAccountId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorAlias:      { type: String, required: true },
    authorAvatarSeed: { type: String, required: true },

    body: {
      type:     String,
      required: true,
      minlength: 20,
      maxlength: 3000,
    },
    categoryIds: {
      type:    [String],
      default: [],
    },
    state: {
      type:     String,
      enum:     Object.values(POST_EXPERIENCE_STATE),
      required: true,
    },
    visibilityScope: {
      type:    String,
      enum:    Object.values(POST_VISIBILITY),
      default: POST_VISIBILITY.BROAD,
    },
    status: {
      type:     String,
      enum:     Object.values(POST_STATUS),
      default:  POST_STATUS.PUBLISHED,
      index:    true,
    },

    publishedAt:   { type: Date, default: () => new Date() },
    editableUntil: { type: Date, required: true },
    editedAt:      { type: Date, default: null },
    deletedAt:     { type: Date, default: null, index: true },

    // Internal — never in public API responses
    moderationNotes: { type: String, default: null },
    contentFlags:    { type: [String], default: [] },

    reactionCounts: { type: ReactionCountsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        // ─── Privacy: strip all internal fields ───────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete ret['__v'];
        delete ret['authorAccountId'];
        delete ret['moderationNotes'];
        delete ret['contentFlags'];
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Author's posts, sorted by creation (for "my posts" feed)
PostSchema.index({ authorAccountId: 1, createdAt: -1 });
// Category feed — published posts, newest first
PostSchema.index({ categoryIds: 1, publishedAt: -1, status: 1 });
// Status-based queries (moderation queue, expiry jobs)
PostSchema.index({ status: 1, publishedAt: -1 });

export const PostModel: Model<IPost> = model<IPost>('Post', PostSchema);
