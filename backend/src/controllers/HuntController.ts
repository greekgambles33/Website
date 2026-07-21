import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { HuntService, serializeHunt } from "@/services/HuntService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  }
  return result.data;
}

const createHuntSchema = z.object({
  name: z.string().min(1).max(120),
  startBalance: z.number().nonnegative(),
  currency: z.string().min(1).max(8).optional(),
});

const addBonusSchema = z.object({
  slotName: z.string().min(1).max(120),
  provider: z.string().max(120).optional(),
  image: z.string().url().max(500).optional().nullable(),
  bet: z.number().positive(),
  note: z.string().max(500).optional().nullable(),
});

const editBonusSchema = addBonusSchema.partial();

const openBonusSchema = z.object({
  payout: z.number().nonnegative(),
});

const reorderSchema = z.object({
  orderedBonusIds: z.array(z.string()).min(1),
});

export const HuntController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const hunts = await HuntService.list();
    res.json({ success: true, hunts: hunts.map(serializeHunt) });
  }),

  getLive: asyncHandler(async (_req: Request, res: Response) => {
    const hunt = await HuntService.getLive();
    res.json({ success: true, hunt: hunt ? serializeHunt(hunt) : null });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.get(req.params.id);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.getBySlug(req.params.slug);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(createHuntSchema, req.body);
    const hunt = await HuntService.create(req.user!.id, data);
    res.status(201).json({ success: true, hunt: serializeHunt(hunt) });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await HuntService.remove(req.params.id);
    res.json({ success: true });
  }),

  addBonus: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(addBonusSchema, req.body);
    const hunt = await HuntService.addBonus(req.params.id, data);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  editBonus: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(editBonusSchema, req.body);
    const hunt = await HuntService.editBonus(req.params.id, req.params.bonusId, data);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  removeBonus: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.removeBonus(req.params.id, req.params.bonusId);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  openBonus: asyncHandler(async (req: Request, res: Response) => {
    const { payout } = parseBody(openBonusSchema, req.body);
    const hunt = await HuntService.openBonus(req.params.id, req.params.bonusId, payout);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const { orderedBonusIds } = parseBody(reorderSchema, req.body);
    const hunt = await HuntService.reorder(req.params.id, orderedBonusIds);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  shuffle: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.shuffle(req.params.id);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.start(req.params.id);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.complete(req.params.id);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  setLive: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.setLive(req.params.id);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),

  unsetLive: asyncHandler(async (req: Request, res: Response) => {
    const hunt = await HuntService.unsetLive(req.params.id);
    res.json({ success: true, hunt: serializeHunt(hunt) });
  }),
};
