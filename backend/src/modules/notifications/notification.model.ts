/**
 * notification.model.ts — In-app notification schema.
 *
 * Privacy invariants:
 *  - `genericText` is safe for lock-screen previews — NO message content, NO aliases, NO PII.
 *  - `recipientAccountId` is never returned in public API responses.
 *  - Notification content never references another user's identity.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_REFERENCE_TYPE,
  type NotificationType,
  type NotificationReferenceType,
} from '../../constants/notificationTypes';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface INotification extends Document {
  _id:                Types.ObjectId;
  /** NEVER in public API responses */
  recipientAccountId: Types.ObjectId;
  type:               NotificationType;
  referenceId:        Types.ObjectId;
  referenceType:      NotificationReferenceType;
  isRead:             boolean;
  emailSent:          boolean;
  /** Safe for lock-screen. Never contains message content, alias, or PII. */
  genericText:        string;
  createdAt:          Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const NotificationSchema = new Schema<INotification>(
  {
    recipientAccountId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type:     String,
      enum:     Object.values(NOTIFICATION_TYPE),
      required: true,
    },
    referenceId:   { type: Schema.Types.ObjectId, required: true },
    referenceType: {
      type:     String,
      enum:     Object.values(NOTIFICATION_REFERENCE_TYPE),
      required: true,
    },
    isRead:      { type: Boolean, default: false },
    emailSent:   { type: Boolean, default: false },
    genericText: { type: String,  required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary fetch: unread notifications for a user, newest first
NotificationSchema.index({ recipientAccountId: 1, isRead: 1, createdAt: -1 });
// Mark-as-read lookup
NotificationSchema.index({ recipientAccountId: 1, _id: 1 });

export const NotificationModel: Model<INotification> =
  model<INotification>('Notification', NotificationSchema);
