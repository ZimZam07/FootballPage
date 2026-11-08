"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, MapPin, Users } from "lucide-react";
import { competitionLabel, formatDate, formatTime, useApi } from "@/lib/club-hub/client";
import type { LineupPlayer, MatchDetail, MatchStatLine, MatchTeamDetail, TeamLite } from "@/lib/club-hub/types";
import { ErrorState, Segmented, Skeleton, StateMessage, TeamLogo } from "./ui";

// ---------------------------------------------------------------------------
// Scoreboard

export function Scoreboard({ detail, clubId }: { detail: MatchDetail; clubId: string }) {
  const side = (t: MatchTeamDetail, align: "left" | "right") => (
    <div className={`flex min-w-0 flex-1 items-center gap-3 sm:gap-4 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamLogo src={t.team.logo} name={t.team.name} className="h-12 w-12 sm:h-16 sm:w-16" />
      <span className={`min-w-0 font-display text-lg font-bold uppercase leading-none sm:text-2xl ${t.team.id === clubId ? "text-white" : "text-slate-300"}`}>{t.team.name}</span>
    </div>
  );
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-[0.14em] text-slate-400">{competitionLabel(detail.competition)}</span>
        <span className="opacity-40">/</span>
        <span>{formatDate(detail.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
        {detail.venue && (
          <>
            <span className="opacity-40">/</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{detail.venue}</span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {side(detail.home, "left")}
        <div className="shrink-0 text-center">
          <div className="font-display font-extrabold leading-none tabular-nums text-white">
            <span className="text-5xl sm:text-6xl">{detail.home.score ?? "–"}</span>
            <span className="mx-1.5 text-3xl text-slate-500 sm:text-4xl">:</span>
            <span className="text-5xl sm:text-6xl">{detail.away.score ?? "–"}</span>
          </div>
          {detail.state === "in" ? (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff4b3a]">
              <span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" /> {detail.liveLabel ?? detail.statusDetail}
            </span>
          ) : (
            <span className="mt-1.5 inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {detail.state === "post" ? "Full time" : detail.statusDetail}
            </span>
          )}
        </div>
        {side(detail.away, "right")}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Statistics

export function StatBars({ stats, home, away, homeColor, awayColor }: { stats: MatchStatLine[]; home: TeamLite; away: TeamLite; homeColor: string; awayColor: string }) {
  if (!stats.length) {
    return <StateMessage icon={<BarChart3 className="h-5 w-5" />} title="No statistics for this match" message="The data provider has not published team statistics for this fixture." />;
  }
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between border-b border-line pb-3 text-sm font-semibold text-slate-200">
        <span className="flex items-center gap-2"><TeamLogo src={home.logo} name={home.name} className="h-6 w-6" />{home.shortName}</span>
        <span className="flex items-center gap-2">{away.shortName}<TeamLogo src={away.logo} name={away.name} className="h-6 w-6" /></span>
      </div>
      <div className="space-y-4">
        {stats.map((s, i) => {
          const total = s.homeValue + s.awayValue;
          const hp = total ? (s.homeValue / total) * 100 : 0;
          const ap = total ? (s.awayValue / total) * 100 : 0;
          const lead = s.homeValue === s.awayValue ? null : s.homeValue > s.awayValue ? "home" : "away";
          return (
            <div key={s.key} className="ch-stat">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className={`w-14 font-display text-xl font-bold tabular-nums ${lead === "home" ? "text-white" : "text-slate-500"}`}>{s.home}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{s.label}</span>
                <span className={`w-14 text-right font-display text-xl font-bold tabular-nums ${lead === "away" ? "text-white" : "text-slate-500"}`}>{s.away}</span>
              </div>
              <div className="flex gap-1">
                <div className="flex h-1 flex-1 justify-end bg-white/[0.06]">
                  <div className="ch-grow h-full" style={{ width: `${hp}%`, background: lead === "away" ? `color-mix(in srgb, ${homeColor} 45%, #22252b)` : homeColor, ["--grow-origin" as string]: "right", animationDelay: `${i * 50}ms` }} />
                </div>
                <div className="flex h-1 flex-1 bg-white/[0.06]">
                  <div className="ch-grow h-full" style={{ width: `${ap}%`, background: lead === "home" ? `color-mix(in srgb, ${awayColor} 45%, #22252b)` : awayColor, animationDelay: `${i * 50}ms` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lineups

const DEPTH: Record<string, number> = {
  G: 0, GK: 0,
  CD: 1, "CD-L": 1, "CD-R": 1, LB: 1, RB: 1, SW: 1, CB: 1,
  LWB: 2, RWB: 2, DM: 2, "DM-L": 2, "DM-R": 2, CDM: 2,
  CM: 3, "CM-L": 3, "CM-R": 3, LM: 3, RM: 3,
  AM: 4, "AM-L": 4, "AM-R": 4, CAM: 4,
  LF: 5, RF: 5, "CF-L": 5, "CF-R": 5, LW: 5, RW: 5, SS: 5,
  F: 6, CF: 6, ST: 6,
};

const lateral = (abbr: string) => {
  if (abbr.endsWith("-L")) return -1;
  if (abbr.endsWith("-R")) return 1;
  if (/^L/.test(abbr)) return -2;
  if (/^R/.test(abbr)) return 2;
  return 0;
};

/** Arranges starters into lines (defence → attack), using the published formation when it fits. */
function arrange(starters: LineupPlayer[], formation: string | null): { keeper: LineupPlayer[]; lines: LineupPlayer[][] } {
  const keeper = starters.filter((p) => DEPTH[p.positionAbbr] === 0);
  const outfield = starters
    .filter((p) => DEPTH[p.positionAbbr] !== 0)
    .sort((a, b) => (DEPTH[a.positionAbbr] ?? 3) - (DEPTH[b.positionAbbr] ?? 3) || a.formationPlace - b.formationPlace);
  const counts = (formation ?? "").split("-").map(Number).filter((n) => n > 0);
  let lines: LineupPlayer[][] = [];
  if (counts.length && counts.reduce((a, b) => a + b, 0) === outfield.length) {
    let i = 0;
    lines = counts.map((n) => outfield.slice(i, (i += n)));
  } else {
    const byDepth = new Map<number, LineupPlayer[]>();
    for (const p of outfield) {
      const d = DEPTH[p.positionAbbr] ?? 3;
      byDepth.set(d, [...(byDepth.get(d) ?? []), p]);
    }
    lines = [...byDepth.entries()].sort((a, b) => a[0] - b[0]).map(([, ps]) => ps);
  }
  return { keeper, lines: lines.map((l) => [...l].sort((a, b) => lateral(a.positionAbbr) - lateral(b.positionAbbr))) };
}

function PitchPlayer({ p, color }: { p: LineupPlayer; color: string }) {
  return (
    <div className="flex w-16 flex-col items-center gap-1 sm:w-20" title={`${p.name} · ${p.position}`}>
      <div className="ch-token relative">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 font-display text-sm font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.45)] sm:h-9 sm:w-9"
          style={{ background: color }}
        >
          {p.jersey ?? ""}
        </span>
        {p.subbedOut && (
          <span className="absolute -right-1.5 -top-1 rounded-full bg-white p-0.5 text-red-500 shadow" title="Substituted off">
            <ArrowDown className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="max-w-full truncate rounded-sm bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-white sm:text-[11px]">
        {p.shortName}
      </span>
    </div>
  );
}

function Pitch({ side, color }: { side: MatchTeamDetail; color: string }) {
  const { keeper, lines } = arrange(side.starters, side.formation);
  return (
    <div className="ch-pitch relative overflow-hidden rounded-md p-3">
      {/* Pitch markings: half-way arc, penalty box, six-yard box and spot */}
      <div className="pointer-events-none absolute inset-3 border border-white/30" aria-hidden>
        <div className="absolute left-1/2 top-0 h-16 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
        <div className="absolute bottom-0 left-1/2 h-16 w-44 -translate-x-1/2 border border-b-0 border-white/30" />
        <div className="absolute bottom-0 left-1/2 h-7 w-20 -translate-x-1/2 border border-b-0 border-white/30" />
        <div className="absolute bottom-[3.25rem] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/40" />
      </div>
      <div className="relative flex min-h-[26rem] flex-col justify-between gap-2 py-4 sm:min-h-[30rem]">
        {[...lines].reverse().map((line, i) => (
          <div key={i} className="flex items-start justify-around">
            {line.map((p) => <PitchPlayer key={p.id || p.name} p={p} color={color} />)}
          </div>
        ))}
        <div className="flex justify-center">
          {keeper.map((p) => <PitchPlayer key={p.id || p.name} p={p} color="#0f172a" />)}
        </div>
      </div>
    </div>
  );
}

function TeamLineup({ side, color }: { side: MatchTeamDetail; color: string }) {
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center gap-3">
        <TeamLogo src={side.team.logo} name={side.team.name} className="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{side.team.name}</p>
          {side.formation && <p className="font-display text-base font-bold tracking-wide text-slate-400">{side.formation}</p>}
        </div>
      </div>
      <Pitch side={side} color={color} />
      {side.substitutes.length > 0 && (
        <div>
          <p className="kicker mb-2">Substitutes</p>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {side.substitutes.map((p) => (
              <li key={p.id || p.name} className="flex items-center gap-2">
                <span className="w-6 text-right font-display text-sm font-bold tabular-nums text-slate-500">{p.jersey}</span>
                <span className={`truncate ${p.subbedIn ? "font-semibold text-white" : "text-slate-400"}`}>{p.name}</span>
                {p.subbedIn && <ArrowUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={3} aria-label="Came on" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Lineups({ detail, homeColor, awayColor }: { detail: MatchDetail; homeColor: string; awayColor: string }) {
  if (!detail.home.starters.length && !detail.away.starters.length) {
    return <StateMessage icon={<Users className="h-5 w-5" />} title="Lineups not available" message="Starting line-ups have not been published for this match." />;
  }
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <TeamLineup side={detail.home} color={homeColor} />
      <TeamLineup side={detail.away} color={awayColor} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full insight panel (scoreboard + stats/lineups). Used by "Live match", "Last Match" and the
// match modal. Pass `detail` when the caller already holds (and refreshes) the match data.

export function MatchInsight({
  eventId,
  clubId,
  accent,
  detail,
}: {
  eventId: string;
  clubId: string;
  accent: string;
  detail?: MatchDetail;
}) {
  const api = useApi<MatchDetail>(detail ? null : `/api/club-hub/match?event=${eventId}`);
  const data = detail ?? api.data;
  const { error, loading, retry } = api;
  const [tab, setTab] = useState<"stats" | "lineups">("stats");

  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="mx-auto h-4 w-64" />
        <div className="flex items-center justify-between gap-6">
          <Skeleton className="h-16 w-40" />
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-16 w-40" />
        </div>
        <div className="space-y-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      </div>
    );
  }

  // The selected club always gets its brand colour; the opponent a neutral contrast.
  const opponent = "#5f6876";
  const homeColor = data.home.team.id === clubId ? accent : opponent;
  const awayColor = data.away.team.id === clubId ? accent : opponent;

  return (
    <div className="space-y-8">
      <Scoreboard detail={data} clubId={clubId} />
      <div className="flex justify-center">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "stats", label: "Match stats" },
            { value: "lineups", label: "Lineups" },
          ]}
        />
      </div>
      <div key={tab} className="ch-fade-up">
        {tab === "stats" ? (
          <StatBars stats={data.stats} home={data.home.team} away={data.away.team} homeColor={homeColor} awayColor={awayColor} />
        ) : (
          <Lineups detail={data} homeColor={homeColor} awayColor={awayColor} />
        )}
      </div>
      {data.attendance ? (
        <p className="text-center text-xs text-slate-500">Attendance {data.attendance.toLocaleString()} · Kick-off {formatTime(data.date)}</p>
      ) : null}
    </div>
  );
}
