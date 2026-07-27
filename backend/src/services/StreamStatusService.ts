import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";

const POLL_MS = 60_000;

interface KickChannelResponse {
  livestream: {
    session_title?: string;
    viewer_count?: number;
    start_time?: string;
    categories?: { name: string }[];
  } | null;
}

/** Polls Kick's public channel API and keeps the stream_status Site Content
 * key in sync automatically — no more manually toggling "Currently Live" in
 * the admin panel. Best-effort: any failure just leaves the last known
 * status in place until the next successful poll. */
class StreamStatusServiceImpl {
  private timer: NodeJS.Timeout | null = null;

  start() {
    if (!env.KICK_CHANNEL_NAME) {
      console.warn("[stream-status] KICK_CHANNEL_NAME not set — automatic stream status disabled");
      return;
    }
    this.poll();
    this.timer = setInterval(() => this.poll(), POLL_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll() {
    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${env.KICK_CHANNEL_NAME}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;

      const data = (await res.json()) as KickChannelResponse;
      const live = data.livestream;
      const isLive = !!live;
      const uptimeMinutes = live?.start_time
        ? Math.max(0, Math.floor((Date.now() - new Date(live.start_time).getTime()) / 60_000))
        : 0;

      await prisma.siteContent.upsert({
        where: { key: "stream_status" },
        create: {
          key: "stream_status",
          data: {
            isLive,
            title: live?.session_title || "Stream is offline right now",
            category: live?.categories?.[0]?.name || "Slots",
            viewers: live?.viewer_count ?? 0,
            uptimeMinutes,
          },
        },
        update: {
          data: {
            isLive,
            title: live?.session_title || "Stream is offline right now",
            category: live?.categories?.[0]?.name || "Slots",
            viewers: live?.viewer_count ?? 0,
            uptimeMinutes,
          },
        },
      });
    } catch (err) {
      console.error("[stream-status] poll failed (non-fatal):", err);
    }
  }
}

export const StreamStatusService = new StreamStatusServiceImpl();
