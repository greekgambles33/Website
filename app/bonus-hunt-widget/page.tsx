"use client";

import { useEffect, useState } from "react";
import { fetchLiveHunt } from "@/lib/huntsApi";
import { calcHuntStats, bonusMultiplier } from "@/lib/huntStats";
import { formatCurrency } from "@/lib/utils";
import type { Hunt } from "@/lib/api";

const POLL_INTERVAL = 5000;

const statusLabel = { COLLECTING: "Collecting", OPENING: "Opening", COMPLETED: "Completed" } as const;
const statusColor = { COLLECTING: "#cbb8a8", OPENING: "#ff2d0f", COMPLETED: "#ffd15a" } as const;

export default function BonusHuntWidgetPage() {
  const [hunt, setHunt] = useState<Hunt | null>(null);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";

    let cancelled = false;
    const load = async () => {
      try {
        const live = await fetchLiveHunt();
        if (!cancelled) setHunt(live);
      } catch {
        // OBS has no session — silently retry on the next tick.
      }
    };
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!hunt) {
    return (
      <div
        style={{
          width: 320,
          fontFamily: "var(--font-archivo, sans-serif)",
          background: "rgba(15,10,7,0.7)",
          border: "1px solid rgba(255,122,26,0.16)",
          borderRadius: 12,
          padding: "14px 16px",
          color: "#cbb8a8",
          fontSize: 12,
        }}
      >
        No active hunt
      </div>
    );
  }

  const stats = calcHuntStats(hunt);
  const bestMulti = stats.bestSpin ? bonusMultiplier(stats.bestSpin) : null;

  return (
    <div
      style={{
        width: 320,
        fontFamily: "var(--font-archivo, sans-serif)",
        color: "#f3e9df",
        background: "rgba(15,10,7,0.82)",
        border: "1px solid rgba(255,122,26,0.2)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,122,26,0.16)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {hunt.name}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: statusColor[hunt.status] }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: statusColor[hunt.status] }} />
          {statusLabel[hunt.status]}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "10px 14px", fontSize: 11 }}>
        <Stat label="Start" value={formatCurrency(hunt.startBalance, hunt.currency)} />
        <Stat
          label="P&L"
          value={stats.opened.length > 0 ? formatCurrency(stats.profitLoss, hunt.currency) : "—"}
          color={stats.profitLoss >= 0 ? "#7ad07a" : "#ff5a3a"}
        />
        <Stat label="Best" value={bestMulti !== null ? `${bestMulti.toFixed(2)}x` : "—"} color="#ffd15a" />
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto", borderTop: "1px solid rgba(255,122,26,0.1)" }}>
        {hunt.bonuses.map((bonus) => {
          const opened = bonus.payout !== null;
          const multi = bonusMultiplier(bonus);
          return (
            <div
              key={bonus.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 14px",
                fontSize: 11.5,
                opacity: opened ? 1 : 0.55,
                borderBottom: "1px solid rgba(255,122,26,0.06)",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                {bonus.slotName}
              </span>
              {opened ? (
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: multi && multi >= 100 ? "#ffd15a" : "#f3e9df" }}>
                    {multi?.toFixed(2)}x
                  </span>
                  <span style={{ color: "#ffa24d" }}>{formatCurrency(bonus.payout!, hunt.currency)}</span>
                </span>
              ) : (
                <span style={{ color: "#6b4a33" }}>pending</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color = "#f3e9df" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontWeight: 700, color, fontSize: 13 }}>{value}</div>
      <div style={{ color: "#6b4a33", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
