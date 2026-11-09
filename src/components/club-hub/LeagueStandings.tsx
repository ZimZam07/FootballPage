"use client";

import { ListOrdered } from "lucide-react";
import { useApi } from "@/lib/club-hub/client";
import type { ClubRef, LeagueId, StandingRow, Standings } from "@/lib/club-hub/types";
import { LEAGUE_IDENTITY, seasonLabel, standingZone, zonesIn } from "@/lib/club-hub/leagueIdentity";
import { LeagueIdentity } from "./LeagueIdentity";
import { ErrorState, Skeleton, StateMessage, TeamLogo } from "./ui";

const zoneOf = (r: StandingRow) => standingZone(r.zone?.description);

const gd = (n: number) => (n > 0 ? `+${n}` : String(n));

// Column visibility: position, club, played, goal difference and points always; W/D/L from 640px; GF/GA from 768px.
const SM = "hidden sm:table-cell";
const MD = "hidden md:table-cell";

export default function LeagueStandings({ league, leagueName, onOpen }: { league: LeagueId; leagueName: string; onOpen: (club: ClubRef) => void }) {
  const { data, error, loading, retry } = useApi<Standings>(`/api/club-hub/standings?league=${league}`);
  const theme = { bar: LEAGUE_IDENTITY[league].primary };
  // Guard against showing another league's table while a new one loads.
  const table = data && data.league === league ? data : undefined;

  const played = table?.rows.map((r) => r.played) ?? [];
  const minP = played.length ? Math.min(...played) : 0;
  const maxP = played.length ? Math.max(...played) : 0;
  const progress = !played.length ? null : minP === maxP ? `After ${maxP} ${maxP === 1 ? "match" : "matches"}` : `${minP}–${maxP} matches played`;
  const legend = table ? zonesIn(table.rows.map((r) => r.zone?.description)) : [];
  const deducted = table?.rows.filter((r) => r.deductions > 0) ?? [];

  return (
    <section className="ch-fade-up" aria-labelledby="league-standings-title" style={{ animationDelay: "120ms" }}>
      {/* Header: league accent rule, then the competition identity (logo, name, season) and progress */}
      <div className="mb-5 border-t border-line">
        <span className="block h-0.5 w-16" style={{ background: theme.bar }} aria-hidden />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <LeagueIdentity league={league} kicker="League standings" season={table?.season} titleId="league-standings-title" />
          {progress && <p className="text-sm text-slate-400 sm:pb-0.5">{progress}</p>}
        </div>
      </div>

      {error && !table ? (
        <div className="rounded-lg border border-line bg-panel">
          <ErrorState error={error} onRetry={retry} />
        </div>
      ) : loading || !table ? (
        <div className="overflow-hidden rounded-lg border border-line bg-panel" aria-busy aria-label="Loading standings">
          <div className="flex h-11 items-center gap-4 border-b border-line bg-white/[0.02] px-4 sm:px-6">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-40" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-12 items-center gap-3 border-b border-line px-4 last:border-0 sm:px-6">
              <Skeleton className="h-4 w-5" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-24 sm:w-56" />
            </div>
          ))}
        </div>
      ) : table.rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel">
          <StateMessage icon={<ListOrdered className="h-5 w-5" />} title="No standings yet" message={`The ${leagueName} table will appear once the season is under way.`} />
        </div>
      ) : (
        <>
          <div key={league} className="ch-fade-up overflow-hidden rounded-lg border border-line bg-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <caption className="sr-only">
                  {leagueName} {seasonLabel(table.season)} standings
                </caption>
                <thead>
                  <tr className="border-b border-line bg-white/[0.02] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th scope="col" className="w-12 py-3.5 pl-3 pr-2 text-left sm:w-16 sm:pl-6" title="Position">Pos</th>
                    <th scope="col" className="py-3.5 pr-2 text-left">Club</th>
                    <th scope="col" className="w-9 px-1 text-center sm:w-11" title="Played">P</th>
                    <th scope="col" className={`${SM} w-11 px-1 text-center`} title="Won">W</th>
                    <th scope="col" className={`${SM} w-11 px-1 text-center`} title="Drawn">D</th>
                    <th scope="col" className={`${SM} w-11 px-1 text-center`} title="Lost">L</th>
                    <th scope="col" className={`${MD} w-11 px-1 text-center`} title="Goals for">GF</th>
                    <th scope="col" className={`${MD} w-11 px-1 text-center`} title="Goals against">GA</th>
                    <th scope="col" className="w-11 px-1 text-center sm:w-12" title="Goal difference">GD</th>
                    <th scope="col" className="w-12 px-2 text-center text-white sm:w-16 sm:pr-4" title="Points" style={{ background: `color-mix(in srgb, ${theme.bar} 14%, transparent)` }}>
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => {
                    const zone = zoneOf(r);
                    const nextZone = table.rows[i + 1] ? zoneOf(table.rows[i + 1]) : null;
                    // A slightly stronger rule where one zone ends, so the cut-off lines read at a glance.
                    const boundary = i < table.rows.length - 1 && zone?.key !== nextZone?.key;
                    const ref: ClubRef = { id: r.team.id, league, name: r.team.name, shortName: r.team.shortName, logo: r.team.logo };
                    return (
                      <tr key={r.team.id} className={`border-b transition-colors last:border-0 hover:bg-white/[0.025] ${boundary ? "border-white/15" : "border-line"}`}>
                        <td className="relative py-2.5 pl-3 sm:pl-6">
                          <span className="absolute inset-y-1.5 left-0 w-[3px]" style={{ background: zone?.color ?? "transparent" }} title={r.zone?.description} aria-hidden />
                          <span className="font-display text-base font-bold text-slate-300">{r.position}</span>
                          {zone && <span className="sr-only"> ({r.zone?.description})</span>}
                        </td>
                        <td className="max-w-0 py-2.5 pr-2">
                          <button onClick={() => onOpen(ref)} className="group flex w-full min-w-0 items-center gap-2.5 text-left sm:gap-3" title={`Open ${r.team.name}`}>
                            <TeamLogo src={r.team.logo} name={r.team.name} className="h-6 w-6" />
                            <span className="min-w-0 truncate font-medium text-slate-100 group-hover:text-white group-hover:underline group-hover:decoration-white/30 group-hover:underline-offset-4">
                              <span className="hidden sm:inline">{r.team.name}</span>
                              <span className="sm:hidden">{r.team.shortName}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-1 text-center text-slate-300">{r.played}</td>
                        <td className={`${SM} px-1 text-center text-slate-400`}>{r.won}</td>
                        <td className={`${SM} px-1 text-center text-slate-400`}>{r.drawn}</td>
                        <td className={`${SM} px-1 text-center text-slate-400`}>{r.lost}</td>
                        <td className={`${MD} px-1 text-center text-slate-500`}>{r.goalsFor}</td>
                        <td className={`${MD} px-1 text-center text-slate-500`}>{r.goalsAgainst}</td>
                        <td className={`px-1 text-center ${r.goalDifference > 0 ? "text-emerald-300/90" : r.goalDifference < 0 ? "text-rose-300/80" : "text-slate-400"}`}>{gd(r.goalDifference)}</td>
                        <td className="px-2 text-center font-display text-lg font-bold text-white sm:pr-4" style={{ background: `color-mix(in srgb, ${theme.bar} 9%, transparent)` }}>
                          {r.points}
                          {r.deductions > 0 && (
                            <sup className="ml-0.5 text-[10px] text-amber-400" title={`${r.deductions} point${r.deductions === 1 ? "" : "s"} deducted`}>
                              *
                            </sup>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-start sm:justify-between">
            {legend.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Table key">
                {legend.map((z) => (
                  <li key={z.key} className="inline-flex items-center gap-2">
                    <span className="h-3 w-[3px]" style={{ background: z.color }} aria-hidden />
                    {z.label}
                  </li>
                ))}
              </ul>
            )}
            <p className="shrink-0 text-slate-500">
              Live from ESPN; positions use the league&apos;s official ordering.
              {deducted.length > 0 && <span className="text-amber-400/90"> * Points deducted.</span>}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
