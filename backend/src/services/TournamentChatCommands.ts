import { PredictionVoteSource, TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TournamentService } from "@/services/TournamentService";
import { CustomError } from "@/middleware/errorHandler";

const SLOT_REQUEST_COMMAND = /^!sr\s+(.+)/i;

/** !sr <slot name> — a chat shortcut for the same slot-call form on the
 * tournament page. Only works for a verified chatter who's actually been
 * drawn into the tournament currently in slot selection. */
export async function handleTournamentCommand(
  rawText: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<string | null> {
  const match = rawText.trim().match(SLOT_REQUEST_COMMAND);
  if (!match) return null;

  const slotName = match[1].trim();
  if (!slotName) return null;

  const tournament = await prisma.tournament.findFirst({
    where: { status: TournamentStatus.SLOT_SELECTION },
    orderBy: { createdAt: "desc" },
  });
  if (!tournament) return `@${chatUsername} no tournament is picking slots right now.`;

  const user = await prisma.user.findFirst({
    where:
      source === PredictionVoteSource.TWITCH
        ? { twitchUsername: { equals: chatUsername, mode: "insensitive" }, twitchVerified: true }
        : { kickUsername: { equals: chatUsername, mode: "insensitive" }, kickVerified: true },
    select: { id: true },
  });
  if (!user) return `@${chatUsername} link your account on the site first to call a slot from chat.`;

  try {
    await TournamentService.setSlot(tournament.id, user.id, slotName);
    return `@${chatUsername} slot locked in: ${slotName}`;
  } catch (err) {
    const message = err instanceof CustomError ? err.message : "Failed to call that slot.";
    return `@${chatUsername} ${message}`;
  }
}
