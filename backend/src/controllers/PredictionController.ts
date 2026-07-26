import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { PredictionService } from "@/services/PredictionService";
import { StreamGameService } from "@/services/StreamGameService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  return result.data;
}

const createMatchSchema = z.object({
  format: z.enum(["SHORT", "NORMAL", "EVENT"]).optional(),
  targetScore: z.number().int().min(1).max(1000).optional(),
});

const openRoundSchema = z.object({
  question: z.string().min(1).max(280),
  streamerCall: z.string().min(1).max(280),
});

const resolveRoundSchema = z.object({ streamerCorrect: z.boolean() });
const challengeSchema = z.object({ challengeText: z.string().max(500).nullable() });
const leaderboardQuerySchema = z.enum(["week", "month", "all"]);

export const PredictionController = {
  getActiveMatch: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const match = await PredictionService.getActiveMatch(game.id);
    res.json({ success: true, match });
  }),

  listMatches: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const matches = await PredictionService.listMatches(game.id);
    res.json({ success: true, matches });
  }),

  getMatch: asyncHandler(async (req: Request, res: Response) => {
    const match = await PredictionService.getMatch(req.params.matchId);
    res.json({ success: true, match });
  }),

  createMatch: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const data = parseBody(createMatchSchema, req.body);
    const match = await PredictionService.createMatch(req.user!.id, game.id, data);
    res.status(201).json({ success: true, match });
  }),

  endMatch: asyncHandler(async (req: Request, res: Response) => {
    const { challengeText } = parseBody(challengeSchema.partial(), req.body);
    const match = await PredictionService.endMatch(req.params.matchId, challengeText);
    res.json({ success: true, match });
  }),

  setChallenge: asyncHandler(async (req: Request, res: Response) => {
    const { challengeText } = parseBody(challengeSchema, req.body);
    const match = await PredictionService.setChallenge(req.params.matchId, challengeText);
    res.json({ success: true, match });
  }),

  openRound: asyncHandler(async (req: Request, res: Response) => {
    const { question, streamerCall } = parseBody(openRoundSchema, req.body);
    const round = await PredictionService.openRound(req.params.matchId, question, streamerCall);
    res.status(201).json({ success: true, round });
  }),

  lockRound: asyncHandler(async (req: Request, res: Response) => {
    const round = await PredictionService.lockRound(req.params.roundId);
    res.json({ success: true, round });
  }),

  voidRound: asyncHandler(async (req: Request, res: Response) => {
    const round = await PredictionService.voidRound(req.params.roundId);
    res.json({ success: true, round });
  }),

  resolveRound: asyncHandler(async (req: Request, res: Response) => {
    const { streamerCorrect } = parseBody(resolveRoundSchema, req.body);
    const match = await PredictionService.resolveRound(req.params.roundId, streamerCorrect);
    res.json({ success: true, match });
  }),

  getLeaderboard: asyncHandler(async (req: Request, res: Response) => {
    const parsed = leaderboardQuerySchema.safeParse(req.query.period ?? "week");
    if (!parsed.success) throw createError.badRequest("period must be week, month, or all");
    const leaderboard = await PredictionService.getLeaderboard(parsed.data);
    res.json({ success: true, leaderboard });
  }),

  getMyStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await PredictionService.getUserStats(req.user!.id);
    res.json({ success: true, stats });
  }),
};
