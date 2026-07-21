import type { Hunt, HuntBonus } from "@/lib/api";

export interface HuntStats {
  opened: HuntBonus[];
  pending: number;
  totalBonuses: number;
  winnings: number;
  profitLoss: number;
  avgMultiplier: number;
  bestSpin: HuntBonus | null;
  progressPct: number;
  requiredAvgPerBonus: number;
}

export function calcHuntStats(hunt: Hunt): HuntStats {
  const bonuses = hunt.bonuses;
  const opened = bonuses.filter((b) => b.payout !== null);
  const winnings = opened.reduce((sum, b) => sum + (b.payout ?? 0), 0);
  const bestSpin = opened.reduce<HuntBonus | null>((best, b) => {
    if (!best) return b;
    const bestMulti = best.bet > 0 ? (best.payout ?? 0) / best.bet : 0;
    const multi = b.bet > 0 ? (b.payout ?? 0) / b.bet : 0;
    return multi > bestMulti ? b : best;
  }, null);
  const avgMultiplier =
    opened.length > 0
      ? opened.reduce((sum, b) => sum + (b.bet > 0 ? (b.payout ?? 0) / b.bet : 0), 0) / opened.length
      : 0;

  return {
    opened,
    pending: bonuses.length - opened.length,
    totalBonuses: bonuses.length,
    winnings,
    profitLoss: winnings - hunt.startBalance,
    avgMultiplier,
    bestSpin,
    progressPct: bonuses.length > 0 ? Math.round((opened.length / bonuses.length) * 100) : 0,
    requiredAvgPerBonus: bonuses.length > 0 ? hunt.startBalance / bonuses.length : 0,
  };
}

export function bonusMultiplier(bonus: HuntBonus): number | null {
  if (bonus.payout === null) return null;
  return bonus.bet > 0 ? bonus.payout / bonus.bet : 0;
}
