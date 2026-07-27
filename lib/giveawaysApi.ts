"use client";

import { API_ENDPOINTS, type Giveaway, type GiveawayEntry } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class GiveawayApiError extends Error {}

async function giveawayFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
    throw new GiveawayApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ---------- Public ----------

export async function fetchGiveaways(): Promise<Giveaway[]> {
  const data = await giveawayFetch<{ giveaways: Giveaway[] }>(API_ENDPOINTS.GIVEAWAYS, { cache: "no-store" });
  return data.giveaways;
}

export async function fetchGiveaway(id: string): Promise<Giveaway> {
  const data = await giveawayFetch<{ giveaway: Giveaway }>(API_ENDPOINTS.GIVEAWAY(id), { cache: "no-store" });
  return data.giveaway;
}

// ---------- Logged-in viewer ----------

export async function fetchMyGiveawayEntry(id: string): Promise<boolean> {
  const data = await giveawayFetch<{ entered: boolean }>(API_ENDPOINTS.GIVEAWAY_MY_ENTRY(id));
  return data.entered;
}

export async function enterGiveaway(id: string): Promise<void> {
  await giveawayFetch(API_ENDPOINTS.GIVEAWAY_ENTER(id), { method: "POST" });
}

export async function leaveGiveaway(id: string): Promise<void> {
  await giveawayFetch(API_ENDPOINTS.GIVEAWAY_ENTER(id), { method: "DELETE" });
}

// ---------- Moderator/admin ----------

export async function createGiveaway(input: {
  title: string;
  description?: string | null;
  entryCost?: number;
  endsAt?: string | null;
}): Promise<Giveaway> {
  const data = await giveawayFetch<{ giveaway: Giveaway }>(API_ENDPOINTS.GIVEAWAYS, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.giveaway;
}

export async function updateGiveaway(
  id: string,
  patch: Partial<{ title: string; description: string | null; entryCost: number; endsAt: string | null }>
): Promise<Giveaway> {
  const data = await giveawayFetch<{ giveaway: Giveaway }>(API_ENDPOINTS.GIVEAWAY(id), {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return data.giveaway;
}

export async function deleteGiveaway(id: string): Promise<void> {
  await giveawayFetch(API_ENDPOINTS.GIVEAWAY(id), { method: "DELETE" });
}

export async function openGiveaway(id: string): Promise<Giveaway> {
  const data = await giveawayFetch<{ giveaway: Giveaway }>(API_ENDPOINTS.GIVEAWAY_OPEN(id), { method: "POST" });
  return data.giveaway;
}

export async function closeGiveaway(id: string): Promise<Giveaway> {
  const data = await giveawayFetch<{ giveaway: Giveaway }>(API_ENDPOINTS.GIVEAWAY_CLOSE(id), { method: "POST" });
  return data.giveaway;
}

export async function fetchGiveawayEntries(id: string): Promise<GiveawayEntry[]> {
  const data = await giveawayFetch<{ entries: GiveawayEntry[] }>(API_ENDPOINTS.GIVEAWAY_ENTRIES(id));
  return data.entries;
}

export async function drawGiveawayWinner(id: string): Promise<Giveaway> {
  const data = await giveawayFetch<{ giveaway: Giveaway }>(API_ENDPOINTS.GIVEAWAY_DRAW(id), { method: "POST" });
  return data.giveaway;
}
