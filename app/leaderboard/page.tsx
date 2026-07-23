"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Coin } from "@/components/ui/Coin";
import { fetchLeaderboard } from "@/lib/siteContentApi";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/api";

const rankColors = ["text-gold-400", "text-ash-100", "text-lava-400"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    fetchLeaderboard(50)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  return (
    <Section>
      <SectionHeading
        eyebrow="Top Cats"
        title="Leaderboard"
        description="Ranked by HellCatCoins earned this season."
      />

      {entries === null ? (
        <p className="mt-12 text-center text-sm text-ash-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ash-400">No one&apos;s on the board yet — be the first.</p>
      ) : (
        <GlassCard className="mx-auto mt-8 max-w-2xl divide-y divide-white/5 p-0">
          {entries.map((user) => (
            <div key={user.userId} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "font-display w-6 text-lg",
                    rankColors[user.rank - 1] ?? "text-ash-300"
                  )}
                >
                  {user.rank}
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold text-white">{user.username}</p>
                  <p className="text-xs text-ash-500">{user.tier}</p>
                </div>
              </div>
              <span className="font-heading flex items-center gap-1.5 text-sm font-bold text-lava-300">
                <Coin size="xs" />
                {user.coins.toLocaleString()}
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </Section>
  );
}
