import { PredictionVoteSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HuntService } from "@/services/HuntService";

const SLOT_REQUEST_COMMAND = /^!sr\s+(.+)/i;

/** !sr <slot name> while a hunt is live — queues a suggestion for the admin
 * to review in the Hunt Tracker builder. Always silent (no chat reply):
 * with potentially dozens of viewers suggesting slots, replying to each one
 * would flood chat the same way replying to every prediction vote would. */
export async function handleHuntSuggestion(
  rawText: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<null> {
  const match = rawText.trim().match(SLOT_REQUEST_COMMAND);
  if (!match) return null;

  const slotName = match[1].trim();
  if (!slotName) return null;

  const hunt = await prisma.hunt.findFirst({ where: { isLive: true }, orderBy: { updatedAt: "desc" } });
  if (!hunt) return null;

  await HuntService.suggestSlot(hunt.id, chatUsername, source, slotName);
  return null;
}
