import { Prisma, type SiteContent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

export const SITE_CONTENT_KEYS = [
  "stream_status",
  "hero_highlights",
  "community_stats",
  "announcements",
  "store",
  "community_highlights",
  "games",
] as const;

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];

export class SiteContentService {
  static async getAll(): Promise<SiteContent[]> {
    return prisma.siteContent.findMany({ orderBy: { key: "asc" } });
  }

  static async get(key: string): Promise<SiteContent | null> {
    return prisma.siteContent.findUnique({ where: { key } });
  }

  static async upsert(key: SiteContentKey, data: unknown, userId: string): Promise<SiteContent> {
    return prisma.siteContent.upsert({
      where: { key },
      create: { key, data: data as Prisma.InputJsonValue, updatedById: userId },
      update: { data: data as Prisma.InputJsonValue, updatedById: userId },
    });
  }

  static async remove(key: string): Promise<void> {
    const result = await prisma.siteContent.deleteMany({ where: { key } });
    if (result.count === 0) throw createError.notFound("Content key not found");
  }
}
