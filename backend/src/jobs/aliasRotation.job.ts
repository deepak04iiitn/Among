/**
 * aliasRotation.job.ts — Daily alias rotation via Agenda.
 *
 * Runs once per day. Queries users whose `currentAlias.expiresAt` has passed
 * and `hasCompletedOnboarding = true`. Rotates their alias unless they have
 * an active conversation (alias must persist for conversation lifetime).
 *
 * PRD §6.1: Block and enforcement are tied to the private account ID.
 * Alias rotation never resets a block or restriction.
 *
 * NOTE: The "active conversation" check will be wired to the Conversation
 * model in Phase 7. For now, a stub returns false (no active conversations).
 */
import { UserModel } from '../modules/users/user.model';
import { generateAlias } from '../utils/aliasGenerator';
import { ALIAS_ROTATION_CYCLE_MS } from '../constants/timeouts';
import { logger } from '../utils/logger';

export const JOB_NAME_ALIAS_ROTATION = 'aliasRotation:daily';

/**
 * Stub: check whether a user currently has an active conversation.
 * Replaced with a real Conversation model query in Phase 7.
 */
async function hasActiveConversation(_accountId: string): Promise<boolean> {
  return false;
}

/**
 * Execute one rotation pass.
 * Returns the number of aliases rotated for observability.
 */
export async function runAliasRotation(): Promise<{ rotated: number; skipped: number }> {
  const now     = new Date();
  let rotated   = 0;
  let skipped   = 0;

  // Find all users with expired aliases who have completed onboarding
  const usersToRotate = await UserModel.find({
    hasCompletedOnboarding: true,
    deletedAt:              null,
    'currentAlias.expiresAt': { $lte: now },
  }).select('_id currentAlias').lean();

  logger.info(`Alias rotation: found ${usersToRotate.length} candidates`);

  for (const candidate of usersToRotate) {
    const accountId = String(candidate._id);

    // Skip users with an active conversation — alias persists for the session
    const activeConv = await hasActiveConversation(accountId);
    if (activeConv) {
      skipped++;
      continue;
    }

    const { name, avatarSeed } = generateAlias();
    const expiresAt = new Date(Date.now() + ALIAS_ROTATION_CYCLE_MS);

    await UserModel.updateOne(
      { _id: candidate._id },
      {
        $set: {
          currentAlias: { name, avatarSeed, issuedAt: now, expiresAt },
        },
        $inc: { aliasRotationCount: 1 },
      }
    );

    rotated++;
  }

  logger.info(`Alias rotation complete: rotated=${rotated} skipped=${skipped}`);
  return { rotated, skipped };
}

/**
 * Minimal Agenda interface — avoids adding the `agenda` package as a hard
 * dependency in Phase 3. The full Agenda integration is wired in Phase 15.
 */
interface AgendaLike {
  define(name: string, handler: () => Promise<void>): void;
  every(interval: string, name: string): Promise<unknown>;
}

/**
 * Register the alias rotation job with an Agenda instance.
 * Called from server.ts during startup.
 */
export function registerAliasRotationJob(agenda: AgendaLike): void {
  agenda.define(JOB_NAME_ALIAS_ROTATION, async () => {
    await runAliasRotation();
  });
}

/**
 * Schedule the daily alias rotation cron.
 * Should be called once after Agenda is connected.
 */
export async function scheduleAliasRotationCron(agenda: AgendaLike): Promise<void> {
  await agenda.every('24 hours', JOB_NAME_ALIAS_ROTATION);
  logger.info(`Scheduled '${JOB_NAME_ALIAS_ROTATION}' every 24 hours`);
}
