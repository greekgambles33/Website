"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { schedule, nextStreamAt } from "@/lib/mock-data";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { cn } from "@/lib/utils";

export function ScheduleSection() {
  const countdown = useCountdown(nextStreamAt);

  return (
    <Section id="schedule">
      <SectionHeading
        eyebrow="Weekly Schedule"
        title="Stream Schedule"
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

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {schedule.map((day) => (
          <GlassCard
            key={day.day}
            hover={!day.off}
            className={cn(
              "flex flex-col items-center gap-2 py-5 text-center",
              day.off && "border-lava-400/10 opacity-60"
            )}
          >
            <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-ash-300">
              {day.day}
            </span>
            {day.live ? (
              <Badge tone="live" pulse>
                Live
              </Badge>
            ) : (
              <span className={cn("font-display text-xl", day.off ? "text-ash-500" : "text-white")}>
                {day.off ? "—" : day.time.replace(" EST", "")}
              </span>
            )}
            <p className="mt-1 text-xs leading-snug text-ash-300">{day.title}</p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
