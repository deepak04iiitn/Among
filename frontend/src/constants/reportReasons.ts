// MIRRORED — keep in sync with backend/src/constants/reportReasons.ts
// Frontend-facing report reason definitions for the ReportModal UI.

export const REPORT_REASON = {
  HARASSMENT:               'harassment',
  SELF_HARM_RISK:           'self_harm_risk',
  ILLEGAL_CONTENT:          'illegal_content',
  SPAM:                     'spam',
  IMPERSONATION:            'impersonation',
  DEANONYMIZATION_ATTEMPT:  'deanonymization_attempt',
  OTHER:                    'other',
} as const;

export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];

export interface ReportReasonOption {
  readonly id:    ReportReason;
  readonly label: string;
}

/** Ordered list for display in ReportModal */
export const REPORT_REASON_OPTIONS: readonly ReportReasonOption[] = [
  { id: REPORT_REASON.HARASSMENT,              label: 'Harassment or abuse' },
  { id: REPORT_REASON.SELF_HARM_RISK,          label: 'Self-harm or safety risk' },
  { id: REPORT_REASON.ILLEGAL_CONTENT,         label: 'Illegal content' },
  { id: REPORT_REASON.DEANONYMIZATION_ATTEMPT, label: 'Trying to identify someone' },
  { id: REPORT_REASON.IMPERSONATION,           label: 'Impersonation' },
  { id: REPORT_REASON.SPAM,                    label: 'Spam or bot' },
  { id: REPORT_REASON.OTHER,                   label: 'Something else' },
] as const;
