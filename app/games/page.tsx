"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { GameContent } from "@/lib/api";

const statusTone = {
  Live: "live",
  "Voting Open": "lava",
  "Coming Soon": "neutral",
} as const;

export default function GamesPage() {
  const { data: games } = useSiteContent<GameContent[]>("games");

  return (
    <Section>
      <SectionHeading
        eyebrow="Stream Games"
        title="Featured Games"
        description="Modular community games running live — join in from your dashboard."
      />

      {!games || games.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ash-400">No games configured yet.</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <GlassCard key={game.id} className="flex flex-col">
              <Badge
                tone={statusTone[game.status as keyof typeof statusTone] ?? "neutral"}
                pulse={game.status === "Live"}
                className="w-fit"
              >
                {game.status}
              </Badge>
              <h3 className="mt-4 text-lg font-semibold text-white">{game.name}</h3>
              <p className="mt-2 text-sm text-ash-300">{game.description}</p>
              {game.howToPlay && (
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ash-300">{game.howToPlay}</p>
              )}
              {game.participants > 0 && (
                <p className="mt-4 text-xs font-medium text-lava-300">
                  {game.participants.toLocaleString()} participants
                </p>
              )}
              {game.href && (
                <div className="mt-5">
                  <ButtonLink href={game.href} size="sm" variant="secondary">
                    View {game.name}
                  </ButtonLink>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </Section>
  );
}
