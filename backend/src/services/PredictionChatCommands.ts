import { PredictionChoice, PredictionRoundStatus, PredictionVoteSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PredictionService } from "@/services/PredictionService";
import { StreamGameService } from "@/services/StreamGameService";

/** The single Chat vs Streamer game's catalog slug. There's only one
 * prediction game for now, so the chat bots route every !win/!score/etc
 * command straight to it rather than needing per-game command routing. */
export const CHAT_VS_STREAMER_SLUG = "chat-vs-streamer";

const WIN_COMMAND = /^!win\s+(chat|streamer)\b/i;
const SIMPLE_COMMANDS: Record<string, true> = {
  "!score": true,
  "!streak": true,
  "!leaderboard": true,
  "!rules": true,
  "!status": true,
  "!wins": true,
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** Votes are recorded silently — with a busy chat, replying to every single
 * !win would blow through Twitch/Kick's chat rate limits almost instantly.
 * Viewers check the live tally with !status or !score instead. Always
 * "handled" (returns null either way) so a stray !win never falls through
 * to be treated as an unrecognized command. */
async function handleWin(text: string, chatUsername: string, source: PredictionVoteSource): Promise<null> {
  const match = text.match(WIN_COMMAND);
  if (!match) return null;

  const choice = match[1].toLowerCase() === "chat" ? PredictionChoice.CHAT : PredictionChoice.STREAMER;
  const game = await StreamGameService.getBySlug(CHAT_VS_STREAMER_SLUG).catch(() => null);
  if (!game) return null;

  await PredictionService.recordVote(game.id, chatUsername, choice, source);
  return null;
}

async function handleSimple(command: string, chatUsername: string, source: PredictionVoteSource): Promise<string | null> {
  const game = await StreamGameService.getBySlug(CHAT_VS_STREAMER_SLUG).catch(() => null);
  if (!game) return null;

  if (command === "!rules") {
    return "Chat vs Streamer: the streamer calls the next spin, chat votes !win streamer (they're right) or !win chat (they're wrong). Right call = point. Full rules on the site.";
  }

  const match = await PredictionService.getActiveMatch(game.id);
  if (!match) return "No match running right now — check back when the stream's live!";

  if (command === "!score") {
    return `CHAT ${match.chatScore} — STREAMER ${match.streamerScore} | First to ${match.targetScore} wins`;
  }

  if (command === "!streak") {
    return `Chat streak: ${match.chatStreak} | Streamer streak: ${match.streamerStreak}`;
  }

  if (command === "!status") {
    const openRound = match.rounds.find((r) => r.status === PredictionRoundStatus.OPEN);
    if (!openRound) return "No round open right now — hang tight for the next one.";
    return `Round ${openRound.roundNumber} OPEN — vote !win chat or !win streamer (${openRound.votesChat + openRound.votesStreamer} votes so far)`;
  }

  if (command === "!leaderboard") {
    const board = await PredictionService.getLeaderboard("week", 5);
    if (board.length === 0) return "No qualified predictors yet this week — keep voting!";
    const lines = board.map((e, i) => `${i + 1}) ${e.user.displayName} ${pct(e.accuracy)} (${e.correctPredictions}/${e.totalPredictions})`);
    return `Top predictors this week: ${lines.join(" ")}`;
  }

  if (command === "!wins") {
    const user = await prisma.user.findFirst({
      where:
        source === PredictionVoteSource.TWITCH
          ? { twitchUsername: { equals: chatUsername, mode: "insensitive" }, twitchVerified: true }
          : { kickUsername: { equals: chatUsername, mode: "insensitive" }, kickVerified: true },
      select: { id: true },
    });
    if (!user) return `@${chatUsername} link your account on the site to track your personal record!`;

    const stats = await PredictionService.getUserStats(user.id);
    if (stats.totalPredictions === 0) return `@${chatUsername} no predictions logged yet — vote with !win chat or !win streamer!`;
    return `@${chatUsername}: ${stats.correctPredictions} correct, ${pct(stats.accuracy)} accuracy, best streak ${stats.longestStreak}`;
  }

  return null;
}

/** Parses one chat message and returns a reply to post, or null if the
 * message wasn't a recognized command (or there's nothing worth saying). */
export async function handlePredictionCommand(
  rawText: string,
  chatUsername: string,
  source: PredictionVoteSource
): Promise<string | null> {
  const text = rawText.trim();
  if (!text.startsWith("!")) return null;

  const winReply = await handleWin(text, chatUsername, source);
  if (winReply !== null) return winReply;

  const command = text.split(/\s+/)[0].toLowerCase();
  if (!SIMPLE_COMMANDS[command]) return null;

  return handleSimple(command, chatUsername, source);
}
