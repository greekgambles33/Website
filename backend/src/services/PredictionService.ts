import { Prisma, PredictionChoice, PredictionMatchStatus, PredictionRoundStatus, PredictionVoteSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

const matchInclude = {
  rounds: { orderBy: { roundNumber: "desc" as const }, take: 25 },
  streamGame: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.PredictionMatchInclude;

export type FullPredictionMatch = Prisma.PredictionMatchGetPayload<{ include: typeof matchInclude }>;

const MIN_LEADERBOARD_VOTES = 15;

function tierPoints(streak: number): number {
  if (streak >= 10) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

/** A choice is "correct" iff it matches reality: backing STREAMER is correct
 * when the streamer's call was right, backing CHAT is correct when it wasn't. */
function isChoiceCorrect(choice: PredictionChoice, streamerCorrect: boolean): boolean {
  return (choice === PredictionChoice.STREAMER) === streamerCorrect;
}

function nextUnderdogState(active: boolean, gap: number): boolean {
  if (!active && gap >= 5) return true;
  if (active && gap <= 2) return false;
  return active;
}

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday;
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function loadMatch(id: string): Promise<FullPredictionMatch> {
  const match = await prisma.predictionMatch.findUnique({ where: { id }, include: matchInclude });
  if (!match) throw createError.notFound("Match not found");
  return match;
}

export class PredictionService {
  static async getActiveMatch(streamGameId: string): Promise<FullPredictionMatch | null> {
    const match = await prisma.predictionMatch.findFirst({
      where: { streamGameId, status: PredictionMatchStatus.ACTIVE },
      include: matchInclude,
      orderBy: { createdAt: "desc" },
    });
    return match;
  }

  static async listMatches(streamGameId: string): Promise<FullPredictionMatch[]> {
    return prisma.predictionMatch.findMany({
      where: { streamGameId },
      include: matchInclude,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  static async getMatch(id: string): Promise<FullPredictionMatch> {
    return loadMatch(id);
  }

  static async createMatch(
    userId: string,
    streamGameId: string,
    data: { format?: "SHORT" | "NORMAL" | "EVENT"; targetScore?: number }
  ): Promise<FullPredictionMatch> {
    const existing = await prisma.predictionMatch.findFirst({
      where: { streamGameId, status: PredictionMatchStatus.ACTIVE },
    });
    if (existing) throw createError.conflict("There's already an active match for this game — end it first.");

    const match = await prisma.predictionMatch.create({
      data: {
        streamGameId,
        createdById: userId,
        format: data.format ?? "NORMAL",
        targetScore: data.targetScore ?? 15,
      },
    });
    return loadMatch(match.id);
  }

  static async endMatch(id: string, challengeText?: string | null): Promise<FullPredictionMatch> {
    const match = await loadMatch(id);
    if (match.status === PredictionMatchStatus.COMPLETED) return match;

    const winner =
      match.chatScore === match.streamerScore
        ? null
        : match.chatScore > match.streamerScore
          ? PredictionChoice.CHAT
          : PredictionChoice.STREAMER;

    await prisma.predictionMatch.update({
      where: { id },
      data: {
        status: PredictionMatchStatus.COMPLETED,
        winner,
        completedAt: new Date(),
        ...(challengeText !== undefined ? { challengeText } : {}),
      },
    });
    return loadMatch(id);
  }

  static async setChallenge(id: string, challengeText: string | null): Promise<FullPredictionMatch> {
    await loadMatch(id);
    await prisma.predictionMatch.update({ where: { id }, data: { challengeText } });
    return loadMatch(id);
  }

  static async openRound(matchId: string, question: string, streamerCall: string) {
    const match = await loadMatch(matchId);
    if (match.status !== PredictionMatchStatus.ACTIVE) throw createError.badRequest("Match is not active");

    const openOrLocked = match.rounds.find(
      (r) => r.status === PredictionRoundStatus.OPEN || r.status === PredictionRoundStatus.LOCKED
    );
    if (openOrLocked) throw createError.conflict("A round is already in progress — lock or void it first.");

    const maxRoundNumber = match.rounds.reduce((max, r) => Math.max(max, r.roundNumber), 0);

    const round = await prisma.predictionRound.create({
      data: {
        matchId,
        roundNumber: maxRoundNumber + 1,
        question,
        streamerCall,
        status: PredictionRoundStatus.OPEN,
        openedAt: new Date(),
      },
    });
    return round;
  }

  private static async getRoundOrThrow(roundId: string) {
    const round = await prisma.predictionRound.findUnique({ where: { id: roundId } });
    if (!round) throw createError.notFound("Round not found");
    return round;
  }

  static async lockRound(roundId: string) {
    const round = await this.getRoundOrThrow(roundId);
    if (round.status !== PredictionRoundStatus.OPEN) throw createError.badRequest("Round is not open");

    const totalVotes = round.votesChat + round.votesStreamer;
    const chatPick =
      totalVotes === 0 ? null : round.votesChat >= round.votesStreamer ? PredictionChoice.CHAT : PredictionChoice.STREAMER;

    return prisma.predictionRound.update({
      where: { id: roundId },
      data: { status: PredictionRoundStatus.LOCKED, chatPick, lockedAt: new Date() },
    });
  }

  static async voidRound(roundId: string) {
    const round = await this.getRoundOrThrow(roundId);
    if (round.status === PredictionRoundStatus.RESOLVED || round.status === PredictionRoundStatus.VOID) {
      throw createError.badRequest("Round is already finished");
    }
    return prisma.predictionRound.update({ where: { id: roundId }, data: { status: PredictionRoundStatus.VOID } });
  }

  /** Resolves a round: was the streamer's stated call actually right? Applies
   * scoring, streaks, the underdog rule, and checks for a match win. */
  static async resolveRound(roundId: string, streamerCorrect: boolean): Promise<FullPredictionMatch> {
    const round = await this.getRoundOrThrow(roundId);
    if (round.status !== PredictionRoundStatus.LOCKED) throw createError.badRequest("Round must be locked before it can be resolved");

    const match = await loadMatch(round.matchId);

    const chatCorrect = round.chatPick !== null && isChoiceCorrect(round.chatPick, streamerCorrect);
    const streamerWasCorrect = streamerCorrect === true;

    const chatGap = match.streamerScore - match.chatScore;
    const streamerGap = match.chatScore - match.streamerScore;
    const chatUnderdog = nextUnderdogState(match.chatUnderdog, chatGap);
    const streamerUnderdog = nextUnderdogState(match.streamerUnderdog, streamerGap);

    const newChatStreak = chatCorrect ? match.chatStreak + 1 : 0;
    const newStreamerStreak = streamerWasCorrect ? match.streamerStreak + 1 : 0;

    const chatPoints = chatCorrect ? tierPoints(newChatStreak) * (chatUnderdog ? 2 : 1) : 0;
    const streamerPoints = streamerWasCorrect ? tierPoints(newStreamerStreak) * (streamerUnderdog ? 2 : 1) : 0;

    const newChatScore = match.chatScore + chatPoints;
    const newStreamerScore = match.streamerScore + streamerPoints;

    const chatDone = newChatScore >= match.targetScore;
    const streamerDone = newStreamerScore >= match.targetScore;
    let winner: PredictionChoice | null = null;
    if (chatDone && streamerDone) {
      winner = newChatScore === newStreamerScore ? null : newChatScore > newStreamerScore ? PredictionChoice.CHAT : PredictionChoice.STREAMER;
    } else if (chatDone) {
      winner = PredictionChoice.CHAT;
    } else if (streamerDone) {
      winner = PredictionChoice.STREAMER;
    }

    await prisma.$transaction([
      prisma.predictionRound.update({
        where: { id: roundId },
        data: { status: PredictionRoundStatus.RESOLVED, streamerCorrect, resolvedAt: new Date() },
      }),
      prisma.predictionMatch.update({
        where: { id: match.id },
        data: {
          chatScore: newChatScore,
          streamerScore: newStreamerScore,
          chatStreak: newChatStreak,
          streamerStreak: newStreamerStreak,
          chatUnderdog,
          streamerUnderdog,
          ...(winner
            ? { status: PredictionMatchStatus.COMPLETED, winner, completedAt: new Date() }
            : {}),
        },
      }),
    ]);

    return loadMatch(match.id);
  }

  /** Records one viewer's chat-command vote for whichever round is currently
   * open on the match. Ignored if no round is open, or the vote is a no-op
   * repeat of the viewer's existing pick. */
  static async recordVote(
    streamGameId: string,
    rawChatUsername: string,
    choice: PredictionChoice,
    source: PredictionVoteSource
  ): Promise<{ recorded: boolean; roundId?: string }> {
    const chatUsername = rawChatUsername.trim().toLowerCase();
    if (!chatUsername) return { recorded: false };

    const match = await prisma.predictionMatch.findFirst({
      where: { streamGameId, status: PredictionMatchStatus.ACTIVE },
    });
    if (!match) return { recorded: false };

    const round = await prisma.predictionRound.findFirst({
      where: { matchId: match.id, status: PredictionRoundStatus.OPEN },
    });
    if (!round) return { recorded: false };

    const user = await prisma.user.findFirst({
      where:
        source === PredictionVoteSource.TWITCH
          ? { twitchUsername: { equals: chatUsername, mode: "insensitive" }, twitchVerified: true }
          : { kickUsername: { equals: chatUsername, mode: "insensitive" }, kickVerified: true },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.predictionVote.findUnique({
        where: { roundId_chatUsername: { roundId: round.id, chatUsername } },
      });

      if (existing) {
        if (existing.choice === choice) return; // no-op repeat
        await tx.predictionVote.update({ where: { id: existing.id }, data: { choice, userId: user?.id ?? null } });
        await tx.predictionRound.update({
          where: { id: round.id },
          data: {
            votesChat: { increment: choice === PredictionChoice.CHAT ? 1 : -1 },
            votesStreamer: { increment: choice === PredictionChoice.STREAMER ? 1 : -1 },
          },
        });
        return;
      }

      await tx.predictionVote.create({
        data: { roundId: round.id, chatUsername, choice, source, userId: user?.id ?? null },
      });
      await tx.predictionRound.update({
        where: { id: round.id },
        data: {
          votesChat: { increment: choice === PredictionChoice.CHAT ? 1 : 0 },
          votesStreamer: { increment: choice === PredictionChoice.STREAMER ? 1 : 0 },
        },
      });
    });

    return { recorded: true, roundId: round.id };
  }

  static async getUserStats(userId: string) {
    const votes = await prisma.predictionVote.findMany({
      where: { userId, round: { status: PredictionRoundStatus.RESOLVED } },
      include: { round: { select: { streamerCorrect: true, resolvedAt: true } } },
      orderBy: { createdAt: "asc" },
    });

    let correct = 0;
    let bestStreak = 0;
    let currentStreak = 0;
    for (const vote of votes) {
      const isCorrect = vote.round.streamerCorrect !== null && isChoiceCorrect(vote.choice, vote.round.streamerCorrect);
      if (isCorrect) {
        correct += 1;
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      totalPredictions: votes.length,
      correctPredictions: correct,
      accuracy: votes.length ? correct / votes.length : 0,
      longestStreak: bestStreak,
    };
  }

  static async getLeaderboard(period: "week" | "month" | "all", limit = 10) {
    const since = period === "week" ? startOfWeek() : period === "month" ? startOfMonth() : undefined;

    const votes = await prisma.predictionVote.findMany({
      where: {
        userId: { not: null },
        round: { status: PredictionRoundStatus.RESOLVED, ...(since ? { resolvedAt: { gte: since } } : {}) },
      },
      include: {
        round: { select: { streamerCorrect: true } },
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    const byUser = new Map<string, { user: { id: string; displayName: string; avatarUrl: string | null }; total: number; correct: number }>();
    for (const vote of votes) {
      if (!vote.user || vote.round.streamerCorrect === null) continue;
      const entry = byUser.get(vote.user.id) ?? { user: vote.user, total: 0, correct: 0 };
      entry.total += 1;
      if (isChoiceCorrect(vote.choice, vote.round.streamerCorrect)) entry.correct += 1;
      byUser.set(vote.user.id, entry);
    }

    const minVotes = period === "all" ? 1 : MIN_LEADERBOARD_VOTES;

    return [...byUser.values()]
      .filter((e) => e.total >= minVotes)
      .map((e) => ({
        user: e.user,
        totalPredictions: e.total,
        correctPredictions: e.correct,
        accuracy: e.correct / e.total,
      }))
      .sort((a, b) => b.accuracy - a.accuracy || b.correctPredictions - a.correctPredictions)
      .slice(0, limit);
  }
}
