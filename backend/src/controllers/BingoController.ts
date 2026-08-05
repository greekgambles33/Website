import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { BingoService } from "@/services/BingoService";
import { StreamGameService } from "@/services/StreamGameService";
import { prisma } from "@/lib/prisma";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  return result.data;
}

const createSchema = z.object({
  title: z.string().min(1).max(100),
  gridSize: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  linePoints: z.number().int().min(1).max(100000).optional(),
  keyword: z.string().min(1).max(30).optional(),
});

const keywordSchema = z.object({ keyword: z.string().min(1).max(30) });
const slotSchema = z.object({ slotName: z.string().min(1).max(100) });
const resultSchema = z.object({ won: z.boolean() });
const chatUsernameSchema = z.object({ chatUsername: z.string().min(1).max(60), preferredSlot: z.string().max(100).optional().nullable() });

/** Resolve a chat username to a linked, verified site account (if any) — used
 * so an admin-added participant, like a chat-joined one, links up when possible. */
async function resolveUserId(chatUsername: string): Promise<string | null> {
  const normalized = chatUsername.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { kickUsername: { equals: normalized, mode: "insensitive" }, kickVerified: true },
        { twitchUsername: { equals: normalized, mode: "insensitive" }, twitchVerified: true },
      ],
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

export const BingoController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const includeDraft = !!(req.user?.isAdmin || req.user?.isModerator);
    const games = await BingoService.list(game.id, includeDraft);
    res.json({ success: true, games });
  }),

  getActive: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    const active = await BingoService.getActive(game.id);
    res.json({ success: true, game: active });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.getById(req.params.id);
    res.json({ success: true, game });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const streamGame = await StreamGameService.getBySlug(req.params.slug);
    const data = parseBody(createSchema, req.body);
    const game = await BingoService.create(req.user!.id, streamGame.id, data);
    res.status(201).json({ success: true, game });
  }),

  setKeyword: asyncHandler(async (req: Request, res: Response) => {
    const { keyword } = parseBody(keywordSchema, req.body);
    const game = await BingoService.setKeyword(req.params.id, keyword);
    res.json({ success: true, game });
  }),

  openRegistration: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.openRegistration(req.params.id);
    res.json({ success: true, game });
  }),

  startGame: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.startGame(req.params.id);
    res.json({ success: true, game });
  }),

  spinCell: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.spinCell(req.params.id);
    res.json({ success: true, game });
  }),

  drawPlayer: asyncHandler(async (req: Request, res: Response) => {
    const includeWinners = req.body?.includeWinners === true;
    const game = await BingoService.drawPlayer(req.params.id, includeWinners);
    res.json({ success: true, game });
  }),

  // Admin-only over HTTP — the drawn player sets their own slot via "!slot <name>" in chat.
  setSlot: asyncHandler(async (req: Request, res: Response) => {
    const { slotName } = parseBody(slotSchema, req.body);
    const game = await BingoService.setSlot(req.params.id, req.params.cellId, slotName, null, true);
    res.json({ success: true, game });
  }),

  markResult: asyncHandler(async (req: Request, res: Response) => {
    const { won } = parseBody(resultSchema, req.body);
    const { game, newLineWins } = await BingoService.markResult(req.params.id, won);
    res.json({ success: true, game, newLineWins });
  }),

  completeGame: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.completeGame(req.params.id);
    res.json({ success: true, game });
  }),

  unlive: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.unlive(req.params.id);
    res.json({ success: true, game });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.cancel(req.params.id);
    res.json({ success: true, game });
  }),

  deleteGame: asyncHandler(async (req: Request, res: Response) => {
    await BingoService.deleteGame(req.params.id);
    res.json({ success: true });
  }),

  // Admin manually adding/removing a participant (e.g. someone shouted it out but chat missed it).
  addParticipant: asyncHandler(async (req: Request, res: Response) => {
    const { chatUsername, preferredSlot } = parseBody(chatUsernameSchema, req.body);
    const userId = await resolveUserId(chatUsername);
    const game = await BingoService.join(req.params.id, chatUsername, userId, preferredSlot ?? null);
    res.json({ success: true, game });
  }),

  removeParticipant: asyncHandler(async (req: Request, res: Response) => {
    const game = await BingoService.removeParticipant(req.params.id, req.params.chatUsername);
    res.json({ success: true, game });
  }),
};
