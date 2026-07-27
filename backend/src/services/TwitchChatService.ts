import WebSocket from "ws";
import { PredictionVoteSource } from "@prisma/client";
import { env } from "@/config/env";
import { routeChatCommand } from "@/services/ChatCommandRouter";
import { awardChatActivityPoint } from "@/services/ChatActivityService";

const IRC_WS_URL = "wss://irc-ws.chat.twitch.tv:443";

const PRIVMSG_PATTERN = /^:(\w+)!\w+@\S+\.tmi\.twitch\.tv PRIVMSG #\S+ :(.*)$/;

/** Minimal Twitch IRC client over the `ws` package — no tmi.js dependency,
 * mirrors KickChatService's shape. Only needs read + PRIVMSG send. */
class TwitchChatServiceImpl {
  private ws: WebSocket | null = null;
  private reconnectDelay = 2000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private started = false;
  private channel = "";

  start() {
    if (!env.TWITCH_BOT_USERNAME || !env.TWITCH_BOT_OAUTH_TOKEN || !env.TWITCH_CHANNEL_NAME) {
      console.warn("[twitch-chat] bot credentials not set — Twitch prediction voting disabled");
      return;
    }
    this.channel = env.TWITCH_CHANNEL_NAME.toLowerCase().replace(/^#/, "");
    this.started = true;
    this.connect();
  }

  stop() {
    this.started = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  private connect() {
    this.ws = new WebSocket(IRC_WS_URL);

    this.ws.on("open", () => {
      this.reconnectDelay = 2000;
      const token = env.TWITCH_BOT_OAUTH_TOKEN.startsWith("oauth:")
        ? env.TWITCH_BOT_OAUTH_TOKEN
        : `oauth:${env.TWITCH_BOT_OAUTH_TOKEN}`;
      this.ws?.send(`PASS ${token}`);
      this.ws?.send(`NICK ${env.TWITCH_BOT_USERNAME.toLowerCase()}`);
      this.ws?.send(`JOIN #${this.channel}`);
      console.log(`[twitch-chat] joining #${this.channel}`);
    });

    this.ws.on("message", (raw) => this.handleLines(raw.toString()));
    this.ws.on("close", () => this.scheduleReconnect());
    this.ws.on("error", (err) => console.error("[twitch-chat] websocket error:", err.message));
  }

  private scheduleReconnect() {
    if (!this.started) return;
    this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000);
  }

  private handleLines(raw: string) {
    for (const line of raw.split("\r\n")) {
      if (!line) continue;

      if (line.startsWith("PING")) {
        this.ws?.send("PONG :tmi.twitch.tv");
        continue;
      }

      const match = line.match(PRIVMSG_PATTERN);
      if (!match) continue;

      const [, twitchUsername, content] = match;
      this.handleMessage(twitchUsername, content).catch((err) =>
        console.error("[twitch-chat] prediction command failed:", err)
      );
    }
  }

  private async handleMessage(twitchUsername: string, content: string) {
    awardChatActivityPoint(twitchUsername, PredictionVoteSource.TWITCH).catch((err) =>
      console.error("[twitch-chat] chat activity point failed:", err)
    );

    const reply = await routeChatCommand(content, twitchUsername, PredictionVoteSource.TWITCH);
    if (reply) this.sendChatMessage(reply);
  }

  private sendChatMessage(content: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(`PRIVMSG #${this.channel} :${content}`);
  }
}

export const TwitchChatService = new TwitchChatServiceImpl();
