import Redis from "ioredis";
import { env } from "@/config/env";

type MemoryEntry = { value: string; expiresAt: number | null };

class MemoryFallback {
  private store = new Map<string, MemoryEntry>();

  private isExpired(entry: MemoryEntry) {
    return entry.expiresAt !== null && entry.expiresAt < Date.now();
  }

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string, ttlSeconds?: number) {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  del(key: string) {
    this.store.delete(key);
  }
}

class RedisService {
  private client: Redis;
  private fallback = new MemoryFallback();
  private connected = false;
  private connecting: Promise<void>;

  constructor() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
      lazyConnect: true,
    });

    this.client.on("connect", () => {
      this.connected = true;
    });
    this.client.on("error", () => {
      this.connected = false;
    });

    // Awaited by `ready()` so the very first call made right after startup
    // doesn't race the initial handshake and wrongly fall back to memory.
    this.connecting = this.client.connect().catch(() => {
      console.warn("[redis] unavailable — falling back to in-memory store (dev only)");
    });
  }

  private async ready(): Promise<boolean> {
    if (!this.connected) await this.connecting;
    return this.connected;
  }

  async get(key: string): Promise<string | null> {
    if (await this.ready()) {
      try {
        return await this.client.get(key);
      } catch {
        this.connected = false;
      }
    }
    return this.fallback.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (await this.ready()) {
      try {
        if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
        else await this.client.set(key, value);
        return;
      } catch {
        this.connected = false;
      }
    }
    this.fallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (await this.ready()) {
      try {
        await this.client.del(key);
        return;
      } catch {
        this.connected = false;
      }
    }
    this.fallback.del(key);
  }

  async setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

export const redis = new RedisService();
