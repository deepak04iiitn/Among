/**
 * discovery.controller.ts — HTTP handlers for discovery routes.
 */
import type { Request, Response, NextFunction } from 'express';
import * as discoveryService from './discovery.service';
import type { CategoryFeedQuery, SavedPostsQuery } from './discovery.schema';

// ─── GET /api/discovery/feed ──────────────────────────────────────────────────

export async function getHomeFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await discoveryService.getHomeFeed(req.user!.accountId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/discovery/category/:slug ───────────────────────────────────────

export async function getCategoryFeed(
  req: Request<{ slug: string }, object, object, CategoryFeedQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opts: { cursor?: string; limit?: number } = {};
    if (req.query.cursor !== undefined) opts.cursor = req.query.cursor;
    if (req.query.limit  !== undefined) opts.limit  = req.query.limit;

    const result = await discoveryService.getCategoryFeedPublic(
      req.user!.accountId,
      req.params.slug,
      opts
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/posts/:id/similar ───────────────────────────────────────────────

export async function getSimilarPosts(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await discoveryService.getSimilarPosts(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/posts/:id/saved ────────────────────────────────────────────────

export async function savePost(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await discoveryService.savePost(req.user!.accountId, req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/posts/:id/saved ─────────────────────────────────────────────

export async function unsavePost(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await discoveryService.unsavePost(req.user!.accountId, req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/me/saved ──────────────────────────────────────────────────

export async function getSavedPosts(
  req: Request<object, object, object, SavedPostsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const savedOpts: { cursor?: string; limit?: number } = {};
    if (req.query.cursor !== undefined) savedOpts.cursor = req.query.cursor;
    if (req.query.limit  !== undefined) savedOpts.limit  = req.query.limit;

    const result = await discoveryService.getSavedPosts(
      req.user!.accountId,
      savedOpts
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/me/you-are-not-alone ─────────────────────────────────────

export async function getYouAreNotAlone(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await discoveryService.getYouAreNotAloneStats(req.user!.accountId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
