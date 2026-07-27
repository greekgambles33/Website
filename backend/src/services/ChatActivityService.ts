import { PredictionVoteSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const COOLDOWN_SECONDS = 5 * 60;
const COOLDOWN_PREFIX = "chat_activity_cooldown:";

/** Awards 1 CatCoin per verified chatter, at most once every 5 minutes,
 * regardless of how many messages they send in that window. Only works for
 * viewers who've linked their Twitch/Kick account — there's no site user to
 * credit otherwise. Silent no-op on any miss (unknown user, on cooldown). */
export async function awardChatActivityPoint(rawChatUsername: string, source: PredictionVoteSource): Promise<void> {
  const chatUsername = rawChatUsername.trim().toLowerCase();
  if (!chatUsername) return;

  const user = await prisma.user.findFirst({
    where:
      source === PredictionVoteSource.TWITCH
        ? { twitchUsername: { equals: chatUsername, mode: "insensitive" }, twitchVerified: true }
        : { kickUsername: { equals: chatUsername, mode: "insensitive" }, kickVerified: true },
    select: { id: true },
  });
  if (!user) return;

  const cooldownKey = `${COOLDOWN_PREFIX}${user.id}`;
  if (await redis.get(cooldownKey)) return;
  await redis.set(cooldownKey, "1", COOLDOWN_SECONDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { catCoinBalance: { increment: 1 }, totalEarned: { increment: 1 } },
  });
}
