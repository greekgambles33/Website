import type { PredictionVoteSource } from "@prisma/client";
import { handlePredictionCommand } from "@/services/PredictionChatCommands";
import { handleLadderCommand } from "@/services/LadderChatCommands";
import { handleTournamentCommand } from "@/services/TournamentChatCommands";

/** Single entry point both chat bots call — tries each stream game's command
 * parser in turn. Add new games' command handlers here as they're built. */
export async function routeChatCommand(
  text: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<string | null> {
  const predictionReply = await handlePredictionCommand(text, chatUsername, source);
  if (predictionReply !== null) return predictionReply;

  const ladderReply = await handleLadderCommand(text);
  if (ladderReply !== null) return ladderReply;

  return handleTournamentCommand(text, chatUsername, source);
}
