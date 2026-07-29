import { PredictionVoteSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HuntService } from "@/services/HuntService";

const SLOT_REQUEST_COMMAND = /^!sr\s+(.+)/i;
const GUESS_COMMAND = /^!guess\s+\$?([\d,]+(?:\.\d+)?)/i;

/** Recognized provider prefixes for !sr, longest alias first so "no limit
 * city" matches before the shorter "no limit". Canonical names here must
 * match SLOT_PROVIDERS in app/hunt-tracker/[id]/page.tsx on the frontend. */
const PROVIDER_ALIASES_RAW: [alias: string, canonical: string][] = [
  ["nolimit city", "Nolimit City"],
  ["no limit city", "Nolimit City"],
  ["nolimitcity", "Nolimit City"],
  ["no limit", "Nolimit City"],
  ["nolimit", "Nolimit City"],
  ["pragmatic play", "Pragmatic Play"],
  ["pragmatic", "Pragmatic Play"],
  ["hacksaw gaming", "Hacksaw Gaming"],
  ["hacksaw", "Hacksaw Gaming"],
  ["big time gaming", "Big Time Gaming"],
  ["big time", "Big Time Gaming"],
  ["bigtime", "Big Time Gaming"],
  ["play n go", "Play'n GO"],
  ["play'n go", "Play'n GO"],
  ["playngo", "Play'n GO"],
  ["push gaming", "Push Gaming"],
  ["push", "Push Gaming"],
  ["relax gaming", "Relax Gaming"],
  ["relax", "Relax Gaming"],
  ["red tiger", "Red Tiger"],
  ["redtiger", "Red Tiger"],
  ["blueprint gaming", "Blueprint Gaming"],
  ["blueprint", "Blueprint Gaming"],
  ["elk studios", "ELK Studios"],
  ["elk", "ELK Studios"],
  ["quickspin", "Quickspin"],
  ["netent", "NetEnt"],
  ["playtech", "Playtech"],
  ["thunderkick", "Thunderkick"],
];

const PROVIDER_ALIASES = [...PROVIDER_ALIASES_RAW].sort((a, b) => b[0].length - a[0].length);

function parseProviderAndName(raw: string): { provider: string; slotName: string } {
  const lower = raw.toLowerCase();
  for (const [alias, canonical] of PROVIDER_ALIASES) {
    if (lower === alias) continue; // provider with no slot name isn't useful
    if (lower.startsWith(`${alias} `)) {
      const rest = raw.slice(alias.length).trim();
      if (rest) return { provider: canonical, slotName: rest };
    }
  }
  return { provider: "Other", slotName: raw.trim() };
}

/** !sr [provider] <slot name> while a hunt is live — e.g. "!sr pragmatic
 * gates of olympus" or just "!sr wanted dead or a wild". Queues a
 * suggestion, grouped by provider, for the admin to review in the Hunt
 * Tracker builder. Always silent (no chat reply): with potentially dozens
 * of viewers suggesting slots, replying to each one would flood chat the
 * same way replying to every prediction vote would. */
export async function handleHuntSuggestion(
  rawText: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<null> {
  const match = rawText.trim().match(SLOT_REQUEST_COMMAND);
  if (!match) return null;

  const { provider, slotName } = parseProviderAndName(match[1].trim());
  if (!slotName) return null;

  const hunt = await prisma.hunt.findFirst({ where: { isLive: true }, orderBy: { updatedAt: "desc" } });
  if (!hunt) return null;

  await HuntService.suggestSlot(hunt.id, chatUsername, source, slotName, provider);
  return null;
}

/** !guess <amount> — "Guess the Balance" from chat, e.g. "!guess 1250" or
 * "!guess $1,250.50". Only works while the admin has guessing open, and
 * only for a verified Twitch/Kick account (same as every other chat game —
 * there's no site account to credit a guess to otherwise). Replies once on
 * a successful submission; silent on anything that doesn't apply, so
 * viewers testing the command before it's open don't spam chat. */
export async function handleGuessCommand(
  rawText: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<string | null> {
  const match = rawText.trim().match(GUESS_COMMAND);
  if (!match) return null;

  const guess = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(guess) || guess < 0) return null;

  const hunt = await prisma.hunt.findFirst({ where: { guessesOpen: true }, orderBy: { updatedAt: "desc" } });
  if (!hunt) return null;

  const user = await prisma.user.findFirst({
    where:
      source === PredictionVoteSource.TWITCH
        ? { twitchUsername: { equals: chatUsername, mode: "insensitive" }, twitchVerified: true }
        : { kickUsername: { equals: chatUsername, mode: "insensitive" }, kickVerified: true },
    select: { id: true },
  });
  if (!user) return null;

  try {
    await HuntService.submitGuess(hunt.id, user.id, guess);
    return `@${chatUsername} guess locked in: ${guess.toFixed(2)} ${hunt.currency}`;
  } catch {
    return null;
  }
}
