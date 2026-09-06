/**
 * conversation.service.ts — Core conversation CRUD, end, and feedback operations.
 *
 * Privacy invariants:
 *  - participantAccountIds are never returned to clients.
 *  - Only alias snapshots (name + seed) are exposed.
 */
import { Types } from 'mongoose';
import { ConversationModel, type IConversation } from './conversation.model';
import { MessageModel } from './message.model';
import {
  CONVERSATION_STATE,
  ACTIVE_CONVERSATION_STATES,
  ENDED_CONVERSATION_STATES,
  TRANSCRIPT_VISIBLE_STATES,
} from '../../constants/conversationStates';
import {
  ERR_CONVERSATION_NOT_FOUND,
  ERR_CONVERSATION_ENDED,
  ERR_NOT_PARTICIPANT,
} from '../../constants/errorCodes';
import { AppError } from '../../utils/errors';
import { TRANSCRIPT_RETENTION_MS } from '../../constants/timeouts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicConversation {
  id:                    string;
  contextCategoryId:     string;
  contextPostId:         string | null;
  state:                 string;
  myAliasSnapshot:       { aliasName: string; avatarSeed: string };
  otherAliasSnapshot:    { aliasName: string; avatarSeed: string } | null;
  requestedAt:           string;
  matchedAt:             string | null;
  startedAt:             string | null;
  expiresAt:             string | null;
  endedAt:               string | null;
  endReason:             string | null;
  feedbackSubmitted:     boolean;
  transcriptVisible:     boolean;
}

export interface ConversationListItem {
  id:                 string;
  contextCategoryId:  string;
  state:              string;
  otherAliasSnapshot: { aliasName: string; avatarSeed: string } | null;
  startedAt:          string | null;
  endedAt:            string | null;
  lastActivityAt:     string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPublicConversation(
  conv: IConversation,
  accountId: string
): PublicConversation {
  const mySnapshot = conv.participantAliasSnapshots.find(
    (s) => String(s.accountId) === accountId
  );
  const otherSnapshot = conv.participantAliasSnapshots.find(
    (s) => String(s.accountId) !== accountId
  );

  // Determine if requester is participant A (first) or B (second)
  const isParticipantA = String(conv.participantAccountIds[0]) === accountId;
  const feedbackSubmitted = isParticipantA
    ? conv.feedbackA !== null
    : conv.feedbackB !== null;

  // Transcript visible only within retention window
  const transcriptVisible =
    TRANSCRIPT_VISIBLE_STATES.has(conv.state) &&
    conv.endedAt !== null &&
    Date.now() - conv.endedAt.getTime() < TRANSCRIPT_RETENTION_MS;

  return {
    id:                    String(conv._id),
    contextCategoryId:     conv.contextCategoryId,
    contextPostId:         conv.contextPostId ? String(conv.contextPostId) : null,
    state:                 conv.state,
    myAliasSnapshot:       { aliasName: mySnapshot?.aliasName ?? '', avatarSeed: mySnapshot?.avatarSeed ?? '' },
    otherAliasSnapshot:    otherSnapshot ? { aliasName: otherSnapshot.aliasName, avatarSeed: otherSnapshot.avatarSeed } : null,
    requestedAt:           conv.requestedAt.toISOString(),
    matchedAt:             conv.matchedAt?.toISOString() ?? null,
    startedAt:             conv.startedAt?.toISOString() ?? null,
    expiresAt:             conv.expiresAt?.toISOString() ?? null,
    endedAt:               conv.endedAt?.toISOString() ?? null,
    endReason:             conv.endReason,
    feedbackSubmitted,
    transcriptVisible,
  };
}

function assertParticipant(conv: IConversation, accountId: string): void {
  const isParticipant = conv.participantAccountIds.some(
    (id) => String(id) === accountId
  );
  if (!isParticipant) {
    throw new AppError('You are not a participant in this conversation', 403, ERR_NOT_PARTICIPANT);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getConversationForUser(
  accountId:      string,
  conversationId: string
): Promise<PublicConversation> {
  const conv = await ConversationModel.findById(conversationId);
  if (!conv) {
    throw new AppError('Conversation not found', 404, ERR_CONVERSATION_NOT_FOUND);
  }
  assertParticipant(conv, accountId);
  return toPublicConversation(conv, accountId);
}

export async function listConversationsForUser(
  accountId: string
): Promise<ConversationListItem[]> {
  const conversations = await ConversationModel.find({
    participantAccountIds: new Types.ObjectId(accountId),
    state: {
      $in: [
        ...Array.from(ACTIVE_CONVERSATION_STATES),
        CONVERSATION_STATE.ENDED_BY_USER,
        CONVERSATION_STATE.ENDED_INACTIVITY,
        CONVERSATION_STATE.ENDED_MAX_DURATION,
        CONVERSATION_STATE.ENDED_MODERATION,
        CONVERSATION_STATE.REQUESTED,
        CONVERSATION_STATE.NO_MATCH_FOUND,
      ],
    },
  })
    .sort({ requestedAt: -1 })
    .limit(20)
    .lean();

  return conversations.map((conv) => {
    const other = conv.participantAliasSnapshots.find(
      (s) => String(s.accountId) !== accountId
    );
    return {
      id:                 String(conv._id),
      contextCategoryId:  conv.contextCategoryId,
      state:              conv.state,
      otherAliasSnapshot: other ? { aliasName: other.aliasName, avatarSeed: other.avatarSeed } : null,
      startedAt:          conv.startedAt?.toISOString() ?? null,
      endedAt:            conv.endedAt?.toISOString() ?? null,
      lastActivityAt:     conv.lastActivityAt?.toISOString() ?? null,
    };
  });
}

export async function endConversation(
  accountId:      string,
  conversationId: string
): Promise<void> {
  const conv = await ConversationModel.findById(conversationId);
  if (!conv) {
    throw new AppError('Conversation not found', 404, ERR_CONVERSATION_NOT_FOUND);
  }
  assertParticipant(conv, accountId);

  if (ENDED_CONVERSATION_STATES.has(conv.state)) {
    throw new AppError('Conversation has already ended', 409, ERR_CONVERSATION_ENDED);
  }

  await ConversationModel.updateOne(
    { _id: conversationId },
    {
      $set: {
        state:     CONVERSATION_STATE.ENDED_BY_USER,
        endedAt:   new Date(),
        endReason: 'ended_by_user',
      },
    }
  );
}

export async function submitFeedback(
  accountId:      string,
  conversationId: string,
  helpful:        boolean
): Promise<void> {
  const conv = await ConversationModel.findById(conversationId);
  if (!conv) {
    throw new AppError('Conversation not found', 404, ERR_CONVERSATION_NOT_FOUND);
  }
  assertParticipant(conv, accountId);

  // Determine which feedback field belongs to this user
  const isParticipantA = String(conv.participantAccountIds[0]) === accountId;
  const feedbackField  = isParticipantA ? 'feedbackA' : 'feedbackB';

  // Cannot change feedback once submitted
  const currentFeedback = isParticipantA ? conv.feedbackA : conv.feedbackB;
  if (currentFeedback !== null) return; // Silently ignore

  await ConversationModel.updateOne(
    { _id: conversationId },
    { $set: { [feedbackField]: helpful } }
  );
}

export async function deleteMessageForModeration(
  messageId: string
): Promise<void> {
  await MessageModel.updateOne(
    { _id: messageId },
    { $set: { deletedAt: new Date() } }
  );
}
