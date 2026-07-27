"use client";

import { API_ENDPOINTS, type Hunt, type HuntGuessWinner, type HuntSlotSuggestion } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class HuntApiError extends Error {}

async function huntFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
    throw new HuntApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ---------- Public reads ----------

export async function fetchLiveHunt(): Promise<Hunt | null> {
  const data = await huntFetch<{ hunt: Hunt | null }>(API_ENDPOINTS.HUNT_LIVE, { cache: "no-store" });
  return data.hunt;
}

export async function fetchHunt(id: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT(id), { cache: "no-store" });
  return data.hunt;
}

export async function fetchHuntBySlug(slug: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_BY_SLUG(slug), { cache: "no-store" });
  return data.hunt;
}

// ---------- Moderator/admin management ----------

export async function fetchHunts(): Promise<Hunt[]> {
  const data = await huntFetch<{ hunts: Hunt[] }>(API_ENDPOINTS.HUNTS);
  return data.hunts;
}

export async function createHunt(input: { name: string; startBalance: number; currency?: string }): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNTS, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.hunt;
}

export async function deleteHunt(id: string): Promise<void> {
  await huntFetch(API_ENDPOINTS.HUNT(id), { method: "DELETE" });
}

export async function addBonus(
  id: string,
  input: { slotName: string; provider?: string; image?: string | null; bet: number; note?: string | null }
): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_BONUSES(id), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.hunt;
}

export async function editBonus(
  id: string,
  bonusId: string,
  patch: Partial<{ slotName: string; provider: string; image: string | null; bet: number; note: string | null }>
): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_BONUS(id, bonusId), {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return data.hunt;
}

export async function removeBonus(id: string, bonusId: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_BONUS(id, bonusId), { method: "DELETE" });
  return data.hunt;
}

export async function openBonus(id: string, bonusId: string, payout: number): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_BONUS_OPEN(id, bonusId), {
    method: "POST",
    body: JSON.stringify({ payout }),
  });
  return data.hunt;
}

export async function reorderBonuses(id: string, orderedBonusIds: string[]): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_REORDER(id), {
    method: "POST",
    body: JSON.stringify({ orderedBonusIds }),
  });
  return data.hunt;
}

export async function shuffleBonuses(id: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_SHUFFLE(id), { method: "POST" });
  return data.hunt;
}

export async function startHunt(id: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_START(id), { method: "POST" });
  return data.hunt;
}

export async function completeHunt(id: string, finalBalance?: number): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_COMPLETE(id), {
    method: "POST",
    body: JSON.stringify({ finalBalance }),
  });
  return data.hunt;
}

export async function openGuessing(id: string, prizeCoins: number): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_GUESSING_OPEN(id), {
    method: "POST",
    body: JSON.stringify({ prizeCoins }),
  });
  return data.hunt;
}

export async function closeGuessing(id: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_GUESSING_CLOSE(id), { method: "POST" });
  return data.hunt;
}

// ---------- Guess the Balance ----------

export async function fetchGuessSummary(id: string): Promise<{ count: number; winner: HuntGuessWinner | null }> {
  return huntFetch(API_ENDPOINTS.HUNT_GUESS_SUMMARY(id), { cache: "no-store" });
}

export async function fetchMyGuess(id: string): Promise<number | null> {
  const data = await huntFetch<{ guess: number | null }>(API_ENDPOINTS.HUNT_MY_GUESS(id));
  return data.guess;
}

export async function submitGuess(id: string, guess: number): Promise<void> {
  await huntFetch(API_ENDPOINTS.HUNT_GUESS(id), { method: "POST", body: JSON.stringify({ guess }) });
}

export async function goLive(id: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_LIVE_TOGGLE(id), { method: "POST" });
  return data.hunt;
}

export async function takeDown(id: string): Promise<Hunt> {
  const data = await huntFetch<{ hunt: Hunt }>(API_ENDPOINTS.HUNT_LIVE_TOGGLE(id), { method: "DELETE" });
  return data.hunt;
}

// ---------- Suggested slots (!sr in chat while a hunt is live) ----------

export async function fetchSlotSuggestions(id: string): Promise<HuntSlotSuggestion[]> {
  const data = await huntFetch<{ suggestions: HuntSlotSuggestion[] }>(API_ENDPOINTS.HUNT_SUGGESTIONS(id), {
    cache: "no-store",
  });
  return data.suggestions;
}

export async function dismissSlotSuggestion(id: string, suggestionId: string): Promise<void> {
  await huntFetch(API_ENDPOINTS.HUNT_SUGGESTION(id, suggestionId), { method: "DELETE" });
}
