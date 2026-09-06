/**
 * message.model.ts — Individual messages within a conversation.
 *
 * Privacy invariants:
 *  - `senderAccountId` NEVER included in API responses.
 *  - Only `senderAliasSnapshot` (aliasName + avatarSeed) is exposed.
 *  - No read receipts.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { MESSAGE_MAX_CHARS } from '../../constants/limits';

// ─── Document interface ───────────────────────────────────────────────────────

export interface IMessage extends Document {
  _id:                  Types.ObjectId;
  conversationId:       Types.ObjectId;
  /** Never in API response */
  senderAccountId:      Types.ObjectId;
  senderAliasSnapshot:  string;   // aliasName only
  senderAvatarSeed:     string;
  body:                 string;
  contactInfoWarning:   boolean;
  deletedAt:            Date | null;
  sentAt:               Date;
  createdAt:            Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const MessageSchema = new Schema<IMessage>(
  {
    conversationId:      { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderAccountId:     { type: Schema.Types.ObjectId, ref: 'User',         required: true },
    senderAliasSnapshot: { type: String, required: true },
    senderAvatarSeed:    { type: String, required: true },
    body: {
      type:      String,
      required:  true,
      maxlength: MESSAGE_MAX_CHARS,
    },
    contactInfoWarning: { type: Boolean, default: false },
    deletedAt:          { type: Date,    default: null },
    sentAt:             { type: Date,    default: () => new Date(), index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['senderAccountId'];
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary query: messages in a conversation ordered by time
MessageSchema.index({ conversationId: 1, sentAt: 1 });

export const MessageModel: Model<IMessage> = model<IMessage>('Message', MessageSchema);
