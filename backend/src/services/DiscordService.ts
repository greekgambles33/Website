import { env } from "@/config/env";
import { createError } from "@/middleware/errorHandler";

const OAUTH_BASE = "https://discord.com/api/oauth2";
const API_BASE = "https://discord.com/api/v10";

export interface DiscordTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
}

export class DiscordService {
  static generateOAuthURL(state: string): string {
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: "code",
      scope: "identify email guilds",
      state,
    });
    return `${OAUTH_BASE}/authorize?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code: string): Promise<DiscordTokens> {
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI,
    });

    const response = await fetch(`${OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      throw createError.badRequest("Failed to exchange Discord authorization code");
    }

    return (await response.json()) as DiscordTokens;
  }

  static async getUserInfo(accessToken: string): Promise<DiscordUser> {
    const response = await fetch(`${API_BASE}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw createError.badRequest("Failed to fetch Discord user profile");
    }

    return (await response.json()) as DiscordUser;
  }

  static async checkServerMembership(accessToken: string, guildId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return false;

    const guilds = (await response.json()) as Array<{ id: string }>;
    return guilds.some((g) => g.id === guildId);
  }

  static getAvatarUrl(discordUser: DiscordUser): string | null {
    if (!discordUser.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
  }
}
