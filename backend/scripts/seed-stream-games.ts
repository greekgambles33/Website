import { prisma } from "@/lib/prisma";

/** Idempotent — safe to re-run. Creates the four catalog entries for
 * /stream-games if they don't already exist; leaves existing rows alone. */
async function main() {
  const owner = await prisma.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: "asc" } });
  if (!owner) {
    console.error("No admin user found — log in as an admin at least once before running this script.");
    process.exit(1);
  }

  const games = [
    {
      slug: "bonus-hunt",
      name: "Bonus Hunt",
      description: "Follow the live bonus hunt — bet size, multiplier, and payout as every slot in the collection gets opened.",
      sortOrder: 0,
    },
    {
      slug: "tournament",
      name: "Tournament",
      description: "Bracket-style slot tournament — enter the raffle, get drawn a slot, and battle it out round by round.",
      sortOrder: 1,
    },
    {
      slug: "chat-vs-streamer",
      name: "Chat vs Streamer",
      description: "The streamer calls it, chat votes on Twitch or Kick with !win chat or !win streamer. Right call wins the point.",
      sortOrder: 2,
    },
    {
      slug: "climb-the-ladder",
      name: "Climb the Ladder",
      description: "One climber, six rungs, 250 to 2,000 points. Predict every challenge with !climb pass / !climb fail.",
      sortOrder: 3,
    },
  ];

  for (const game of games) {
    const result = await prisma.streamGame.upsert({
      where: { slug: game.slug },
      update: {},
      create: { ...game, createdById: owner.id },
    });
    console.log(`${result.slug}: ${result.id}`);
  }

  process.exit(0);
}

main();
