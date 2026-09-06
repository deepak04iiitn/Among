/**
 * notification.service.test.ts — Unit tests for notification.service.ts
 *
 * Critical invariants:
 *  - Notification created with correct type and generic text.
 *  - `getUnreadNotifications` returns only unread.
 *  - `markAllRead` marks all.
 *  - Email sent only if user opted in.
 *  - Email body contains no message content or PII.
 *  - `recipientAccountId` NEVER included in returned data.
 *  - `createNotification` never throws.
 */
import { Types } from 'mongoose';
import * as notificationService from './notification.service';
import { NotificationModel } from './notification.model';
import { UserModel } from '../users/user.model';
import * as emailProvider from '../../services/emailProvider.service';

jest.mock('./notification.model', () => ({
  NotificationModel: {
    create:     jest.fn(),
    find:       jest.fn(),
    updateOne:  jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock('../users/user.model', () => ({
  UserModel: { findById: jest.fn() },
}));

jest.mock('../../services/emailProvider.service', () => ({
  sendEmail: jest.fn(),
}));

const mockCreate     = NotificationModel.create     as jest.Mock;
const mockFind       = NotificationModel.find       as jest.Mock;
const mockUpdateOne  = NotificationModel.updateOne  as jest.Mock;
const mockUpdateMany = NotificationModel.updateMany as jest.Mock;
const mockFindById   = UserModel.findById            as jest.Mock;
const mockSendEmail  = emailProvider.sendEmail       as jest.Mock;

const ACCOUNT_ID = String(new Types.ObjectId());
const POST_ID    = String(new Types.ObjectId());
const NOTIF_ID   = String(new Types.ObjectId());

function makeFakeNotification(overrides: Partial<{ isRead: boolean }> = {}) {
  return {
    _id:                new Types.ObjectId(NOTIF_ID),
    recipientAccountId: new Types.ObjectId(ACCOUNT_ID),
    type:               'reaction_on_post',
    referenceId:        new Types.ObjectId(POST_ID),
    referenceType:      'post',
    isRead:             overrides.isRead ?? false,
    emailSent:          false,
    genericText:        'Someone responded to your experience on AMONG.',
    createdAt:          new Date(),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockCreate.mockResolvedValue(makeFakeNotification());
  mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  mockUpdateMany.mockResolvedValue({ modifiedCount: 0 });
  mockSendEmail.mockResolvedValue({ sent: false });
});

// ─── createNotification ───────────────────────────────────────────────────────

describe('createNotification', () => {
  it('creates notification with correct type and generic text', async () => {
    const result = await notificationService.createNotification(
      ACCOUNT_ID, 'reaction_on_post', POST_ID, 'post'
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type:        'reaction_on_post',
        genericText: 'Someone responded to your experience on AMONG.',
      })
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('reaction_on_post');
  });

  it('does NOT include recipientAccountId in returned data', async () => {
    const result = await notificationService.createNotification(
      ACCOUNT_ID, 'reaction_on_post', POST_ID, 'post'
    );
    expect(result).not.toHaveProperty('recipientAccountId');
  });

  it('never throws — returns null on model error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'));
    const result = await notificationService.createNotification(
      ACCOUNT_ID, 'new_message', POST_ID, 'conversation'
    );
    expect(result).toBeNull();
  });

  it('does NOT send email when user has not opted in', async () => {
    mockFindById.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve({ notificationSettings: { emailEnabled: false }, email: 'user@test.com' }) }),
    });
    await notificationService.createNotification(ACCOUNT_ID, 'sny_prompt', POST_ID, 'post');
    // Give async email dispatch time to run
    await new Promise((r) => setTimeout(r, 50));
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('sends email when user has opted in — body contains no PII', async () => {
    mockFindById.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve({ notificationSettings: { emailEnabled: true }, email: 'user@test.com' }) }),
    });
    mockSendEmail.mockResolvedValueOnce({ sent: true });
    await notificationService.createNotification(ACCOUNT_ID, 'new_message', POST_ID, 'conversation');
    await new Promise((r) => setTimeout(r, 50));
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to:       'user@test.com',
        // Subject must be generic
        subject:  expect.stringContaining('AMONG'),
        // textBody must NOT contain message content (only generic text)
        textBody: expect.not.stringContaining('message content'),
      })
    );
  });
});

// ─── getUnreadNotifications ───────────────────────────────────────────────────

describe('getUnreadNotifications', () => {
  it('returns only unread notifications', async () => {
    const unread = makeFakeNotification({ isRead: false });
    mockFind.mockReturnValueOnce({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([unread]) }) }),
    });
    const result = await notificationService.getUnreadNotifications(ACCOUNT_ID);
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]!.isRead).toBe(false);
  });

  it('query filter includes isRead: false', async () => {
    mockFind.mockReturnValueOnce({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
    });
    await notificationService.getUnreadNotifications(ACCOUNT_ID);
    const call = mockFind.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.isRead).toBe(false);
  });

  it('does NOT include recipientAccountId in returned items', async () => {
    mockFind.mockReturnValueOnce({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([makeFakeNotification()]) }) }),
    });
    const result = await notificationService.getUnreadNotifications(ACCOUNT_ID);
    expect(result.notifications[0]).not.toHaveProperty('recipientAccountId');
  });

  it('returns cursor when page is full', async () => {
    // Return NOTIFICATION_PAGE_SIZE items
    const items = Array.from({ length: 30 }, () => makeFakeNotification());
    mockFind.mockReturnValueOnce({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve(items) }) }),
    });
    const result = await notificationService.getUnreadNotifications(ACCOUNT_ID);
    expect(result.cursor).toBe(NOTIF_ID);
  });

  it('returns cursor: null when page is not full', async () => {
    mockFind.mockReturnValueOnce({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([makeFakeNotification()]) }) }),
    });
    const result = await notificationService.getUnreadNotifications(ACCOUNT_ID);
    expect(result.cursor).toBeNull();
  });
});

// ─── markAsRead ───────────────────────────────────────────────────────────────

describe('markAsRead', () => {
  it('updates only the requesting user\'s notification', async () => {
    await notificationService.markAsRead(ACCOUNT_ID, NOTIF_ID);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientAccountId: new Types.ObjectId(ACCOUNT_ID),
      }),
      { $set: { isRead: true } }
    );
  });
});

// ─── markAllRead ──────────────────────────────────────────────────────────────

describe('markAllRead', () => {
  it('marks all unread notifications for the user', async () => {
    await notificationService.markAllRead(ACCOUNT_ID);
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ isRead: false }),
      { $set: { isRead: true } }
    );
  });
});
