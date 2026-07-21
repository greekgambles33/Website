import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { createError } from "@/middleware/errorHandler";

const PENDING_PREFIX = "kick_verify:";
const CODE_PREFIX = "kick_verify_code:";
const SIGNAL_PREFIX = "kick_verified_signal:";
const TTL_SECONDS = 600;

interface PendingVerification {
  kickUsername: string;
  code: string;
}

export class KickVerificationService {
  static async initiate(userId: string, kickUsernameInput: string): Promise<{ code: string; kickUsername: string }> {
    const kickUsername = kickUsernameInput.trim();
    if (!kickUsername) throw createError.badRequest("Kick username is required");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError.notFound("User not found");

    if (user.kickUsername && user.kickUsername.toLowerCase() !== kickUsername.toLowerCase()) {
      throw createError.conflict(
        "This account is already linked to a different Kick username. Contact an admin to change it."
      );
    }

    const existing = await prisma.user.findUnique({ where: { kickUsername } });
    if (existing && existing.id !== userId) {
      throw createError.conflict("This Kick username is already linked to another account.");
    }

    const code = randomBytes(3).toString("hex").toUpperCase();

    await redis.setJSON(`${PENDING_PREFIX}${userId}`, { kickUsername, code } satisfies PendingVerification, TTL_SECONDS);
    await redis.set(`${CODE_PREFIX}${code}`, userId, TTL_SECONDS);

    return { code, kickUsername };
  }

  static async status(userId: string): Promise<{ verified: boolean; kickUsername: string | null }> {
    const signalUsername = await redis.get(`${SIGNAL_PREFIX}${userId}`);
    if (signalUsername) return { verified: true, kickUsername: signalUsername };

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { kickVerified: true, kickUsername: true } });
    return { verified: !!user?.kickVerified, kickUsername: user?.kickUsername ?? null };
  }

  /** Called by KickChatService when it sees "!verify CODE" from kickUsername in chat. */
  static async processVerification(kickUsername: string, code: string): Promise<string | null> {
    const userId = await redis.get(`${CODE_PREFIX}${code}`);
    if (!userId) return null;

    const pending = await redis.getJSON<PendingVerification>(`${PENDING_PREFIX}${userId}`);
    if (!pending || pending.code !== code) return null;
    if (pending.kickUsername.toLowerCase() !== kickUsername.toLowerCase()) return null;

    await prisma.user.update({
      where: { id: userId },
      data: { kickUsername: pending.kickUsername, kickVerified: true },
    });

    await redis.del(`${CODE_PREFIX}${code}`);
    await redis.del(`${PENDING_PREFIX}${userId}`);
    await redis.set(`${SIGNAL_PREFIX}${userId}`, pending.kickUsername, 300);

    return pending.kickUsername;
  }

  static async unlink(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { kickVerified: false } });
  }
}
