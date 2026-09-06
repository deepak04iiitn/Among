/**
 * dailyPrompt.job.ts — Agenda job for "Someone Needs You" daily prompt notifications.
 *
 * Strategy: lazy generation — we do NOT pre-generate prompts for every user.
 * Instead, we scan for eligible users (opted-in + onboarding complete) and create
 * a `SNY_PROMPT_AVAILABLE` notification so the client can fetch the actual prompt
 * on demand. This prevents stale prompts from sitting in a queue.
 *
 * Schedule: once daily at configurable time (default 09:00 UTC).
 */
import type { Agenda } from 'agenda';
import { UserModel } from '../modules/users/user.model';
import * as experienceGraphService from '../modules/experienceGraph/experienceGraph.service';
import * as snyService from '../modules/someoneNeedsYou/someoneNeedsYou.service';
import { ExperienceGraphModel } from '../modules/experienceGraph/experienceGraph.model';
// Notification types — to be expanded in Phase 9
const NOTIFICATION_TYPE = { SNY_PROMPT_AVAILABLE: 'sny_prompt_available' } as const;

const JOB_DAILY_SNY_NOTIFY = 'dailySnyNotify';

/** In-memory notification store — replace with DB notifications collection in Phase 9 */
export const pendingSnyNotifications = new Map<string, Date>();

// ─── Job definitions ──────────────────────────────────────────────────────────

export function defineDailyPromptJob(agenda: Agenda): void {
  agenda.define(JOB_DAILY_SNY_NOTIFY, async () => {
    // Find all users with at least one SNY opt-in category who completed onboarding
    const eligibleGraphs = await ExperienceGraphModel.find(
      { 'experiences.snyOptIn': true }
    )
      .select('accountId')
      .lean();

    if (eligibleGraphs.length === 0) return;

    const accountIds = eligibleGraphs.map((g) => String(g.accountId));

    // Filter to only users who have completed onboarding
    const eligibleUsers = await UserModel.find(
      {
        _id: { $in: accountIds },
        hasCompletedOnboarding: true,
        isBanned: { $ne: true },
      }
    )
      .select('_id')
      .lean();

    for (const user of eligibleUsers) {
      const accountId = String(user._id);

      try {
        const survivedCategories = await experienceGraphService.getSurvivedCategories(accountId);
        if (survivedCategories.length === 0) continue;

        const status = snyService.getPromptStatus(accountId);
        // Only notify if user hasn't already seen/dismissed today's prompt
        if (status.dismissed || status.promptsSent > 0) continue;

        // Create notification (stub — full notification system in Phase 9)
        void NOTIFICATION_TYPE.SNY_PROMPT_AVAILABLE; // referenced for Phase 9
        pendingSnyNotifications.set(accountId, new Date());
      } catch {
        // Skip individual failures to ensure job continues for other users
        continue;
      }
    }
  });
}

export async function scheduleDailyPromptJob(agenda: Agenda): Promise<void> {
  await agenda.every('0 9 * * *', JOB_DAILY_SNY_NOTIFY);
}
