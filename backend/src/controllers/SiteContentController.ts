import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { SiteContentService, SITE_CONTENT_KEYS, type SiteContentKey } from "@/services/SiteContentService";

const schemasByKey: Record<SiteContentKey, z.ZodType> = {
  stream_status: z.object({
    isLive: z.boolean(),
    title: z.string().min(1).max(200),
    category: z.string().min(1).max(80),
    viewers: z.number().int().nonnegative(),
    uptimeMinutes: z.number().int().nonnegative(),
  }),
  hero_highlights: z.array(z.object({ label: z.string().min(1).max(60), value: z.string().min(1).max(30) })).max(6),
  community_stats: z.array(z.object({ label: z.string().min(1).max(60), value: z.number().nonnegative() })).max(8),
  announcements: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(1000),
        date: z.string().min(1),
        pinned: z.boolean().optional(),
      })
    )
    .max(50),
  store: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(120),
        price: z.number().int().nonnegative(),
        category: z.string().min(1).max(60),
        limited: z.boolean(),
      })
    )
    .max(100),
  giveaway: z.object({
    title: z.string().min(1).max(200),
    entriesOpen: z.boolean(),
    entryCost: z.number().int().nonnegative(),
    freeEntryAvailable: z.boolean(),
    endsAt: z.string().min(1),
    totalEntries: z.number().int().nonnegative(),
  }),
  upcoming_giveaways: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(200),
        startsAt: z.string().min(1),
        entryCost: z.number().int().nonnegative(),
        freeEntryAvailable: z.boolean(),
      })
    )
    .max(20),
  latest_winners: z
    .array(
      z.object({
        id: z.string().min(1),
        username: z.string().min(1).max(80),
        prize: z.string().min(1).max(120),
        date: z.string().min(1),
      })
    )
    .max(50),
  community_highlights: z
    .array(z.object({ id: z.string().min(1), username: z.string().min(1).max(80), quote: z.string().min(1).max(400) }))
    .max(20),
  games: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(80),
        description: z.string().min(1).max(300),
        status: z.string().min(1).max(40),
        participants: z.number().int().nonnegative(),
        href: z.string().max(200).optional(),
        howToPlay: z.string().max(600).optional(),
      })
    )
    .max(20),
};

function isKnownKey(key: string): key is SiteContentKey {
  return (SITE_CONTENT_KEYS as readonly string[]).includes(key);
}

export const SiteContentController = {
  listKeys: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, keys: SITE_CONTENT_KEYS });
  }),

  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const rows = await SiteContentService.getAll();
    const content: Record<string, unknown> = {};
    for (const row of rows) content[row.key] = row.data;
    res.json({ success: true, content });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    if (!isKnownKey(req.params.key)) throw createError.notFound("Unknown content key");
    const row = await SiteContentService.get(req.params.key);
    res.json({ success: true, data: row?.data ?? null, updatedAt: row?.updatedAt ?? null });
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    if (!isKnownKey(key)) throw createError.notFound("Unknown content key");

    const schema = schemasByKey[key];
    const result = schema.safeParse(req.body?.data);
    if (!result.success) {
      throw createError.badRequest(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "));
    }

    const row = await SiteContentService.upsert(key, result.data, req.user!.id);
    res.json({ success: true, data: row.data, updatedAt: row.updatedAt });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!isKnownKey(req.params.key)) throw createError.notFound("Unknown content key");
    await SiteContentService.remove(req.params.key);
    res.json({ success: true });
  }),
};
