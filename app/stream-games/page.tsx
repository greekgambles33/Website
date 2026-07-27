"use client";

import { useEffect, useState } from "react";
import { Loader2, Gamepad2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { fetchStreamGames } from "@/lib/streamGamesApi";
import type { StreamGame } from "@/lib/api";

// Games with their own pre-existing standalone page (Bonus Hunt, Tournament)
// link straight there instead of the generic /stream-games/[slug] route.
const EXTERNAL_LINKS: Record<string, string> = {
  "bonus-hunt": "/bonus-hunt",
  tournament: "/tournament",
};

export default function StreamGamesPage() {
  const [games, setGames] = useState<StreamGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreamGames()
      .then(setGames)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section>
      <SectionHeading
        eyebrow="Free to Play"
        title="Stream Games"
        description="Live community games running alongside the stream — bonus hunts, tournaments, chat predictions, and more. Free to play, every time."
      />

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : games.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ash-400">No stream games are live right now — check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <GlassCard key={game.id} className="flex flex-col">
              <div className="flex items-center gap-2">
                <Gamepad2 size={18} className="text-lava-400" />
                {game.isLive && <Badge tone="live" pulse>Live</Badge>}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{game.name}</h3>
              {game.description && <p className="mt-2 flex-1 text-sm text-ash-300">{game.description}</p>}
              <div className="mt-5">
                <ButtonLink href={EXTERNAL_LINKS[game.slug] ?? `/stream-games/${game.slug}`} size="sm" variant="secondary">
                  View {game.name}
                </ButtonLink>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Section>
  );
}
