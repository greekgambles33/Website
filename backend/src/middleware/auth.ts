import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env, isProd } from "@/config/env";
import { createError, asyncHandler } from "@/middleware/errorHandler";
import { AuthService, type JWTPayload, type AuthTokens } from "@/services/AuthService";
import { prisma } from "@/lib/prisma";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(res: Response, tokens: AuthTokens) {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn * 1000,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
}

export function extractAccessToken(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  return null;
}

export function extractRefreshToken(req: Request): string | null {
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (cookieToken) return cookieToken;
  if (typeof req.body?.refreshToken === "string") return req.body.refreshToken;
  return null;
}

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractAccessToken(req);
  if (!token) throw createError.unauthorized("Access token required");

  let decoded: JWTPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch {
    throw createError.unauthorized("Invalid or expired access token");
  }

  if (await AuthService.isTokenRevoked(token)) {
    throw createError.unauthorized("Access token has been revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { isSuspended: true } });
  if (user?.isSuspended) {
    throw createError.forbidden("This account has been suspended");
  }

  req.user = decoded;
  next();
});

export const optionalAuthMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractAccessToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    if (!(await AuthService.isTokenRevoked(token))) {
      req.user = decoded;
    }
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
});

export const adminMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) throw createError.forbidden("Admin access required");
  next();
});

export const moderatorMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin && !req.user?.isModerator) {
    throw createError.forbidden("Moderator access required");
  }
  next();
});
