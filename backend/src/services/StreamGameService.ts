import { PredictionMatchStatus, LadderRunStatus, TournamentStatus, type StreamGame } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

export interface StreamGameInput {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export type StreamGameWithLiveStatus = StreamGame & { isLive: boolean };

/** isActive/isVisible are catalog toggles (is this game shown at all) — this
 * is the real, moment-to-moment "is something actually happening right now"
 * status, cross-checked against each game's own system. Hardcoded per slug
 * since there are only ever a handful of known games; unrecognized slugs
 * (a game with no dedicated system yet) just report not-live. */
async function computeIsLive(game: StreamGame): Promise<boolean> {
  switch (game.slug) {
    case "bonus-hunt": {
      const hunt = await prisma.hunt.findFirst({ where: { isLive: true }, select: { id: true } });
      return !!hunt;
    }
    case "tournament": {
      const tournament = await prisma.tournament.findFirst({
        where: { status: TournamentStatus.IN_PROGRESS },
        select: { id: true },
      });
      return !!tournament;
    }
    case "chat-vs-streamer": {
      const match = await prisma.predictionMatch.findFirst({
        where: { streamGameId: game.id, status: PredictionMatchStatus.ACTIVE },
        select: { id: true },
      });
      return !!match;
    }
    case "climb-the-ladder": {
      const run = await prisma.ladderRun.findFirst({
        where: { streamGameId: game.id, status: LadderRunStatus.ACTIVE },
        select: { id: true },
      });
      return !!run;
    }
    default:
      return false;
  }
}

async function withLiveStatus(games: StreamGame[]): Promise<StreamGameWithLiveStatus[]> {
  return Promise.all(games.map(async (game) => ({ ...game, isLive: await computeIsLive(game) })));
}

export class StreamGameService {
  static async listPublic(): Promise<StreamGameWithLiveStatus[]> {
    const games = await prisma.streamGame.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } });
    return withLiveStatus(games);
  }

  static async listAll(): Promise<StreamGameWithLiveStatus[]> {
    const games = await prisma.streamGame.findMany({ orderBy: { sortOrder: "asc" } });
    return withLiveStatus(games);
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
