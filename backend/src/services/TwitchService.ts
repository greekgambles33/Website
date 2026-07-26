import { env } from "@/config/env";
import { createError } from "@/middleware/errorHandler";

const OAUTH_BASE = "https://id.twitch.tv/oauth2";
const API_BASE = "https://api.twitch.tv/helix";

export interface TwitchTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

export class TwitchService {
  static generateOAuthURL(state: string): string {
    const params = new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      redirect_uri: env.TWITCH_REDIRECT_URI,
      response_type: "code",
      scope: "",
      state,
      force_verify: "true",
    });
    return `${OAUTH_BASE}/authorize?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code: string): Promise<TwitchTokens> {
    const params = new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: env.TWITCH_REDIRECT_URI,
    });

    const response = await fetch(`${OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      throw createError.badRequest("Failed to exchange Twitch authorization code");
    }

    return (await response.json()) as TwitchTokens;
  }

  static async getUserInfo(accessToken: string): Promise<TwitchUser> {
    const response = await fetch(`${API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": env.TWITCH_CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw createError.badRequest("Failed to fetch Twitch user profile");
    }

    const data = (await response.json()) as { data: TwitchUser[] };
    const user = data.data[0];
    if (!user) throw createError.badRequest("Failed to fetch Twitch user profile");

    return user;
  }
}
