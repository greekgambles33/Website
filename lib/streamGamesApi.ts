"use client";

import {
  API_ENDPOINTS,
  type StreamGame,
  type PredictionMatch,
  type PredictionLeaderboardEntry,
  type PredictionUserStats,
  type LadderLevel,
  type LadderRun,
  type BingoGame,
} from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class StreamGameApiError extends Error {}

async function streamGameFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new StreamGameApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ---------- Catalog: public reads ----------

export async function fetchStreamGames(): Promise<StreamGame[]> {
  const data = await streamGameFetch<{ games: StreamGame[] }>(API_ENDPOINTS.STREAM_GAMES, { cache: "no-store" });
  return data.games;
}

export async function fetchStreamGameBySlug(slug: string): Promise<StreamGame> {
  const data = await streamGameFetch<{ game: StreamGame }>(API_ENDPOINTS.STREAM_GAME_BY_SLUG(slug), {
    cache: "no-store",
  });
  return data.game;
}

// ---------- Catalog: moderator/admin management ----------

export async function fetchAllStreamGames(): Promise<StreamGame[]> {
  const data = await streamGameFetch<{ games: StreamGame[] }>(API_ENDPOINTS.STREAM_GAMES_ALL);
  return data.games;
}

export async function createStreamGame(input: {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}): Promise<StreamGame> {
  const data = await streamGameFetch<{ game: StreamGame }>(API_ENDPOINTS.STREAM_GAMES, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.game;
}

export async function updateStreamGame(
  id: string,
  patch: Partial<{
    name: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    isVisible: boolean;
    prizeModeEnabled: boolean;
    prizeRulesText: string | null;
  }>
): Promise<StreamGame> {
  const data = await streamGameFetch<{ game: StreamGame }>(API_ENDPOINTS.STREAM_GAME(id), {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return data.game;
}

export async function deleteStreamGame(id: string): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.STREAM_GAME(id), { method: "DELETE" });
}

export async function reorderStreamGames(orderedIds: string[]): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.STREAM_GAMES_REORDER, {
    method: "POST",
    body: JSON.stringify({ orderedIds }),
  });
}

// ---------- Chat vs Streamer: public reads ----------

export async function fetchActivePredictionMatch(slug: string): Promise<PredictionMatch | null> {
  const data = await streamGameFetch<{ match: PredictionMatch | null }>(API_ENDPOINTS.PREDICTION_ACTIVE_MATCH(slug), {
    cache: "no-store",
  });
  return data.match;
}

export async function fetchPredictionMatch(matchId: string): Promise<PredictionMatch> {
  const data = await streamGameFetch<{ match: PredictionMatch }>(API_ENDPOINTS.PREDICTION_MATCH(matchId), {
    cache: "no-store",
  });
  return data.match;
}

export async function fetchPredictionLeaderboard(period: "week" | "month" | "all"): Promise<PredictionLeaderboardEntry[]> {
  const data = await streamGameFetch<{ leaderboard: PredictionLeaderboardEntry[] }>(
    `${API_ENDPOINTS.PREDICTION_LEADERBOARD}?period=${period}`,
    { cache: "no-store" }
  );
  return data.leaderboard;
}

export async function fetchMyPredictionStats(): Promise<PredictionUserStats> {
  const data = await streamGameFetch<{ stats: PredictionUserStats }>(API_ENDPOINTS.PREDICTION_MY_STATS);
  return data.stats;
}

// ---------- Chat vs Streamer: moderator/admin control panel ----------

export async function fetchPredictionMatches(slug: string): Promise<PredictionMatch[]> {
  const data = await streamGameFetch<{ matches: PredictionMatch[] }>(API_ENDPOINTS.PREDICTION_MATCHES(slug));
  return data.matches;
}

export async function createPredictionMatch(
  slug: string,
  input: { format?: "SHORT" | "NORMAL" | "EVENT"; targetScore?: number }
): Promise<PredictionMatch> {
  const data = await streamGameFetch<{ match: PredictionMatch }>(API_ENDPOINTS.PREDICTION_MATCHES(slug), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.match;
}

export async function endPredictionMatch(matchId: string, challengeText?: string | null): Promise<PredictionMatch> {
  const data = await streamGameFetch<{ match: PredictionMatch }>(API_ENDPOINTS.PREDICTION_MATCH_END(matchId), {
    method: "POST",
    body: JSON.stringify({ challengeText }),
  });
  return data.match;
}

export async function setPredictionChallenge(matchId: string, challengeText: string | null): Promise<PredictionMatch> {
  const data = await streamGameFetch<{ match: PredictionMatch }>(API_ENDPOINTS.PREDICTION_MATCH_CHALLENGE(matchId), {
    method: "PUT",
    body: JSON.stringify({ challengeText }),
  });
  return data.match;
}

export async function openPredictionRound(
  matchId: string,
  input: { question: string; streamerCall: string }
): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.PREDICTION_ROUNDS(matchId), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function lockPredictionRound(roundId: string): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.PREDICTION_ROUND_LOCK(roundId), { method: "POST" });
}

export async function voidPredictionRound(roundId: string): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.PREDICTION_ROUND_VOID(roundId), { method: "POST" });
}

export async function resolvePredictionRound(roundId: string, streamerCorrect: boolean): Promise<PredictionMatch> {
  const data = await streamGameFetch<{ match: PredictionMatch }>(API_ENDPOINTS.PREDICTION_ROUND_RESOLVE(roundId), {
    method: "POST",
    body: JSON.stringify({ streamerCorrect }),
  });
  return data.match;
}

// ---------- Climb the Ladder: public reads ----------

export async function fetchLadderLevels(): Promise<LadderLevel[]> {
  const data = await streamGameFetch<{ levels: LadderLevel[] }>(API_ENDPOINTS.LADDER_LEVELS);
  return data.levels;
}

export async function fetchActiveLadderRun(slug: string): Promise<LadderRun | null> {
  const data = await streamGameFetch<{ run: LadderRun | null }>(API_ENDPOINTS.LADDER_ACTIVE_RUN(slug), {
    cache: "no-store",
  });
  return data.run;
}

export async function fetchLadderRuns(slug: string): Promise<LadderRun[]> {
  const data = await streamGameFetch<{ runs: LadderRun[] }>(API_ENDPOINTS.LADDER_RUNS(slug), { cache: "no-store" });
  return data.runs;
}

// ---------- Climb the Ladder: moderator/admin control panel ----------

export async function createLadderRun(slug: string, participantName: string): Promise<LadderRun> {
  const data = await streamGameFetch<{ run: LadderRun }>(API_ENDPOINTS.LADDER_RUNS(slug), {
    method: "POST",
    body: JSON.stringify({ participantName }),
  });
  return data.run;
}

export async function deleteLadderRun(runId: string): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.LADDER_RUN(runId), { method: "DELETE" });
}

export async function passLadderChallenge(runId: string): Promise<LadderRun> {
  const data = await streamGameFetch<{ run: LadderRun }>(API_ENDPOINTS.LADDER_RUN_PASS(runId), { method: "POST" });
  return data.run;
}

export async function failLadderChallenge(runId: string): Promise<LadderRun> {
  const data = await streamGameFetch<{ run: LadderRun }>(API_ENDPOINTS.LADDER_RUN_FAIL(runId), { method: "POST" });
  return data.run;
}

export async function cashOutLadderRun(runId: string): Promise<LadderRun> {
  const data = await streamGameFetch<{ run: LadderRun }>(API_ENDPOINTS.LADDER_RUN_CASHOUT(runId), { method: "POST" });
  return data.run;
}

export async function climbLadderHigher(runId: string): Promise<LadderRun> {
  const data = await streamGameFetch<{ run: LadderRun }>(API_ENDPOINTS.LADDER_RUN_CLIMB(runId), { method: "POST" });
  return data.run;
}

// ---------- Bonus Bingo: public reads ----------

export async function fetchBingoGames(slug: string): Promise<BingoGame[]> {
  const data = await streamGameFetch<{ games: BingoGame[] }>(API_ENDPOINTS.BINGO_GAMES(slug), { cache: "no-store" });
  return data.games;
}

export async function fetchActiveBingoGame(slug: string): Promise<BingoGame | null> {
  const data = await streamGameFetch<{ game: BingoGame | null }>(API_ENDPOINTS.BINGO_ACTIVE_GAME(slug), { cache: "no-store" });
  return data.game;
}

export async function fetchBingoGame(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME(id), { cache: "no-store" });
  return data.game;
}

// ---------- Bonus Bingo: moderator/admin control panel ----------

export async function createBingoGame(
  slug: string,
  input: { title: string; gridSize?: 3 | 4 | 5; linePoints?: number; keyword?: string }
): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAMES(slug), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.game;
}

export async function setBingoKeyword(id: string, keyword: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_KEYWORD(id), {
    method: "POST",
    body: JSON.stringify({ keyword }),
  });
  return data.game;
}

export async function openBingoRegistration(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_OPEN_REGISTRATION(id), { method: "POST" });
  return data.game;
}

export async function startBingoGame(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_START(id), { method: "POST" });
  return data.game;
}

export async function spinBingoCell(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_SPIN(id), { method: "POST" });
  return data.game;
}

export async function drawBingoPlayer(id: string, includeWinners: boolean): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_DRAW(id), {
    method: "POST",
    body: JSON.stringify({ includeWinners }),
  });
  return data.game;
}

export async function setBingoCellSlot(id: string, cellId: string, slotName: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_CELL_SLOT(id, cellId), {
    method: "POST",
    body: JSON.stringify({ slotName }),
  });
  return data.game;
}

export async function markBingoResult(id: string, won: boolean): Promise<{ game: BingoGame; newLineWins: BingoGame["lineWins"] }> {
  return streamGameFetch<{ game: BingoGame; newLineWins: BingoGame["lineWins"] }>(API_ENDPOINTS.BINGO_GAME_RESULT(id), {
    method: "POST",
    body: JSON.stringify({ won }),
  });
}

export async function completeBingoGame(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_COMPLETE(id), { method: "POST" });
  return data.game;
}

export async function unliveBingoGame(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_UNLIVE(id), { method: "POST" });
  return data.game;
}

export async function cancelBingoGame(id: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_CANCEL(id), { method: "POST" });
  return data.game;
}

export async function deleteBingoGame(id: string): Promise<void> {
  await streamGameFetch(API_ENDPOINTS.BINGO_GAME(id), { method: "DELETE" });
}

export async function addBingoParticipant(id: string, chatUsername: string, preferredSlot?: string | null): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_PARTICIPANTS(id), {
    method: "POST",
    body: JSON.stringify({ chatUsername, preferredSlot }),
  });
  return data.game;
}

export async function removeBingoParticipant(id: string, chatUsername: string): Promise<BingoGame> {
  const data = await streamGameFetch<{ game: BingoGame }>(API_ENDPOINTS.BINGO_GAME_PARTICIPANT(id, chatUsername), {
    method: "DELETE",
  });
  return data.game;
}
