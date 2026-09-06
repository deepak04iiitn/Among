/**
 * report.model.ts — Report document schema.
 *
 * Privacy invariants:
 *  - `reporterAccountId` is NEVER returned in any moderation queue response.
 *  - Report outcome is never communicated back to reporter.
 *  - Always returns { success: true } on submission regardless of outcome.
 */
import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { type ReportReason } from '../../constants/reportReasons';

// ─── Action log entry ─────────────────────────────────────────────────────────

export interface IActionLogEntry {
  actorId:   Types.ObjectId;
  action:    string;
  timestamp: Date;
  notes:     string;
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IReport extends Document {
  _id:                  Types.ObjectId;
  /** NEVER exposed to moderator — hidden for reporter safety */
  reporterAccountId:    Types.ObjectId;
  reportedContentType:  'post' | 'message' | 'response';
  reportedContentId:    Types.ObjectId;
  reportedAccountId:    Types.ObjectId;
  reason:               ReportReason;
  additionalDetails:    string;
  status:               'open' | 'actioned' | 'dismissed';
  severity:             'critical' | 'high' | 'medium' | 'low';
  isCrisisFlagged:      boolean;
  moderatorId:          Types.ObjectId | null;
  actionTaken:          string | null;
  actionLog:            IActionLogEntry[];
  createdAt:            Date;
  resolvedAt:           Date | null;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const ActionLogEntrySchema = new Schema<IActionLogEntry>(
  {
    actorId:   { type: Schema.Types.ObjectId, required: true },
    action:    { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
    notes:     { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const ReportSchema = new Schema<IReport>(
  {
    reporterAccountId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedContentType: {
      type: String,
      enum: ['post', 'message', 'response'],
      required: true,
    },
    reportedContentId:   { type: Schema.Types.ObjectId, required: true },
    reportedAccountId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason:              { type: String, required: true },
    additionalDetails:   { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['open', 'actioned', 'dismissed'],
      default: 'open',
    },
    severity: {
      type:    String,
      enum:    ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    isCrisisFlagged: { type: Boolean, default: false },
    moderatorId:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actionTaken:     { type: String, default: null },
    actionLog:       { type: [ActionLogEntrySchema], default: [] },
    resolvedAt:      { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Moderator queue: open first, crisis at top, then by creation time
ReportSchema.index({ status: 1, isCrisisFlagged: -1, createdAt: 1 });
// Quick lookup by reported content
ReportSchema.index({ reportedContentId: 1, reportedContentType: 1 });
// Quick lookup by reported account (for enforcement history)
ReportSchema.index({ reportedAccountId: 1, status: 1 });

export const ReportModel: Model<IReport> = model<IReport>('Report', ReportSchema);
