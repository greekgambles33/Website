import { randomUUID } from "crypto";
import { Prisma, HuntStatus, type Hunt } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

export interface HuntBonus {
  id: string;
  slotName: string;
  provider: string;
  image: string | null;
  bet: number;
  payout: number | null;
  note: string | null;
  addedAt: string;
}

export interface SerializedHunt extends Omit<Hunt, "startBalance" | "bonuses"> {
  startBalance: number;
  bonuses: HuntBonus[];
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "hunt"}-${Math.random().toString(36).slice(2, 7)}`;
}

function getBonuses(hunt: Hunt): HuntBonus[] {
  return (hunt.bonuses as unknown as HuntBonus[]) ?? [];
}

export function serializeHunt(hunt: Hunt): SerializedHunt {
  return {
    ...hunt,
    startBalance: Number(hunt.startBalance),
    bonuses: getBonuses(hunt),
  };
}

export class HuntService {
  static async list(): Promise<Hunt[]> {
    return prisma.hunt.findMany({ orderBy: { createdAt: "desc" } });
  }

  static async get(id: string): Promise<Hunt> {
    const hunt = await prisma.hunt.findUnique({ where: { id } });
    if (!hunt) throw createError.notFound("Hunt not found");
    return hunt;
  }

  static async getBySlug(slug: string): Promise<Hunt> {
    const hunt = await prisma.hunt.findUnique({ where: { slug } });
    if (!hunt) throw createError.notFound("Hunt not found");
    return hunt;
  }

  static async getLive(): Promise<Hunt | null> {
    return prisma.hunt.findFirst({ where: { isLive: true }, orderBy: { updatedAt: "desc" } });
  }

  static async create(userId: string, data: { name: string; startBalance: number; currency?: string }): Promise<Hunt> {
    const name = data.name?.trim();
    if (!name) throw createError.badRequest("Hunt name is required");
    if (typeof data.startBalance !== "number" || !Number.isFinite(data.startBalance) || data.startBalance < 0) {
      throw createError.badRequest("startBalance must be a non-negative number");
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.hunt.create({
          data: {
            slug: slugify(name),
            name,
            currency: data.currency?.trim() || "USD",
            startBalance: data.startBalance,
            createdById: userId,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }
    throw createError.internal("Failed to create hunt");
  }

  static async remove(id: string): Promise<void> {
    const result = await prisma.hunt.deleteMany({ where: { id } });
    if (result.count === 0) throw createError.notFound("Hunt not found");
  }

  private static async persistBonuses(id: string, bonuses: HuntBonus[]): Promise<Hunt> {
    return prisma.hunt.update({
      where: { id },
      data: { bonuses: bonuses as unknown as Prisma.InputJsonValue },
    });
  }

  static async addBonus(
    id: string,
    input: { slotName: string; provider?: string; image?: string | null; bet: number; note?: string | null }
  ): Promise<Hunt> {
    const hunt = await this.get(id);
    if (hunt.status === HuntStatus.COMPLETED) {
      throw createError.badRequest("Cannot add bonuses to a completed hunt");
    }
    if (!input.slotName?.trim()) throw createError.badRequest("slotName is required");
    if (typeof input.bet !== "number" || !Number.isFinite(input.bet) || input.bet <= 0) {
      throw createError.badRequest("bet must be a positive number");
    }

    const bonus: HuntBonus = {
      id: randomUUID(),
      slotName: input.slotName.trim(),
      provider: input.provider?.trim() || "Unknown",
      image: input.image?.trim() || null,
      bet: input.bet,
      payout: null,
      note: input.note?.trim() || null,
      addedAt: new Date().toISOString(),
    };

    return this.persistBonuses(id, [...getBonuses(hunt), bonus]);
  }

  static async editBonus(
    id: string,
    bonusId: string,
    patch: Partial<Pick<HuntBonus, "slotName" | "provider" | "image" | "bet" | "note">>
  ): Promise<Hunt> {
    const hunt = await this.get(id);
    const bonuses = getBonuses(hunt);
    const index = bonuses.findIndex((b) => b.id === bonusId);
    if (index === -1) throw createError.notFound("Bonus not found");

    if (patch.bet !== undefined && (typeof patch.bet !== "number" || !Number.isFinite(patch.bet) || patch.bet <= 0)) {
      throw createError.badRequest("bet must be a positive number");
    }
    if (patch.slotName !== undefined && !patch.slotName.trim()) {
      throw createError.badRequest("slotName cannot be empty");
    }

    const next = [...bonuses];
    next[index] = {
      ...next[index],
      ...(patch.slotName !== undefined && { slotName: patch.slotName.trim() }),
      ...(patch.provider !== undefined && { provider: patch.provider.trim() || "Unknown" }),
      ...(patch.image !== undefined && { image: patch.image?.trim() || null }),
      ...(patch.bet !== undefined && { bet: patch.bet }),
      ...(patch.note !== undefined && { note: patch.note?.trim() || null }),
    };

    return this.persistBonuses(id, next);
  }

  static async removeBonus(id: string, bonusId: string): Promise<Hunt> {
    const hunt = await this.get(id);
    const bonuses = getBonuses(hunt);
    const next = bonuses.filter((b) => b.id !== bonusId);
    if (next.length === bonuses.length) throw createError.notFound("Bonus not found");
    return this.persistBonuses(id, next);
  }

  static async openBonus(id: string, bonusId: string, payout: number): Promise<Hunt> {
    if (typeof payout !== "number" || !Number.isFinite(payout) || payout < 0) {
      throw createError.badRequest("payout must be a non-negative number");
    }

    const hunt = await this.get(id);
    const bonuses = getBonuses(hunt);
    const index = bonuses.findIndex((b) => b.id === bonusId);
    if (index === -1) throw createError.notFound("Bonus not found");

    const next = [...bonuses];
    next[index] = { ...next[index], payout };

    return this.persistBonuses(id, next);
  }

  static async reorder(id: string, orderedBonusIds: string[]): Promise<Hunt> {
    const hunt = await this.get(id);
    const bonuses = getBonuses(hunt);
    if (orderedBonusIds.length !== bonuses.length || new Set(orderedBonusIds).size !== bonuses.length) {
      throw createError.badRequest("orderedBonusIds must contain every bonus id exactly once");
    }
    const byId = new Map(bonuses.map((b) => [b.id, b]));
    const next = orderedBonusIds.map((bid) => {
      const bonus = byId.get(bid);
      if (!bonus) throw createError.badRequest(`Unknown bonus id: ${bid}`);
      return bonus;
    });
    return this.persistBonuses(id, next);
  }

  static async shuffle(id: string): Promise<Hunt> {
    const hunt = await this.get(id);
    const bonuses = [...getBonuses(hunt)];
    for (let i = bonuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bonuses[i], bonuses[j]] = [bonuses[j], bonuses[i]];
    }
    return this.persistBonuses(id, bonuses);
  }

  static async start(id: string): Promise<Hunt> {
    const hunt = await this.get(id);
    if (hunt.status !== HuntStatus.COLLECTING) throw createError.badRequest("Hunt has already been started");
    if (getBonuses(hunt).length === 0) throw createError.badRequest("Add at least one bonus before starting");

    return prisma.hunt.update({
      where: { id },
      data: { status: HuntStatus.OPENING, startedAt: new Date() },
    });
  }

  static async complete(id: string): Promise<Hunt> {
    const hunt = await this.get(id);
    if (hunt.status === HuntStatus.COMPLETED) throw createError.badRequest("Hunt is already completed");

    return prisma.hunt.update({
      where: { id },
      data: { status: HuntStatus.COMPLETED, completedAt: new Date(), isLive: false },
    });
  }

  static async setLive(id: string): Promise<Hunt> {
    await this.get(id);
    return prisma.$transaction(async (tx) => {
      await tx.hunt.updateMany({ where: { isLive: true, NOT: { id } }, data: { isLive: false } });
      return tx.hunt.update({ where: { id }, data: { isLive: true } });
    });
  }

  static async unsetLive(id: string): Promise<Hunt> {
    await this.get(id);
    return prisma.hunt.update({ where: { id }, data: { isLive: false } });
  }
}
