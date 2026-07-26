import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { LadderService } from "@/services/LadderService";
import { StreamGameService } from "@/services/StreamGameService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  return result.data;
}

const createRunSchema = z.object({ participantName: z.string().min(1).max(60) });

export const LadderController = {
  getLevels: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, levels: LadderService.levels() });
  }),

  getActiveRun: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const run = await LadderService.getActiveRun(game.id);
    res.json({ success: true, run });
  }),

  listRuns: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const runs = await LadderService.listRuns(game.id);
    res.json({ success: true, runs });
  }),

  createRun: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const { participantName } = parseBody(createRunSchema, req.body);
    const run = await LadderService.createRun(req.user!.id, game.id, participantName);
    res.status(201).json({ success: true, run });
  }),

  deleteRun: asyncHandler(async (req: Request, res: Response) => {
    await LadderService.deleteRun(req.params.runId);
    res.json({ success: true });
  }),

  passChallenge: asyncHandler(async (req: Request, res: Response) => {
    const run = await LadderService.passChallenge(req.params.runId);
    res.json({ success: true, run });
  }),

  failChallenge: asyncHandler(async (req: Request, res: Response) => {
    const run = await LadderService.failChallenge(req.params.runId);
    res.json({ success: true, run });
  }),

  cashOut: asyncHandler(async (req: Request, res: Response) => {
    const run = await LadderService.cashOut(req.params.runId);
    res.json({ success: true, run });
  }),

  climbHigher: asyncHandler(async (req: Request, res: Response) => {
    const run = await LadderService.climbHigher(req.params.runId);
    res.json({ success: true, run });
  }),
};
