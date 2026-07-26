"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { fetchActivePredictionMatch } from "@/lib/streamGamesApi";
import type { PredictionMatch } from "@/lib/api";

const SLUG = "chat-vs-streamer";
const POLL_MS = 2000;

export default function ChatVsStreamerOverlayPage() {
  const [match, setMatch] = useState<PredictionMatch | null>(null);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
  }, []);

  useEffect(() => {
    const load = () => fetchActivePredictionMatch(SLUG).then(setMatch).catch(() => {});
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!match) return null;

  const currentRound = match.rounds[0];
  const roundOpen = currentRound?.status === "OPEN" || currentRound?.status === "LOCKED";
  const totalVotes = currentRound ? currentRound.votesChat + currentRound.votesStreamer : 0;
  const chatPct = totalVotes ? currentRound!.votesChat / totalVotes : 0.5;

  return (
    <div className="min-h-screen w-full bg-transparent p-6 font-sans">
      {/* Victory takeover */}
      {match.status === "COMPLETED" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <p className="font-heading text-2xl uppercase tracking-[0.3em] text-gold-300">Match Point</p>
            <p className="text-ember mt-2 text-7xl">{match.winner} Wins</p>
            <p className="mt-3 text-2xl text-white">
              {match.chatScore} — {match.streamerScore}
            </p>
          </div>
        </div>
      )}

      {/* Scoreboard bar — top center */}
      <div className="mx-auto flex w-fit items-center gap-6 rounded-2xl border border-lava-400/25 bg-ash-950/85 px-8 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur">
        <div className="text-center">
          <p className="font-heading text-[10px] uppercase tracking-widest text-ash-400">Chat</p>
          <p className="text-ember text-4xl leading-none">{match.chatScore}</p>
          {match.chatStreak >= 3 && (
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-gold-400">
              <Flame size={11} /> {match.chatStreak}
            </p>
          )}
        </div>
        <span className="font-heading text-xs text-ash-600">VS</span>
        <div className="text-center">
          <p className="font-heading text-[10px] uppercase tracking-widest text-ash-400">Streamer</p>
          <p className="text-ember text-4xl leading-none">{match.streamerScore}</p>
          {match.streamerStreak >= 3 && (
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-gold-400">
              <Flame size={11} /> {match.streamerStreak}
            </p>
          )}
        </div>
      </div>

      {/* Question + vote split — lower third */}
      {roundOpen && currentRound && (
        <div className="fixed inset-x-0 bottom-10 mx-auto w-[min(760px,92vw)] rounded-2xl border border-crimson-500/25 bg-ash-950/85 px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur">
          <p className="text-center text-lg text-white">{currentRound.question}</p>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-ash-800">
            <div className="bg-lava-400 transition-all" style={{ width: `${chatPct * 100}%` }} />
            <div className="bg-crimson-500 transition-all" style={{ width: `${(1 - chatPct) * 100}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-xs text-ash-300">
            <span>CHAT · {Math.round(chatPct * 100)}%</span>
            <span>STREAMER · {Math.round((1 - chatPct) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
