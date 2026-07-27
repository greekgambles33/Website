import WebSocket from "ws";
import { PredictionVoteSource } from "@prisma/client";
import { env } from "@/config/env";
import { KickVerificationService } from "@/services/KickVerificationService";
import { routeChatCommand } from "@/services/ChatCommandRouter";
import { awardChatActivityPoint } from "@/services/ChatActivityService";

/**
 * Kick has no official public chat API. This connects to the same
 * Pusher-based websocket kick.com's own frontend uses. The app key below
 * is Kick's public (non-secret) Pusher key as of writing — if Kick changes
 * their websocket infrastructure this will need to be updated.
 */
const PUSHER_APP_KEY = "32cbd69e4b950bf97679";
const PUSHER_WS_URL = `wss://ws-us2.pusher.com/app/${PUSHER_APP_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;

const VERIFY_COMMAND = /^!verify\s+([A-Z0-9]{6})/i;

interface KickChatMessageEvent {
  content: string;
  sender: { username: string };
}

class KickChatServiceImpl {
  private ws: WebSocket | null = null;
  private reconnectDelay = 2000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private started = false;

  start() {
    if (!env.KICK_CHATROOM_ID) {
      console.warn("[kick-chat] KICK_CHATROOM_ID not set — chat verification bot disabled");
      return;
    }
    this.started = true;
    this.connect();
  }

  stop() {
    this.started = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  private connect() {
    this.ws = new WebSocket(PUSHER_WS_URL);

    this.ws.on("open", () => {
      this.reconnectDelay = 2000;
      this.ws?.send(
        JSON.stringify({
          event: "pusher:subscribe",
          data: { channel: `chatrooms.${env.KICK_CHATROOM_ID}.v2` },
        })
      );
      console.log(`[kick-chat] subscribed to chatroom ${env.KICK_CHATROOM_ID}`);
    });

    this.ws.on("message", (raw) => this.handleMessage(raw.toString()));

    this.ws.on("close", () => this.scheduleReconnect());
    this.ws.on("error", (err) => {
      console.error("[kick-chat] websocket error:", err.message);
    });
  }

  private scheduleReconnect() {
    if (!this.started) return;
    this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000);
  }

  private async handleMessage(raw: string) {
    let outer: { event?: string; data?: string };
    try {
      outer = JSON.parse(raw);
    } catch {
      return;
    }

    if (outer.event !== "App\\Events\\ChatMessageEvent" || !outer.data) return;

    let payload: KickChatMessageEvent;
    try {
      payload = JSON.parse(outer.data);
    } catch {
      return;
    }

    const kickUsername = payload.sender?.username;
    if (!kickUsername || !payload.content) return;

    awardChatActivityPoint(kickUsername, PredictionVoteSource.KICK).catch((err) =>
      console.error("[kick-chat] chat activity point failed:", err)
    );

    const verifyMatch = payload.content.match(VERIFY_COMMAND);
    if (verifyMatch) {
      const code = verifyMatch[1].toUpperCase();
      const verifiedUsername = await KickVerificationService.processVerification(kickUsername, code);
      if (verifiedUsername) {
        console.log(`[kick-chat] verified ${verifiedUsername} via code ${code}`);
        await this.sendChatMessage(`✅ @${verifiedUsername} your Kick account is now verified!`);
      }
      return;
    }

    try {
      const reply = await routeChatCommand(payload.content, kickUsername, PredictionVoteSource.KICK);
      if (reply) await this.sendChatMessage(reply);
    } catch (err) {
      console.error("[kick-chat] prediction command failed:", err);
    }
  }

  /** Best-effort chat confirmation. Requires KICK_BOT_TOKEN; silently skipped without it. */
  private async sendChatMessage(content: string) {
    if (!env.KICK_BOT_TOKEN) return;
    try {
      await fetch(`https://kick.com/api/v2/messages/send/${env.KICK_CHATROOM_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.KICK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ content, type: "message" }),
      });
    } catch (err) {
      console.error("[kick-chat] failed to send confirmation message:", err);
    }
  }
}

export const KickChatService = new KickChatServiceImpl();
