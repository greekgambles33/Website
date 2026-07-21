import { randomInt } from "crypto";
import { Prisma, TournamentStatus, MatchStatus, type Tournament } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

const tournamentInclude = {
  entries: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
  participants: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
  matches: true,
} satisfies Prisma.TournamentInclude;

export type FullTournament = Prisma.TournamentGetPayload<{ include: typeof tournamentInclude }>;

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

async function loadFull(id: string): Promise<FullTournament> {
  const tournament = await prisma.tournament.findUnique({ where: { id }, include: tournamentInclude });
  if (!tournament) throw createError.notFound("Tournament not found");
  return tournament;
}

export class TournamentService {
  static async list(): Promise<Tournament[]> {
    return prisma.tournament.findMany({ orderBy: { createdAt: "desc" } });
  }

  static async get(id: string): Promise<FullTournament> {
    return loadFull(id);
  }

  static async getMyEntry(id: string, userId: string) {
    const [entry, participant] = await Promise.all([
      prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: id, userId } } }),
      prisma.tournamentParticipant.findUnique({ where: { tournamentId_userId: { tournamentId: id, userId } } }),
    ]);
    return { entered: !!entry, participant };
  }

  static async getEntries(id: string) {
    return prisma.tournamentEntry.findMany({
      where: { tournamentId: id },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { enteredAt: "asc" },
    });
  }

  static async create(
    adminId: string,
    data: { title: string; maxPlayers?: number; slotTimerSeconds?: number; prizeCoins?: number }
  ): Promise<Tournament> {
    const title = data.title?.trim();
    if (!title) throw createError.badRequest("Title is required");

    return prisma.tournament.create({
      data: {
        title,
        maxPlayers: data.maxPlayers ?? 8,
        slotTimerSeconds: data.slotTimerSeconds ?? 180,
        prizeCoins: data.prizeCoins ?? 0,
        createdById: adminId,
      },
    });
  }

  static async remove(id: string): Promise<void> {
    const result = await prisma.tournament.deleteMany({ where: { id } });
    if (result.count === 0) throw createError.notFound("Tournament not found");
  }

  static async cancel(id: string): Promise<Tournament> {
    const tournament = await this.requireTournament(id);
    if (tournament.status === TournamentStatus.COMPLETED) {
      throw createError.badRequest("Cannot cancel a completed tournament");
    }
    return prisma.tournament.update({ where: { id }, data: { status: TournamentStatus.CANCELLED } });
  }

  static async openRegistration(id: string): Promise<Tournament> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.DRAFT) throw createError.badRequest("Tournament is not in draft");
    return prisma.tournament.update({ where: { id }, data: { status: TournamentStatus.REGISTRATION } });
  }

  static async enterRaffle(id: string, userId: string): Promise<void> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw createError.badRequest("Registration isn't open for this tournament");
    }
    await prisma.tournamentEntry.upsert({
      where: { tournamentId_userId: { tournamentId: id, userId } },
      create: { tournamentId: id, userId },
      update: {},
    });
  }

  static async leaveRaffle(id: string, userId: string): Promise<void> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw createError.badRequest("Registration isn't open for this tournament");
    }
    await prisma.tournamentEntry.deleteMany({ where: { tournamentId: id, userId } });
  }

  static async drawWinners(id: string, count: number, guaranteedUserIds: string[] = []): Promise<Tournament> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw createError.badRequest("Tournament must be in registration to draw players");
    }

    const entries = await prisma.tournamentEntry.findMany({ where: { tournamentId: id } });
    const entryUserIds = entries.map((e) => e.userId);
    const guaranteed = guaranteedUserIds.filter((uid) => entryUserIds.includes(uid));
    if (guaranteed.length > count) throw createError.badRequest("More guaranteed entrants than the draw size");

    const remainingPool = shuffle(entryUserIds.filter((uid) => !guaranteed.includes(uid)));
    const randomPicks = remainingPool.slice(0, Math.max(0, count - guaranteed.length));
    const drawn = shuffle([...guaranteed, ...randomPicks]);

    if (drawn.length === 0) throw createError.badRequest("No entrants to draw from");

    const deadline = new Date(Date.now() + tournament.slotTimerSeconds * 1000);

    await prisma.$transaction([
      prisma.tournament.update({
        where: { id },
        data: { maxPlayers: drawn.length, status: TournamentStatus.SLOT_SELECTION },
      }),
      prisma.tournamentParticipant.createMany({
        data: drawn.map((userId, i) => ({
          tournamentId: id,
          userId,
          seed: i + 1,
          slotDeadline: deadline,
        })),
      }),
    ]);

    return this.requireTournament(id);
  }

  static async rerollParticipant(id: string, participantId: string): Promise<Tournament> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.SLOT_SELECTION) {
      throw createError.badRequest("Tournament is not in slot selection");
    }
    const participant = await prisma.tournamentParticipant.findUnique({ where: { id: participantId } });
    if (!participant || participant.tournamentId !== id) throw createError.notFound("Participant not found");
    if (participant.slotConfirmed) throw createError.badRequest("Cannot reroll a confirmed participant");

    const [entries, participants] = await Promise.all([
      prisma.tournamentEntry.findMany({ where: { tournamentId: id } }),
      prisma.tournamentParticipant.findMany({ where: { tournamentId: id } }),
    ]);
    const participantUserIds = new Set(participants.map((p) => p.userId));
    const pool = shuffle(entries.map((e) => e.userId).filter((uid) => !participantUserIds.has(uid)));
    const replacementUserId = pool[0];

    await prisma.$transaction(async (tx) => {
      await tx.tournamentParticipant.delete({ where: { id: participantId } });
      if (replacementUserId) {
        await tx.tournamentParticipant.create({
          data: {
            tournamentId: id,
            userId: replacementUserId,
            seed: participant.seed,
            slotDeadline: new Date(Date.now() + tournament.slotTimerSeconds * 1000),
          },
        });
      }
    });

    return this.requireTournament(id);
  }

  static async setSlot(id: string, userId: string, slotCall: string): Promise<Tournament> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.SLOT_SELECTION) {
      throw createError.badRequest("Tournament is not in slot selection");
    }
    const participant = await prisma.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId: id, userId } },
    });
    if (!participant) throw createError.forbidden("You weren't drawn into this tournament");

    const trimmed = slotCall.trim();
    if (!trimmed) throw createError.badRequest("slotCall is required");

    const clash = await prisma.tournamentParticipant.findFirst({
      where: {
        tournamentId: id,
        slotConfirmed: true,
        id: { not: participant.id },
        slotCall: { equals: trimmed, mode: "insensitive" },
      },
    });
    if (clash) throw createError.conflict("That slot has already been called by another player");

    await prisma.tournamentParticipant.update({
      where: { id: participant.id },
      data: { slotCall: trimmed, slotConfirmed: true },
    });

    const remaining = await prisma.tournamentParticipant.count({ where: { tournamentId: id, slotConfirmed: false } });
    if (remaining === 0) await this.buildBracket(id);

    return this.requireTournament(id);
  }

  static async startTournament(id: string): Promise<Tournament> {
    const tournament = await this.requireTournament(id);
    if (tournament.status !== TournamentStatus.SLOT_SELECTION) {
      throw createError.badRequest("Tournament is not in slot selection");
    }
    await this.buildBracket(id);
    return this.requireTournament(id);
  }

  private static async buildBracket(id: string): Promise<void> {
    const confirmed = shuffle(
      await prisma.tournamentParticipant.findMany({ where: { tournamentId: id, slotConfirmed: true } })
    );
    if (confirmed.length < 2) throw createError.badRequest("Need at least 2 confirmed players to start the bracket");

    const size = nextPowerOfTwo(confirmed.length);
    const matchCount = size / 2;
    const byes = size - confirmed.length;

    const byeMatchIndexes = new Set(shuffle(Array.from({ length: matchCount }, (_, i) => i)).slice(0, byes));

    const pool = [...confirmed];
    const rounds = Math.log2(size);

    await prisma.$transaction(async (tx) => {
      // Create every round's match shells up front, wired to their round-2 slot via matchNumber.
      const matchIdByRoundNumber = new Map<string, string>();
      for (let round = 1; round <= rounds; round++) {
        const count = size / 2 ** round;
        for (let matchNumber = 1; matchNumber <= count; matchNumber++) {
          const created = await tx.tournamentMatch.create({
            data: { tournamentId: id, round, matchNumber, status: MatchStatus.PENDING },
          });
          matchIdByRoundNumber.set(`${round}:${matchNumber}`, created.id);
        }
      }
      for (let round = 1; round < rounds; round++) {
        const count = size / 2 ** round;
        for (let matchNumber = 1; matchNumber <= count; matchNumber++) {
          const matchId = matchIdByRoundNumber.get(`${round}:${matchNumber}`)!;
          const nextMatchId = matchIdByRoundNumber.get(`${round + 1}:${Math.ceil(matchNumber / 2)}`)!;
          await tx.tournamentMatch.update({ where: { id: matchId }, data: { nextMatchId } });
        }
      }

      // Populate round 1, resolving byes immediately.
      for (let matchNumber = 1; matchNumber <= matchCount; matchNumber++) {
        const matchId = matchIdByRoundNumber.get(`1:${matchNumber}`)!;
        const isBye = byeMatchIndexes.has(matchNumber - 1);
        const a = pool.shift();
        const b = isBye ? undefined : pool.shift();

        if (isBye) {
          await tx.tournamentMatch.update({
            where: { id: matchId },
            data: { participantAId: a?.id, status: MatchStatus.COMPLETED, winnerId: a?.id },
          });
          const nextMatchId = matchIdByRoundNumber.get(`2:${Math.ceil(matchNumber / 2)}`);
          if (nextMatchId && a) {
            const slotField = matchNumber % 2 === 1 ? "participantAId" : "participantBId";
            await tx.tournamentMatch.update({ where: { id: nextMatchId }, data: { [slotField]: a.id } });
          }
        } else {
          await tx.tournamentMatch.update({
            where: { id: matchId },
            data: { participantAId: a?.id, participantBId: b?.id, status: MatchStatus.ACTIVE },
          });
        }
      }

      // A next-round match that ended up with both slots pre-filled by two byes goes ACTIVE.
      const round2Matches =
        rounds >= 2
          ? await tx.tournamentMatch.findMany({ where: { tournamentId: id, round: 2, status: MatchStatus.PENDING } })
          : [];
      for (const m of round2Matches) {
        if (m.participantAId && m.participantBId) {
          await tx.tournamentMatch.update({ where: { id: m.id }, data: { status: MatchStatus.ACTIVE } });
        }
      }

      await tx.tournament.update({
        where: { id },
        data: { status: TournamentStatus.IN_PROGRESS, currentRound: 1 },
      });
    });
  }

  static async declareMatchWinner(matchId: string, winnerId: string): Promise<Tournament> {
    const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
    if (!match) throw createError.notFound("Match not found");
    if (match.status !== MatchStatus.ACTIVE) throw createError.badRequest("This match isn't active");
    if (winnerId !== match.participantAId && winnerId !== match.participantBId) {
      throw createError.badRequest("winnerId must be one of this match's participants");
    }
    const loserId = winnerId === match.participantAId ? match.participantBId : match.participantAId;

    await prisma.$transaction(async (tx) => {
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: MatchStatus.COMPLETED, winnerId },
      });
      if (loserId) {
        await tx.tournamentParticipant.update({ where: { id: loserId }, data: { eliminated: true } });
      }

      if (match.nextMatchId) {
        const slotField = match.matchNumber % 2 === 1 ? "participantAId" : "participantBId";
        const nextMatch = await tx.tournamentMatch.update({
          where: { id: match.nextMatchId },
          data: { [slotField]: winnerId },
        });
        if (nextMatch.participantAId && nextMatch.participantBId && nextMatch.status === MatchStatus.PENDING) {
          await tx.tournamentMatch.update({ where: { id: nextMatch.id }, data: { status: MatchStatus.ACTIVE } });
        }
      } else {
        // No next match — this was the final. Crown the champion and pay out.
        const tournament = await tx.tournament.findUniqueOrThrow({ where: { id: match.tournamentId } });
        await tx.tournamentParticipant.update({ where: { id: winnerId }, data: { finalPosition: 1 } });
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: TournamentStatus.COMPLETED, completedAt: new Date() },
        });

        if (tournament.prizeCoins > 0) {
          const champion = await tx.tournamentParticipant.findUniqueOrThrow({ where: { id: winnerId } });
          const user = await tx.user.update({
            where: { id: champion.userId },
            data: {
              catCoinBalance: { increment: tournament.prizeCoins },
              totalEarned: { increment: tournament.prizeCoins },
            },
          });
          await tx.auditLog.create({
            data: {
              adminId: tournament.createdById,
              targetId: user.id,
              action: "tournament.prize_payout",
              details: { tournamentId: tournament.id, amount: tournament.prizeCoins },
            },
          });
        }
      }
    });

    return this.requireTournament(match.tournamentId);
  }

  static async revertMatchWinner(matchId: string): Promise<Tournament> {
    const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
    if (!match) throw createError.notFound("Match not found");
    if (match.status !== MatchStatus.COMPLETED || !match.winnerId) {
      throw createError.badRequest("This match hasn't been decided yet");
    }

    if (match.nextMatchId) {
      const nextMatch = await prisma.tournamentMatch.findUnique({ where: { id: match.nextMatchId } });
      if (nextMatch?.status === MatchStatus.COMPLETED) {
        throw createError.badRequest("Can't revert — the winner has already advanced past this point");
      }
    }

    const loserId = match.winnerId === match.participantAId ? match.participantBId : match.participantAId;

    await prisma.$transaction(async (tx) => {
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: MatchStatus.ACTIVE, winnerId: null },
      });
      if (loserId) {
        await tx.tournamentParticipant.update({ where: { id: loserId }, data: { eliminated: false } });
      }

      if (match.nextMatchId) {
        const slotField = match.matchNumber % 2 === 1 ? "participantAId" : "participantBId";
        await tx.tournamentMatch.update({ where: { id: match.nextMatchId }, data: { [slotField]: null } });
      } else {
        const tournament = await tx.tournament.findUniqueOrThrow({ where: { id: match.tournamentId } });
        await tx.tournamentParticipant.update({ where: { id: match.winnerId! }, data: { finalPosition: null } });
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: TournamentStatus.IN_PROGRESS, completedAt: null },
        });

        if (tournament.prizeCoins > 0) {
          const champion = await tx.tournamentParticipant.findUniqueOrThrow({ where: { id: match.winnerId! } });
          const user = await tx.user.findUniqueOrThrow({ where: { id: champion.userId } });
          if (user.catCoinBalance - tournament.prizeCoins < 0) {
            throw createError.badRequest(
              "Can't revert — the champion has already spent their prize coins, adjust their balance manually"
            );
          }
          await tx.user.update({
            where: { id: champion.userId },
            data: {
              catCoinBalance: { decrement: tournament.prizeCoins },
              totalEarned: { decrement: tournament.prizeCoins },
            },
          });
          await tx.auditLog.create({
            data: {
              adminId: tournament.createdById,
              targetId: user.id,
              action: "tournament.prize_payout_reverted",
              details: { tournamentId: tournament.id, amount: tournament.prizeCoins },
            },
          });
        }
      }
    });

    return this.requireTournament(match.tournamentId);
  }

  private static async requireTournament(id: string): Promise<Tournament> {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw createError.notFound("Tournament not found");
    return tournament;
  }
}
