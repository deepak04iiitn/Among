/**
 * someoneNeedsYou.controller.ts — HTTP handlers for SNY endpoints.
 */
import type { Request, Response, NextFunction } from 'express';
import * as snyService from './someoneNeedsYou.service';
import * as experienceGraphService from '../experienceGraph/experienceGraph.service';
import type { SNYAcceptInput, SNYSkipInput, SNYOptInInput } from './someoneNeedsYou.schema';

// ─── Prompt endpoints ─────────────────────────────────────────────────────────

export async function getDailyPrompt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prompt = await snyService.getDailyPromptForUser(req.user!.accountId);
    if (!prompt) {
      res.status(200).json({ prompt: null });
      return;
    }
    res.status(200).json({ prompt });
  } catch (err) {
    next(err);
  }
}

export async function skipPrompt(
  req: Request<object, object, SNYSkipInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const next_prompt = await snyService.skipPrompt(req.user!.accountId, req.body.skippedPostId);
    res.status(200).json({ prompt: next_prompt });
  } catch (err) {
    next(err);
  }
}

export async function acceptPrompt(
  req: Request<object, object, SNYAcceptInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await snyService.acceptPrompt(req.user!.accountId, req.body.promptPostId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function dismissPrompt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    snyService.dismissPromptForToday(req.user!.accountId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getPromptStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = snyService.getPromptStatus(req.user!.accountId);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

// ─── Experience graph endpoints ───────────────────────────────────────────────

export async function getExperienceHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const history = await experienceGraphService.getExperienceHistory(req.user!.accountId);
    res.status(200).json({ experiences: history });
  } catch (err) {
    next(err);
  }
}

export async function updateOptIn(
  req: Request<object, object, SNYOptInInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await experienceGraphService.updateSnyOptIn(
      req.user!.accountId,
      req.body.categoryId,
      req.body.optIn
    );
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
