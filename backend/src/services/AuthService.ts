import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { env } from "@/config/env";
import { DiscordService, type DiscordUser } from "@/services/DiscordService";

export interface JWTPayload {
  id: string;
  discordId: string;
  isAdmin: boolean;
  isModerator: boolean;
}

export interface PublicUser {
  id: string;
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  kickUsername: string | null;
  kickVerified: boolean;
  catCoinBalance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const SESSION_PREFIX = "session:";
const REVOKED_PREFIX = "revoked:";

function toPublicUser(user: {
  id: string;
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  kickUsername: string | null;
  kickVerified: boolean;
  catCoinBalance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    discordId: user.discordId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    isModerator: user.isModerator,
    kickUsername: user.kickUsername,
    kickVerified: user.kickVerified,
    catCoinBalance: user.catCoinBalance,
    totalEarned: user.totalEarned,
    totalSpent: user.totalSpent,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  static async createOrUpdateUserFromDiscord(discordUser: DiscordUser): Promise<PublicUser> {
    const displayName = discordUser.global_name || discordUser.username;
    const avatarUrl = DiscordService.getAvatarUrl(discordUser);
    const isAdmin = env.ADMIN_DISCORD_IDS.includes(discordUser.id);

    const user = await prisma.user.upsert({
      where: { discordId: discordUser.id },
      update: { displayName, avatarUrl, isAdmin, lastActiveAt: new Date() },
      create: { discordId: discordUser.id, displayName, avatarUrl, isAdmin },
    });

    return toPublicUser(user);
  }

  static generateTokens(user: PublicUser): AuthTokens {
    const payload: JWTPayload = {
      id: user.id,
      discordId: user.discordId,
      isAdmin: user.isAdmin,
      isModerator: user.isModerator,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const decoded = jwt.decode(accessToken) as { exp: number; iat: number };
    return { accessToken, refreshToken, expiresIn: decoded.exp - decoded.iat };
  }

  static async storeSession(
    user: PublicUser,
    tokens: AuthTokens,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(tokens.accessToken, 10);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    await prisma.userSession.create({
      data: { userId: user.id, tokenHash, refreshTokenHash, expiresAt, userAgent, ipAddress },
    });

    await redis.setJSON(`${SESSION_PREFIX}${tokens.accessToken}`, user, tokens.expiresIn);
  }

  static async getUserSession(accessToken: string): Promise<PublicUser | null> {
    const cached = await redis.getJSON<PublicUser>(`${SESSION_PREFIX}${accessToken}`);
    if (cached) return cached;

    try {
      const decoded = jwt.verify(accessToken, env.JWT_SECRET) as JWTPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return null;
      const publicUser = toPublicUser(user);
      await redis.setJSON(`${SESSION_PREFIX}${accessToken}`, publicUser, 60);
      return publicUser;
    } catch {
      return null;
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JWTPayload;

    const sessions = await prisma.userSession.findMany({
      where: { userId: decoded.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    let matchedSession = null;
    for (const session of sessions) {
      if (session.refreshTokenHash && (await bcrypt.compare(refreshToken, session.refreshTokenHash))) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new Error("Refresh token not recognized");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new Error("User not found");

    const publicUser = toPublicUser(user);
    const tokens = this.generateTokens(publicUser);

    const tokenHash = await bcrypt.hash(tokens.accessToken, 10);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    await prisma.userSession.update({
      where: { id: matchedSession.id },
      data: { tokenHash, refreshTokenHash, expiresAt, lastUsedAt: new Date() },
    });

    await redis.setJSON(`${SESSION_PREFIX}${tokens.accessToken}`, publicUser, tokens.expiresIn);

    return tokens;
  }

  static async logout(userId: string, accessToken?: string): Promise<void> {
    if (accessToken) {
      await redis.del(`${SESSION_PREFIX}${accessToken}`);
      await redis.set(`${REVOKED_PREFIX}${accessToken}`, "1", 60 * 60 * 24);
    }
    await prisma.userSession.deleteMany({ where: { userId } });
  }

  static async isTokenRevoked(accessToken: string): Promise<boolean> {
    return (await redis.get(`${REVOKED_PREFIX}${accessToken}`)) !== null;
  }
}

export { toPublicUser };
