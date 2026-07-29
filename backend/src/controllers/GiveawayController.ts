import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { GiveawayService } from "@/services/GiveawayService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  return result.data;
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  entryCost: z.number().int().nonnegative().optional(),
  requirementText: z.string().max(500).optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

const adminAddEntrySchema = z.object({ userId: z.string().min(1) });

export const GiveawayController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const giveaways = await GiveawayService.list();
    res.json({ success: true, giveaways });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const giveaway = await GiveawayService.get(req.params.id);
    res.json({ success: true, giveaway });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(createSchema, req.body);
    const giveaway = await GiveawayService.create(req.user!.id, data);
    res.status(201).json({ success: true, giveaway });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(updateSchema, req.body);
    const giveaway = await GiveawayService.update(req.params.id, data);
    res.json({ success: true, giveaway });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await GiveawayService.remove(req.params.id);
    res.json({ success: true });
  }),

  open: asyncHandler(async (req: Request, res: Response) => {
    const giveaway = await GiveawayService.open(req.params.id);
    res.json({ success: true, giveaway });
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const giveaway = await GiveawayService.close(req.params.id);
    res.json({ success: true, giveaway });
  }),

  listEntries: asyncHandler(async (req: Request, res: Response) => {
    const entries = await GiveawayService.listEntries(req.params.id);
    res.json({ success: true, entries });
  }),

  getMyEntry: asyncHandler(async (req: Request, res: Response) => {
    const data = await GiveawayService.getMyEntry(req.params.id, req.user!.id);
    res.json({ success: true, ...data });
  }),

  enter: asyncHandler(async (req: Request, res: Response) => {
    await GiveawayService.enter(req.params.id, req.user!.id);
    res.json({ success: true });
  }),

  leave: asyncHandler(async (req: Request, res: Response) => {
    await GiveawayService.leave(req.params.id, req.user!.id);
    res.json({ success: true });
  }),

  drawWinner: asyncHandler(async (req: Request, res: Response) => {
    const giveaway = await GiveawayService.drawWinner(req.params.id);
    res.json({ success: true, giveaway });
  }),

  adminAddEntry: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = parseBody(adminAddEntrySchema, req.body);
    await GiveawayService.adminAddEntry(req.params.id, userId);
    res.json({ success: true });
  }),

  adminRemoveEntry: asyncHandler(async (req: Request, res: Response) => {
    await GiveawayService.adminRemoveEntry(req.params.id, req.params.entryId);
    res.json({ success: true });
  }),
};
