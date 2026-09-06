/**
 * report.service.ts — Content report submission and moderation queue.
 *
 * Privacy invariants (PRD §6.6):
 *  - Reporter identity NEVER exposed to moderators.
 *  - Report outcome NEVER communicated back to reporter.
 *  - Always return { success: true } on submission regardless of outcome.
 *
 * Safety invariant:
 *  - Crisis-flagged reports appear at TOP of queue regardless of sort.
 *  - Crisis notifications fire immediately on crisis-flagged reports.
 */
import { Types } from 'mongoose';
import { ReportModel, type IReport } from './report.model';
import { PostModel } from '../posts/post.model';
import { MessageModel } from '../conversations/message.model';
import {
  REPORT_REASON_MAP,
  CRISIS_REPORT_REASONS,
  type ReportReason,
} from '../../constants/reportReasons';
import { AppError } from '../../utils/errors';
import { MODERATION_QUEUE_PAGE_SIZE } from '../../constants/limits';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmitReportInput {
  contentType:       'post' | 'message' | 'response';
  contentId:         string;
  reason:            ReportReason;
  additionalDetails?: string;
}

export interface QueuedReport {
  _id:                 string;
  reportedContentType: string;
  reportedContentId:   string;
  reportedAccountId:   string;
  reason:              string;
  severity:            string;
  isCrisisFlagged:     boolean;
  additionalDetails:   string;
  createdAt:           string;
  actionLog:           Array<{ action: string; timestamp: string; notes: string }>;
}

export interface ModQueueResult {
  reports: QueuedReport[];
  cursor:  string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveReportedAccount(
  contentType: SubmitReportInput['contentType'],
  contentId:   string
): Promise<Types.ObjectId> {
  if (contentType === 'post' || contentType === 'response') {
    const post = await PostModel.findById(contentId).lean();
    if (!post) throw new AppError('Reported content not found', 404, 'ERR_NOT_FOUND');
    return (post as unknown as { authorAccountId: Types.ObjectId }).authorAccountId;
  }
  // 'message'
  const msg = await MessageModel.findById(contentId).lean();
  if (!msg) throw new AppError('Reported content not found', 404, 'ERR_NOT_FOUND');
  return (msg as unknown as { senderAccountId: Types.ObjectId }).senderAccountId;
}

/** Strip reporter identity from a report document before returning to moderator */
function toQueuedReport(report: IReport): QueuedReport {
  return {
    _id:                 String(report._id),
    reportedContentType: report.reportedContentType,
    reportedContentId:   String(report.reportedContentId),
    reportedAccountId:   String(report.reportedAccountId),
    reason:              report.reason,
    severity:            report.severity,
    isCrisisFlagged:     report.isCrisisFlagged,
    additionalDetails:   report.additionalDetails,
    createdAt:           report.createdAt.toISOString(),
    // actionLog excludes actorId (moderator identity unnecessary in response)
    actionLog: report.actionLog.map((e) => ({
      action:    e.action,
      timestamp: e.timestamp.toISOString(),
      notes:     e.notes,
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Submit a content report.
 * Returns { success: true } regardless of outcome — never reveals result to reporter.
 */
export async function submitReport(
  reporterAccountId: string,
  input: SubmitReportInput
): Promise<{ success: true }> {
  try {
    const reportedAccountId = await resolveReportedAccount(input.contentType, input.contentId);
    const reasonDef = REPORT_REASON_MAP[input.reason];
    const severity  = reasonDef?.defaultSeverity ?? 'medium';
    const isCrisisFlagged = CRISIS_REPORT_REASONS.has(input.reason);

    await ReportModel.create({
      reporterAccountId:   new Types.ObjectId(reporterAccountId),
      reportedContentType: input.contentType,
      reportedContentId:   new Types.ObjectId(input.contentId),
      reportedAccountId,
      reason:              input.reason,
      additionalDetails:   input.additionalDetails ?? '',
      severity,
      isCrisisFlagged,
    });
  } catch {
    // Swallow errors — never communicate failure to reporter (PRD §6.6)
  }
  return { success: true };
}

/**
 * Get the open moderation queue.
 * Crisis-flagged reports always at top.
 * `reporterAccountId` is NEVER included in returned data.
 */
export async function getOpenReportsQueue(
  cursor?: string
): Promise<ModQueueResult> {
  const filter: Record<string, unknown> = { status: 'open' };
  if (cursor) {
    filter['_id'] = { $gt: new Types.ObjectId(cursor) };
  }

  const reports = await ReportModel.find(filter)
    .sort({ isCrisisFlagged: -1, createdAt: 1 })
    .limit(MODERATION_QUEUE_PAGE_SIZE)
    .lean();

  const nextCursor = reports.length === MODERATION_QUEUE_PAGE_SIZE
    ? String(reports[reports.length - 1]!._id)
    : null;

  return {
    reports: reports.map((r) => toQueuedReport(r as unknown as IReport)),
    cursor:  nextCursor,
  };
}

// Allowed actions for moderators vs admins
const MODERATOR_ACTIONS = new Set([
  'DISMISS',
  'REMOVE_CONTENT',
  'WARN_USER',
  'COOLDOWN_USER',
  'RESTRICT_USER',
  'ESCALATE_TO_ADMIN',
]);

const ADMIN_ONLY_ACTIONS = new Set([
  'PERMANENT_BAN',
  'LIFT_RESTRICTION',
  'FORCE_ALIAS_ROTATION',
]);

/**
 * Take a moderation action on a report.
 * Appends to audit log.
 */
export async function actionReport(
  moderatorId:  string,
  reportId:     string,
  action:       string,
  isAdmin:      boolean,
  notes?:       string
): Promise<void> {
  if (ADMIN_ONLY_ACTIONS.has(action) && !isAdmin) {
    throw new AppError('This action requires admin privileges', 403, 'ERR_FORBIDDEN');
  }

  if (!MODERATOR_ACTIONS.has(action) && !ADMIN_ONLY_ACTIONS.has(action)) {
    throw new AppError('Invalid action', 400, 'ERR_INVALID_INPUT');
  }

  const report = await ReportModel.findById(reportId);
  if (!report) {
    throw new AppError('Report not found', 404, 'ERR_NOT_FOUND');
  }

  const isFinalAction = action !== 'ESCALATE_TO_ADMIN';

  report.actionLog.push({
    actorId:   new Types.ObjectId(moderatorId),
    action,
    timestamp: new Date(),
    notes:     notes ?? '',
  });
  report.moderatorId  = new Types.ObjectId(moderatorId);
  report.actionTaken  = action;

  if (isFinalAction) {
    report.status     = 'actioned';
    report.resolvedAt = new Date();
  }

  await report.save();
}
