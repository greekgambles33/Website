import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Coin } from "@/components/ui/Coin";
import { fullLeaderboard, leaderboardSeason } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leaderboard | GreekGodBerry",
  description: "The top HellCatCoin earners this season, ranked.",
};

const rankColors = ["text-gold-400", "text-ash-100", "text-lava-400"];

export default function LeaderboardPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Top Cats"
        title="Leaderboard"
        description="Ranked by HellCatCoins earned this season."
      />

      <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center">
        <Badge tone="lava">{leaderboardSeason.name}</Badge>
      </div>

      <GlassCard className="mx-auto mt-8 max-w-2xl divide-y divide-white/5 p-0">
        {fullLeaderboard.map((user) => (
          <div key={user.rank} className="flex items-center justify-between gap-4 px-6 py-4">
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
                <p className="text-xs text-ash-500">{user.level}</p>
              </div>
            </div>
            <span className="font-heading flex items-center gap-1.5 text-sm font-bold text-lava-300">
              <Coin size="xs" />
              {user.coins.toLocaleString()}
            </span>
          </div>
        ))}
      </GlassCard>
    </Section>
  );
}
