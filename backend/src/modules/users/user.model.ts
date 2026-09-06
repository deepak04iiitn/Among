/**
 * user.model.ts — Minimal User schema for Phase 1 auth.
 *
 * NOTE: This is a minimal stub. The full User model with alias,
 * experience graph, settings, and notification preferences is
 * completed in Phase 3 (Authentication & Anonymous Identity System).
 */
import { Schema, model, type Document, type Model } from 'mongoose';
import { USER_ROLE, type UserRole } from '../../constants/userRoles';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      // Email is stored for internal use only — never returned in public API responses
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.USER,
      required: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Never return __v, firebaseUid, or email in toJSON output
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete ret['__v'];
        delete ret['firebaseUid'];
        delete ret['email'];
        return ret;
      },
    },
  }
);

// Compound index for fast auth lookups
UserSchema.index({ firebaseUid: 1, isBanned: 1 });

export const UserModel: Model<IUser> = model<IUser>('User', UserSchema);
