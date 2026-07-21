import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import { prisma } from "@/lib/prisma";

const userListSelect = {
  id: true,
  discordId: true,
  displayName: true,
  avatarUrl: true,
  isAdmin: true,
  isModerator: true,
  isSuspended: true,
  kickUsername: true,
  kickVerified: true,
  catCoinBalance: true,
  totalEarned: true,
  totalSpent: true,
  createdAt: true,
  lastActiveAt: true,
} satisfies Prisma.UserSelect;

const FILTERS = ["all", "suspended", "admins", "moderators", "kick_pending"] as const;
type Filter = (typeof FILTERS)[number];

function parsePagination(req: Request) {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function assertNotSelf(req: Request, userId: string) {
  if (req.user!.id === userId) {
    throw createError.badRequest("You cannot perform this action on your own account");
  }
}

export const AdminController = {
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter = (typeof req.query.filter === "string" && (FILTERS as readonly string[]).includes(req.query.filter)
      ? req.query.filter
      : "all") as Filter;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { kickUsername: { contains: search, mode: "insensitive" } },
          { discordId: { contains: search } },
        ],
      }),
      ...(filter === "suspended" && { isSuspended: true }),
      ...(filter === "admins" && { isAdmin: true }),
      ...(filter === "moderators" && { isModerator: true }),
      ...(filter === "kick_pending" && { kickUsername: { not: null }, kickVerified: false }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: userListSelect, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, users, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }),

  getUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userListSelect });
    if (!user) throw createError.notFound("User not found");
    res.json({ success: true, user });
  }),

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      suspendedCount,
      adminCount,
      moderatorCount,
      kickVerifiedCount,
      kickPendingCount,
      newUsersLast7Days,
      coinAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({ where: { isModerator: true } }),
      prisma.user.count({ where: { kickVerified: true } }),
      prisma.user.count({ where: { kickUsername: { not: null }, kickVerified: false } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.aggregate({ _sum: { catCoinBalance: true } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        suspendedCount,
        adminCount,
        moderatorCount,
        kickVerifiedCount,
        kickPendingCount,
        newUsersLast7Days,
        totalCoinsInCirculation: coinAgg._sum.catCoinBalance ?? 0,
      },
    });
  }),

  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          admin: { select: { displayName: true, avatarUrl: true } },
          target: { select: { displayName: true, avatarUrl: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ success: true, logs, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  }),

  verifyKickUsername: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { verified } = req.body as { verified?: boolean };
    if (typeof verified !== "boolean") throw createError.badRequest("verified must be a boolean");

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { kickUsername: true } });
      if (!user) throw createError.notFound("User not found");
      if (!user.kickUsername) throw createError.badRequest("User has no Kick username to verify");

      await tx.user.update({ where: { id: userId }, data: { kickVerified: verified } });
      await tx.auditLog.create({
        data: {
          adminId: req.user!.id,
          targetId: userId,
          action: verified ? "kick.verify" : "kick.unverify",
        },
      });
    });

    res.json({ success: true });
  }),

  editKickUsername: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { kickUsername } = req.body as { kickUsername?: string | null };

    if (kickUsername) {
      const existing = await prisma.user.findUnique({ where: { kickUsername } });
      if (existing && existing.id !== userId) {
        throw createError.conflict("This Kick username is already linked to another account");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { kickUsername: kickUsername || null } });
      await tx.auditLog.create({
        data: { adminId: req.user!.id, targetId: userId, action: "kick.edit_username", details: { kickUsername } },
      });
    });

    res.json({ success: true });
  }),

  adjustCoins: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { amount, reason } = req.body as { amount?: number; reason?: string };

    assertNotSelf(req, userId);

    if (typeof amount !== "number" || !Number.isInteger(amount) || amount === 0) {
      throw createError.badRequest("amount must be a non-zero integer");
    }
    if (reason !== undefined && typeof reason !== "string") {
      throw createError.badRequest("reason must be a string");
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { catCoinBalance: true, totalEarned: true, totalSpent: true },
      });
      if (!user) throw createError.notFound("User not found");

      const newBalance = user.catCoinBalance + amount;
      if (newBalance < 0) throw createError.badRequest("This adjustment would take the balance below zero");

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          catCoinBalance: newBalance,
          ...(amount > 0 ? { totalEarned: user.totalEarned + amount } : { totalSpent: user.totalSpent + Math.abs(amount) }),
        },
        select: { catCoinBalance: true, totalEarned: true, totalSpent: true },
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user!.id,
          targetId: userId,
          action: "coins.adjust",
          details: { amount, reason: reason ?? null, newBalance: updated.catCoinBalance },
        },
      });

      return updated;
    });

    res.json({ success: true, ...result });
  }),

  setSuspended: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { suspended } = req.body as { suspended?: boolean };
    if (typeof suspended !== "boolean") throw createError.badRequest("suspended must be a boolean");

    assertNotSelf(req, userId);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw createError.notFound("User not found");

      await tx.user.update({ where: { id: userId }, data: { isSuspended: suspended } });
      await tx.auditLog.create({
        data: { adminId: req.user!.id, targetId: userId, action: suspended ? "user.suspend" : "user.unsuspend" },
      });
    });

    res.json({ success: true });
  }),

  setModerator: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { isModerator } = req.body as { isModerator?: boolean };
    if (typeof isModerator !== "boolean") throw createError.badRequest("isModerator must be a boolean");

    assertNotSelf(req, userId);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw createError.notFound("User not found");

      await tx.user.update({ where: { id: userId }, data: { isModerator } });
      await tx.auditLog.create({
        data: {
          adminId: req.user!.id,
          targetId: userId,
          action: isModerator ? "user.grant_moderator" : "user.revoke_moderator",
        },
      });
    });

    res.json({ success: true });
  }),
};
