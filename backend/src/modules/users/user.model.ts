/**
 * user.model.ts — Full User schema (Phase 3).
 *
 * Privacy invariants enforced here:
 *  - `firebaseUid` and `email` are stripped from all toJSON output.
 *  - `enforcementStatus` internal fields (notes, mod ID) never exposed.
 *  - `snyOptIns` are private — never in public API responses.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { USER_ROLE, type UserRole } from '../../constants/userRoles';
import { SUBSCRIPTION_TIER, type SubscriptionTier } from '../../constants/subscriptionTiers';

// ─── Sub-document interfaces ─────────────────────────────────────────────────

export interface IAlias {
  name:       string;
  avatarSeed: string;
  issuedAt:   Date;
  expiresAt:  Date | null;
}

export interface IEnforcementStatus {
  isBanned:               boolean;
  bannedAt:               Date | null;
  restrictionType:        string | null;
  restrictionExpiresAt:   Date | null;
  warningCount:           number;
}

// ─── Main document interface ─────────────────────────────────────────────────

export interface IUser extends Document {
  _id:         Types.ObjectId;
  firebaseUid: string;
  email:       string;
  role:        UserRole;
  subscriptionTier: SubscriptionTier;

  // Onboarding
  hasCompletedOnboarding: boolean;
  ageConfirmed:           boolean;
  tosAccepted:            boolean;
  tosAcceptedAt:          Date | null;

  // Experience preferences (3–5 after onboarding)
  categoryInterests: string[];

  // Alias & identity
  currentAlias:              IAlias | null;
  aliasRotationCount:        number;
  lastAliasRotationRequestAt: Date | null;

  // Enforcement (private — never in public API responses)
  enforcementStatus: IEnforcementStatus;

  // Convenience getter (proxies enforcementStatus.isBanned)
  isBanned: boolean;

  // "Someone Needs You" opt-ins per category
  snyOptIns: string[];

  // Saved posts
  savedPostIds: Types.ObjectId[];

  // Soft delete
  deletedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ────────────────────────────────────────────────────

const AliasSchema = new Schema<IAlias>(
  {
    name:       { type: String, required: true },
    avatarSeed: { type: String, required: true },
    issuedAt:   { type: Date,   required: true, default: () => new Date() },
    expiresAt:  { type: Date,   default: null },
  },
  { _id: false }
);

const EnforcementStatusSchema = new Schema<IEnforcementStatus>(
  {
    isBanned:             { type: Boolean, default: false },
    bannedAt:             { type: Date,    default: null },
    restrictionType:      { type: String,  default: null },
    restrictionExpiresAt: { type: Date,    default: null },
    warningCount:         { type: Number,  default: 0 },
  },
  { _id: false }
);

// ─── Main schema ─────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email:       { type: String, required: true },

    role: {
      type:     String,
      enum:     Object.values(USER_ROLE),
      default:  USER_ROLE.USER,
      required: true,
    },
    subscriptionTier: {
      type:    String,
      enum:    Object.values(SUBSCRIPTION_TIER),
      default: SUBSCRIPTION_TIER.FREE,
    },

    // Onboarding
    hasCompletedOnboarding: { type: Boolean, default: false },
    ageConfirmed:           { type: Boolean, default: false },
    tosAccepted:            { type: Boolean, default: false },
    tosAcceptedAt:          { type: Date,    default: null },

    // Experience preferences
    categoryInterests: { type: [String], default: [] },

    // Alias
    currentAlias:               { type: AliasSchema, default: null },
    aliasRotationCount:         { type: Number, default: 0 },
    lastAliasRotationRequestAt: { type: Date,   default: null },

    // Enforcement — private, never in public responses
    enforcementStatus: { type: EnforcementStatusSchema, default: () => ({}) },

    // SNY opt-ins
    snyOptIns: { type: [String], default: [] },

    // Saved posts
    savedPostIds: { type: [Schema.Types.ObjectId], ref: 'Post', default: [] },

    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        // ─── Privacy: strip all internal/private fields ───────────────────
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete ret['__v'];
        delete ret['firebaseUid'];
        delete ret['email'];
        delete ret['enforcementStatus'];
        delete ret['snyOptIns'];
        delete ret['deletedAt'];
        return ret;
      },
    },
  }
);

// ─── Virtual: isBanned (convenience proxy) ───────────────────────────────────
UserSchema.virtual('isBanned').get(function (this: IUser): boolean {
  return this.enforcementStatus?.isBanned ?? false;
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Fast auth lookups
UserSchema.index({ firebaseUid: 1, 'enforcementStatus.isBanned': 1 });
// Alias rotation job — find users with expired aliases
UserSchema.index({ 'currentAlias.expiresAt': 1, hasCompletedOnboarding: 1 });
// Soft-delete filter
UserSchema.index({ deletedAt: 1 });

export const UserModel: Model<IUser> = model<IUser>('User', UserSchema);
