/**
 * moderation.controller.ts — HTTP handlers for reports, blocks, and admin enforcement.
 */
import type { Request, Response, NextFunction } from 'express';
import * as reportService from './report.service';
import * as blockService from '../blocks/block.service';
import * as enforcementService from './enforcement.service';
import type {
  SubmitReportInput,
  BlockUserInput,
  ActionReportInput,
  AdminEnforcementInput,
} from './moderation.schema';

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function submitReport(
  req: Request<object, object, SubmitReportInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportService.submitReport(
      req.user!.accountId,
      req.body as reportService.SubmitReportInput
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

export async function blockUser(
  req: Request<object, object, BlockUserInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await blockService.blockUser(req.user!.accountId, req.body.blockedAccountId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function unblockUser(
  req: Request<{ accountId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await blockService.unblockUser(req.user!.accountId, req.params.accountId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getBlockList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blocks = await blockService.getBlockedAccounts(req.user!.accountId);
    res.status(200).json({ blocks });
  } catch (err) {
    next(err);
  }
}

// ─── Admin: reports queue ─────────────────────────────────────────────────────

export async function getModerationQueue(
  req: Request<object, object, object, { cursor?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportService.getOpenReportsQueue(req.query.cursor);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function actionReport(
  req: Request<{ id: string }, object, ActionReportInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isAdmin = req.user!.role === 'admin';
    await reportService.actionReport(
      req.user!.accountId,
      req.params.id,
      req.body.action,
      isAdmin,
      req.body.notes
    );
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── Admin: user enforcement ──────────────────────────────────────────────────

export async function applyEnforcementAction(
  req: Request<{ id: string }, object, AdminEnforcementInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const targetId  = req.params.id;
    const actorId   = req.user!.accountId;
    const { action, reportId = 'admin-action', durationDays, durationHours, notes: _ } = req.body;

    switch (action) {
      case 'WARN_USER':
        await enforcementService.applyWarning(targetId, actorId, reportId);
        break;
      case 'COOLDOWN_USER':
        await enforcementService.applyCooldown(targetId, actorId, reportId, durationHours);
        break;
      case 'RESTRICT_USER':
        await enforcementService.applyTemporaryRestriction(targetId, actorId, reportId, durationDays);
        break;
      case 'PERMANENT_BAN':
        await enforcementService.applyPermanentBan(targetId, actorId, reportId);
        break;
      case 'LIFT_RESTRICTION':
        await enforcementService.liftRestriction(targetId, actorId);
        break;
      case 'FORCE_ALIAS_ROTATION':
        await enforcementService.forceAliasRotation(targetId, actorId);
        break;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUserDetail(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restriction = await enforcementService.getActiveRestriction(req.params.id);
    res.status(200).json(restriction);
  } catch (err) {
    next(err);
  }
}
