import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { WagerLeaderboardService, serializeWagerLeaderboard } from "@/services/WagerLeaderboardService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  return result.data;
}

const prizeTierSchema = z.object({
  rank: z.number().int().min(1),
  amount: z.number().nonnegative(),
});

const createSchema = z.object({
  title: z.string().max(120).optional().nullable(),
  prizeAmount: z.number().nonnegative(),
  currency: z.string().min(1).max(8).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  prizeDistribution: z.array(prizeTierSchema).max(20).optional().nullable(),
});

const updateSchema = createSchema.partial();

const addEntrySchema = z.object({
  name: z.string().min(1).max(80),
  wagered: z.number().nonnegative(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

const editEntrySchema = addEntrySchema.partial();

export const WagerLeaderboardController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const boards = await WagerLeaderboardService.list();
    res.json({ success: true, leaderboards: boards.map(serializeWagerLeaderboard) });
  }),

  listArchived: asyncHandler(async (_req: Request, res: Response) => {
    const boards = await WagerLeaderboardService.listArchived();
    res.json({ success: true, leaderboards: boards.map(serializeWagerLeaderboard) });
  }),

  getLive: asyncHandler(async (_req: Request, res: Response) => {
    const board = await WagerLeaderboardService.getLive();
    res.json({ success: true, leaderboard: board ? serializeWagerLeaderboard(board) : null });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const board = await WagerLeaderboardService.get(req.params.id);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(createSchema, req.body);
    const board = await WagerLeaderboardService.create(req.user!.id, data);
    res.status(201).json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(updateSchema, req.body);
    const board = await WagerLeaderboardService.update(req.params.id, data);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await WagerLeaderboardService.remove(req.params.id);
    res.json({ success: true });
  }),

  addEntry: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(addEntrySchema, req.body);
    const board = await WagerLeaderboardService.addEntry(req.params.id, data);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  editEntry: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(editEntrySchema, req.body);
    const board = await WagerLeaderboardService.editEntry(req.params.id, req.params.entryId, data);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  removeEntry: asyncHandler(async (req: Request, res: Response) => {
    const board = await WagerLeaderboardService.removeEntry(req.params.id, req.params.entryId);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  setLive: asyncHandler(async (req: Request, res: Response) => {
    const board = await WagerLeaderboardService.setLive(req.params.id);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  unsetLive: asyncHandler(async (req: Request, res: Response) => {
    const board = await WagerLeaderboardService.unsetLive(req.params.id);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const board = await WagerLeaderboardService.archive(req.params.id);
    res.json({ success: true, leaderboard: serializeWagerLeaderboard(board) });
  }),
};
