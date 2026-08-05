import { PredictionVoteSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BingoService } from "@/services/BingoService";
import { StreamGameService } from "@/services/StreamGameService";
import { CustomError } from "@/middleware/errorHandler";

export const BONUS_BINGO_SLUG = "bonus-bingo";

const SLOT_COMMAND = /^!slot\s+(.+)/i;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveUserId(chatUsername: string, source: PredictionVoteSource): Promise<string | null> {
  const normalized = chatUsername.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where:
      source === PredictionVoteSource.TWITCH
        ? { twitchUsername: { equals: normalized, mode: "insensitive" }, twitchVerified: true }
        : { kickUsername: { equals: normalized, mode: "insensitive" }, kickVerified: true },
    select: { id: true },
  });
  return user?.id ?? null;
}

/** "<keyword>" or "<keyword> <slot name>" — keyword is per-game admin-configurable
 * (default "!join"). Joining is silent-ish: only replies on success/known failure,
 * never for a stray message that just doesn't match the active game's keyword. */
async function handleJoin(rawText: string, chatUsername: string, source: PredictionVoteSource): Promise<string | null> {
  const game = await StreamGameService.getBySlug(BONUS_BINGO_SLUG).catch(() => null);
  if (!game) return null;

  const active = await BingoService.getActive(game.id);
  if (!active) return null;

  const escaped = escapeRegExp(active.keyword.trim());
  const match = rawText.trim().match(new RegExp(`^${escaped}(?:\\s+(.+))?$`, "i"));
  if (!match) return null;

  const preferredSlot = match[1]?.trim() || null;
  const userId = await resolveUserId(chatUsername, source);

  try {
    const wasAlready = active.participants.some((p) => p.chatUsername === chatUsername.trim().toLowerCase());
    await BingoService.join(active.id, chatUsername, userId, preferredSlot);
    return wasAlready
      ? `@${chatUsername} updated your default slot to "${preferredSlot}"!`
      : `${chatUsername} has joined Bonus Bingo! 🎉`;
  } catch {
    // Bare repeat joins / mid-turn joins are expected, not errors — stay silent.
    return null;
  }
}

/** "!slot <name>" — only does anything if this chatter is the currently
 * drawn player on an active bingo cell with no slot chosen yet. */
async function handleSlot(rawText: string, chatUsername: string): Promise<string | null> {
  const match = rawText.trim().match(SLOT_COMMAND);
  if (!match) return null;
  const slotName = match[1].trim();
  if (!slotName) return null;

  const game = await StreamGameService.getBySlug(BONUS_BINGO_SLUG).catch(() => null);
  if (!game) return null;

  const active = await BingoService.getActive(game.id);
  if (!active || !active.currentCellId) return null;

  const normalized = chatUsername.trim().toLowerCase();
  if (active.currentChatUsername !== normalized) return null;

  const activeCell = active.cells.find((c) => c.id === active.currentCellId);
  if (!activeCell || activeCell.slotName) return null;

  try {
    await BingoService.setSlot(active.id, active.currentCellId, slotName, normalized, false);
    return `${chatUsername} has picked "${slotName}" as their slot! 🎰`;
  } catch (err) {
    return err instanceof CustomError ? `@${chatUsername} ${err.message}` : null;
  }
}

export async function handleBingoCommand(
  rawText: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<string | null> {
  const slotReply = await handleSlot(rawText, chatUsername);
  if (slotReply !== null) return slotReply;

  return handleJoin(rawText, chatUsername, source);
}
