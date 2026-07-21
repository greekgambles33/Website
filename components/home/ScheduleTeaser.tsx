"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { ButtonLink } from "@/components/ui/Button";
import { nextStreamAt } from "@/lib/mock-data";
import { useCountdown } from "@/lib/hooks/useCountdown";

export function ScheduleTeaser() {
  const countdown = useCountdown(nextStreamAt);

  return (
    <Section>
      <SectionHeading
        eyebrow="Weekly Schedule"
        title="Next Stream"
        description="All times shown in your local timezone."
      />

      <GlassCard className="mx-auto mt-10 flex max-w-md flex-col items-center gap-2 text-center">
        <span className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
          Next Stream Starts In
        </span>
        <div className="text-coin font-display flex gap-3 text-3xl">
          {countdown ? (
            <>
              <span>{String(countdown.days).padStart(2, "0")}d</span>
              <span>{String(countdown.hours).padStart(2, "0")}h</span>
              <span>{String(countdown.minutes).padStart(2, "0")}m</span>
              <span>{String(countdown.seconds).padStart(2, "0")}s</span>
            </>
          ) : (
            <span className="font-sans text-base font-normal text-ash-300">Loading…</span>
          )}
        </div>
      </GlassCard>

      <div className="mt-8 text-center">
        <ButtonLink href="/schedule" variant="secondary">
          View Full Schedule
        </ButtonLink>
      </div>
    </Section>
  );
}
