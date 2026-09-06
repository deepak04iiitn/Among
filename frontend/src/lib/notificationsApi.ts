/**
 * notificationsApi.ts — HTTP client for in-app notification endpoints.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';
import type { NotificationType, NotificationReferenceType } from '../constants/notificationTypes';
import type { NotificationReferenceType as _Ref } from '../constants/notificationTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiNotification {
  id:            string;
  type:          NotificationType;
  referenceId:   string;
  referenceType: NotificationReferenceType;
  isRead:        boolean;
  genericText:   string;
  createdAt:     string;
  // recipientAccountId intentionally excluded
}

export interface NotificationsPage {
  notifications: ApiNotification[];
  cursor:        string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchUnreadNotifications(cursor?: string): Promise<NotificationsPage> {
  const params = cursor ? { cursor } : {};
  const res    = await apiClient.get<NotificationsPage>(API.NOTIFICATIONS, { params });
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.put(API.NOTIFICATION_READ(id));
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post(API.NOTIFICATIONS_READ_ALL);
}
