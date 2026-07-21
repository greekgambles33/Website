"use client";

import { API_ENDPOINTS, type Tournament, type FullTournament, type TournamentEntry } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class TournamentApiError extends Error {}

async function tFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
    throw new TournamentApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ---------- Public / viewer ----------

export async function fetchTournaments(): Promise<Tournament[]> {
  const data = await tFetch<{ tournaments: Tournament[] }>(API_ENDPOINTS.TOURNAMENTS, { cache: "no-store" });
  return data.tournaments;
}

export async function fetchTournament(id: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT(id), { cache: "no-store" });
  return data.tournament;
}

export async function fetchMyEntry(
  id: string
): Promise<{ entered: boolean; participant: FullTournament["participants"][number] | null }> {
  return tFetch(API_ENDPOINTS.TOURNAMENT_MY_ENTRY(id));
}

export async function enterRaffle(id: string): Promise<void> {
  await tFetch(API_ENDPOINTS.TOURNAMENT_ENTER(id), { method: "POST" });
}

export async function leaveRaffle(id: string): Promise<void> {
  await tFetch(API_ENDPOINTS.TOURNAMENT_ENTER(id), { method: "DELETE" });
}

export async function setSlot(id: string, slotCall: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_SLOT(id), {
    method: "POST",
    body: JSON.stringify({ slotCall }),
  });
  return data.tournament;
}

// ---------- Admin ----------

export async function createTournament(input: {
  title: string;
  maxPlayers?: number;
  slotTimerSeconds?: number;
  prizeCoins?: number;
}): Promise<Tournament> {
  const data = await tFetch<{ tournament: Tournament }>(API_ENDPOINTS.TOURNAMENTS, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.tournament;
}

export async function deleteTournament(id: string): Promise<void> {
  await tFetch(API_ENDPOINTS.TOURNAMENT(id), { method: "DELETE" });
}

export async function cancelTournament(id: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_CANCEL(id), { method: "POST" });
  return data.tournament;
}

export async function openRegistration(id: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_OPEN_REGISTRATION(id), {
    method: "POST",
  });
  return data.tournament;
}

export async function fetchEntries(id: string): Promise<TournamentEntry[]> {
  const data = await tFetch<{ entries: TournamentEntry[] }>(API_ENDPOINTS.TOURNAMENT_ENTRIES(id));
  return data.entries;
}

export async function drawWinners(id: string, count: number, guaranteedUserIds: string[]): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_DRAW(id), {
    method: "POST",
    body: JSON.stringify({ count, guaranteedUserIds }),
  });
  return data.tournament;
}

export async function rerollParticipant(id: string, participantId: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(
    API_ENDPOINTS.TOURNAMENT_PARTICIPANT_REROLL(id, participantId),
    { method: "POST" }
  );
  return data.tournament;
}

export async function startTournament(id: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_START(id), { method: "POST" });
  return data.tournament;
}

export async function declareMatchWinner(matchId: string, winnerId: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_MATCH_WINNER(matchId), {
    method: "POST",
    body: JSON.stringify({ winnerId }),
  });
  return data.tournament;
}

export async function revertMatchWinner(matchId: string): Promise<FullTournament> {
  const data = await tFetch<{ tournament: FullTournament }>(API_ENDPOINTS.TOURNAMENT_MATCH_WINNER(matchId), {
    method: "DELETE",
  });
  return data.tournament;
}
