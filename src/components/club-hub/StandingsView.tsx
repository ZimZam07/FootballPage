"use client";

import { useEffect, useRef } from "react";
import { useApi } from "@/lib/club-hub/client";
import type { ClubRef, Standings } from "@/lib/club-hub/types";
import { standingZone, zonesIn } from "@/lib/club-hub/leagueIdentity";
import { LeagueIdentity } from "./LeagueIdentity";
import { ErrorState, Skeleton, TeamLogo, card } from "./ui";

export default function StandingsView({ club, accent, focusClub }: { club: ClubRef; accent: string; focusClub: boolean }) {
  const { data, error, loading, retry } = useApi<Standings>(`/api/club-hub/standings?league=${club.league}`);
  const row = useRef<HTMLTableRowElement>(null);

  // "See full standings" lands here: bring the selected club's row into view.
  useEffect(() => {
    if (focusClub && data && row.current) {
      row.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusClub, data]);

  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) {
    return (
      <div className={`${card} space-y-3 p-6`}>
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
      </div>
    );
  }

  const zones = zonesIn(data.rows.map((r) => r.zone?.description));

  return (
    <div className="space-y-4">
      <LeagueIdentity league={club.league} size="md" season={data.season} />
      <div className={`${card} ch-fade-up overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-line bg-white/[0.02] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="ch-sticky-cell py-3.5 pl-4 pr-2 text-left sm:pl-6">Club</th>
                <th className="px-1.5 text-center sm:px-2" title="Matches played">MP</th>
                <th className="px-1.5 text-center sm:px-2" title="Won">W</th>
                <th className="px-1.5 text-center sm:px-2" title="Drawn">D</th>
                <th className="px-1.5 text-center sm:px-2" title="Lost">L</th>
                <th className="hidden px-1.5 text-center sm:px-2 md:table-cell" title="Goals for">GF</th>
                <th className="hidden px-1.5 text-center sm:px-2 md:table-cell" title="Goals against">GA</th>
                <th className="px-1.5 text-center sm:px-2" title="Goal difference">GD</th>
                <th className="px-2 pr-3 text-center text-white sm:pr-6" title="Points">Pts</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const me = r.team.id === club.id;
                return (
                  <tr
                    key={r.team.id}
                    ref={me ? row : undefined}
                    aria-current={me ? "true" : undefined}
                    className={`ch-trow border-b border-line transition-colors last:border-0 ${me ? "font-semibold" : "hover:bg-white/[0.025]"}`}
                    style={me ? { background: `color-mix(in srgb, ${accent} 13%, transparent)` } : undefined}
                  >
                    <td className="ch-sticky-cell py-3 pl-2 pr-1.5 sm:pl-6 sm:pr-2" style={{ ["--ch-cell-bg" as string]: me ? `color-mix(in srgb, ${accent} 13%, var(--ch-row-bg))` : "var(--ch-row-bg)" }}>
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <span className="h-5 w-[3px] shrink-0" style={{ background: standingZone(r.zone?.description)?.color ?? "transparent" }} title={r.zone?.description} />
                        <span className="w-4 shrink-0 text-right font-display text-base font-bold text-slate-400 sm:w-6">{r.position}</span>
                        <TeamLogo src={r.team.logo} name={r.team.name} className="h-6 w-6" />
                        <span className={`block max-w-[5.5rem] truncate sm:max-w-none ${me ? "text-white" : "font-medium text-slate-200"}`}>
                          <span className="hidden sm:inline">{r.team.name}</span>
                          <span className="sm:hidden">{r.team.shortName}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-1.5 text-center sm:px-2 text-slate-400">{r.played}</td>
                    <td className="px-1.5 text-center sm:px-2 text-slate-400">{r.won}</td>
                    <td className="px-1.5 text-center sm:px-2 text-slate-400">{r.drawn}</td>
                    <td className="px-1.5 text-center sm:px-2 text-slate-400">{r.lost}</td>
                    <td className="hidden px-1.5 text-center sm:px-2 text-slate-500 md:table-cell">{r.goalsFor}</td>
                    <td className="hidden px-1.5 text-center sm:px-2 text-slate-500 md:table-cell">{r.goalsAgainst}</td>
                    <td className="px-1.5 text-center sm:px-2 text-slate-400">{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
                    <td className="px-2 pr-3 text-center font-display text-lg font-bold text-white sm:pr-6">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
          {zones.map((z) => (
            <span key={z.key} className="inline-flex items-center gap-2"><span className="h-3 w-[3px]" style={{ background: z.color }} />{z.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
