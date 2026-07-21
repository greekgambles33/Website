import Image from "next/image";
import { Crown, Flame } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import type { Hunt } from "@/lib/api";
import { calcHuntStats, bonusMultiplier } from "@/lib/huntStats";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusTone = {
  COLLECTING: "neutral",
  OPENING: "live",
  COMPLETED: "gold",
} as const;

const statusLabel = {
  COLLECTING: "Collecting",
  OPENING: "Opening",
  COMPLETED: "Completed",
} as const;

export function HuntDisplay({ hunt }: { hunt: Hunt }) {
  const stats = calcHuntStats(hunt);
  const bestMulti = stats.bestSpin ? bonusMultiplier(stats.bestSpin) : null;

  return (
    <div>
      <div className="flex flex-col items-center gap-3 text-center">
        <Badge tone={statusTone[hunt.status]} pulse={hunt.status === "OPENING"}>
          {statusLabel[hunt.status]}
        </Badge>
        <h1 className="text-ember text-3xl sm:text-4xl">{hunt.name}</h1>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <GlassCard className="text-center">
          <div className="text-coin font-display text-2xl sm:text-3xl">
            {formatCurrency(hunt.startBalance, hunt.currency)}
          </div>
          <p className="font-heading mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ash-300">
            Starting Balance
          </p>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="font-display text-2xl text-white sm:text-3xl">
            {stats.opened.length}/{stats.totalBonuses}
          </div>
          <p className="font-heading mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ash-300">
            Bonuses Opened
          </p>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-ember font-display text-2xl sm:text-3xl">
            {bestMulti !== null ? `${bestMulti.toFixed(2)}x` : "—"}
          </div>
          <p className="font-heading mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ash-300">
            Best Multiplier
          </p>
        </GlassCard>
        <GlassCard className="text-center">
          <div
            className={cn(
              "font-display text-2xl sm:text-3xl",
              stats.opened.length === 0
                ? "text-white"
                : stats.profitLoss >= 0
                  ? "text-[#7ad07a]"
                  : "text-crimson-400"
            )}
          >
            {stats.opened.length > 0
              ? `${stats.profitLoss >= 0 ? "+" : ""}${formatCurrency(stats.profitLoss, hunt.currency)}`
              : "—"}
          </div>
          <p className="font-heading mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ash-300">
            Profit / Loss
          </p>
        </GlassCard>
      </div>

      <GlassCard className="mx-auto mt-8 max-w-3xl">
        <div className="flex items-center justify-between text-xs text-ash-300">
          <span className="font-heading font-semibold uppercase tracking-widest">Progress</span>
          <span>
            {stats.opened.length} opened &middot; {stats.pending} pending &middot;{" "}
            {formatCurrency(hunt.startBalance, hunt.currency)} bought in
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ash-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lava-400 to-crimson-500 transition-all"
            style={{ width: `${stats.progressPct}%` }}
          />
        </div>
        <div className="mt-3 text-center text-sm">
          <span className="font-heading font-bold text-lava-300">
            {formatCurrency(stats.winnings, hunt.currency)} won so far
          </span>
        </div>
      </GlassCard>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {hunt.bonuses.map((bonus) => {
          const isOpened = bonus.payout !== null;
          const isBest = stats.bestSpin?.id === bonus.id;
          const multi = bonusMultiplier(bonus);

          return (
            <GlassCard key={bonus.id} glow={isBest} className={cn("flex flex-col", !isOpened && "opacity-70")}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-heading truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-ash-500">
                  {bonus.provider}
                </p>
                {isBest && (
                  <Badge tone="gold" className="shrink-0 gap-1">
                    <Crown size={11} /> Best
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                {bonus.image && (
                  <Image
                    src={bonus.image}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <h3 className="text-base font-semibold text-white">{bonus.slotName}</h3>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-ash-300">
                <span>Bet</span>
                <span className="font-semibold text-white">{formatCurrency(bonus.bet, hunt.currency)}</span>
              </div>

              <div className="mt-4 border-t border-white/5 pt-4">
                {isOpened ? (
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl text-white">{multi?.toFixed(2)}x</span>
                    <span className="text-sm font-semibold text-lava-300">
                      {formatCurrency(bonus.payout!, hunt.currency)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold uppercase tracking-widest text-ash-500">
                    <Flame size={12} />
                    Pending
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
