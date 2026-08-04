"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { fetchLiveWagerLeaderboard } from "@/lib/wagerLeaderboardApi";
import { formatCurrency, cn } from "@/lib/utils";
import type { WagerLeaderboard } from "@/lib/api";

const rankColors = ["text-gold-400", "text-ash-100", "text-lava-400"];

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  const total = Math.max(0, diff);
  return {
    ended: diff <= 0,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (timeLeft.ended) {
    return <p className="mt-6 text-center text-sm font-semibold text-ash-400">Race has ended</p>;
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3">
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 min-w-[64px]">
          <span className="font-display text-2xl font-bold text-white tabular-nums">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-widest text-ash-400">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<WagerLeaderboard | null | undefined>(undefined);

  useEffect(() => {
    fetchLiveWagerLeaderboard()
      .then(setBoard)
      .catch(() => setBoard(null));
  }, []);

  return (
    <Section>
      <SectionHeading
        eyebrow="Wager Race"
        title={board ? board.displayTitle : "Leaderboard"}
        description="Ranked by how much you've wagered — top of the board takes the prize."
      />

      {board?.endsAt && <Countdown endsAt={board.endsAt} />}

      {board === undefined ? (
        <p className="mt-12 text-center text-sm text-ash-400">Loading…</p>
      ) : board === null || board.entries.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ash-400">No wager race is running right now — check back soon.</p>
      ) : (
        <GlassCard className="mx-auto mt-8 max-w-2xl divide-y divide-white/5 p-0">
          {board.entries.map((entry, i) => (
            <div key={entry.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <span className={cn("font-display w-6 text-lg", rankColors[i] ?? "text-ash-300")}>{i + 1}</span>
                {entry.avatarUrl ? (
                  <Image src={entry.avatarUrl} alt="" width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="font-heading flex h-8 w-8 items-center justify-center rounded-full border border-lava-400/40 bg-ash-800 text-xs font-bold text-lava-300">
                    {entry.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="font-heading text-sm font-semibold text-white">{entry.name}</p>
              </div>
              <span className="font-heading text-sm font-bold text-lava-300">
                {formatCurrency(entry.wagered, board.currency)}
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </Section>
  );
}
