import { randomUUID } from "crypto";
import { Prisma, type WagerLeaderboard } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

export interface WagerEntry {
  id: string;
  name: string;
  wagered: number;
  avatarUrl: string | null;
}

export interface SerializedWagerLeaderboard extends Omit<WagerLeaderboard, "prizeAmount" | "entries" | "endsAt"> {
  prizeAmount: number;
  entries: WagerEntry[];
  endsAt: string | null;
  /** Explicit title if set, else auto-generated from prizeAmount/currency,
   * e.g. "$250 Leaderboard". */
  displayTitle: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

function formatPrize(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = amount % 1 === 0 ? amount.toLocaleString() : amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
  return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
}

function getEntries(board: WagerLeaderboard): WagerEntry[] {
  return (board.entries as unknown as WagerEntry[]) ?? [];
}

export function serializeWagerLeaderboard(board: WagerLeaderboard): SerializedWagerLeaderboard {
  const prizeAmount = Number(board.prizeAmount);
  const entries = [...getEntries(board)].sort((a, b) => b.wagered - a.wagered);
  return {
    ...board,
    prizeAmount,
    entries,
    endsAt: board.endsAt ? board.endsAt.toISOString() : null,
    displayTitle: board.title?.trim() || `${formatPrize(prizeAmount, board.currency)} Leaderboard`,
  };
}

function slugName(name: string): string {
  return name.trim().slice(0, 80);
}

export class WagerLeaderboardService {
  static async list(): Promise<WagerLeaderboard[]> {
    return prisma.wagerLeaderboard.findMany({ orderBy: { createdAt: "desc" } });
  }

  static async get(id: string): Promise<WagerLeaderboard> {
    const board = await prisma.wagerLeaderboard.findUnique({ where: { id } });
    if (!board) throw createError.notFound("Wager leaderboard not found");
    return board;
  }

  static async getLive(): Promise<WagerLeaderboard | null> {
    return prisma.wagerLeaderboard.findFirst({ where: { isLive: true }, orderBy: { updatedAt: "desc" } });
  }

  static async create(
    userId: string,
    data: { title?: string | null; prizeAmount: number; currency?: string; endsAt?: string | null }
  ): Promise<WagerLeaderboard> {
    if (typeof data.prizeAmount !== "number" || !Number.isFinite(data.prizeAmount) || data.prizeAmount < 0) {
      throw createError.badRequest("prizeAmount must be a non-negative number");
    }
    return prisma.wagerLeaderboard.create({
      data: {
        title: data.title?.trim() || null,
        prizeAmount: data.prizeAmount,
        currency: data.currency?.trim() || "USD",
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdById: userId,
      },
    });
  }

  static async update(
    id: string,
    data: Partial<{ title: string | null; prizeAmount: number; currency: string; endsAt: string | null }>
  ): Promise<WagerLeaderboard> {
    await this.get(id);
    if (data.prizeAmount !== undefined && (!Number.isFinite(data.prizeAmount) || data.prizeAmount < 0)) {
      throw createError.badRequest("prizeAmount must be a non-negative number");
    }
    return prisma.wagerLeaderboard.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title?.trim() || null } : {}),
        ...(data.prizeAmount !== undefined ? { prizeAmount: data.prizeAmount } : {}),
        ...(data.currency !== undefined ? { currency: data.currency.trim() || "USD" } : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
      },
    });
  }

  static async remove(id: string): Promise<void> {
    const result = await prisma.wagerLeaderboard.deleteMany({ where: { id } });
    if (result.count === 0) throw createError.notFound("Wager leaderboard not found");
  }

  private static async persistEntries(id: string, entries: WagerEntry[]): Promise<WagerLeaderboard> {
    return prisma.wagerLeaderboard.update({
      where: { id },
      data: { entries: entries as unknown as Prisma.InputJsonValue },
    });
  }

  static async addEntry(id: string, input: { name: string; wagered: number; avatarUrl?: string | null }): Promise<WagerLeaderboard> {
    const board = await this.get(id);
    if (!input.name?.trim()) throw createError.badRequest("name is required");
    if (typeof input.wagered !== "number" || !Number.isFinite(input.wagered) || input.wagered < 0) {
      throw createError.badRequest("wagered must be a non-negative number");
    }

    const entry: WagerEntry = {
      id: randomUUID(),
      name: slugName(input.name),
      wagered: input.wagered,
      avatarUrl: input.avatarUrl?.trim() || null,
    };
    return this.persistEntries(id, [...getEntries(board), entry]);
  }

  static async editEntry(
    id: string,
    entryId: string,
    patch: Partial<{ name: string; wagered: number; avatarUrl: string | null }>
  ): Promise<WagerLeaderboard> {
    const board = await this.get(id);
    const entries = getEntries(board);
    const index = entries.findIndex((e) => e.id === entryId);
    if (index === -1) throw createError.notFound("Entry not found");

    if (patch.wagered !== undefined && (!Number.isFinite(patch.wagered) || patch.wagered < 0)) {
      throw createError.badRequest("wagered must be a non-negative number");
    }
    if (patch.name !== undefined && !patch.name.trim()) throw createError.badRequest("name cannot be empty");

    const next = [...entries];
    next[index] = {
      ...next[index],
      ...(patch.name !== undefined && { name: slugName(patch.name) }),
      ...(patch.wagered !== undefined && { wagered: patch.wagered }),
      ...(patch.avatarUrl !== undefined && { avatarUrl: patch.avatarUrl?.trim() || null }),
    };
    return this.persistEntries(id, next);
  }

  static async removeEntry(id: string, entryId: string): Promise<WagerLeaderboard> {
    const board = await this.get(id);
    const entries = getEntries(board);
    const next = entries.filter((e) => e.id !== entryId);
    if (next.length === entries.length) throw createError.notFound("Entry not found");
    return this.persistEntries(id, next);
  }

  static async setLive(id: string): Promise<WagerLeaderboard> {
    await this.get(id);
    return prisma.$transaction(async (tx) => {
      await tx.wagerLeaderboard.updateMany({ where: { isLive: true, NOT: { id } }, data: { isLive: false } });
      return tx.wagerLeaderboard.update({ where: { id }, data: { isLive: true } });
    });
  }

  static async unsetLive(id: string): Promise<WagerLeaderboard> {
    await this.get(id);
    return prisma.wagerLeaderboard.update({ where: { id }, data: { isLive: false } });
  }
}
