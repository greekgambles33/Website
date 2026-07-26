"use client";

import { API_ENDPOINTS, type AdminStats, type AdminUser, type AuditLogEntry } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

export class AdminApiError extends Error {}

async function authedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
    throw new AdminApiError(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export type UserFilter = "all" | "suspended" | "admins" | "moderators" | "kick_pending" | "twitch_pending";

export async function fetchAdminStats(): Promise<AdminStats> {
  const data = await authedFetch<{ stats: AdminStats }>(API_ENDPOINTS.ADMIN_STATS);
  return data.stats;
}

export async function fetchAdminUser(userId: string): Promise<AdminUser> {
  const data = await authedFetch<{ user: AdminUser }>(API_ENDPOINTS.ADMIN_USER(userId));
  return data.user;
}

export async function fetchAdminUsers(params: {
  search?: string;
  filter?: UserFilter;
  page?: number;
  limit?: number;
}): Promise<{ users: AdminUser[]; page: number; limit: number; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.filter && params.filter !== "all") query.set("filter", params.filter);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));

  return authedFetch(`${API_ENDPOINTS.ADMIN_USERS}?${query.toString()}`);
}

export async function fetchAuditLogs(params: {
  page?: number;
  limit?: number;
}): Promise<{ logs: AuditLogEntry[]; page: number; limit: number; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));

  return authedFetch(`${API_ENDPOINTS.ADMIN_AUDIT_LOGS}?${query.toString()}`);
}

export async function adjustUserCoins(userId: string, amount: number, reason: string): Promise<number> {
  const data = await authedFetch<{ catCoinBalance: number }>(API_ENDPOINTS.ADMIN_USER_COINS(userId), {
    method: "PUT",
    body: JSON.stringify({ amount, reason }),
  });
  return data.catCoinBalance;
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  await authedFetch(API_ENDPOINTS.ADMIN_USER_SUSPEND(userId), {
    method: "PUT",
    body: JSON.stringify({ suspended }),
  });
}

export async function setUserModerator(userId: string, isModerator: boolean): Promise<void> {
  await authedFetch(API_ENDPOINTS.ADMIN_USER_MODERATOR(userId), {
    method: "PUT",
    body: JSON.stringify({ isModerator }),
  });
}

export async function verifyUserKick(userId: string, verified: boolean): Promise<void> {
  await authedFetch(API_ENDPOINTS.ADMIN_USER_VERIFY_KICK(userId), {
    method: "PUT",
    body: JSON.stringify({ verified }),
  });
}

export async function editUserKickUsername(userId: string, kickUsername: string | null): Promise<void> {
  await authedFetch(API_ENDPOINTS.ADMIN_USER_KICK_USERNAME(userId), {
    method: "PUT",
    body: JSON.stringify({ kickUsername }),
  });
}

export async function verifyUserTwitch(userId: string, verified: boolean): Promise<void> {
  await authedFetch(API_ENDPOINTS.ADMIN_USER_VERIFY_TWITCH(userId), {
    method: "PUT",
    body: JSON.stringify({ verified }),
  });
}

export async function editUserTwitchUsername(userId: string, twitchUsername: string | null): Promise<void> {
  await authedFetch(API_ENDPOINTS.ADMIN_USER_TWITCH_USERNAME(userId), {
    method: "PUT",
    body: JSON.stringify({ twitchUsername }),
  });
}
