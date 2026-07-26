import { LadderService, LADDER_LEVELS } from "@/services/LadderService";
import { StreamGameService } from "@/services/StreamGameService";

export const CLIMB_THE_LADDER_SLUG = "climb-the-ladder";

const VOTE_COMMAND = /^!climb\s+(pass|fail|cashout|higher)\b/i;
const SIMPLE_COMMANDS: Record<string, true> = { "!climb status": true, "!climb rules": true };

/** Votes are silent — same chat rate-limit reasoning as the prediction game:
 * replying to every single !climb would flood chat almost instantly. */
async function handleVote(text: string): Promise<null> {
  const match = text.match(VOTE_COMMAND);
  if (!match) return null;

  const word = match[1].toLowerCase();
  const choice = word === "higher" ? "climb" : (word as "pass" | "fail" | "cashout");

  const game = await StreamGameService.getBySlug(CLIMB_THE_LADDER_SLUG).catch(() => null);
  if (!game) return null;

  await LadderService.recordChatVote(game.id, choice);
  return null;
}

async function handleSimple(command: string): Promise<string | null> {
  const game = await StreamGameService.getBySlug(CLIMB_THE_LADDER_SLUG).catch(() => null);
  if (!game) return null;

  if (command === "!climb rules") {
    return "Climb the Ladder: one climber, six rungs from 250 to 2,000 points. Clear a rung and they choose — cash out, or climb higher. Predict the outcome with !climb pass / !climb fail, or !climb cashout / !climb higher during the decision.";
  }

  const run = await LadderService.getActiveRun(game.id);
  if (!run) return "No climb running right now — check back when the stream's live!";

  if (command === "!climb status") {
    if (run.phase === "ATTEMPTING") {
      const attempting = LADDER_LEVELS[run.currentLevel];
      return `${run.participantName} is attempting Level ${attempting.level} (${attempting.points} pts) — !climb pass or !climb fail`;
    }
    const cleared = LADDER_LEVELS[run.currentLevel - 1];
    return `${run.participantName} cleared Level ${cleared.level} (${cleared.points} pts) — cash out or climb higher? !climb cashout or !climb higher`;
  }

  return null;
}

export async function handleLadderCommand(rawText: string): Promise<string | null> {
  const text = rawText.trim();
  if (!text.toLowerCase().startsWith("!climb")) return null;

  const voteReply = await handleVote(text);
  if (voteReply !== null) return voteReply;

  const command = text.toLowerCase().split(/\s+/).slice(0, 2).join(" ");
  if (!SIMPLE_COMMANDS[command]) return null;

  return handleSimple(command);
}
