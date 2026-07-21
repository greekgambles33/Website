import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { featuredGames } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Games | GreekGodBerry",
  description: "Every stream game running live on GreekGodBerry — how they work and how to join.",
};

const statusTone = {
  Live: "live",
  "Voting Open": "lava",
  "Coming Soon": "neutral",
} as const;

export default function GamesPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Stream Games"
        title="Featured Games"
        description="Modular community games running live — join in from your dashboard."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {featuredGames.map((game) => (
          <GlassCard key={game.id} className="flex flex-col">
            <Badge
              tone={statusTone[game.status as keyof typeof statusTone]}
              pulse={game.status === "Live"}
              className="w-fit"
            >
              {game.status}
            </Badge>
            <h3 className="mt-4 text-lg font-semibold text-white">{game.name}</h3>
            <p className="mt-2 text-sm text-ash-300">{game.description}</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-ash-300">{game.howToPlay}</p>
            {game.participants > 0 && (
              <p className="mt-4 text-xs font-medium text-lava-300">
                {game.participants.toLocaleString()} participants
              </p>
            )}
            {"href" in game && game.href && (
              <div className="mt-5">
                <ButtonLink href={game.href} size="sm" variant="secondary">
                  {game.id === "bonus-hunt" ? "View Hunt" : "View Tournament"}
                </ButtonLink>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
