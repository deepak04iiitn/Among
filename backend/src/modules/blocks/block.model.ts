/**
 * block.model.ts — Mongoose schema for user blocks.
 *
 * Block is always tied to the PRIVATE account ID — not the alias.
 * Alias rotation NEVER resets a block (enforced by using accountId, not alias).
 *
 * Privacy: `blockerAccountId` and `blockedAccountId` are never in public API responses.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface IBlock extends Document {
  _id:               Types.ObjectId;
  blockerAccountId:  Types.ObjectId;
  blockedAccountId:  Types.ObjectId;
  createdAt:         Date;
}

const BlockSchema = new Schema<IBlock>(
  {
    blockerAccountId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blockedAccountId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique pair — can only block once
BlockSchema.index({ blockerAccountId: 1, blockedAccountId: 1 }, { unique: true });
// Fast lookup of all accounts blocked by a user
BlockSchema.index({ blockerAccountId: 1 });

export const BlockModel: Model<IBlock> = model<IBlock>('Block', BlockSchema);
