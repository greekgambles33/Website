"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";
import { TournamentView, TournamentLoading } from "@/components/tournament/TournamentView";
import { fetchTournament, TournamentApiError } from "@/lib/tournamentsApi";
import type { FullTournament } from "@/lib/api";

const POLL_INTERVAL = 5000;

export default function TournamentByIdPage() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<FullTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTournament(params.id);
      setTournament(data);
      setError(null);
    } catch (err) {
      setError(err instanceof TournamentApiError ? err.message : "Tournament not found");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <Section>
      {loading ? (
        <TournamentLoading />
      ) : error || !tournament ? (
        <GlassCard className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 py-14 text-center">
          <h2 className="text-lg font-semibold text-white">Tournament Not Found</h2>
          <p className="text-sm text-ash-300">{error ?? "This tournament doesn't exist or was removed."}</p>
          <Link
            href="/tournament"
            className="font-heading mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lava-300 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Tournament
          </Link>
        </GlassCard>
      ) : (
        <TournamentView tournament={tournament} onRefresh={load} />
      )}
    </Section>
  );
}
