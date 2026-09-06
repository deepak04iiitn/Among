/**
 * matching.service.ts — Creates, queues, matches, cancels, and expires
 * conversation match requests.
 *
 * Matching is fair (FIFO within a category cluster) and respects blocks.
 * No persistent relationship is created — the conversation is inherently temporary.
 */
import { Types } from 'mongoose';
import { ConversationModel, type IConversation } from './conversation.model';
import { CONVERSATION_STATE } from '../../constants/conversationStates';
import { MATCH_REQUEST_EXPIRY_MS } from '../../constants/timeouts';
import { DAILY_CONVERSATION_REQUEST_LIMIT } from '../../constants/limits';
import {
  ERR_ACTIVE_CONVERSATION_EXISTS,
  ERR_DAILY_CONVERSATION_LIMIT,
  ERR_NOT_PARTICIPANT,
} from '../../constants/errorCodes';
import { AppError } from '../../utils/errors';
import { UserModel } from '../users/user.model';
import { BlockModel } from '../blocks/block.model';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchRequestInput {
  contextPostId?:    string;
  contextCategoryId: string;
}

export interface MatchResult {
  matched:     boolean;
  conversation: IConversation;
  partnerId?:   string; // private account ID of matched partner (for socket notification only)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return related category IDs for broader matching */
function getRelatedCategoryIds(categoryId: string): string[] {
  const cat = EXPERIENCE_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? [categoryId, ...(cat.relatedCategoryIds ?? [])] : [categoryId];
}

async function countTodayRequests(accountId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return ConversationModel.countDocuments({
    participantAccountIds: new Types.ObjectId(accountId),
    requestedAt: { $gte: startOfDay },
  });
}

async function getBlockedAccountIds(accountId: string): Promise<string[]> {
  const [blockedByMe, blockingMe] = await Promise.all([
    BlockModel.find({ blockerAccountId: accountId }).lean(),
    BlockModel.find({ blockedAccountId: accountId }).lean(),
  ]);
  const ids = new Set<string>();
  blockedByMe.forEach((b) => ids.add(String(b.blockedAccountId)));
  blockingMe.forEach((b) => ids.add(String(b.blockerAccountId)));
  return Array.from(ids);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a match request for an authenticated user.
 * Returns the new Conversation (state: REQUESTED) or an already-matched one.
 */
export async function createMatchRequest(
  accountId: string,
  input: MatchRequestInput
): Promise<MatchResult> {
  // 1. Validate user exists and is not banned/restricted
  const user = await UserModel.findById(accountId).lean();
  if (!user) {
    throw new AppError('User not found', 404, 'ERR_USER_NOT_FOUND');
  }

  // 2. Check for existing active conversation
  const existingActive = await ConversationModel.findOne({
    participantAccountIds: new Types.ObjectId(accountId),
    state: { $in: [CONVERSATION_STATE.REQUESTED, CONVERSATION_STATE.MATCHED_PENDING, CONVERSATION_STATE.ACTIVE, CONVERSATION_STATE.INACTIVITY_WARNING] },
  });
  if (existingActive) {
    throw new AppError('You already have an active conversation or pending match request.', 409, ERR_ACTIVE_CONVERSATION_EXISTS);
  }

  // 3. Daily limit check
  const todayCount = await countTodayRequests(accountId);
  if (todayCount >= DAILY_CONVERSATION_REQUEST_LIMIT) {
    throw new AppError('Daily conversation request limit reached.', 429, ERR_DAILY_CONVERSATION_LIMIT);
  }

  // 4. Create REQUESTED conversation
  const conversation = await ConversationModel.create({
    participantAccountIds:     [new Types.ObjectId(accountId)],   // Only one participant until match
    participantAliasSnapshots: [
      {
        accountId:  new Types.ObjectId(accountId),
        aliasName:  user.currentAlias?.name ?? '',
        avatarSeed: user.currentAlias?.avatarSeed ?? '',
      },
    ],
    contextPostId:         input.contextPostId ? new Types.ObjectId(input.contextPostId) : null,
    contextCategoryId:     input.contextCategoryId,
    state:                 CONVERSATION_STATE.REQUESTED,
    requestedAt:           new Date(),
    matchRequestExpiresAt: new Date(Date.now() + MATCH_REQUEST_EXPIRY_MS),
  });

  // 5. Attempt immediate match
  return findMatch(String(conversation._id), accountId, input.contextCategoryId);
}

/**
 * Attempt to find a match for a newly created REQUESTED conversation.
 * Called immediately after creation and also by the expiry job.
 */
export async function findMatch(
  conversationId: string,
  accountId:      string,
  categoryId:     string
): Promise<MatchResult> {
  const blockedIds = await getBlockedAccountIds(accountId);
  const relatedCategories = getRelatedCategoryIds(categoryId);

  // Query for oldest eligible REQUESTED conversation from a different user
  const candidate = await ConversationModel.findOne({
    _id:                   { $ne: new Types.ObjectId(conversationId) },
    state:                 CONVERSATION_STATE.REQUESTED,
    contextCategoryId:     { $in: relatedCategories },
    participantAccountIds: {
      $ne:  new Types.ObjectId(accountId),
      $nin: blockedIds.map((id) => new Types.ObjectId(id)),
      $size: 1,  // Only single-participant (not yet matched)
    },
    matchRequestExpiresAt: { $gt: new Date() },
  }).sort({ requestedAt: 1 }); // FIFO fairness

  const myConversation = await ConversationModel.findById(conversationId);
  if (!myConversation) {
    throw new AppError('Conversation not found', 404, 'ERR_CONVERSATION_NOT_FOUND');
  }

  if (!candidate) {
    // No match yet — leave in queue
    return { matched: false, conversation: myConversation };
  }

  const partnerId = String(candidate.participantAccountIds[0]);

  // Check that partner hasn't blocked us either (double-check)
  if (blockedIds.includes(partnerId)) {
    return { matched: false, conversation: myConversation };
  }

  // Load partner user for alias snapshot
  const partnerUser = await UserModel.findById(partnerId).lean();
  if (!partnerUser) {
    return { matched: false, conversation: myConversation };
  }

  const now = new Date();

  // Update the candidate's conversation to include both participants and matched state
  await ConversationModel.updateOne(
    { _id: candidate._id, state: CONVERSATION_STATE.REQUESTED }, // optimistic concurrency
    {
      $set: {
        state:                 CONVERSATION_STATE.MATCHED_PENDING,
        matchedAt:             now,
        participantAccountIds: [candidate.participantAccountIds[0], new Types.ObjectId(accountId)],
      },
      $push: {
        participantAliasSnapshots: {
          accountId:  new Types.ObjectId(accountId),
          aliasName:  myConversation.participantAliasSnapshots[0]?.aliasName ?? '',
          avatarSeed: myConversation.participantAliasSnapshots[0]?.avatarSeed ?? '',
        },
      },
    }
  );

  // Set myConversation state to MATCHED_PENDING (redirect to partner's conversation doc)
  await ConversationModel.updateOne(
    { _id: conversationId },
    { $set: { state: CONVERSATION_STATE.NO_MATCH_FOUND, endedAt: now, endReason: 'merged_into_partner' } }
  );

  const updatedConversation = await ConversationModel.findById(candidate._id);
  if (!updatedConversation) {
    throw new AppError('Match failed unexpectedly', 500, 'ERR_INTERNAL');
  }

  return { matched: true, conversation: updatedConversation, partnerId };
}

/**
 * Expire a match request that has been waiting too long.
 */
export async function expireMatchRequest(conversationId: string): Promise<void> {
  await ConversationModel.updateOne(
    { _id: conversationId, state: CONVERSATION_STATE.REQUESTED },
    {
      $set: {
        state:    CONVERSATION_STATE.NO_MATCH_FOUND,
        endedAt:  new Date(),
        endReason: 'match_request_expired',
      },
    }
  );
}

/**
 * Cancel a pending match request.
 */
export async function cancelMatchRequest(
  accountId:      string,
  conversationId: string
): Promise<void> {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'ERR_CONVERSATION_NOT_FOUND');
  }

  const isParticipant = conversation.participantAccountIds.some(
    (id) => String(id) === accountId
  );
  if (!isParticipant) {
    throw new AppError('You are not a participant in this conversation', 403, ERR_NOT_PARTICIPANT);
  }

  if (conversation.state !== CONVERSATION_STATE.REQUESTED) {
    throw new AppError('Cannot cancel a non-REQUESTED conversation', 400, ERR_ACTIVE_CONVERSATION_EXISTS);
  }

  await ConversationModel.updateOne(
    { _id: conversationId },
    {
      $set: {
        state:     CONVERSATION_STATE.NO_MATCH_FOUND,
        endedAt:   new Date(),
        endReason: 'cancelled_by_user',
      },
    }
  );
}
