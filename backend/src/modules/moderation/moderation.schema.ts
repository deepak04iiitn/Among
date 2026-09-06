/**
 * moderation.schema.ts — Zod validation schemas for moderation endpoints.
 */
import { z } from 'zod';
import { REPORT_REASON } from '../../constants/reportReasons';

const validReasons = Object.values(REPORT_REASON) as [string, ...string[]];

export const submitReportSchema = z.object({
  contentType:       z.enum(['post', 'message', 'response']),
  contentId:         z.string().min(1, 'Content ID required'),
  reason:            z.enum(validReasons, { errorMap: () => ({ message: 'Invalid report reason' }) }),
  additionalDetails: z.string().max(500).optional(),
});

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

export const blockUserSchema = z.object({
  blockedAccountId: z.string().min(1, 'Account ID required'),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

export const actionReportSchema = z.object({
  action: z.string().min(1, 'Action required'),
  notes:  z.string().max(500).optional(),
});

export type ActionReportInput = z.infer<typeof actionReportSchema>;

export const adminEnforcementSchema = z.object({
  action:        z.enum([
    'WARN_USER',
    'COOLDOWN_USER',
    'RESTRICT_USER',
    'PERMANENT_BAN',
    'LIFT_RESTRICTION',
    'FORCE_ALIAS_ROTATION',
  ]),
  reportId:      z.string().optional(),
  durationDays:  z.number().int().positive().optional(),
  durationHours: z.number().int().positive().optional(),
  notes:         z.string().max(500).optional(),
});

export type AdminEnforcementInput = z.infer<typeof adminEnforcementSchema>;
