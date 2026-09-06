/**
 * analyticsEvent.model.ts — Mongoose schema for analytics events.
 *
 * Privacy invariants (PRD §18):
 *  - accountIdHash is HMAC of accountId — never the raw ID.
 *  - No Firebase UID, email, or message content ever stored.
 *  - metadata contains only non-identifying context fields.
 */
import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { AnalyticsEventType } from '../../constants/analyticsEvents';

export interface IAnalyticsEvent extends Document {
  _id:               Types.ObjectId;
  eventType:         AnalyticsEventType;
  /** HMAC-SHA256 hash of accountId — enables cohort analysis without raw ID exposure */
  accountIdHash:     string;
  /** Anonymous session identifier */
  sessionId:         string;
  /** Experience category — where relevant */
  categoryId?:       string;
  /** Conversation state — where relevant */
  conversationState?: string;
  timestamp:         Date;
  /** Non-identifying, event-specific context (no content body, no PII) */
  metadata:          Record<string, unknown>;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType:         { type: String, required: true, index: true },
    accountIdHash:     { type: String, required: true, index: true },
    sessionId:         { type: String, required: true },
    categoryId:        { type: String },
    conversationState: { type: String },
    timestamp:         { type: Date,   required: true, index: true, default: Date.now },
    metadata:          { type: Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'analyticsEvents',
    // No updatedAt — analytics events are write-once
    timestamps: { createdAt: false, updatedAt: false },
  }
);

// Compound index for metric queries
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ accountIdHash: 1, timestamp: -1 });

export const AnalyticsEventModel = mongoose.model<IAnalyticsEvent>(
  'AnalyticsEvent',
  AnalyticsEventSchema
);
