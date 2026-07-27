import { randomInt } from "crypto";
import { GiveawayStatus, Prisma, type Giveaway } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

const giveawayInclude = {
  winner: { select: { id: true, displayName: true, avatarUrl: true } },
  createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
  _count: { select: { entries: true } },
} satisfies Prisma.GiveawayInclude;

export type FullGiveaway = Prisma.GiveawayGetPayload<{ include: typeof giveawayInclude }>;

async function loadOrThrow(id: string): Promise<FullGiveaway> {
  const giveaway = await prisma.giveaway.findUnique({ where: { id }, include: giveawayInclude });
  if (!giveaway) throw createError.notFound("Giveaway not found");
  return giveaway;
}

export class GiveawayService {
  static async list(): Promise<FullGiveaway[]> {
    return prisma.giveaway.findMany({ include: giveawayInclude, orderBy: { createdAt: "desc" } });
  }

  static async get(id: string): Promise<FullGiveaway> {
    return loadOrThrow(id);
  }

  static async create(
    userId: string,
    data: { title: string; description?: string | null; entryCost?: number; endsAt?: string | null }
  ): Promise<Giveaway> {
    return prisma.giveaway.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        entryCost: data.entryCost ?? 0,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdById: userId,
      },
    });
  }

  static async update(
    id: string,
    data: Partial<{ title: string; description: string | null; entryCost: number; endsAt: string | null }>
  ): Promise<Giveaway> {
    const giveaway = await loadOrThrow(id);
    if (giveaway.status !== GiveawayStatus.DRAFT) {
      throw createError.badRequest("Only draft giveaways can be edited — close and create a new one instead");
    }
    return prisma.giveaway.update({
      where: { id },
      data: { ...data, endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined },
    });
  }

  static async remove(id: string): Promise<void> {
    await loadOrThrow(id);
    await prisma.giveaway.delete({ where: { id } });
  }

  static async open(id: string): Promise<Giveaway> {
    const giveaway = await loadOrThrow(id);
    if (giveaway.status !== GiveawayStatus.DRAFT) throw createError.badRequest("Giveaway is not a draft");
    return prisma.giveaway.update({ where: { id }, data: { status: GiveawayStatus.OPEN } });
  }

  static async close(id: string): Promise<Giveaway> {
    const giveaway = await loadOrThrow(id);
    if (giveaway.status !== GiveawayStatus.OPEN) throw createError.badRequest("Giveaway is not open");
    return prisma.giveaway.update({ where: { id }, data: { status: GiveawayStatus.CLOSED } });
  }

  static async listEntries(id: string) {
    return prisma.giveawayEntry.findMany({
      where: { giveawayId: id },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { enteredAt: "asc" },
    });
  }

  static async getMyEntry(id: string, userId: string) {
    const entry = await prisma.giveawayEntry.findUnique({ where: { giveawayId_userId: { giveawayId: id, userId } } });
    return { entered: !!entry };
  }

  static async enter(id: string, userId: string): Promise<void> {
    const giveaway = await loadOrThrow(id);
    if (giveaway.status !== GiveawayStatus.OPEN) throw createError.badRequest("This giveaway isn't open for entries");

    const existing = await prisma.giveawayEntry.findUnique({
      where: { giveawayId_userId: { giveawayId: id, userId } },
    });
    if (existing) throw createError.conflict("You're already entered");

    await prisma.$transaction(async (tx) => {
      if (giveaway.entryCost > 0) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { catCoinBalance: true } });
        if (user.catCoinBalance < giveaway.entryCost) throw createError.badRequest("Not enough coins to enter");
        await tx.user.update({
          where: { id: userId },
          data: { catCoinBalance: { decrement: giveaway.entryCost }, totalSpent: { increment: giveaway.entryCost } },
        });
      }
      await tx.giveawayEntry.create({ data: { giveawayId: id, userId } });
    });
  }

  static async leave(id: string, userId: string): Promise<void> {
    const giveaway = await loadOrThrow(id);
    if (giveaway.status !== GiveawayStatus.OPEN) throw createError.badRequest("Entries are closed — you can't withdraw now");

    const entry = await prisma.giveawayEntry.findUnique({
      where: { giveawayId_userId: { giveawayId: id, userId } },
    });
    if (!entry) throw createError.notFound("You're not entered in this giveaway");

    await prisma.$transaction(async (tx) => {
      if (giveaway.entryCost > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { catCoinBalance: { increment: giveaway.entryCost }, totalSpent: { decrement: giveaway.entryCost } },
        });
      }
      await tx.giveawayEntry.delete({ where: { id: entry.id } });
    });
  }

  static async drawWinner(id: string): Promise<FullGiveaway> {
    const giveaway = await loadOrThrow(id);
    if (giveaway.status === GiveawayStatus.DRAFT) throw createError.badRequest("Open the giveaway before drawing a winner");
    if (giveaway.status === GiveawayStatus.COMPLETED) throw createError.badRequest("A winner has already been drawn");

    const entries = await prisma.giveawayEntry.findMany({ where: { giveawayId: id } });
    if (entries.length === 0) throw createError.badRequest("No entries to draw from");

    const winnerEntry = entries[randomInt(entries.length)];

    await prisma.giveaway.update({
      where: { id },
      data: { status: GiveawayStatus.COMPLETED, winnerId: winnerEntry.userId, drawnAt: new Date() },
    });

    return loadOrThrow(id);
  }
}
