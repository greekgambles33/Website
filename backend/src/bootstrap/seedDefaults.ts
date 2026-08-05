import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_SITE_CONTENT: Record<string, unknown> = {
  stream_status: { isLive: false, title: "Stream is offline right now", category: "Slots", viewers: 0, uptimeMinutes: 0 },
  hero_highlights: [
    { label: "Community Members", value: "0" },
    { label: "Coins Given Out", value: "0" },
    { label: "Nights Streamed", value: "0" },
  ],
  community_stats: [
    { label: "Members", value: 0 },
    { label: "Coins Distributed", value: 0 },
    { label: "Giveaways Run", value: 0 },
  ],
  announcements: [
    {
      id: "sample-announcement-1",
      title: "Welcome to the new site",
      body: "This is a sample announcement — edit or delete it from Admin → Site Content.",
      date: "Sample date",
      pinned: true,
    },
  ],
  store: [{ id: "sample-item-1", name: "Sample Store Item", price: 100, category: "Sample", limited: false }],
  community_highlights: [
    { id: "sample-highlight-1", username: "SampleUser", quote: "This is a sample community highlight — edit or delete it from Admin → Site Content." },
  ],
  games: [
    {
      id: "sample-game-1",
      name: "Sample Game",
      description: "This is a sample entry — edit it, delete it, or point it at one of your Stream Games.",
      status: "Coming Soon",
      participants: 0,
      href: "/stream-games",
    },
  ],
};

const DEFAULT_STREAM_GAMES = [
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
  {
    slug: "bonus-bingo",
    name: "Bonus Bingo",
    description: "Join with !join in chat, get drawn for a square, pick your bonus buy — profit turns it green. Complete a line to win.",
    sortOrder: 4,
  },
];

async function seedStreamGames(): Promise<void> {
  const owner = await prisma.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: "asc" } });
  if (!owner) {
    console.log("[bootstrap] no admin user yet — skipping Stream Games catalog seed until one logs in");
    return;
  }

  for (const game of DEFAULT_STREAM_GAMES) {
    await prisma.streamGame.upsert({
      where: { slug: game.slug },
      update: {},
      create: { ...game, createdById: owner.id },
    });
  }
  console.log(`[bootstrap] Stream Games catalog ready (${DEFAULT_STREAM_GAMES.length} entries)`);
}

/** Only fills in keys that don't exist yet — never touches a key an admin
 * has already saved, even an empty array (that's a deliberate "cleared"
 * state, not a missing one). */
async function seedSiteContent(): Promise<void> {
  const existing = await prisma.siteContent.findMany({ select: { key: true } });
  const existingKeys = new Set(existing.map((row) => row.key));

  let created = 0;
  for (const [key, data] of Object.entries(DEFAULT_SITE_CONTENT)) {
    if (existingKeys.has(key)) continue;
    await prisma.siteContent.create({ data: { key, data: data as Prisma.InputJsonValue } });
    created += 1;
  }
  if (created > 0) console.log(`[bootstrap] Site Content defaults seeded (${created} keys)`);
}

/** Best-effort, idempotent, never throws — a missing default here should
 * never take the server down (see the Twitch env var incident). Runs once
 * after the server starts listening. */
export async function seedDefaults(): Promise<void> {
  try {
    await seedStreamGames();
  } catch (err) {
    console.error("[bootstrap] seedStreamGames failed (non-fatal):", err);
  }

  try {
    await seedSiteContent();
  } catch (err) {
    console.error("[bootstrap] seedSiteContent failed (non-fatal):", err);
  }
}
