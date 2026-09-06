// Backend-only — report reason definitions and severity classification.

export const REPORT_REASON = {
  HARASSMENT: 'harassment',
  SELF_HARM_RISK: 'self_harm_risk',
  ILLEGAL_CONTENT: 'illegal_content',
  SPAM: 'spam',
  IMPERSONATION: 'impersonation',
  DEANONYMIZATION_ATTEMPT: 'deanonymization_attempt',
  OTHER: 'other',
} as const;

export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];

export interface ReportReasonDefinition {
  readonly id: ReportReason;
  readonly label: string;
  readonly description: string;
  readonly defaultSeverity: 'critical' | 'high' | 'medium' | 'low';
}

export const REPORT_REASONS: readonly ReportReasonDefinition[] = [
  {
    id: REPORT_REASON.HARASSMENT,
    label: 'Harassment or abuse',
    description: 'Targeting, threatening, or abusing someone.',
    defaultSeverity: 'high',
  },
  {
    id: REPORT_REASON.SELF_HARM_RISK,
    label: 'Self-harm or safety risk',
    description: 'Content suggesting someone may be in danger.',
    defaultSeverity: 'critical',
  },
  {
    id: REPORT_REASON.ILLEGAL_CONTENT,
    label: 'Illegal content',
    description: 'Content describing or soliciting illegal activity.',
    defaultSeverity: 'high',
  },
  {
    id: REPORT_REASON.SPAM,
    label: 'Spam or bot',
    description: 'Automated, repeated, or irrelevant content.',
    defaultSeverity: 'low',
  },
  {
    id: REPORT_REASON.IMPERSONATION,
    label: 'Impersonation',
    description: 'Pretending to be someone they are not.',
    defaultSeverity: 'medium',
  },
  {
    id: REPORT_REASON.DEANONYMIZATION_ATTEMPT,
    label: 'Trying to identify someone',
    description: "Attempting to expose another user's real identity.",
    defaultSeverity: 'high',
  },
  {
    id: REPORT_REASON.OTHER,
    label: 'Something else',
    description: 'Does not fit other categories.',
    defaultSeverity: 'medium',
  },
] as const;

export const REPORT_REASON_MAP: Readonly<Record<ReportReason, ReportReasonDefinition>> =
  Object.fromEntries(REPORT_REASONS.map((r) => [r.id, r])) as Record<
    ReportReason,
    ReportReasonDefinition
  >;

export const CRISIS_REPORT_REASONS: ReadonlySet<ReportReason> = new Set([
  REPORT_REASON.SELF_HARM_RISK,
]);
