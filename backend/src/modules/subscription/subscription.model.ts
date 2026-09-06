/**
 * subscription.model.ts — Mongoose schema for Subscription documents.
 *
 * NO subscription product exists at MVP — all users are FREE tier.
 * This schema exists so the architecture is ready for future Stripe integration
 * without any restructuring of product services.
 *
 * PRD §20 — Subscription Architecture rules:
 *  - All entitlement checks go through `getEntitlements()`, never raw tier checks.
 *  - `paymentProvider` and `paymentProviderId` are nullable — populated at payment time.
 */
import mongoose, { Schema, type Document, type Types } from 'mongoose';
import {
  SUBSCRIPTION_TIER,
  SUBSCRIPTION_STATUS,
  type SubscriptionTier,
  type SubscriptionStatus,
} from '../../constants/subscriptionTiers';

export interface ISubscription extends Document {
  _id:               Types.ObjectId;
  accountId:         Types.ObjectId;
  tier:              SubscriptionTier;
  status:            SubscriptionStatus;
  startedAt:         Date;
  expiresAt:         Date | null;
  /** Payment provider name — e.g. 'stripe'. Null until payment is configured. */
  paymentProvider:   string | null;
  /** Provider's subscription ID — e.g. Stripe sub_xxx. Null until payment. */
  paymentProviderId: string | null;
  createdAt:         Date;
  updatedAt:         Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    accountId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    tier: {
      type:    String,
      enum:    Object.values(SUBSCRIPTION_TIER),
      default: SUBSCRIPTION_TIER.FREE,
    },
    status: {
      type:    String,
      enum:    Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
    },
    startedAt:         { type: Date, required: true, default: Date.now },
    expiresAt:         { type: Date, default: null },
    paymentProvider:   { type: String, default: null },
    paymentProviderId: { type: String, default: null },
  },
  {
    collection: 'subscriptions',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// One subscription per account (at MVP; will support upgrade history later)
SubscriptionSchema.index({ accountId: 1 }, { unique: true });

export const SubscriptionModel = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);
