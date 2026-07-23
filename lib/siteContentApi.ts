"use client";

import { API_ENDPOINTS, type LeaderboardEntry } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class SiteContentApiError extends Error {}

async function contentFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
    throw new SiteContentApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

/** Fetches every content key in one call — used by the homepage so it's a single request. */
export async function fetchAllSiteContent(): Promise<Record<string, unknown>> {
  const data = await contentFetch<{ content: Record<string, unknown> }>(API_ENDPOINTS.SITE_CONTENT_ALL, {
    cache: "no-store",
  });
  return data.content;
}

export async function fetchSiteContent<T>(key: string): Promise<T | null> {
  const data = await contentFetch<{ data: T | null }>(API_ENDPOINTS.SITE_CONTENT(key), { cache: "no-store" });
  return data.data;
}

export async function saveSiteContent<T>(key: string, value: T): Promise<T> {
  const res = await contentFetch<{ data: T }>(API_ENDPOINTS.SITE_CONTENT(key), {
    method: "PUT",
    body: JSON.stringify({ data: value }),
  });
  return res.data;
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const data = await contentFetch<{ leaderboard: LeaderboardEntry[] }>(`${API_ENDPOINTS.LEADERBOARD}?limit=${limit}`, {
    cache: "no-store",
  });
  return data.leaderboard;
}
