/**
 * notification.service.ts — In-app notification creation and retrieval.
 *
 * Privacy rules (PRD §6.3):
 *  - `genericText` is safe for lock-screen — never contains message content, alias, or PII.
 *  - Email is opt-in, async, fire-and-forget.
 *  - Email body is always generic — never contains message content or PII.
 *  - `recipientAccountId` never included in public API responses.
 *
 * Analytics: notifications never block user-facing requests.
 */
import { Types } from 'mongoose';
import { NotificationModel, type INotification } from './notification.model';
import { UserModel } from '../users/user.model';
import { sendEmail } from '../../services/emailProvider.service';
import {
  NOTIFICATION_GENERIC_TEXT,
  type NotificationType,
  type NotificationReferenceType,
} from '../../constants/notificationTypes';
import { NOTIFICATION_PAGE_SIZE } from '../../constants/limits';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicNotification {
  id:            string;
  type:          NotificationType;
  referenceId:   string;
  referenceType: NotificationReferenceType;
  isRead:        boolean;
  genericText:   string;
  createdAt:     string;
  // NOTE: recipientAccountId is NEVER included here
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPublic(n: INotification): PublicNotification {
  return {
    id:            String(n._id),
    type:          n.type,
    referenceId:   String(n.referenceId),
    referenceType: n.referenceType,
    isRead:        n.isRead,
    genericText:   n.genericText,
    createdAt:     n.createdAt.toISOString(),
    // recipientAccountId intentionally excluded
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a notification for a user.
 * Fires email (async, non-blocking) if the user opted in.
 * Safe to call without await — never throws.
 */
export async function createNotification(
  recipientAccountId: string,
  type:               NotificationType,
  referenceId:        string,
  referenceType:      NotificationReferenceType
): Promise<PublicNotification | null> {
  try {
    const genericText = NOTIFICATION_GENERIC_TEXT[type];

    const notification = await NotificationModel.create({
      recipientAccountId: new Types.ObjectId(recipientAccountId),
      type,
      referenceId:   new Types.ObjectId(referenceId),
      referenceType,
      genericText,
    });

    // Fire-and-forget email (never blocks the caller)
    void dispatchEmailIfOptedIn(recipientAccountId, genericText, notification._id as Types.ObjectId);

    return toPublic(notification);
  } catch {
    // Never throws — safety net for notification creation
    return null;
  }
}

/**
 * Get all unread notifications for a user (newest first).
 */
export async function getUnreadNotifications(
  accountId: string,
  cursor?:   string
): Promise<{ notifications: PublicNotification[]; cursor: string | null }> {
  const filter: Record<string, unknown> = {
    recipientAccountId: new Types.ObjectId(accountId),
    isRead:             false,
  };

  if (cursor) {
    filter['_id'] = { $lt: new Types.ObjectId(cursor) };
  }

  const notifications = await NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(NOTIFICATION_PAGE_SIZE)
    .lean();

  const nextCursor = notifications.length === NOTIFICATION_PAGE_SIZE
    ? String(notifications[notifications.length - 1]!._id)
    : null;

  return {
    notifications: notifications.map((n) => toPublic(n as unknown as INotification)),
    cursor:        nextCursor,
  };
}

/**
 * Mark a single notification as read (must belong to the requesting user).
 */
export async function markAsRead(
  accountId:      string,
  notificationId: string
): Promise<void> {
  await NotificationModel.updateOne(
    {
      _id:                new Types.ObjectId(notificationId),
      recipientAccountId: new Types.ObjectId(accountId),
    },
    { $set: { isRead: true } }
  );
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(accountId: string): Promise<void> {
  await NotificationModel.updateMany(
    { recipientAccountId: new Types.ObjectId(accountId), isRead: false },
    { $set: { isRead: true } }
  );
}

// ─── Internal email dispatch ──────────────────────────────────────────────────

async function dispatchEmailIfOptedIn(
  accountId:      string,
  genericText:    string,
  notificationId: Types.ObjectId
): Promise<void> {
  try {
    const user = await UserModel.findById(accountId)
      .select('email notificationSettings')
      .lean();

    if (!user) return;

    const emailOptIn = (user as unknown as { notificationSettings?: { emailEnabled?: boolean } })
      .notificationSettings?.emailEnabled ?? false;

    if (!emailOptIn) return;

    const email = (user as unknown as { email: string }).email;
    if (!email) return;

    const result = await sendEmail({
      to:       email,
      subject:  'You have a new notification on AMONG',
      textBody: genericText, // generic only — never message content or PII
    });

    if (result.sent) {
      await NotificationModel.updateOne(
        { _id: notificationId },
        { $set: { emailSent: true } }
      );
    }
  } catch {
    // Never throw — email is best-effort
  }
}
