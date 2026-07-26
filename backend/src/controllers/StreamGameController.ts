import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { StreamGameService } from "@/services/StreamGameService";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw createError.badRequest(result.error.issues.map((i) => i.message).join(", "));
  return result.data;
}

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createSchema = z.object({
  slug: z.string().min(1).max(60).regex(slugPattern, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  prizeModeEnabled: z.boolean().optional(),
  prizeRulesText: z.string().max(4000).optional().nullable(),
});

const reorderSchema = z.object({ orderedIds: z.array(z.string()).min(1) });

export const StreamGameController = {
  listPublic: asyncHandler(async (_req: Request, res: Response) => {
    const games = await StreamGameService.listPublic();
    res.json({ success: true, games });
  }),

  listAll: asyncHandler(async (_req: Request, res: Response) => {
    const games = await StreamGameService.listAll();
    res.json({ success: true, games });
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const game = await StreamGameService.getBySlug(req.params.slug);
    res.json({ success: true, game });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(createSchema, req.body);
    const game = await StreamGameService.create(req.user!.id, data);
    res.status(201).json({ success: true, game });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(updateSchema, req.body);
    const game = await StreamGameService.update(req.params.id, data);
    res.json({ success: true, game });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await StreamGameService.remove(req.params.id);
    res.json({ success: true });
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const { orderedIds } = parseBody(reorderSchema, req.body);
    await StreamGameService.reorder(orderedIds);
    res.json({ success: true });
  }),
};
