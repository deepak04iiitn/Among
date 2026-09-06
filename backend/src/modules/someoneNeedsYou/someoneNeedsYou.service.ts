/**
 * someoneNeedsYou.service.ts — "Someone Needs You" daily prompt matching.
 *
 * Matches users who have PAST experience in a category with users who are
 * currently posting about that category. Privacy-safe: no identities cross
 * between matched parties until they accept and enter a conversation.
 *
 * PRD §13 constraints:
 *  - Max 1 prompt per day (MAX_SNY_PROMPTS_PER_DAY).
 *  - Max 3 skips per day (DAILY_SNY_SKIP_LIMIT).
 *  - Must not show user their own post.
 *  - Must respect blocks.
 *  - Feature-flagged — off by default.
 */
import { Types } from 'mongoose';
import * as experienceGraphService from '../experienceGraph/experienceGraph.service';
import { PostModel } from '../posts/post.model';
import { BlockModel } from '../blocks/block.model';
import { POST_STATUS, POST_EXPERIENCE_STATE } from '../../constants/postStates';
import {
  MAX_SNY_PROMPTS_PER_DAY,
  DAILY_SNY_SKIP_LIMIT,
} from '../../constants/limits';
import { AppError } from '../../utils/errors';

// ─── Simple in-memory daily counter (per process — sufficient for single node) ──
// In production these would be stored in the DB on the User document.

const promptsSentToday  = new Map<string, number>();  // accountId → count
const skipCountToday    = new Map<string, number>();  // accountId → skip count
const dismissedToday    = new Set<string>();           // accountId
const lastPromptDate    = new Map<string, string>();   // accountId → YYYY-MM-DD

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function resetDailyCountersIfNeeded(accountId: string): void {
  const today = todayKey();
  if (lastPromptDate.get(accountId) !== today) {
    lastPromptDate.set(accountId, today);
    promptsSentToday.delete(accountId);
    skipCountToday.delete(accountId);
    dismissedToday.delete(accountId);
  }
}

async function getBlockedAccountIds(accountId: string): Promise<Set<string>> {
  const [blockedByMe, blockingMe] = await Promise.all([
    BlockModel.find({ blockerAccountId: accountId }).lean(),
    BlockModel.find({ blockedAccountId: accountId }).lean(),
  ]);
  const ids = new Set<string>();
  blockedByMe.forEach((b) => ids.add(String(b.blockedAccountId)));
  blockingMe.forEach((b) => ids.add(String(b.blockerAccountId)));
  return ids;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SNYPromptResult {
  postId:        string;
  categoryId:    string;
  bodyPreview:   string;
  skipsUsed:     number;
  skipsRemaining: number;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get today's SNY prompt for a user.
 * Returns null if no eligible prompt found or daily limit already reached.
 */
export async function getDailyPromptForUser(
  accountId:     string,
  excludePostIds: string[] = []
): Promise<SNYPromptResult | null> {
  resetDailyCountersIfNeeded(accountId);

  // Already dismissed today
  if (dismissedToday.has(accountId)) return null;

  // Daily prompt limit
  const promptsSent = promptsSentToday.get(accountId) ?? 0;
  if (promptsSent >= MAX_SNY_PROMPTS_PER_DAY) return null;

  // Get categories user can help with (has PAST reaction, opted in)
  const survivedCategories = await experienceGraphService.getSurvivedCategories(accountId);
  if (survivedCategories.length === 0) return null;

  const blockedIds = await getBlockedAccountIds(accountId);

  // Look for a recent CURRENT post in any survived category
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  for (const categoryId of survivedCategories) {
    const excludeObjectIds = excludePostIds.map((id) => new Types.ObjectId(id));

    const post = await PostModel.findOne({
      status:          POST_STATUS.PUBLISHED,
      experienceState: POST_EXPERIENCE_STATE.CURRENT,
      categoryIds:     categoryId,
      accountId:       { $ne: new Types.ObjectId(accountId), $nin: Array.from(blockedIds).map((id) => new Types.ObjectId(id)) },
      publishedAt:     { $gte: fortyEightHoursAgo },
      ...(excludeObjectIds.length > 0 && { _id: { $nin: excludeObjectIds } }),
    })
      .sort({ publishedAt: -1 })
      .lean();

    if (post) {
      const skipsUsed = skipCountToday.get(accountId) ?? 0;
      return {
        postId:        String(post._id),
        categoryId,
        bodyPreview:   post.body.slice(0, 280),
        skipsUsed,
        skipsRemaining: Math.max(0, DAILY_SNY_SKIP_LIMIT - skipsUsed),
      };
    }
  }

  return null;
}

/**
 * Skip the current prompt and get the next one.
 * Returns null if skip limit reached.
 */
export async function skipPrompt(
  accountId: string,
  skippedPostId: string
): Promise<SNYPromptResult | null> {
  resetDailyCountersIfNeeded(accountId);

  const currentSkips = skipCountToday.get(accountId) ?? 0;
  if (currentSkips >= DAILY_SNY_SKIP_LIMIT) {
    dismissedToday.add(accountId);
    return null;
  }

  skipCountToday.set(accountId, currentSkips + 1);

  // Get a new prompt excluding the skipped post
  const graph = await PostModel.findById(skippedPostId, { _id: 1 }).lean();
  const excludeIds = graph ? [skippedPostId] : [];

  return getDailyPromptForUser(accountId, excludeIds);
}

/**
 * Accept the prompt — this triggers a conversation match request.
 * Returns the relevant contextCategoryId and contextPostId for the match.
 */
export async function acceptPrompt(
  accountId:    string,
  promptPostId: string
): Promise<{ contextCategoryId: string; contextPostId: string }> {
  resetDailyCountersIfNeeded(accountId);

  const post = await PostModel.findById(promptPostId, { categoryIds: 1 }).lean();
  if (!post) {
    throw new AppError('Prompt post not found', 404, 'ERR_NOT_FOUND');
  }

  const categoryId = post.categoryIds[0];
  if (!categoryId) {
    throw new AppError('Prompt post has no category', 400, 'ERR_INVALID_INPUT');
  }

  // Mark as sent today
  const current = promptsSentToday.get(accountId) ?? 0;
  promptsSentToday.set(accountId, current + 1);

  return {
    contextCategoryId: categoryId,
    contextPostId:     promptPostId,
  };
}

/**
 * Dismiss the SNY prompt for today without acting on it.
 */
export function dismissPromptForToday(accountId: string): void {
  resetDailyCountersIfNeeded(accountId);
  dismissedToday.add(accountId);
}

/**
 * Get daily prompt status summary for a user (for settings/UI).
 */
export function getPromptStatus(accountId: string): {
  dismissed:   boolean;
  promptsSent: number;
  skipsUsed:   number;
} {
  resetDailyCountersIfNeeded(accountId);
  return {
    dismissed:   dismissedToday.has(accountId),
    promptsSent: promptsSentToday.get(accountId) ?? 0,
    skipsUsed:   skipCountToday.get(accountId) ?? 0,
  };
}
