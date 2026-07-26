"use client";

import { useEffect, useState } from "react";
import { fetchActiveLadderRun } from "@/lib/streamGamesApi";
import type { LadderRun } from "@/lib/api";

const SLUG = "climb-the-ladder";
const POLL_MS = 2000;

const LEVELS = [
  { level: 1, points: 250, net: null as number | null },
  { level: 2, points: 500, net: 250 },
  { level: 3, points: 750, net: null },
  { level: 4, points: 1000, net: null },
  { level: 5, points: 1500, net: 1000 },
  { level: 6, points: 2000, net: null },
];

function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 50;
}

export default function ClimbTheLadderOverlayPage() {
  const [run, setRun] = useState<LadderRun | null>(null);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
  }, []);

  useEffect(() => {
    const load = () => fetchActiveLadderRun(SLUG).then(setRun).catch(() => {});
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!run) return null;

  const attempting = run.status === "ACTIVE" && run.phase === "ATTEMPTING" ? LEVELS[run.currentLevel] : null;
  const cleared = run.currentLevel > 0 ? LEVELS[run.currentLevel - 1] : null;
  const isFinalClimb = attempting?.level === 6;
  const passFailTotal = run.chatPassVotes + run.chatFailVotes;
  const decisionTotal = run.chatCashoutVotes + run.chatClimbVotes;

  return (
    <div className="min-h-screen w-full bg-transparent p-6 font-sans">
      {isFinalClimb && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <p className="font-heading text-2xl uppercase tracking-[0.3em] text-gold-300">The Final Climb</p>
            <p className="text-ember mt-2 text-6xl">{run.participantName}</p>
            <p className="mt-2 text-xl text-white">Going for 2,000</p>
          </div>
        </div>
      )}

      {run.status !== "ACTIVE" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <p className="font-heading text-xl uppercase tracking-[0.3em] text-gold-300">
              {run.status === "CASHED_OUT" ? "Cashed Out" : run.status === "COMPLETED" ? "Ladder Complete" : "Run Over"}
            </p>
            <p className="text-ember mt-2 text-6xl">{run.finalPoints} pts</p>
            <p className="mt-2 text-lg text-white">{run.participantName}</p>
          </div>
        </div>
      )}

      {/* Vertical ladder strip — left side */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 space-y-2 rounded-2xl border border-gold-500/25 bg-ash-950/85 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur">
        {[...LEVELS].reverse().map((lvl) => {
          const isCleared = run.currentLevel >= lvl.level;
          const isCurrent = run.status === "ACTIVE" && run.phase === "ATTEMPTING" && run.currentLevel + 1 === lvl.level;
          return (
            <div
              key={lvl.level}
              className={`w-40 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                isCurrent
                  ? "border-transparent bg-gradient-to-r from-gold-300 to-lava-400 text-[#140a04]"
                  : isCleared
                    ? "border-gold-500/40 bg-gold-500/10 text-ash-100"
                    : "border-white/5 text-ash-500"
              }`}
            >
              L{lvl.level} · {lvl.points}
              {lvl.net && <span className="ml-1 text-[10px] opacity-75">(net {lvl.net})</span>}
            </div>
          );
        })}
      </div>

      {/* HUD — top right */}
      <div className="fixed right-6 top-6 rounded-2xl border border-lava-400/25 bg-ash-950/85 px-6 py-3 text-right shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur">
        <p className="font-heading text-[10px] uppercase tracking-widest text-ash-400">Climber</p>
        <p className="text-ember text-2xl leading-none">{run.participantName}</p>
        <p className="mt-1 text-xs text-ash-300">Secured: {run.securedFloor} pts</p>
      </div>

      {/* Decision / prediction panel — bottom right */}
      {run.status === "ACTIVE" && (
        <div className="fixed bottom-10 right-6 w-72 rounded-2xl border border-crimson-500/25 bg-ash-950/85 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur">
          {attempting ? (
            <>
              <p className="text-center text-sm text-white">
                Level {attempting.level} attempt &mdash; {attempting.points} pts
              </p>
              {passFailTotal > 0 && (
                <>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ash-800">
                    <div className="bg-lava-400" style={{ width: `${pct(run.chatPassVotes, passFailTotal)}%` }} />
                    <div className="bg-crimson-500" style={{ width: `${pct(run.chatFailVotes, passFailTotal)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-ash-300">
                    <span>PASS {pct(run.chatPassVotes, passFailTotal)}%</span>
                    <span>FAIL {pct(run.chatFailVotes, passFailTotal)}%</span>
                  </div>
                </>
              )}
            </>
          ) : (
            cleared && (
              <>
                <p className="text-center text-sm text-white">Level {cleared.level} cleared — cash out or climb?</p>
                {decisionTotal > 0 && (
                  <>
                    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ash-800">
                      <div className="bg-gold-400" style={{ width: `${pct(run.chatCashoutVotes, decisionTotal)}%` }} />
                      <div className="bg-lava-400" style={{ width: `${pct(run.chatClimbVotes, decisionTotal)}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-ash-300">
                      <span>CASH OUT {pct(run.chatCashoutVotes, decisionTotal)}%</span>
                      <span>CLIMB {pct(run.chatClimbVotes, decisionTotal)}%</span>
                    </div>
                  </>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
