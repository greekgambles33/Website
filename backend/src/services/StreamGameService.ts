import type { StreamGame } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

export interface StreamGameInput {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export class StreamGameService {
  static async listPublic(): Promise<StreamGame[]> {
    return prisma.streamGame.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } });
  }

  static async listAll(): Promise<StreamGame[]> {
    return prisma.streamGame.findMany({ orderBy: { sortOrder: "asc" } });
  }

  static async getBySlug(slug: string): Promise<StreamGame> {
    const game = await prisma.streamGame.findUnique({ where: { slug } });
    if (!game) throw createError.notFound("Stream game not found");
    return game;
  }

  static async create(userId: string, data: StreamGameInput): Promise<StreamGame> {
    const existing = await prisma.streamGame.findUnique({ where: { slug: data.slug } });
    if (existing) throw createError.conflict("A stream game with this slug already exists");

    const maxSort = await prisma.streamGame.aggregate({ _max: { sortOrder: true } });

    return prisma.streamGame.create({
      data: { ...data, createdById: userId, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
    });
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      imageUrl: string | null;
      isActive: boolean;
      isVisible: boolean;
      prizeModeEnabled: boolean;
      prizeRulesText: string | null;
    }>
  ): Promise<StreamGame> {
    const game = await prisma.streamGame.findUnique({ where: { id } });
    if (!game) throw createError.notFound("Stream game not found");
    return prisma.streamGame.update({ where: { id }, data });
  }

  static async remove(id: string): Promise<void> {
    const game = await prisma.streamGame.findUnique({ where: { id } });
    if (!game) throw createError.notFound("Stream game not found");
    await prisma.streamGame.delete({ where: { id } });
  }

  static async reorder(orderedIds: string[]): Promise<void> {
    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.streamGame.update({ where: { id }, data: { sortOrder: index } }))
    );
  }
}
