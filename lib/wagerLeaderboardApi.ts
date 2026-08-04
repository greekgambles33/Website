"use client";

import { API_ENDPOINTS, type WagerLeaderboard } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class WagerLeaderboardApiError extends Error {}

async function wagerFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
    throw new WagerLeaderboardApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ---------- Public ----------

export async function fetchLiveWagerLeaderboard(): Promise<WagerLeaderboard | null> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard | null }>(API_ENDPOINTS.WAGER_LEADERBOARD_LIVE, {
    cache: "no-store",
  });
  return data.leaderboard;
}

// ---------- Admin ----------

export async function fetchWagerLeaderboards(): Promise<WagerLeaderboard[]> {
  const data = await wagerFetch<{ leaderboards: WagerLeaderboard[] }>(API_ENDPOINTS.WAGER_LEADERBOARDS);
  return data.leaderboards;
}

export async function fetchWagerLeaderboard(id: string): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD(id));
  return data.leaderboard;
}

export async function createWagerLeaderboard(input: {
  title?: string | null;
  prizeAmount: number;
  currency?: string;
  endsAt?: string | null;
}): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARDS, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.leaderboard;
}

export async function updateWagerLeaderboard(
  id: string,
  patch: Partial<{ title: string | null; prizeAmount: number; currency: string; endsAt: string | null }>
): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD(id), {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return data.leaderboard;
}

export async function deleteWagerLeaderboard(id: string): Promise<void> {
  await wagerFetch(API_ENDPOINTS.WAGER_LEADERBOARD(id), { method: "DELETE" });
}

export async function addWagerEntry(
  id: string,
  input: { name: string; wagered: number; avatarUrl?: string | null }
): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD_ENTRIES(id), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.leaderboard;
}

export async function editWagerEntry(
  id: string,
  entryId: string,
  patch: Partial<{ name: string; wagered: number; avatarUrl: string | null }>
): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD_ENTRY(id, entryId), {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return data.leaderboard;
}

export async function removeWagerEntry(id: string, entryId: string): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD_ENTRY(id, entryId), {
    method: "DELETE",
  });
  return data.leaderboard;
}

export async function setWagerLeaderboardLive(id: string): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD_LIVE_TOGGLE(id), {
    method: "POST",
  });
  return data.leaderboard;
}

export async function unsetWagerLeaderboardLive(id: string): Promise<WagerLeaderboard> {
  const data = await wagerFetch<{ leaderboard: WagerLeaderboard }>(API_ENDPOINTS.WAGER_LEADERBOARD_LIVE_TOGGLE(id), {
    method: "DELETE",
  });
  return data.leaderboard;
}
