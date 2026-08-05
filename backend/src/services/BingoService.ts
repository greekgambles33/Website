import { randomInt } from "crypto";
import { Prisma, BingoStatus, BingoCellStatus, type BonusBingo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { createError } from "@/middleware/errorHandler";

const USER_SELECT = { id: true, displayName: true, kickUsername: true, avatarUrl: true } satisfies Prisma.UserSelect;

const gameInclude = {
  cells: { orderBy: [{ row: "asc" as const }, { col: "asc" as const }], include: { claimedBy: { select: USER_SELECT } } },
  participants: { orderBy: { joinedAt: "asc" as const }, include: { user: { select: USER_SELECT } } },
  lineWins: { orderBy: { completedAt: "asc" as const } },
} satisfies Prisma.BonusBingoInclude;

export type FullBingoGame = Prisma.BonusBingoGetPayload<{ include: typeof gameInclude }>;

const DRAW_CYCLE_TTL_SECONDS = 86_400;

function drawCycleKey(gameId: string): string {
  return `bingo_draw_cycle:${gameId}`;
}

async function loadGameOrThrow(id: string): Promise<FullBingoGame> {
  const game = await prisma.bonusBingo.findUnique({ where: { id }, include: gameInclude });
  if (!game) throw createError.notFound("Bingo game not found");
  return game;
}

function detectNewLines(
  cells: FullBingoGame["cells"],
  gridSize: number,
  alreadyWon: Set<string>
): { lineType: "row" | "col" | "diag"; lineIndex: number; winners: string[] }[] {
  const isGreen = (row: number, col: number) => cells.find((c) => c.row === row && c.col === col)?.status === BingoCellStatus.GREEN;
  const winnerFor = (row: number, col: number) => {
    const cell = cells.find((c) => c.row === row && c.col === col);
    return cell?.claimedByChatUsername ?? null;
  };

  const found: { lineType: "row" | "col" | "diag"; lineIndex: number; winners: string[] }[] = [];

  for (let r = 0; r < gridSize; r++) {
    const key = `row:${r}`;
    if (alreadyWon.has(key)) continue;
    if (Array.from({ length: gridSize }, (_, c) => isGreen(r, c)).every(Boolean)) {
      const winners = Array.from({ length: gridSize }, (_, c) => winnerFor(r, c)).filter((w): w is string => !!w);
      found.push({ lineType: "row", lineIndex: r, winners });
    }
  }

  for (let c = 0; c < gridSize; c++) {
    const key = `col:${c}`;
    if (alreadyWon.has(key)) continue;
    if (Array.from({ length: gridSize }, (_, r) => isGreen(r, c)).every(Boolean)) {
      const winners = Array.from({ length: gridSize }, (_, r) => winnerFor(r, c)).filter((w): w is string => !!w);
      found.push({ lineType: "col", lineIndex: c, winners });
    }
  }

  if (!alreadyWon.has("diag:0") && Array.from({ length: gridSize }, (_, i) => isGreen(i, i)).every(Boolean)) {
    const winners = Array.from({ length: gridSize }, (_, i) => winnerFor(i, i)).filter((w): w is string => !!w);
    found.push({ lineType: "diag", lineIndex: 0, winners });
  }
  if (!alreadyWon.has("diag:1") && Array.from({ length: gridSize }, (_, i) => isGreen(i, gridSize - 1 - i)).every(Boolean)) {
    const winners = Array.from({ length: gridSize }, (_, i) => winnerFor(i, gridSize - 1 - i)).filter((w): w is string => !!w);
    found.push({ lineType: "diag", lineIndex: 1, winners });
  }

  return found;
}

export class BingoService {
  static async getById(id: string): Promise<FullBingoGame> {
    return loadGameOrThrow(id);
  }

  static async list(streamGameId: string, includeDraft: boolean): Promise<FullBingoGame[]> {
    return prisma.bonusBingo.findMany({
      where: { streamGameId, ...(includeDraft ? {} : { status: { not: BingoStatus.DRAFT } }) },
      include: gameInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  /** REGISTRATION or ACTIVE game — there's only ever one live at a time. */
  static async getActive(streamGameId: string): Promise<FullBingoGame | null> {
    return prisma.bonusBingo.findFirst({
      where: { streamGameId, status: { in: [BingoStatus.REGISTRATION, BingoStatus.ACTIVE] } },
      include: gameInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(
    userId: string,
    streamGameId: string,
    data: { title: string; gridSize?: number; linePoints?: number; keyword?: string }
  ): Promise<FullBingoGame> {
    const existing = await this.getActive(streamGameId);
    if (existing) throw createError.conflict("There's already a bingo game in progress — end it first.");

    const gridSize = data.gridSize ?? 5;
    if (![3, 4, 5].includes(gridSize)) throw createError.badRequest("gridSize must be 3, 4, or 5");
    const linePoints = data.linePoints ?? 500;
    if (!Number.isInteger(linePoints) || linePoints < 1) throw createError.badRequest("linePoints must be a positive integer");

    const cellsData: { row: number; col: number }[] = [];
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) cellsData.push({ row: r, col: c });

    const game = await prisma.bonusBingo.create({
      data: {
        streamGameId,
        title: data.title.trim(),
        keyword: data.keyword?.trim() || "!join",
        gridSize,
        linePoints,
        createdById: userId,
        cells: { create: cellsData },
      },
      include: gameInclude,
    });
    return game;
  }

  static async setKeyword(id: string, keyword: string): Promise<FullBingoGame> {
    const trimmed = keyword.trim();
    if (!trimmed) throw createError.badRequest("keyword cannot be empty");
    await loadGameOrThrow(id);
    await prisma.bonusBingo.update({ where: { id }, data: { keyword: trimmed } });
    return loadGameOrThrow(id);
  }

  static async openRegistration(id: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status !== BingoStatus.DRAFT) throw createError.badRequest("Game isn't in draft");
    await prisma.bonusBingo.update({ where: { id }, data: { status: BingoStatus.REGISTRATION } });
    return loadGameOrThrow(id);
  }

  /** Join via chat keyword or admin — chatUsername always set; userId links
   * a verified account when the chatter/site user is recognized. A repeat
   * join with a slot just updates the participant's default slot. */
  static async join(
    gameId: string,
    chatUsername: string,
    userId: string | null,
    preferredSlot: string | null
  ): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(gameId);
    if (game.status !== BingoStatus.REGISTRATION && game.status !== BingoStatus.ACTIVE) {
      throw createError.badRequest("Registration isn't open for this game");
    }
    const normalized = chatUsername.trim().toLowerCase();
    if (!normalized) throw createError.badRequest("chatUsername is required");

    const existing = await prisma.bingoParticipant.findUnique({
      where: { gameId_chatUsername: { gameId, chatUsername: normalized } },
    });

    if (existing) {
      if (!preferredSlot) throw createError.badRequest("Already joined");
      if (game.currentChatUsername === normalized) {
        throw createError.badRequest(`Already your turn — use "!slot ${preferredSlot}" instead`);
      }
      await prisma.bingoParticipant.update({
        where: { id: existing.id },
        data: { preferredSlot: preferredSlot.slice(0, 100), userId: userId ?? existing.userId },
      });
    } else {
      await prisma.bingoParticipant.create({
        data: {
          gameId,
          chatUsername: normalized,
          userId,
          preferredSlot: preferredSlot?.slice(0, 100) || null,
        },
      });
    }
    return loadGameOrThrow(gameId);
  }

  static async removeParticipant(gameId: string, chatUsername: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(gameId);
    if (game.status === BingoStatus.COMPLETED || game.status === BingoStatus.CANCELLED) {
      throw createError.badRequest("This game has already ended");
    }
    const normalized = chatUsername.trim().toLowerCase();
    const result = await prisma.bingoParticipant.deleteMany({ where: { gameId, chatUsername: normalized } });
    if (result.count === 0) throw createError.notFound("Participant not found");

    const patch: Prisma.BonusBingoUpdateInput = {};
    if (game.currentChatUsername === normalized) {
      patch.currentChatUsername = null;
    }
    if (Object.keys(patch).length) await prisma.bonusBingo.update({ where: { id: gameId }, data: patch });

    const cycle = (await redis.getJSON<string[]>(drawCycleKey(gameId))) ?? [];
    if (cycle.includes(normalized)) {
      await redis.setJSON(drawCycleKey(gameId), cycle.filter((u) => u !== normalized), DRAW_CYCLE_TTL_SECONDS);
    }
    return loadGameOrThrow(gameId);
  }

  static async startGame(id: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status !== BingoStatus.REGISTRATION) throw createError.badRequest("Game isn't in registration");
    if (game.participants.length === 0) throw createError.badRequest("Need at least one participant to start");
    await prisma.bonusBingo.update({ where: { id }, data: { status: BingoStatus.ACTIVE } });
    return loadGameOrThrow(id);
  }

  static async spinCell(id: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status !== BingoStatus.ACTIVE) throw createError.badRequest("Game isn't active");
    if (game.currentCellId) throw createError.badRequest("A cell is already selected — resolve it first");

    const empty = game.cells.filter((c) => c.status === BingoCellStatus.EMPTY);
    if (empty.length === 0) throw createError.badRequest("No empty cells left to spin");

    const chosen = empty[randomInt(0, empty.length)];
    await prisma.$transaction([
      prisma.bingoCell.update({ where: { id: chosen.id }, data: { status: BingoCellStatus.ACTIVE } }),
      prisma.bonusBingo.update({
        where: { id },
        data: { currentCellId: chosen.id, currentChatUsername: null },
      }),
    ]);
    return loadGameOrThrow(id);
  }

  /** Fair shuffle-bag draw: everyone in the pool must be drawn once before
   * anyone repeats, tracked per-game in Redis with a 24h TTL. */
  static async drawPlayer(id: string, includeWinners: boolean): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status !== BingoStatus.ACTIVE) throw createError.badRequest("Game isn't active");
    if (!game.currentCellId) throw createError.badRequest("Spin a cell first");
    if (game.participants.length === 0) throw createError.badRequest("No participants to draw from");

    let pool = game.participants;
    if (!includeWinners) {
      const wonUsernames = new Set(
        game.cells.filter((c) => c.status === BingoCellStatus.GREEN && c.claimedByChatUsername).map((c) => c.claimedByChatUsername!)
      );
      const filtered = pool.filter((p) => !wonUsernames.has(p.chatUsername));
      if (filtered.length > 0) pool = filtered; // fall back to everyone if all have already won a cell
    }

    let drawn = pool[0];
    if (pool.length > 1) {
      const drawnThisCycle = new Set((await redis.getJSON<string[]>(drawCycleKey(id))) ?? []);
      let available = pool.filter((p) => !drawnThisCycle.has(p.chatUsername));
      if (available.length === 0) {
        drawnThisCycle.clear();
        available = pool;
      }
      drawn = available[randomInt(0, available.length)];
      drawnThisCycle.add(drawn.chatUsername);
      await redis.setJSON(drawCycleKey(id), Array.from(drawnThisCycle), DRAW_CYCLE_TTL_SECONDS);
    }

    await prisma.$transaction(async (tx) => {
      await tx.bonusBingo.update({ where: { id }, data: { currentChatUsername: drawn.chatUsername } });
      if (drawn.preferredSlot) {
        await tx.bingoCell.updateMany({
          where: { id: game.currentCellId!, slotName: null },
          data: { slotName: drawn.preferredSlot },
        });
      }
    });
    return loadGameOrThrow(id);
  }

  static async setSlot(
    gameId: string,
    cellId: string,
    slotName: string,
    requesterChatUsername: string | null,
    isAdminOrMod: boolean
  ): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(gameId);
    if (game.status !== BingoStatus.ACTIVE) throw createError.badRequest("Game isn't active");
    if (cellId !== game.currentCellId) throw createError.badRequest("This cell is not the active cell");
    if (!isAdminOrMod && requesterChatUsername !== game.currentChatUsername) {
      throw createError.forbidden("Only the drawn player can set the slot right now");
    }
    const trimmed = slotName.trim();
    if (!trimmed) throw createError.badRequest("slotName cannot be empty");

    await prisma.bingoCell.update({ where: { id: cellId }, data: { slotName: trimmed.slice(0, 100) } });
    return loadGameOrThrow(gameId);
  }

  /** Resolves the active cell: green (claimed + line-win check) on a win,
   * fully reset back to EMPTY on a loss so it can be re-spun. */
  static async markResult(id: string, won: boolean): Promise<{ game: FullBingoGame; newLineWins: FullBingoGame["lineWins"] }> {
    const game = await loadGameOrThrow(id);
    if (game.status !== BingoStatus.ACTIVE) throw createError.badRequest("Game isn't active");
    if (!game.currentCellId) throw createError.badRequest("No active cell to resolve");

    const cellId = game.currentCellId;
    const claimerChatUsername = game.currentChatUsername;
    const claimerParticipant = game.participants.find((p) => p.chatUsername === claimerChatUsername);

    await prisma.$transaction([
      prisma.bingoCell.update({
        where: { id: cellId },
        data: won
          ? {
              status: BingoCellStatus.GREEN,
              claimedByChatUsername: claimerChatUsername,
              claimedByUserId: claimerParticipant?.userId ?? null,
              claimedAt: new Date(),
            }
          : {
              status: BingoCellStatus.EMPTY,
              slotName: null,
              claimedByChatUsername: null,
              claimedByUserId: null,
              claimedAt: null,
            },
      }),
      prisma.bonusBingo.update({ where: { id }, data: { currentCellId: null, currentChatUsername: null } }),
    ]);

    let newLineWins: FullBingoGame["lineWins"] = [];
    if (won) {
      const fresh = await loadGameOrThrow(id);
      const alreadyWon = new Set(fresh.lineWins.map((w) => `${w.lineType}:${w.lineIndex}`));
      const detected = detectNewLines(fresh.cells, fresh.gridSize, alreadyWon);

      for (const line of detected) {
        const uniqueWinners = [...new Set(line.winners)];
        const created = await prisma.bingoLineWin.create({
          data: {
            gameId: id,
            lineType: line.lineType,
            lineIndex: line.lineIndex,
            pointsEach: fresh.linePoints,
            winners: uniqueWinners as unknown as Prisma.InputJsonValue,
          },
        });
        newLineWins.push(created);

        for (const chatUsername of uniqueWinners) {
          const participant = fresh.participants.find((p) => p.chatUsername === chatUsername);
          if (!participant?.userId) continue; // unlinked winners get no CatCoin — nothing to credit
          await prisma.user
            .update({
              where: { id: participant.userId },
              data: { catCoinBalance: { increment: fresh.linePoints }, totalEarned: { increment: fresh.linePoints } },
            })
            .catch((err) => console.error("[bingo] failed to award line-win CatCoin:", err));
        }
      }

      const allGreen = fresh.cells.every((c) => c.status === BingoCellStatus.GREEN);
      if (allGreen) {
        await prisma.bonusBingo.update({ where: { id }, data: { status: BingoStatus.COMPLETED, completedAt: new Date() } });
      }
    }

    const finalGame = await loadGameOrThrow(id);
    return { game: finalGame, newLineWins };
  }

  static async completeGame(id: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status === BingoStatus.COMPLETED || game.status === BingoStatus.CANCELLED) {
      throw createError.badRequest("This game has already ended");
    }
    if (game.currentCellId) {
      await prisma.bingoCell.update({
        where: { id: game.currentCellId },
        data: { status: BingoCellStatus.EMPTY, slotName: null, claimedByChatUsername: null, claimedByUserId: null, claimedAt: null },
      });
    }
    await prisma.bonusBingo.update({
      where: { id },
      data: { status: BingoStatus.COMPLETED, currentCellId: null, currentChatUsername: null, completedAt: new Date() },
    });
    await redis.del(drawCycleKey(id));
    return loadGameOrThrow(id);
  }

  static async unlive(id: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status !== BingoStatus.ACTIVE) throw createError.badRequest("Game isn't active");
    if (game.currentCellId) {
      await prisma.bingoCell.update({
        where: { id: game.currentCellId },
        data: { status: BingoCellStatus.EMPTY, slotName: null, claimedByChatUsername: null, claimedByUserId: null, claimedAt: null },
      });
    }
    await prisma.bonusBingo.update({
      where: { id },
      data: { status: BingoStatus.REGISTRATION, currentCellId: null, currentChatUsername: null },
    });
    await redis.del(drawCycleKey(id));
    return loadGameOrThrow(id);
  }

  static async cancel(id: string): Promise<FullBingoGame> {
    const game = await loadGameOrThrow(id);
    if (game.status === BingoStatus.COMPLETED || game.status === BingoStatus.CANCELLED) {
      throw createError.badRequest("This game has already ended");
    }
    await prisma.bonusBingo.update({ where: { id }, data: { status: BingoStatus.CANCELLED } });
    await redis.del(drawCycleKey(id));
    return loadGameOrThrow(id);
  }

  static async deleteGame(id: string): Promise<void> {
    const result = await prisma.bonusBingo.deleteMany({ where: { id } });
    if (result.count === 0) throw createError.notFound("Bingo game not found");
    await redis.del(drawCycleKey(id));
  }
}
