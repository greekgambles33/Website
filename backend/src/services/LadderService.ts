import { LadderRunPhase, LadderRunStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createError } from "@/middleware/errorHandler";

export interface LadderLevel {
  level: number;
  points: number;
  label: string;
  net: number | null;
}

/** The ladder's shape is fixed — one game, six rungs, always these numbers. */
export const LADDER_LEVELS: LadderLevel[] = [
  { level: 1, points: 250, label: "Easy challenge", net: null },
  { level: 2, points: 500, label: "Medium challenge", net: 250 },
  { level: 3, points: 750, label: "Harder challenge", net: null },
  { level: 4, points: 1000, label: "Chat-controlled challenge", net: null },
  { level: 5, points: 1500, label: "Hard challenge", net: 1000 },
  { level: 6, points: 2000, label: "The Final Climb", net: null },
];

const MAX_LEVEL = LADDER_LEVELS.length;

async function loadRunOrThrow(id: string) {
  const run = await prisma.ladderRun.findUnique({ where: { id } });
  if (!run) throw createError.notFound("Run not found");
  return run;
}

export class LadderService {
  static levels(): LadderLevel[] {
    return LADDER_LEVELS;
  }

  static async getActiveRun(streamGameId: string) {
    return prisma.ladderRun.findFirst({
      where: { streamGameId, status: LadderRunStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listRuns(streamGameId: string) {
    return prisma.ladderRun.findMany({
      where: { streamGameId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
  }

  static async createRun(userId: string, streamGameId: string, participantName: string) {
    const existing = await prisma.ladderRun.findFirst({
      where: { streamGameId, status: LadderRunStatus.ACTIVE },
    });
    if (existing) throw createError.conflict("There's already an active run for this game — end it first.");

    return prisma.ladderRun.create({
      data: { streamGameId, createdById: userId, participantName },
    });
  }

  static async deleteRun(id: string) {
    await loadRunOrThrow(id);
    await prisma.ladderRun.delete({ where: { id } });
  }

  /** The climber cleared the challenge at currentLevel + 1. */
  static async passChallenge(id: string) {
    const run = await loadRunOrThrow(id);
    if (run.status !== LadderRunStatus.ACTIVE || run.phase !== LadderRunPhase.ATTEMPTING) {
      throw createError.badRequest("This run isn't waiting on a challenge attempt");
    }

    const nextLevel = LADDER_LEVELS[run.currentLevel]; // currentLevel is 0-indexed count cleared, so this is the level just attempted
    const securedFloor = nextLevel.net ?? run.securedFloor;

    if (nextLevel.level === MAX_LEVEL) {
      return prisma.ladderRun.update({
        where: { id },
        data: {
          currentLevel: nextLevel.level,
          securedFloor,
          status: LadderRunStatus.COMPLETED,
          finalPoints: nextLevel.points,
          endedAt: new Date(),
        },
      });
    }

    return prisma.ladderRun.update({
      where: { id },
      data: {
        currentLevel: nextLevel.level,
        securedFloor,
        phase: LadderRunPhase.DECISION,
        chatCashoutVotes: 0,
        chatClimbVotes: 0,
      },
    });
  }

  /** The climber failed the challenge at currentLevel + 1 — drops to whatever's secured. */
  static async failChallenge(id: string) {
    const run = await loadRunOrThrow(id);
    if (run.status !== LadderRunStatus.ACTIVE || run.phase !== LadderRunPhase.ATTEMPTING) {
      throw createError.badRequest("This run isn't waiting on a challenge attempt");
    }

    return prisma.ladderRun.update({
      where: { id },
      data: {
        status: LadderRunStatus.FAILED,
        finalPoints: run.securedFloor,
        endedAt: new Date(),
      },
    });
  }

  static async cashOut(id: string) {
    const run = await loadRunOrThrow(id);
    if (run.status !== LadderRunStatus.ACTIVE || run.phase !== LadderRunPhase.DECISION) {
      throw createError.badRequest("This run isn't at a cash-out decision");
    }
    const cleared = LADDER_LEVELS[run.currentLevel - 1];

    return prisma.ladderRun.update({
      where: { id },
      data: { status: LadderRunStatus.CASHED_OUT, finalPoints: cleared.points, endedAt: new Date() },
    });
  }

  static async climbHigher(id: string) {
    const run = await loadRunOrThrow(id);
    if (run.status !== LadderRunStatus.ACTIVE || run.phase !== LadderRunPhase.DECISION) {
      throw createError.badRequest("This run isn't at a cash-out decision");
    }

    return prisma.ladderRun.update({
      where: { id },
      data: { phase: LadderRunPhase.ATTEMPTING, chatPassVotes: 0, chatFailVotes: 0 },
    });
  }

  /** Chat's non-binding prediction — silent tally, no per-viewer dedupe (flavor only, not scored). */
  static async recordChatVote(streamGameId: string, choice: "pass" | "fail" | "cashout" | "climb"): Promise<void> {
    const run = await this.getActiveRun(streamGameId);
    if (!run) return;

    if (run.phase === LadderRunPhase.ATTEMPTING && (choice === "pass" || choice === "fail")) {
      await prisma.ladderRun.update({
        where: { id: run.id },
        data: choice === "pass" ? { chatPassVotes: { increment: 1 } } : { chatFailVotes: { increment: 1 } },
      });
    } else if (run.phase === LadderRunPhase.DECISION && (choice === "cashout" || choice === "climb")) {
      await prisma.ladderRun.update({
        where: { id: run.id },
        data: choice === "cashout" ? { chatCashoutVotes: { increment: 1 } } : { chatClimbVotes: { increment: 1 } },
      });
    }
  }
}
