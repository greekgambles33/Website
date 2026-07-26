import "dotenv/config";
import { z } from "zod";

const boolFromString = z
  .string()
  .optional()
  .transform((v) => v === "true");

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  DISCORD_CLIENT_SECRET: z.string().min(1, "DISCORD_CLIENT_SECRET is required"),
  DISCORD_REDIRECT_URI: z.string().min(1, "DISCORD_REDIRECT_URI is required"),
  DISCORD_REQUIRE_SERVER_MEMBERSHIP: boolFromString,
  DISCORD_GUILD_ID: z.string().optional().default(""),
  DISCORD_INVITE_URL: z.string().optional().default(""),
  ADMIN_DISCORD_IDS: z
    .string()
    .optional()
    .default("")
    .transform((v) => v.split(",").map((id) => id.trim()).filter(Boolean)),

  KICK_CHANNEL_NAME: z.string().default("greekgodberry"),
  KICK_CHATROOM_ID: z.string().optional().default(""),
  KICK_BOT_TOKEN: z.string().optional().default(""),

  TWITCH_CLIENT_ID: z.string().min(1, "TWITCH_CLIENT_ID is required"),
  TWITCH_CLIENT_SECRET: z.string().min(1, "TWITCH_CLIENT_SECRET is required"),
  TWITCH_REDIRECT_URI: z.string().min(1, "TWITCH_REDIRECT_URI is required"),

  // --- Stream games chat bots (Chat vs Streamer) ---
  TWITCH_CHANNEL_NAME: z.string().optional().default(""),
  TWITCH_BOT_USERNAME: z.string().optional().default(""),
  TWITCH_BOT_OAUTH_TOKEN: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
