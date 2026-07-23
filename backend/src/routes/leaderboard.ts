import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/lib/prisma";

const router = Router();

function tierFor(balance: number): string {
  if (balance >= 50_000) return "Cat King";
  if (balance >= 25_000) return "Mythic Cat";
  if (balance >= 10_000) return "Alpha Cat";
  if (balance >= 2_500) return "Ember Cat";
  return "Stray Cat";
}

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));

    const users = await prisma.user.findMany({
      where: { isSuspended: false, catCoinBalance: { gt: 0 } },
      orderBy: { catCoinBalance: "desc" },
      take: limit,
      select: { id: true, displayName: true, avatarUrl: true, catCoinBalance: true },
    });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.displayName,
      avatarUrl: u.avatarUrl,
      coins: u.catCoinBalance,
      tier: tierFor(u.catCoinBalance),
    }));

    res.json({ success: true, leaderboard });
  })
);

export default router;
