"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Crown } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { fetchLiveWagerLeaderboard } from "@/lib/wagerLeaderboardApi";
import { formatCurrency, cn } from "@/lib/utils";
import type { WagerLeaderboard, WagerEntry } from "@/lib/api";

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

function Countdown({ endsAt, label, endedLabel }: { endsAt: string; label?: string; endedLabel: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (timeLeft.ended) {
    return <p className="mt-6 text-center text-sm font-semibold text-ash-400">{endedLabel}</p>;
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="mt-6">
      {label && (
        <p className="font-heading text-center text-xs font-semibold uppercase tracking-widest text-ash-400">{label}</p>
      )}
      <div className="mx-auto mt-2 flex max-w-md items-center justify-center gap-3">
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
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const podiumRankColors = ["text-gold-400", "text-ash-100", "text-lava-400"];
const podiumBadgeStyles = [
  "bg-gold-400 text-ash-950",
  "bg-ash-100 text-ash-950",
  "bg-lava-400 text-ash-950",
];

function PodiumCard({
  entry,
  rank,
  prize,
  currency,
}: {
  entry: WagerEntry;
  rank: number;
  prize: number | null;
  currency: string;
}) {
  const isFirst = rank === 1;
  return (
    <GlassCard
      className={cn(
        "flex flex-col items-center px-5 py-6 text-center",
        isFirst && "border-gold-400/50 shadow-[0_0_30px_-8px_rgba(250,204,21,0.35)] sm:-translate-y-4"
      )}
    >
      {isFirst && <Crown size={22} className="mb-1 text-gold-400" />}
      <span
        className={cn(
          "font-display flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
          podiumBadgeStyles[rank - 1] ?? "bg-ash-800 text-ash-100"
        )}
      >
        {rank}
      </span>
      {entry.avatarUrl ? (
        <Image
          src={entry.avatarUrl}
          alt=""
          width={64}
          height={64}
          className="mt-3 rounded-full"
        />
      ) : (
        <div className="font-heading mt-3 flex h-16 w-16 items-center justify-center rounded-full border border-lava-400/40 bg-ash-800 text-xl font-bold text-lava-300">
          {entry.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <p className="font-heading mt-3 truncate text-sm font-semibold text-white">{entry.name}</p>
      <span className={cn("font-heading mt-1 text-sm font-bold", podiumRankColors[rank - 1] ?? "text-ash-300")}>
        {formatCurrency(entry.wagered, currency)}
      </span>
      {prize !== null && (
        <span className="font-display mt-2 text-xl font-bold text-gold-300">
          {formatCurrency(prize, currency)}
        </span>
      )}
    </GlassCard>
  );
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<WagerLeaderboard | null | undefined>(undefined);
  const [notStartedYet, setNotStartedYet] = useState(false);

  useEffect(() => {
    fetchLiveWagerLeaderboard()
      .then(setBoard)
      .catch(() => setBoard(null));
  }, []);

  useEffect(() => {
    if (!board?.startsAt) {
      setNotStartedYet(false);
      return;
    }
    const startsAtMs = new Date(board.startsAt).getTime();
    const tick = () => setNotStartedYet(startsAtMs > Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [board?.startsAt]);

  return (
    <Section>
      <SectionHeading
        eyebrow="Wager Race"
        title={board ? board.displayTitle : "Leaderboard"}
        description="Ranked by how much you've wagered — top of the board takes the prize."
      />

      {notStartedYet && board?.startsAt && <Countdown endsAt={board.startsAt} label="Race starts in" endedLabel="Race is starting…" />}
      {!notStartedYet && board?.endsAt && <Countdown endsAt={board.endsAt} endedLabel="Race has ended" />}

      {board?.prizeDistribution && board.prizeDistribution.length > 0 && (
        <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2">
          {board.prizeDistribution.map((tier) => (
            <span
              key={tier.rank}
              className="font-heading rounded-full border border-gold-500/30 bg-gold-500/5 px-3 py-1 text-xs font-semibold text-gold-300"
            >
              {ordinal(tier.rank)} &middot; {formatCurrency(tier.amount, board.currency)}
            </span>
          ))}
        </div>
      )}

      {board === undefined ? (
        <p className="mt-12 text-center text-sm text-ash-400">Loading…</p>
      ) : board === null || board.entries.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ash-400">No wager race is running right now — check back soon.</p>
      ) : (
        (() => {
          const top3 = board.entries.slice(0, 3).map((entry, i) => ({ entry, rank: i + 1 }));
          const podiumOrder = [top3[1], top3[0], top3[2]].filter(
            (x): x is { entry: WagerEntry; rank: number } => Boolean(x)
          );
          const rest = board.entries.slice(3);
          const prizeForRank = (rank: number): number | null => {
            if (board.prizeDistribution) {
              return board.prizeDistribution.find((t) => t.rank === rank)?.amount ?? null;
            }
            return rank === 1 ? board.prizeAmount : null;
          };

          return (
            <>
              <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 items-end gap-4 sm:grid-cols-3">
                {podiumOrder.map(({ entry, rank }) => (
                  <PodiumCard key={entry.id} entry={entry} rank={rank} prize={prizeForRank(rank)} currency={board.currency} />
                ))}
              </div>

              {rest.length > 0 && (
                <GlassCard className="mx-auto mt-6 max-w-2xl divide-y divide-white/5 p-0">
                  {rest.map((entry, i) => {
                    const rank = i + 4;
                    const prize = prizeForRank(rank);
                    return (
                      <div key={entry.id} className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-4">
                          <span className="font-display w-6 text-lg text-ash-300">{rank}</span>
                          {entry.avatarUrl ? (
                            <Image src={entry.avatarUrl} alt="" width={32} height={32} className="rounded-full" />
                          ) : (
                            <div className="font-heading flex h-8 w-8 items-center justify-center rounded-full border border-lava-400/40 bg-ash-800 text-xs font-bold text-lava-300">
                              {entry.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <p className="font-heading text-sm font-semibold text-white">{entry.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-heading text-sm font-bold text-lava-300">
                            {formatCurrency(entry.wagered, board.currency)}
                          </span>
                          {prize !== null && (
                            <span className="font-heading text-sm font-bold text-gold-300">
                              {formatCurrency(prize, board.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </GlassCard>
              )}
            </>
          );
        })()
      )}
    </Section>
  );
}
