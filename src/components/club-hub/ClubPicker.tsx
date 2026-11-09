"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search, Star, X } from "lucide-react";
import { useApi, useFavorites } from "@/lib/club-hub/client";
import type { ClubRef, LeagueId, LeagueTeams } from "@/lib/club-hub/types";
import { getLeague } from "@/lib/club-hub/leagues";
import LeagueStandings from "./LeagueStandings";
import { ErrorState, Skeleton, StateMessage, TeamLogo } from "./ui";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ClubPicker({ onOpen }: { onOpen: (club: ClubRef) => void }) {
  const { data, error, loading, retry } = useApi<LeagueTeams[]>("/api/club-hub/teams");
  const { favorites, isFavorite, toggle } = useFavorites();
  const [league, setLeague] = useState<LeagueId>("pl");
  const [query, setQuery] = useState("");

  const leagueName = useMemo(() => new Map(data?.map((l) => [l.league, l.name])), [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    const q = fold(query.trim());
    if (q) {
      return data.flatMap((l) =>
        l.teams
          .filter((t) => fold(t.name).includes(q) || fold(t.shortName).includes(q) || fold(t.abbreviation) === q)
          .map((t) => ({ ...t, league: l.league })),
      );
    }
    return (data.find((l) => l.league === league)?.teams ?? []).map((t) => ({ ...t, league }));
  }, [data, league, query]);

  return (
    <div className="space-y-12">
      {/* Followed clubs */}
      <section className="ch-fade-up">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white">Your clubs</h3>
          {favorites.length > 0 && <span className="text-xs text-slate-500">{favorites.length} followed</span>}
        </div>
        {favorites.length === 0 ? (
          <p className="border-y border-line py-6 text-sm text-slate-400">
            Tap the <Star className="mx-0.5 inline h-4 w-4 -translate-y-px text-amber-400" /> on any club below to follow it. Followed clubs appear here for one-tap access.
          </p>
        ) : (
          <div className="grid grid-cols-1 border-t border-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-x-8">
            {favorites.map((club) => (
              <div key={club.id} className="ch-row group relative flex items-center gap-4 border-b border-line py-3.5">
                <TeamLogo src={club.logo} name={club.name} className="h-10 w-10" />
                <button onClick={() => onOpen(club)} className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-['']">
                  <p className="truncate font-semibold text-white">{club.name}</p>
                  <p className="text-xs text-slate-500">{leagueName.get(club.league) ?? ""}</p>
                </button>
                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                <button onClick={() => toggle(club)} aria-label={`Unfollow ${club.name}`} className="relative z-10 rounded p-1.5 text-amber-400 transition hover:bg-amber-400/10">
                  <Star className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Browse */}
      <section className="ch-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white">Find a club</h3>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all leagues…"
              aria-label="Search clubs"
              className="h-10 w-full rounded-md border border-line bg-white/[0.02] pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-volt/60"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* League filter */}
        <div className={`ch-scrollbar-none -mx-4 mb-6 flex gap-6 overflow-x-auto border-b border-line px-4 transition-opacity sm:mx-0 sm:px-0 ${query ? "opacity-40" : ""}`}>
          {(data ?? []).map((l) => {
            const on = league === l.league && !query;
            return (
              <button
                key={l.league}
                onClick={() => {
                  setLeague(l.league);
                  setQuery("");
                }}
                className={`relative -mb-px shrink-0 pb-3 text-sm font-semibold transition-colors ${on ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
              >
                {l.name}
                <span className="ml-1.5 font-display text-sm text-slate-500">{l.teams.length}</span>
                <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-volt transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            );
          })}
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mb-3 h-5 w-28 shrink-0" />)}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={retry} />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-px sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : visible.length === 0 ? (
          <StateMessage icon={<Search className="h-5 w-5" />} title="No clubs match your search" message={`Nothing found for “${query}”. Try a shorter name.`} />
        ) : (
          // A crest album: a hairline grid where each club gets an equal square.
          <div key={query ? "search" : league} className="grid grid-cols-2 overflow-hidden rounded-lg border border-line sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visible.map((team, i) => {
              const ref: ClubRef = { id: team.id, league: team.league, name: team.name, shortName: team.shortName, logo: team.logo };
              const followed = isFavorite(team.id);
              return (
                <div
                  key={`${team.league}-${team.id}`}
                  className="ch-fade-up ch-crest group relative flex flex-col items-center gap-3 px-4 pb-5 pt-7 text-center shadow-[0_0_0_0.5px_var(--color-line)] transition-colors duration-300 hover:bg-panel"
                  style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }}
                >
                  <TeamLogo src={team.logo} name={team.name} className="ch-crest-logo h-14 w-14" />
                  <button onClick={() => onOpen(ref)} className="min-w-0 after:absolute after:inset-0 after:content-['']">
                    <span className="line-clamp-2 text-sm font-semibold leading-tight text-slate-100">{team.name}</span>
                    {query && <span className="mt-1 block text-[11px] text-slate-500">{leagueName.get(team.league)}</span>}
                  </button>
                  <button
                    onClick={() => toggle(ref)}
                    aria-pressed={followed}
                    aria-label={followed ? `Unfollow ${team.name}` : `Follow ${team.name}`}
                    className={`absolute right-2 top-2 z-10 rounded p-1.5 transition ${followed ? "text-amber-400" : "text-slate-500 opacity-0 hover:text-amber-400 focus-visible:opacity-100 group-hover:opacity-100"}`}
                  >
                    <Star className={`h-4 w-4 ${followed ? "fill-current" : ""}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* The selected league's table, below its clubs (hidden while searching across leagues). */}
      {!query && <LeagueStandings league={league} leagueName={leagueName.get(league) ?? getLeague(league)?.name ?? ""} onOpen={onOpen} />}
    </div>
  );
}
