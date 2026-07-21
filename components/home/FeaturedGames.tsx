import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { featuredGames } from "@/lib/mock-data";

const statusTone = {
  Live: "live",
  "Voting Open": "lava",
  "Coming Soon": "neutral",
} as const;

export function FeaturedGames() {
  return (
    <Section id="games">
      <SectionHeading
        eyebrow="Stream Games"
        title="Featured Games"
        description="Modular community games running live — join in from your dashboard."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featuredGames.map((game) => (
          <GlassCard key={game.id} className="flex flex-col">
            <Badge tone={statusTone[game.status as keyof typeof statusTone]} pulse={game.status === "Live"} className="w-fit">
              {game.status}
            </Badge>
            <h3 className="mt-4 text-lg font-semibold text-white">{game.name}</h3>
            <p className="mt-2 flex-1 text-sm text-ash-300">{game.description}</p>
            {game.participants > 0 && (
              <p className="mt-4 text-xs font-medium text-lava-300">
                {game.participants.toLocaleString()} participants
              </p>
            )}
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
