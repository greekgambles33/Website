import { prisma } from "@/lib/prisma";
import { AuthService } from "@/services/AuthService";

async function main() {
  const user = await prisma.user.upsert({
    where: { discordId: "test-discord-id-1" },
    update: {},
    create: { discordId: "test-discord-id-1", displayName: "Test Cat", avatarUrl: null },
  });

  const publicUser = {
    id: user.id,
    discordId: user.discordId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    isModerator: user.isModerator,
    kickUsername: user.kickUsername,
    kickVerified: user.kickVerified,
    catCoinBalance: user.catCoinBalance,
    totalEarned: user.totalEarned,
    totalSpent: user.totalSpent,
    createdAt: user.createdAt,
  };

  const tokens = AuthService.generateTokens(publicUser);
  await AuthService.storeSession(publicUser, tokens);

  console.log(JSON.stringify({ userId: user.id, ...tokens, displayName: user.displayName }));
  process.exit(0);
}

main();
