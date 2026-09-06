/**
 * enforcement.service.ts — Progressive enforcement actions.
 *
 * Escalation ladder (least → most severe):
 *   warning → cooldown → temporary restriction → permanent ban
 *
 * Rules:
 *  - `applyPermanentBan` is admin-only (enforced at route level).
 *  - All actions append to `enforcementStatus.actionLog` (audit trail).
 *  - Banned user's auth middleware already returns 403 (via isBanned check).
 *  - Cooldown: posting and messaging blocked; browsing allowed.
 *  - `forceAliasRotation` changes the user's alias immediately.
 */
import { Types } from 'mongoose';
import { UserModel } from '../users/user.model';
import { AppError } from '../../utils/errors';
import { generateAlias } from '../../utils/aliasGenerator';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnforcementHistoryEntry {
  action:    string;
  appliedAt: string;
  actorId:   string;
  reportId:  string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUser(accountId: string) {
  const user = await UserModel.findById(accountId);
  if (!user) throw new AppError('User not found', 404, 'ERR_NOT_FOUND');
  return user;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function applyWarning(
  targetAccountId: string,
  actorId:         string,
  reportId:        string
): Promise<void> {
  const user = await getUser(targetAccountId);
  user.enforcementStatus.warningCount += 1;
  await user.save();

  await appendToAuditLog(targetAccountId, {
    actorId,
    action:    'WARN_USER',
    reportId,
    timestamp: new Date(),
    notes:     `Warning ${user.enforcementStatus.warningCount} issued.`,
  });
}

/**
 * Cooldown: pauses posting and messaging. Browsing still allowed.
 * Default duration: 24 hours.
 */
export async function applyCooldown(
  targetAccountId: string,
  actorId:         string,
  reportId:        string,
  durationHours:   number = 24
): Promise<void> {
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  await UserModel.updateOne(
    { _id: new Types.ObjectId(targetAccountId) },
    {
      $set: {
        'enforcementStatus.restrictionType':      'cooldown',
        'enforcementStatus.restrictionExpiresAt': expiresAt,
      },
    }
  );

  await appendToAuditLog(targetAccountId, {
    actorId,
    action:    'COOLDOWN_USER',
    reportId,
    timestamp: new Date(),
    notes:     `Cooldown applied for ${durationHours}h, expires ${expiresAt.toISOString()}.`,
  });
}

/**
 * Temporary restriction: posting and messaging blocked for durationDays.
 */
export async function applyTemporaryRestriction(
  targetAccountId: string,
  actorId:         string,
  reportId:        string,
  durationDays:    number = 7
): Promise<void> {
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await UserModel.updateOne(
    { _id: new Types.ObjectId(targetAccountId) },
    {
      $set: {
        'enforcementStatus.restrictionType':      'temporary_restriction',
        'enforcementStatus.restrictionExpiresAt': expiresAt,
      },
    }
  );

  await appendToAuditLog(targetAccountId, {
    actorId,
    action:    'RESTRICT_USER',
    reportId,
    timestamp: new Date(),
    notes:     `Temporary restriction for ${durationDays} days, expires ${expiresAt.toISOString()}.`,
  });
}

/**
 * Permanent ban — ADMIN ONLY (enforced at route level).
 */
export async function applyPermanentBan(
  targetAccountId: string,
  actorId:         string,
  reportId:        string
): Promise<void> {
  await UserModel.updateOne(
    { _id: new Types.ObjectId(targetAccountId) },
    {
      $set: {
        'enforcementStatus.isBanned':  true,
        'enforcementStatus.bannedAt':  new Date(),
      },
    }
  );

  await appendToAuditLog(targetAccountId, {
    actorId,
    action:    'PERMANENT_BAN',
    reportId,
    timestamp: new Date(),
    notes:     'Account permanently banned.',
  });
}

/**
 * Lift a restriction (cooldown or temporary restriction).
 */
export async function liftRestriction(
  targetAccountId: string,
  actorId:         string
): Promise<void> {
  await UserModel.updateOne(
    { _id: new Types.ObjectId(targetAccountId) },
    {
      $set: {
        'enforcementStatus.restrictionType':      null,
        'enforcementStatus.restrictionExpiresAt': null,
      },
    }
  );

  await appendToAuditLog(targetAccountId, {
    actorId,
    action:    'LIFT_RESTRICTION',
    reportId:  'admin-action',
    timestamp: new Date(),
    notes:     'Restriction manually lifted by admin.',
  });
}

/**
 * Force alias rotation — changes the alias immediately.
 */
export async function forceAliasRotation(
  targetAccountId: string,
  actorId:         string
): Promise<void> {
  const generated = generateAlias();

  await UserModel.updateOne(
    { _id: new Types.ObjectId(targetAccountId) },
    {
      $set: {
        currentAlias: {
          name:       generated.name,
          avatarSeed: generated.avatarSeed,
          issuedAt:   new Date(),
          expiresAt:  null,
        },
        aliasRotationCount: 0,
      },
    }
  );

  await appendToAuditLog(targetAccountId, {
    actorId,
    action:    'FORCE_ALIAS_ROTATION',
    reportId:  'admin-action',
    timestamp: new Date(),
    notes:     `Alias forcibly rotated to ${generated.name}.`,
  });
}

/**
 * Check if an account is currently under a cooldown or temporary restriction.
 */
export async function getActiveRestriction(accountId: string): Promise<{
  isRestricted: boolean;
  restrictionType: string | null;
  expiresAt: string | null;
}> {
  const user = await UserModel.findById(accountId)
    .select('enforcementStatus')
    .lean();

  if (!user) return { isRestricted: false, restrictionType: null, expiresAt: null };

  const { restrictionType, restrictionExpiresAt } = user.enforcementStatus ?? {};

  if (!restrictionType) return { isRestricted: false, restrictionType: null, expiresAt: null };

  // Check if the restriction has expired
  if (restrictionExpiresAt && new Date() > restrictionExpiresAt) {
    // Auto-lift expired restriction
    await UserModel.updateOne(
      { _id: new Types.ObjectId(accountId) },
      { $set: { 'enforcementStatus.restrictionType': null, 'enforcementStatus.restrictionExpiresAt': null } }
    );
    return { isRestricted: false, restrictionType: null, expiresAt: null };
  }

  return {
    isRestricted:    true,
    restrictionType: restrictionType ?? null,
    expiresAt:       restrictionExpiresAt?.toISOString() ?? null,
  };
}

// ─── Internal audit log ───────────────────────────────────────────────────────

interface AuditEntry {
  actorId:   string;
  action:    string;
  reportId:  string;
  timestamp: Date;
  notes:     string;
}

/** In-memory audit log (replace with DB collection in Phase 10+) */
const auditLog: Array<{ accountId: string } & AuditEntry> = [];

async function appendToAuditLog(accountId: string, entry: AuditEntry): Promise<void> {
  auditLog.push({ accountId, ...entry });
}

export function getAuditLog(): typeof auditLog {
  return [...auditLog];
}
