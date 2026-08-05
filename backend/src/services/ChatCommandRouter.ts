import type { PredictionVoteSource } from "@prisma/client";
import { handlePredictionCommand } from "@/services/PredictionChatCommands";
import { handleLadderCommand } from "@/services/LadderChatCommands";
import { handleTournamentCommand } from "@/services/TournamentChatCommands";
import { handleHuntSuggestion, handleGuessCommand } from "@/services/HuntChatCommands";
import { handleBingoCommand } from "@/services/BingoChatCommands";

/** Single entry point both chat bots call — tries each stream game's command
 * parser in turn. Add new games' command handlers here as they're built.
 *
 * !sr <name> is shared: it means "call my tournament slot" if the chatter
 * is actually a drawn participant in a tournament picking slots, otherwise
 * it falls through to "suggest a slot" for whichever Bonus Hunt is live. */
export async function routeChatCommand(
  text: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<string | null> {
  const predictionReply = await handlePredictionCommand(text, chatUsername, source);
  if (predictionReply !== null) return predictionReply;

  const ladderReply = await handleLadderCommand(text);
  if (ladderReply !== null) return ladderReply;

  const tournamentReply = await handleTournamentCommand(text, chatUsername, source);
  if (tournamentReply !== null) return tournamentReply;

  const guessReply = await handleGuessCommand(text, chatUsername, source);
  if (guessReply !== null) return guessReply;

  const bingoReply = await handleBingoCommand(text, chatUsername, source);
  if (bingoReply !== null) return bingoReply;

  return handleHuntSuggestion(text, chatUsername, source);
}
