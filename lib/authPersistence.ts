"use client";

import { API_ENDPOINTS, type PublicUser } from "@/lib/api";

const ACCESS_TOKEN_KEY = "ggb_access_token";
const REFRESH_TOKEN_KEY = "ggb_refresh_token";
const USER_KEY = "ggb_user";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

interface CallbackAuthData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  displayName: string;
  isAdmin: boolean;
  isModerator: boolean;
  avatar: string;
}

export function storeAuthData(data: CallbackAuthData) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: data.userId,
      displayName: data.displayName,
      isAdmin: data.isAdmin,
      isModerator: data.isModerator,
      avatarUrl: data.avatar || null,
    })
  );
  scheduleTokenRefresh();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** UI hint only — the httpOnly cookie is what the backend actually trusts. */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function clearAuthData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (refreshTimer) clearTimeout(refreshTimer);
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    scheduleTokenRefresh(data.expiresIn as number | undefined);
    return true;
  } catch {
    return false;
  }
}

function scheduleTokenRefresh(expiresInSeconds = 15 * 60) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = Math.max((expiresInSeconds - 5 * 60) * 1000, 30_000);
  refreshTimer = setTimeout(() => void refreshTokens(), delay);
}

export async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    const res = await fetch(API_ENDPOINTS.AUTH_ME, {
      credentials: "include",
      headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {},
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as PublicUser;
  } catch {
    return null;
  }
}

/** Call on app mount: verifies/refreshes the session and returns the current user, if any. */
export async function initializeAuth(): Promise<PublicUser | null> {
  let user = await fetchCurrentUser();
  if (!user && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) user = await fetchCurrentUser();
  }
  if (user) scheduleTokenRefresh();
  else clearAuthData();
  return user;
}
