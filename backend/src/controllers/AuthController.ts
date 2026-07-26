import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import { asyncHandler, createError } from "@/middleware/errorHandler";
import {
  setAuthCookies,
  clearAuthCookies,
  extractAccessToken,
  extractRefreshToken,
} from "@/middleware/auth";
import { env } from "@/config/env";
import { redis } from "@/lib/redis";
import { DiscordService } from "@/services/DiscordService";
import { TwitchService } from "@/services/TwitchService";
import { AuthService } from "@/services/AuthService";
import { KickVerificationService } from "@/services/KickVerificationService";
import { prisma } from "@/lib/prisma";

const STATE_PREFIX = "oauth_state:";
const TWITCH_STATE_PREFIX = "twitch_oauth_state:";

export const AuthController = {
  initiateDiscordAuth: asyncHandler(async (_req: Request, res: Response) => {
    const state = randomBytes(32).toString("hex");
    await redis.set(`${STATE_PREFIX}${state}`, "valid", 600);
    const authUrl = DiscordService.generateOAuthURL(state);
    res.json({ success: true, authUrl, state });
  }),

  handleDiscordCallback: asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error: oauthError } = req.query;
    const frontendUrl = env.FRONTEND_URL;

    const fail = (message: string) => {
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
    };

    if (oauthError) return fail(typeof oauthError === "string" ? oauthError : "Discord authorization was denied");
    if (!code || typeof code !== "string") return fail("Missing authorization code");
    if (!state || typeof state !== "string") return fail("Missing state parameter");

    const storedState = await redis.get(`${STATE_PREFIX}${state}`);
    if (!storedState) return fail("Invalid or expired state parameter, please try logging in again");
    await redis.del(`${STATE_PREFIX}${state}`);

    try {
      const discordTokens = await DiscordService.exchangeCodeForTokens(code);
      const discordUser = await DiscordService.getUserInfo(discordTokens.access_token);

      if (env.DISCORD_REQUIRE_SERVER_MEMBERSHIP && env.DISCORD_GUILD_ID) {
        const isMember = await DiscordService.checkServerMembership(discordTokens.access_token, env.DISCORD_GUILD_ID);
        if (!isMember) {
          return fail(
            `You must be a member of the Discord server to log in.${
              env.DISCORD_INVITE_URL ? ` Join here: ${env.DISCORD_INVITE_URL}` : ""
            }`
          );
        }
      }

      const user = await AuthService.createOrUpdateUserFromDiscord(discordUser);
      const tokens = AuthService.generateTokens(user);
      await AuthService.storeSession(user, tokens, req.get("User-Agent"), req.ip);

      setAuthCookies(res, tokens);

      const params = new URLSearchParams({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user_id: user.id,
        display_name: user.displayName,
        is_admin: String(user.isAdmin),
        is_moderator: String(user.isModerator),
        avatar: user.avatarUrl ?? "",
      });
      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (err) {
      console.error("[auth] discord callback failed:", err);
      fail(err instanceof Error ? err.message : "Login failed, please try again");
    }
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = extractRefreshToken(req);
    if (!refreshToken) throw createError.unauthorized("Refresh token required");

    try {
      const tokens = await AuthService.refreshToken(refreshToken);
      setAuthCookies(res, tokens);
      res.json({ success: true, ...tokens });
    } catch {
      clearAuthCookies(res);
      throw createError.unauthorized("Invalid or expired refresh token");
    }
  }),

  getAuthStatus: asyncHandler(async (req: Request, res: Response) => {
    const token = extractAccessToken(req);
    if (!token) return res.json({ success: true, authenticated: false });

    const user = await AuthService.getUserSession(token);
    res.json({ success: true, authenticated: !!user, user });
  }),

  getCurrentUser: asyncHandler(async (req: Request, res: Response) => {
    const token = extractAccessToken(req);
    if (!token) throw createError.unauthorized("Not authenticated");

    const user = await AuthService.getUserSession(token);
    if (!user) throw createError.unauthorized("Session not found");

    res.json({ success: true, user });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = extractAccessToken(req);
    if (req.user) await AuthService.logout(req.user.id, token ?? undefined);
    clearAuthCookies(res);
    res.json({ success: true });
  }),

  validateToken: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, valid: true, user: req.user });
  }),

  // --- Kick chat-command verification ---

  initiateKickVerify: asyncHandler(async (req: Request, res: Response) => {
    const { kickUsername } = req.body as { kickUsername?: string };
    if (!kickUsername || typeof kickUsername !== "string") {
      throw createError.badRequest("kickUsername is required");
    }
    const result = await KickVerificationService.initiate(req.user!.id, kickUsername);
    res.json({ success: true, ...result });
  }),

  checkKickVerifyStatus: asyncHandler(async (req: Request, res: Response) => {
    const status = await KickVerificationService.status(req.user!.id);
    res.json({ success: true, ...status });
  }),

  unlinkKick: asyncHandler(async (req: Request, res: Response) => {
    await KickVerificationService.unlink(req.user!.id);
    res.json({ success: true });
  }),

  // --- Twitch OAuth verification ---

  initiateTwitchVerify: asyncHandler(async (req: Request, res: Response) => {
    const state = randomBytes(32).toString("hex");
    await redis.set(`${TWITCH_STATE_PREFIX}${state}`, req.user!.id, 600);
    const authUrl = TwitchService.generateOAuthURL(state);
    res.json({ success: true, authUrl });
  }),

  handleTwitchCallback: asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error: oauthError } = req.query;
    const frontendUrl = env.FRONTEND_URL;

    const fail = (message: string) => {
      res.redirect(`${frontendUrl}/profile?twitch=error&message=${encodeURIComponent(message)}`);
    };

    if (oauthError) return fail(typeof oauthError === "string" ? oauthError : "Twitch authorization was denied");
    if (!code || typeof code !== "string") return fail("Missing authorization code");
    if (!state || typeof state !== "string") return fail("Missing state parameter");

    const userId = await redis.get(`${TWITCH_STATE_PREFIX}${state}`);
    if (!userId) return fail("Invalid or expired state parameter, please try again");
    await redis.del(`${TWITCH_STATE_PREFIX}${state}`);

    try {
      const twitchTokens = await TwitchService.exchangeCodeForTokens(code);
      const twitchUser = await TwitchService.getUserInfo(twitchTokens.access_token);

      const existing = await prisma.user.findUnique({ where: { twitchUsername: twitchUser.login } });
      if (existing && existing.id !== userId) {
        return fail("This Twitch account is already linked to another account");
      }

      await prisma.user.update({
        where: { id: userId },
        data: { twitchUsername: twitchUser.login, twitchVerified: true },
      });

      res.redirect(`${frontendUrl}/profile?twitch=success`);
    } catch (err) {
      console.error("[auth] twitch callback failed:", err);
      fail(err instanceof Error ? err.message : "Twitch verification failed, please try again");
    }
  }),

  unlinkTwitch: asyncHandler(async (req: Request, res: Response) => {
    await prisma.user.update({ where: { id: req.user!.id }, data: { twitchVerified: false } });
    res.json({ success: true });
  }),
};
