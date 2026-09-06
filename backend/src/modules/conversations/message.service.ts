/**
 * message.service.ts — Send, retrieve, and perform contact-info detection on messages.
 *
 * PRD constraints:
 *  - Contact info detection is a SOFT WARNING — message is still sent.
 *  - Warning shown ONCE per conversation per category of detected content.
 *  - Sender accountId is NEVER returned in message API responses.
 *  - No read receipts.
 */
import { Types } from 'mongoose';
import { ConversationModel } from './conversation.model';
import { MessageModel, type IMessage } from './message.model';
import { CONVERSATION_STATE } from '../../constants/conversationStates';
import {
  ERR_CONVERSATION_NOT_FOUND,
  ERR_CONVERSATION_NOT_ACTIVE,
  ERR_NOT_PARTICIPANT,
} from '../../constants/errorCodes';
import { AppError } from '../../utils/errors';
import { MESSAGE_MAX_CHARS } from '../../constants/limits';
import {
  CONTACT_INFO_PATTERNS,
  type ContactInfoPatternKey,
} from '../../constants/contentPatterns';
import { CONVERSATION_MAX_DURATION_MS } from '../../constants/timeouts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicMessage {
  id:                  string;
  senderAliasSnapshot: string;   // aliasName only
  senderAvatarSeed:    string;
  body:                string;
  contactInfoWarning:  boolean;
  sentAt:              string;   // ISO
  isDeleted:           boolean;
}

export interface ContactInfoResult {
  detected: boolean;
  categories: ContactInfoPatternKey[];
}

export interface SendMessageResult {
  message:            PublicMessage;
  contactInfoWarning: boolean;
  warningCategories:  ContactInfoPatternKey[];
  /** true = warning is new for this category this conversation */
  isNewWarning:       boolean;
  /** conversation state after send (may have transitioned from MATCHED_PENDING → ACTIVE) */
  newConversationState: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function detectContactInfo(body: string): ContactInfoResult {
  const categories: ContactInfoPatternKey[] = [];
  for (const [key, pattern] of Object.entries(CONTACT_INFO_PATTERNS)) {
    if (pattern.test(body)) {
      categories.push(key as ContactInfoPatternKey);
    }
  }
  return { detected: categories.length > 0, categories };
}

function toPublicMessage(msg: IMessage): PublicMessage {
  return {
    id:                  String(msg._id),
    senderAliasSnapshot: msg.senderAliasSnapshot,
    senderAvatarSeed:    msg.senderAvatarSeed,
    body:                msg.deletedAt ? '[Message removed]' : msg.body,
    contactInfoWarning:  msg.contactInfoWarning,
    sentAt:              msg.sentAt.toISOString(),
    isDeleted:           msg.deletedAt !== null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendMessage(
  accountId:      string,
  conversationId: string,
  body:           string
): Promise<SendMessageResult> {
  if (!body || body.trim().length === 0) {
    throw new AppError('Message body cannot be empty', 400, 'ERR_INVALID_INPUT');
  }
  if (body.length > MESSAGE_MAX_CHARS) {
    throw new AppError(`Message exceeds ${MESSAGE_MAX_CHARS} characters`, 400, 'ERR_INVALID_INPUT');
  }

  const conv = await ConversationModel.findById(conversationId);
  if (!conv) {
    throw new AppError('Conversation not found', 404, ERR_CONVERSATION_NOT_FOUND);
  }

  const isParticipant = conv.participantAccountIds.some(
    (id) => String(id) === accountId
  );
  if (!isParticipant) {
    throw new AppError('You are not a participant in this conversation', 403, ERR_NOT_PARTICIPANT);
  }

  // Allow sending when MATCHED_PENDING (first message activates) or ACTIVE / INACTIVITY_WARNING
  const sendableStates: ReadonlySet<string> = new Set([
    CONVERSATION_STATE.MATCHED_PENDING,
    CONVERSATION_STATE.ACTIVE,
    CONVERSATION_STATE.INACTIVITY_WARNING,
  ]);
  if (!sendableStates.has(conv.state)) {
    throw new AppError('Conversation is not in a sendable state', 409, ERR_CONVERSATION_NOT_ACTIVE);
  }

  // ── Contact info detection ────────────────────────────────────────────────
  const detection = detectContactInfo(body);
  let isNewWarning = false;

  if (detection.detected) {
    // Check which categories have already been warned this conversation
    const previousWarnings = await MessageModel.find(
      { conversationId: new Types.ObjectId(conversationId), contactInfoWarning: true },
      { body: 1 }
    ).lean();

    const alreadyWarnedCategories = new Set<string>();
    for (const prevMsg of previousWarnings) {
      const prev = detectContactInfo(prevMsg.body);
      prev.categories.forEach((c) => alreadyWarnedCategories.add(c));
    }

    const newCategories = detection.categories.filter((c) => !alreadyWarnedCategories.has(c));
    isNewWarning = newCategories.length > 0;
  }

  // ── Get sender's alias for snapshot ───────────────────────────────────────
  const senderSnapshot = conv.participantAliasSnapshots.find(
    (s) => String(s.accountId) === accountId
  );

  // ── First message: transition MATCHED_PENDING → ACTIVE ────────────────────
  const now = new Date();
  let newConversationState = conv.state;

  if (conv.state === CONVERSATION_STATE.MATCHED_PENDING) {
    const expiresAt = new Date(now.getTime() + CONVERSATION_MAX_DURATION_MS);
    await ConversationModel.updateOne(
      { _id: conversationId },
      {
        $set: {
          state:             CONVERSATION_STATE.ACTIVE,
          startedAt:         now,
          lastActivityAt:    now,
          expiresAt,
          inactivityWarningAt: null,
        },
      }
    );
    newConversationState = CONVERSATION_STATE.ACTIVE;
  } else {
    // Clear inactivity warning if it was set
    await ConversationModel.updateOne(
      { _id: conversationId },
      { $set: { lastActivityAt: now, inactivityWarningAt: null } }
    );
  }

  // ── Persist message ───────────────────────────────────────────────────────
  const message = await MessageModel.create({
    conversationId:      new Types.ObjectId(conversationId),
    senderAccountId:     new Types.ObjectId(accountId),
    senderAliasSnapshot: senderSnapshot?.aliasName ?? 'Unknown',
    senderAvatarSeed:    senderSnapshot?.avatarSeed ?? '',
    body,
    contactInfoWarning: detection.detected,
    sentAt:             now,
  });

  return {
    message:              toPublicMessage(message),
    contactInfoWarning:   detection.detected,
    warningCategories:    detection.categories,
    isNewWarning,
    newConversationState,
  };
}

export async function getMessages(
  accountId:      string,
  conversationId: string,
  opts:           { cursor?: string; limit?: number } = {}
): Promise<{ messages: PublicMessage[]; nextCursor: string | null }> {
  const limit = Math.min(opts.limit ?? 50, 100);

  const conv = await ConversationModel.findById(conversationId, { participantAccountIds: 1 }).lean();
  if (!conv) {
    throw new AppError('Conversation not found', 404, ERR_CONVERSATION_NOT_FOUND);
  }

  const isParticipant = conv.participantAccountIds.some(
    (id) => String(id) === accountId
  );
  if (!isParticipant) {
    throw new AppError('You are not a participant in this conversation', 403, ERR_NOT_PARTICIPANT);
  }

  const query: Record<string, unknown> = {
    conversationId: new Types.ObjectId(conversationId),
  };
  if (opts.cursor) {
    query['sentAt'] = { $lt: new Date(opts.cursor) };
  }

  const messages = await MessageModel.find(query)
    .sort({ sentAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const page    = hasMore ? messages.slice(0, limit) : messages;

  // Reverse to chronological order for the client
  page.reverse();

  const nextCursor = hasMore ? page[0]?.sentAt.toISOString() ?? null : null;

  return {
    messages:   page.map((m) => toPublicMessage(m as unknown as IMessage)),
    nextCursor,
  };
}
