"use client";

import { ArrowRight, BarChart3, CalendarX2, MapPin, Trophy } from "lucide-react";
import {
  LIVE_REFRESH_MS,
  competitionLabel,
  formatDate,
  formatTime,
  isMatchActive,
  onAccent,
  outcomeFor,
  relativeTime,
  timeZoneLabel,
  useApi,
  type Outcome,
} from "@/lib/club-hub/client";
import type { ClubOverview, MatchDetail, MatchSummary, Standings, WinProbability } from "@/lib/club-hub/types";
import Link from "next/link";
import { useCallback, useState } from "react";
import { matchHref } from "@/lib/match/slug";
import MatchCentre from "./MatchCentre";
import { MatchInsight } from "./MatchInsight";
import { ErrorState, Modal, SectionHeading, Skeleton, StateMessage, TeamLogo, card } from "./ui";

// ---------------------------------------------------------------------------
// Next match

const NEUTRAL = "#8d939d";

function ProbabilityBar({ p, match, accent, clubId }: { p: WinProbability; match: MatchSummary; accent: string; clubId: string }) {
  const tint = (id: string) => (id === clubId ? accent : NEUTRAL);
  const parts = [
    { label: match.home.team.shortName, value: p.home, color: tint(match.home.team.id) },
    { label: "Draw", value: p.draw, color: "#4c525b" },
    { label: match.away.team.shortName, value: p.away, color: tint(match.away.team.id) },
  ];
  return (
    <div className="mt-8 border-t border-line pt-5">
      <p className="kicker mb-3">Win probability</p>
      <div className="flex h-1.5 gap-[3px]">
        {parts.map((part, i) => (
          <div key={part.label + i} className="ch-grow h-full" style={{ width: `${part.value}%`, background: part.color, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 text-sm">
        {parts.map((part, i) => (
          <div key={part.label + i} className={i === 1 ? "text-center" : i === 2 ? "text-right" : ""}>
            <span className="font-display text-2xl font-bold text-white">
              {part.value.toFixed(1)}
              <span className="text-base text-slate-500">%</span>
            </span>
            <span className="block truncate text-xs text-slate-500">{part.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">Implied from {p.provider} pre-match odds, bookmaker margin removed. Not an official prediction.</p>
    </div>
  );
}

/** Live ball-possession bar, shown in place of win probability once a match is under way. */
function PossessionBar({ detail, accent, clubId }: { detail: MatchDetail; accent: string; clubId: string }) {
  const p = detail.stats.find((s) => s.key === "possessionPct");
  if (!p) return null;
  const total = p.homeValue + p.awayValue || 1;
  const home = (p.homeValue / total) * 100;
  const label = (t: MatchDetail["home"]["team"]) => t.abbreviation || t.shortName;
  const tint = (id: string) => (id === clubId ? accent : NEUTRAL);
  return (
    <div className="mt-8 border-t border-line pt-5">
      <div className="mb-3 flex items-end justify-between gap-4">
        <p>
          <span className="font-display text-2xl font-bold text-white">{p.home}</span> <span className="text-xs text-slate-500">{label(detail.home.team)}</span>
        </p>
        <p className="kicker">Ball possession</p>
        <p className="text-right">
          <span className="text-xs text-slate-500">{label(detail.away.team)}</span> <span className="font-display text-2xl font-bold text-white">{p.away}</span>
        </p>
      </div>
      <div className="flex h-1.5 gap-[3px]">
        <div className="h-full transition-[width] duration-700 ease-out" style={{ width: `${home}%`, background: tint(detail.home.team.id) }} />
        <div className="h-full flex-1" style={{ background: tint(detail.away.team.id) }} />
      </div>
    </div>
  );
}

function NextMatchCard({
  match,
  detail,
  clubId,
  accent,
  onMatches,
  onStandings,
  onOpen,
}: {
  match: MatchSummary;
  detail: MatchDetail | undefined;
  clubId: string;
  accent: string;
  onMatches: () => void;
  onStandings: () => void;
  onOpen?: () => void;
}) {
  // The match feed (refreshed every 20s while active) is more current than the schedule.
  const state = detail?.state ?? match.state;
  const live = state === "in";
  const finished = state === "post";
  const homeScore = detail?.home.score ?? match.home.score ?? 0;
  const awayScore = detail?.away.score ?? match.away.score ?? 0;
  const clock = detail?.liveLabel ?? match.statusDetail;
  // Once the match has started, the whole card opens the Match Centre.
  const openable = Boolean(onOpen && detail && (live || finished));

  const team = (s: MatchSummary["home"], align: "left" | "right") => (
    <div className={`flex min-w-0 flex-1 flex-col gap-3 ${align === "right" ? "items-end text-right" : "items-start text-left"}`}>
      <TeamLogo src={s.team.logo} name={s.team.name} className="h-14 w-14 sm:h-20 sm:w-20" />
      <div className="min-w-0">
        <p className={`line-clamp-2 font-display text-xl font-bold uppercase leading-none sm:text-3xl ${s.team.id === clubId ? "text-white" : "text-slate-300"}`}>{s.team.name}</p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{s === match.home ? "Home" : "Away"}</p>
      </div>
    </div>
  );

  return (
    <div className={`${card} relative overflow-hidden ${openable ? "cursor-pointer transition-colors hover:border-line-strong" : ""}`}>
      {/* A colour rule across the top, like a broadcast graphic */}
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: live ? "#ff4b3a" : accent }} aria-hidden />
      <div
        className="relative p-5 sm:p-8"
        onClick={(e) => {
          if (openable && !(e.target as HTMLElement).closest("button,a")) onOpen!();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          {live ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ff4b3a]">
              <span className="ch-live-dot h-2 w-2 rounded-full bg-[#ff4b3a]" /> Live now
            </span>
          ) : (
            <span className="kicker">{finished ? "Just finished" : "Next match"}</span>
          )}
          <span className="text-xs font-medium text-slate-400">{[competitionLabel(match.competition), match.round].filter(Boolean).join(" · ")}</span>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 sm:gap-6">
          {team(match.home, "left")}
          <div className="flex shrink-0 flex-col items-center gap-2 px-1 text-center">
            {live || finished ? (
              <>
                <span className="font-display text-6xl font-extrabold leading-none tabular-nums text-white sm:text-8xl">
                  <span key={`h${homeScore}`} className="ch-pop inline-block">{homeScore}</span>
                  <span className="mx-1 text-slate-500 sm:mx-2">:</span>
                  <span key={`a${awayScore}`} className="ch-pop inline-block">{awayScore}</span>
                </span>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#ff4b3a]">
                    <span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" /> {clock}
                  </span>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Full time</span>
                )}
              </>
            ) : (
              <>
                <span className="font-display text-5xl font-bold leading-none tabular-nums text-white sm:text-7xl">{formatTime(match.date)}</span>
                <span className="text-sm font-medium text-slate-300">{formatDate(match.date)}</span>
                <span className="mt-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ background: accent, color: onAccent(accent) }}>
                  {/POSTPONED/.test(match.statusName) ? "Postponed" : relativeTime(match.date)}
                </span>
              </>
            )}
          </div>
          {team(match.away, "right")}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-slate-500">
          {match.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {match.venue}
            </span>
          )}
          <span>{live ? "Live score and stats update automatically" : `All times are in ${timeZoneLabel()}`}</span>
        </div>

        {state === "pre" && detail?.probability && <ProbabilityBar p={detail.probability} match={match} accent={accent} clubId={clubId} />}
        {(live || finished) && detail && <PossessionBar detail={detail} accent={accent} clubId={clubId} />}

        {openable && (
          <button
            onClick={onOpen}
            className="group mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line-strong text-sm font-semibold text-slate-100 transition hover:bg-white/[0.04]"
          >
            Match centre · Timeline, line-ups & stats
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        )}

        <div className={`mt-6 grid gap-2 ${live ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <button
            onClick={onMatches}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition hover:brightness-110 active:translate-y-px"
            style={{ background: accent, color: onAccent(accent) }}
          >
            See more matches <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
          {live && (
            // Opens this match's full Match Centre page (score, timeline, line-ups and stats).
            <Link
              href={matchHref(match.id, match.home.team.name, match.away.team.name)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ff4b3a]/40 px-4 text-sm font-semibold text-[#ff8a7d] transition hover:bg-[#ff4b3a]/10 active:translate-y-px"
            >
              <BarChart3 className="h-4 w-4" /> Match Centre
            </Link>
          )}
          <button
            onClick={onStandings}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong px-4 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.03] active:translate-y-px"
          >
            <Trophy className="h-4 w-4" /> See full standings
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form + mini table

const OUTCOME_STYLE: Record<Outcome, string> = {
  W: "bg-[#3ccf7a] text-slate-950",
  D: "bg-slate-500 text-white",
  L: "bg-[#ff4b3a] text-white",
};

function FormCard({ results, clubId, unavailable }: { results: MatchSummary[]; clubId: string; unavailable: boolean }) {
  const last = results.slice(0, 5).reverse();
  return (
    <div className={`${card} p-5`}>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="kicker">Recent form</p>
        <p className="text-[11px] text-slate-500">oldest → latest</p>
      </div>
      {last.length === 0 ? (
        <p className="text-sm text-slate-500">{unavailable ? "Results couldn't be loaded right now. They'll appear on the next refresh." : "No completed matches yet."}</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {last.map((m, i) => {
            const o = outcomeFor(m, clubId);
            const opp = m.home.team.id === clubId ? m.away.team : m.home.team;
            return (
              <div key={m.id} className="ch-fade-up group flex flex-col items-center gap-2" title={`${m.home.team.shortName} ${m.home.score}–${m.away.score} ${m.away.team.shortName}${/PEN/.test(m.statusName) ? " (decided on penalties)" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                <span className={`flex h-9 w-full items-center justify-center rounded font-display text-lg font-bold ${o ? OUTCOME_STYLE[o] : "bg-slate-700 text-slate-300"}`}>{o ?? "–"}</span>
                <TeamLogo src={opp.logo} name={opp.name} className="h-6 w-6 opacity-80 transition group-hover:opacity-100" />
                <span className="font-display text-xs font-semibold tabular-nums text-slate-500">{m.home.score}–{m.away.score}{/PEN/.test(m.statusName) && <span className="ml-0.5 text-[10px] uppercase"> pens</span>}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniTable({ league, clubId, accent, onStandings }: { league: string; clubId: string; accent: string; onStandings: () => void }) {
  const { data, error, loading, retry } = useApi<Standings>(`/api/club-hub/standings?league=${league}`);
  if (error) return <div className={`${card} p-5`}><ErrorState error={error} onRetry={retry} /></div>;
  const rows = data?.rows ?? [];
  const idx = rows.findIndex((r) => r.team.id === clubId);
  const start = Math.max(0, Math.min(idx - 2, rows.length - 5));
  const slice = idx >= 0 ? rows.slice(start, start + 5) : rows.slice(0, 5);
  return (
    <div className={`${card} overflow-hidden p-5`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="kicker">League table</p>
        <span className="flex text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          <span className="w-6 text-center">W</span>
          <span className="w-6 text-center">D</span>
          <span className="w-6 text-center">L</span>
          <span className="w-8 text-right">Pts</span>
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
      ) : (
        <ul>
          {slice.map((r) => {
            const me = r.team.id === clubId;
            return (
              <li key={r.team.id} className={`relative flex items-center gap-3 border-b border-line py-2 text-sm last:border-0 ${me ? "font-semibold text-white" : "text-slate-300"}`}>
                {me && <span className="absolute -left-5 inset-y-1 w-[3px]" style={{ background: accent }} aria-hidden />}
                <span className="w-5 text-right font-display font-bold tabular-nums text-slate-500">{r.position}</span>
                <TeamLogo src={r.team.logo} name={r.team.name} className="h-5 w-5" />
                <span className="min-w-0 flex-1 truncate">{r.team.shortName}</span>
                <span className="w-6 text-center tabular-nums text-slate-500">{r.won}</span>
                <span className="w-6 text-center tabular-nums text-slate-500">{r.drawn}</span>
                <span className="w-6 text-center tabular-nums text-slate-500">{r.lost}</span>
                <span className="w-8 text-right font-display text-base font-bold tabular-nums text-white">{r.points}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button onClick={onStandings} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-200 transition hover:gap-2 hover:text-white">
        Full table <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview page

export default function Overview({
  overview,
  accent,
  onMatches,
  onStandings,
}: {
  overview: ClubOverview;
  accent: string;
  onMatches: () => void;
  onStandings: () => void;
}) {
  const { club, fixtures, results } = overview;
  const fixturesDown = overview.unavailable?.includes("fixtures") ?? false;
  const resultsDown = overview.unavailable?.includes("results") ?? false;
  const next = fixtures[0];
  const last = results[0];

  // One shared feed for the next match: odds before kick-off, then live score, clock and
  // stats. Refreshed every 20 seconds from just before kick-off until the match ends.
  const active = isMatchActive(next);
  const { data: nextFeed } = useApi<MatchDetail>(next ? `/api/club-hub/match?event=${next.id}` : null, {
    refreshMs: active ? LIVE_REFRESH_MS : undefined,
  });
  const nextDetail = nextFeed && next && nextFeed.id === next.id ? nextFeed : undefined;
  const [centreOpen, setCentreOpen] = useState(false);
  const closeCentre = useCallback(() => setCentreOpen(false), []);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="ch-fade-up min-w-0 lg:col-span-2">
          {next ? (
            <NextMatchCard
              match={next}
              detail={nextDetail}
              clubId={club.id}
              accent={accent}
              onMatches={onMatches}
              onStandings={onStandings}
              onOpen={() => setCentreOpen(true)}
            />
          ) : (
            <div className={`${card} p-6`}>
              <StateMessage
                icon={<CalendarX2 className="h-5 w-5" />}
                title={fixturesDown ? "Fixtures couldn't be loaded" : "No upcoming fixtures scheduled"}
                message={fixturesDown ? "The football data provider didn't respond. This refreshes automatically every minute." : "New fixtures will appear here as soon as they are announced."}
                action={
                  <div className="flex gap-2">
                    <button onClick={onMatches} className="h-9 rounded-md bg-white px-4 text-sm font-semibold text-slate-950">See all matches</button>
                    <button onClick={onStandings} className="h-9 rounded-md border border-line-strong px-4 text-sm font-semibold text-white">See full standings</button>
                  </div>
                }
              />
            </div>
          )}
        </div>
        <div className="ch-fade-up grid min-w-0 content-start gap-5" style={{ animationDelay: "80ms" }}>
          <FormCard results={results} clubId={club.id} unavailable={resultsDown} />
          <MiniTable league={club.league} clubId={club.id} accent={accent} onStandings={onStandings} />
        </div>
      </div>

      <Modal
        wide
        open={centreOpen && Boolean(nextDetail)}
        onClose={closeCentre}
        title={nextDetail ? `${nextDetail.home.team.name} vs ${nextDetail.away.team.name}` : "Match centre"}
      >
        {nextDetail && <MatchCentre detail={nextDetail} clubId={club.id} accent={accent} />}
      </Modal>

      <section className="ch-fade-up" style={{ animationDelay: "140ms" }}>
        <SectionHeading
          title="Last match"
          subtitle="Match statistics and starting line-ups"
          action={last ? <span className="text-xs text-slate-500">Played {relativeTime(last.date)}</span> : undefined}
        />
        <div className={`${card} p-5 sm:p-8`}>
          {last ? (
            <MatchInsight eventId={last.id} clubId={club.id} accent={accent} />
          ) : (
            <StateMessage
              title={resultsDown ? "Last match couldn't be loaded" : "No completed match yet"}
              message={resultsDown ? "Results are temporarily unavailable from the data provider." : `${club.name} have not played a match this season yet.`}
            />
          )}
        </div>
      </section>
    </div>
  );
}
