/**
 * experienceGraph.service.ts — Private experience graph CRUD.
 *
 * Privacy: all methods operate on a single user's own data.
 * No method returns data about other users.
 * Graph is never surfaced in public API responses.
 */
import { Types } from 'mongoose';
import { ExperienceGraphModel, type IExperienceGraph } from './experienceGraph.model';
import { type PrimaryReactionId, PRIMARY_REACTION_IDS } from '../../constants/reactionTypes';
import type { IPost } from '../posts/post.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExperienceHistoryEntry {
  categoryId:    string;
  hasPostedAbout: boolean;
  /** Number of PAST reactions (proxy for "survived" indicator) */
  pastReactionCount: number;
  conversationCount: number;
  snyOptIn:       boolean;
  lastUpdatedAt:  string;
}

export interface ExperienceExportData {
  accountId:   string;
  experiences: Array<{
    categoryId:              string;
    hasPostedAbout:          boolean;
    primaryReactionHistory:  Array<{ postId: string; reaction: string; reactedAt: string }>;
    conversationsEntered:    Array<{ conversationId: string; enteredAt: string }>;
    snyOptIn:                boolean;
    lastUpdatedAt:           string;
  }>;
  exportedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upsert a single experience entry for a category */
async function ensureEntry(accountId: string, categoryId: string): Promise<void> {
  await ExperienceGraphModel.updateOne(
    { accountId: new Types.ObjectId(accountId) },
    {
      $setOnInsert: { accountId: new Types.ObjectId(accountId) },
      $addToSet:    {
        experiences: {
          categoryId,
          hasPostedAbout:        false,
          primaryReactionHistory: [],
          conversationsEntered:  [],
          snyOptIn:              false,
          lastUpdatedAt:         new Date(),
        },
      },
    },
    { upsert: true }
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Called when a user creates a post — marks `hasPostedAbout` for each category.
 */
export async function recordPostCreated(accountId: string, post: Pick<IPost, 'categoryIds'>): Promise<void> {
  for (const categoryId of post.categoryIds) {
    await ensureEntry(accountId, categoryId);
    await ExperienceGraphModel.updateOne(
      { accountId: new Types.ObjectId(accountId), 'experiences.categoryId': categoryId },
      {
        $set: {
          'experiences.$.hasPostedAbout': true,
          'experiences.$.lastUpdatedAt': new Date(),
        },
      }
    );
  }
}

/**
 * Called when a user sets a primary reaction on a post.
 * Records the reaction in the history and auto-sets snyOptIn=true if reaction is PAST.
 */
export async function recordReaction(
  accountId:     string,
  postId:        string,
  categoryIds:   string[],
  primaryReaction: PrimaryReactionId
): Promise<void> {
  for (const categoryId of categoryIds) {
    await ensureEntry(accountId, categoryId);

    const entry: IExperienceGraph['experiences'][0] = {
      categoryId,
      hasPostedAbout:        false,
      primaryReactionHistory: [],
      conversationsEntered:  [],
      snyOptIn:              false,
      lastUpdatedAt:         new Date(),
    } as IExperienceGraph['experiences'][0];

    const reactionEntry = {
      postId:    new Types.ObjectId(postId),
      reaction:  primaryReaction,
      reactedAt: new Date(),
    };

    // Push reaction to history (keep last 50 per category)
    await ExperienceGraphModel.updateOne(
      { accountId: new Types.ObjectId(accountId), 'experiences.categoryId': categoryId },
      {
        $push: {
          'experiences.$.primaryReactionHistory': {
            $each:  [reactionEntry],
            $slice: -50,
          },
        },
        $set: { 'experiences.$.lastUpdatedAt': new Date() },
      }
    );

    // Auto-enable SNY opt-in if user marked experience as PAST
    if (primaryReaction === PRIMARY_REACTION_IDS.PAST) {
      await ExperienceGraphModel.updateOne(
        { accountId: new Types.ObjectId(accountId), 'experiences.categoryId': categoryId },
        { $set: { 'experiences.$.snyOptIn': true } }
      );
    }
    void entry; // suppress unused
  }
}

/**
 * Called when a user enters a conversation in a given category.
 */
export async function recordConversationEntered(
  accountId:      string,
  conversationId: string,
  categoryId:     string
): Promise<void> {
  await ensureEntry(accountId, categoryId);
  await ExperienceGraphModel.updateOne(
    { accountId: new Types.ObjectId(accountId), 'experiences.categoryId': categoryId },
    {
      $push: {
        'experiences.$.conversationsEntered': {
          $each: [{ conversationId: new Types.ObjectId(conversationId), enteredAt: new Date() }],
          $slice: -20,
        },
      },
      $set: { 'experiences.$.lastUpdatedAt': new Date() },
    }
  );
}

/**
 * Returns categoryIds where user has a PAST reaction and snyOptIn=true.
 * Used by the SNY matching service.
 */
export async function getSurvivedCategories(accountId: string): Promise<string[]> {
  const graph = await ExperienceGraphModel.findOne(
    { accountId: new Types.ObjectId(accountId) }
  ).lean();

  if (!graph) return [];

  return graph.experiences
    .filter((e) => {
      const hasPastReaction = e.primaryReactionHistory.some(
        (r) => r.reaction === PRIMARY_REACTION_IDS.PAST
      );
      return hasPastReaction && e.snyOptIn;
    })
    .map((e) => e.categoryId);
}

/**
 * Returns the user's own private experience history (never for public API).
 */
export async function getExperienceHistory(accountId: string): Promise<ExperienceHistoryEntry[]> {
  const graph = await ExperienceGraphModel.findOne(
    { accountId: new Types.ObjectId(accountId) }
  ).lean();

  if (!graph) return [];

  return graph.experiences.map((e) => ({
    categoryId:        e.categoryId,
    hasPostedAbout:    e.hasPostedAbout,
    pastReactionCount: e.primaryReactionHistory.filter((r) => r.reaction === PRIMARY_REACTION_IDS.PAST).length,
    conversationCount: e.conversationsEntered.length,
    snyOptIn:          e.snyOptIn,
    lastUpdatedAt:     e.lastUpdatedAt.toISOString(),
  }));
}

/**
 * Update SNY opt-in for a specific category.
 */
export async function updateSnyOptIn(
  accountId:  string,
  categoryId: string,
  optIn:      boolean
): Promise<void> {
  await ensureEntry(accountId, categoryId);
  await ExperienceGraphModel.updateOne(
    { accountId: new Types.ObjectId(accountId), 'experiences.categoryId': categoryId },
    { $set: { 'experiences.$.snyOptIn': optIn } }
  );
}

/**
 * Removes all experience graph data for an account (for account deletion).
 */
export async function deleteExperienceGraph(accountId: string): Promise<void> {
  await ExperienceGraphModel.deleteOne({ accountId: new Types.ObjectId(accountId) });
}

/**
 * Returns full machine-readable data export (user's own data only).
 */
export async function exportExperienceData(accountId: string): Promise<ExperienceExportData> {
  const graph = await ExperienceGraphModel.findOne(
    { accountId: new Types.ObjectId(accountId) }
  ).lean();

  return {
    accountId,
    experiences: (graph?.experiences ?? []).map((e) => ({
      categoryId:        e.categoryId,
      hasPostedAbout:    e.hasPostedAbout,
      primaryReactionHistory: e.primaryReactionHistory.map((r) => ({
        postId:    String(r.postId),
        reaction:  r.reaction,
        reactedAt: r.reactedAt.toISOString(),
      })),
      conversationsEntered: e.conversationsEntered.map((c) => ({
        conversationId: String(c.conversationId),
        enteredAt:      c.enteredAt.toISOString(),
      })),
      snyOptIn:      e.snyOptIn,
      lastUpdatedAt: e.lastUpdatedAt.toISOString(),
    })),
    exportedAt: new Date().toISOString(),
  };
}
