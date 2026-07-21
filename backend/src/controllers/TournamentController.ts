import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { TournamentService } from "@/services/TournamentService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  }
  return result.data;
}

const createSchema = z.object({
  title: z.string().min(1).max(100),
  maxPlayers: z.number().int().min(2).max(64).optional(),
  slotTimerSeconds: z.number().int().min(60).max(600).optional(),
  prizeCoins: z.number().int().min(0).optional(),
});

const drawSchema = z.object({
  count: z.number().int().min(2).max(64),
  guaranteedUserIds: z.array(z.string()).optional(),
});

const slotSchema = z.object({
  slotCall: z.string().min(1).max(100),
});

const winnerSchema = z.object({
  winnerId: z.string().min(1),
});

export const TournamentController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const tournaments = await TournamentService.list();
    res.json({ success: true, tournaments });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await TournamentService.get(req.params.id);
    res.json({ success: true, tournament });
  }),

  getMyEntry: asyncHandler(async (req: Request, res: Response) => {
    const data = await TournamentService.getMyEntry(req.params.id, req.user!.id);
    res.json({ success: true, ...data });
  }),

  getEntries: asyncHandler(async (req: Request, res: Response) => {
    const entries = await TournamentService.getEntries(req.params.id);
    res.json({ success: true, entries });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(createSchema, req.body);
    const tournament = await TournamentService.create(req.user!.id, data);
    res.status(201).json({ success: true, tournament });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await TournamentService.remove(req.params.id);
    res.json({ success: true });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await TournamentService.cancel(req.params.id);
    res.json({ success: true, tournament });
  }),

  openRegistration: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await TournamentService.openRegistration(req.params.id);
    res.json({ success: true, tournament });
  }),

  enterRaffle: asyncHandler(async (req: Request, res: Response) => {
    await TournamentService.enterRaffle(req.params.id, req.user!.id);
    res.json({ success: true });
  }),

  leaveRaffle: asyncHandler(async (req: Request, res: Response) => {
    await TournamentService.leaveRaffle(req.params.id, req.user!.id);
    res.json({ success: true });
  }),

  drawWinners: asyncHandler(async (req: Request, res: Response) => {
    const { count, guaranteedUserIds } = parseBody(drawSchema, req.body);
    const tournament = await TournamentService.drawWinners(req.params.id, count, guaranteedUserIds ?? []);
    res.json({ success: true, tournament });
  }),

  rerollParticipant: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await TournamentService.rerollParticipant(req.params.id, req.params.participantId);
    res.json({ success: true, tournament });
  }),

  setSlot: asyncHandler(async (req: Request, res: Response) => {
    const { slotCall } = parseBody(slotSchema, req.body);
    const tournament = await TournamentService.setSlot(req.params.id, req.user!.id, slotCall);
    res.json({ success: true, tournament });
  }),

  startTournament: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await TournamentService.startTournament(req.params.id);
    res.json({ success: true, tournament });
  }),

  declareMatchWinner: asyncHandler(async (req: Request, res: Response) => {
    const { winnerId } = parseBody(winnerSchema, req.body);
    const tournament = await TournamentService.declareMatchWinner(req.params.matchId, winnerId);
    res.json({ success: true, tournament });
  }),

  revertMatchWinner: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await TournamentService.revertMatchWinner(req.params.matchId);
    res.json({ success: true, tournament });
  }),
};
