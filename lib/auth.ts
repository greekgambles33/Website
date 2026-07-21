"use client";

import { API_ENDPOINTS } from "@/lib/api";
import { clearAuthData, getAccessToken } from "@/lib/authPersistence";

export async function logout(): Promise<void> {
  try {
    await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
      method: "POST",
      credentials: "include",
      headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {},
    });
  } finally {
    clearAuthData();
    window.location.href = "/";
  }
}

export async function loginWithDiscord(): Promise<void> {
  const res = await fetch(API_ENDPOINTS.AUTH_DISCORD_INITIATE, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to start Discord login");
  const data = await res.json();
  if (!data.success || !data.authUrl) throw new Error("Failed to start Discord login");
  window.location.href = data.authUrl;
}
