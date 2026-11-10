"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Star } from "lucide-react";
import { formatDate, formatTime, relativeTime, timeZoneLabel, useActiveClub, useApi, useFavorites } from "@/lib/club-hub/client";
import type { ClubRef, LeagueTeams } from "@/lib/club-hub/types";
import type { UclCleanSheets, UclKnockoutRound, UclLeader, UclMatch, UclOverview, UclStandingRow, UclZone } from "@/lib/ucl/types";
import { ErrorState, SafeImg, Skeleton, StateMessage, TeamLogo } from "@/components/club-hub/ui";

/* UEFA Champions League — midnight blue and silver. Restrained, precise competition graphics:
   a stage rail, a broadcast-style table with drawn qualification lines, and a bracket whose
   connectors draw themselves in. */

type Section = "standings" | "fixtures" | "knockout" | "clubs" | "stats";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "standings", label: "Standings" },
  { id: "fixtures", label: "Fixtures & results" },
  { id: "knockout", label: "Knockout" },
  { id: "clubs", label: "Clubs" },
  { id: "stats", label: "Top stats" },
];

const SILVER = "#c9d3e6";
const ZONE: Record<UclZone, { color: string; label: string }> = {
  r16: { color: "#9db8ff", label: "Round of 16" },
  "playoff-seeded": { color: "#5f78ad", label: "Play-offs, seeded" },
  "playoff-unseeded": { color: "#3b4a6b", label: "Play-offs, unseeded" },
  out: { color: "transparent", label: "Eliminated" },
};

// ---------------------------------------------------------------------------
// Header

function Header({ data }: { data: UclOverview | undefined }) {
  const played = data?.matches.filter((m) => m.state === "post").length ?? 0;
  const goals = data?.matches.reduce((s, m) => s + (m.state === "post" ? (m.home.score ?? 0) + (m.away.score ?? 0) : 0), 0) ?? 0;
  const now = data ? +new Date(data.generatedAt) : 0;
  return (
    <header className="ucl-band ch-fade-up relative -mx-4 overflow-hidden px-4 pb-8 pt-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex items-center gap-5">
          {data?.logo ? (
            <SafeImg src={data.logo} alt="UEFA Champions League" className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20" fallback={null} />
          ) : (
            <Skeleton className="h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20" />
          )}
          <div className="min-w-0">
            <p className="kicker flex items-center gap-3">
              <span className="font-display text-sm font-bold tracking-[0.08em]" style={{ color: SILVER }}>03</span>
              <span className="h-px w-6 opacity-60" style={{ background: SILVER }} aria-hidden />
              UEFA
            </p>
            <h1 className="mt-2 font-display text-[2.6rem] font-extrabold uppercase leading-[0.9] text-white sm:text-6xl">Champions League</h1>
            <p className="mt-2 text-sm text-slate-400">
              {data ? data.season.replace(/ UEFA Champions League$/, "") : "Loading season…"}
              {data?.currentStage && <span className="text-[#c9d3e6]"> · {data.currentStage.label}</span>}
            </p>
          </div>
        </div>
        {data && (
          <dl className="grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 lg:border-y-0">
            {([["Clubs", data.clubs.length], ["Played", played], ["Goals", goals]] as const).map(([k, v]) => (
              <div key={k} className="px-5 py-3 first:pl-0 lg:py-0">
                <dd className="font-display text-3xl font-bold leading-none text-white sm:text-4xl">{v}</dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{k}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Stage rail */}
      {data && (
        <ol className="ch-scrollbar-none relative mt-8 flex overflow-x-auto border-t border-white/10">
          {data.stages.map((s) => {
            const past = +new Date(s.endDate) < now;
            return (
              <li key={s.id} className="relative min-w-[8.5rem] flex-1 pr-4 pt-3">
                <span className={`absolute left-0 right-0 top-[-1px] h-[2px] ${s.current ? "bg-[#c9d3e6]" : past ? "bg-white/25" : "bg-transparent"}`} aria-hidden />
                {s.current && <span className="absolute -top-[5px] left-0 h-2.5 w-2.5 rounded-full border-2 border-[#0a1532] bg-[#c9d3e6]" aria-hidden />}
                <p className={`text-[13px] font-semibold ${s.current ? "text-white" : past ? "text-slate-500" : "text-slate-300"}`}>{s.label}</p>
                <p className="text-xs text-slate-500">{s.detail}</p>
              </li>
            );
          })}
        </ol>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Fixtures

function MatchRow({ m }: { m: UclMatch }) {
  const done = m.state === "post";
  const live = m.state === "in";
  const won = (s: UclMatch["home"], o: UclMatch["home"]) => done && (s.score ?? 0) > (o.score ?? 0);
  return (
    <Link href={`/match/${m.slug}`} className="ucl-row group grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)_1rem] items-center gap-3 border-b border-white/[0.06] px-2 py-3 sm:px-3">
      <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
        <span className={`truncate text-sm ${won(m.home, m.away) ? "font-semibold text-white" : "text-slate-300"}`}>{m.home.team.shortName}</span>
        <TeamLogo src={m.home.team.logo} name={m.home.team.name} className="h-6 w-6" />
      </div>
      <div className="text-center">
        {live || done ? (
          <span className="font-display text-xl font-bold tabular-nums text-white">
            {m.home.score}<span className="mx-1 text-slate-500">–</span>{m.away.score}
          </span>
        ) : (
          <span className="font-display text-lg font-semibold tabular-nums text-slate-200">{formatTime(m.date)}</span>
        )}
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em]">
          {live ? (
            <span className="inline-flex items-center gap-1 text-[#ff4b3a]"><span className="ch-live-dot h-1 w-1 rounded-full bg-[#ff4b3a]" />{m.liveLabel}</span>
          ) : done ? (
            <span className="text-slate-500">Full time</span>
          ) : /POSTPONED|CANCEL/.test(m.statusName) ? (
            <span className="text-amber-400">Postponed</span>
          ) : (
            <span className="text-slate-500">{m.leg ? `Leg ${m.leg}` : "Kick-off"}</span>
          )}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamLogo src={m.away.team.logo} name={m.away.team.name} className="h-6 w-6" />
        <span className={`truncate text-sm ${won(m.away, m.home) ? "font-semibold text-white" : "text-slate-300"}`}>{m.away.team.shortName}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
    </Link>
  );
}

function Fixtures({ data }: { data: UclOverview }) {
  const [view, setView] = useState<"upcoming" | "results">(data.matches.some((m) => m.state !== "post") ? "upcoming" : "results");
  const list = useMemo(() => {
    const ms = view === "upcoming" ? data.matches.filter((m) => m.state !== "post") : data.matches.filter((m) => m.state === "post").reverse();
    const groups: { key: string; stage: string; items: UclMatch[] }[] = [];
    for (const m of ms.slice(0, 60)) {
      const key = formatDate(m.date, { weekday: "long", day: "numeric", month: "long" });
      const g = groups[groups.length - 1];
      if (g?.key === key) g.items.push(m);
      else groups.push({ key, stage: m.stage, items: [m] });
    }
    return groups;
  }, [data.matches, view]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-6 border-b border-white/10" role="tablist">
          {(["upcoming", "results"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`relative -mb-px pb-2.5 text-sm font-semibold capitalize transition-colors ${view === v ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
            >
              {v}
              <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-[#c9d3e6] transition-transform duration-300 ${view === v ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">Times in {timeZoneLabel()}</span>
      </div>
      {list.length === 0 ? (
        <StateMessage title={view === "upcoming" ? "No upcoming fixtures" : "No results yet"} message={view === "upcoming" ? "The next fixtures will appear once they are scheduled." : "Results appear here after each matchday."} />
      ) : (
        <div key={view} className="ch-fade-up space-y-8">
          {list.map((g) => (
            <section key={g.key}>
              <h4 className="mb-1 flex items-baseline justify-between gap-3 border-b border-white/15 pb-2">
                <span className="font-display text-lg font-bold uppercase tracking-wide text-white">{g.key}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9d3e6]">{g.stage}</span>
              </h4>
              <div className="grid lg:grid-cols-2 lg:gap-x-10">{g.items.map((m) => <MatchRow key={m.id} m={m} />)}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standings

function Standings({ rows, favIds }: { rows: UclStandingRow[]; favIds: Set<string> }) {
  if (!rows.length) return <StateMessage title="Standings unavailable" message="The league-phase table couldn't be loaded right now." />;
  const cutoff: Record<number, string> = { 8: "Round of 16", 24: "Knockout play-offs" };
  return (
    <div className="space-y-5">
      <div className="ucl-table overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="py-3 pl-4 pr-2 text-left sm:pl-5">Club</th>
                {[["P", "Played"], ["W", "Won"], ["D", "Drawn"], ["L", "Lost"]].map(([h, t]) => <th key={h} title={t} className={`w-9 text-center ${h === "P" ? "" : "hidden sm:table-cell"}`}>{h}</th>)}
                <th className="hidden w-10 text-center md:table-cell" title="Goals for">GF</th>
                <th className="hidden w-10 text-center md:table-cell" title="Goals against">GA</th>
                <th className="w-11 text-center" title="Goal difference">GD</th>
                <th className="w-14 pr-4 text-center text-[#c9d3e6] sm:pr-5" title="Points">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const fav = favIds.has(r.team.id);
                const line = cutoff[r.position];
                return (
                  <tr
                    key={r.team.id}
                    className={`ucl-trow group ${line ? "ucl-cut" : "border-b border-white/[0.05]"} ${fav ? "bg-[#c9d3e6]/[0.07]" : ""}`}
                    data-line={line}
                    style={{ animationDelay: `${Math.min(i, 36) * 14}ms` }}
                  >
                    <td className="max-w-0 py-2.5 pl-3 pr-2 sm:pl-5">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <span className="h-5 w-[3px] shrink-0" style={{ background: ZONE[r.zone].color }} title={r.zoneLabel} />
                        <span className={`w-6 shrink-0 text-right font-display text-base font-bold ${r.zone === "out" ? "text-slate-500" : "text-slate-300"}`}>{r.position}</span>
                        <TeamLogo src={r.team.logo} name={r.team.name} className="h-6 w-6" />
                        <span className={`min-w-0 truncate ${r.zone === "out" ? "text-slate-500" : "font-medium text-white"}`}>
                          <span className="hidden sm:inline">{r.team.name}</span>
                          <span className="sm:hidden">{r.team.shortName}</span>
                        </span>
                        {fav && <Star className="h-3.5 w-3.5 shrink-0 fill-[#c9d3e6] text-[#c9d3e6]" aria-label="Followed club" />}
                        {line && <span className="ml-auto hidden whitespace-nowrap pl-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c9d3e6]/70 md:inline">▲ {line}</span>}
                      </div>
                    </td>
                    {[r.played, r.won, r.drawn, r.lost].map((v, k) => <td key={k} className={`text-center text-slate-400 ${k === 0 ? "" : "hidden sm:table-cell"}`}>{v}</td>)}
                    <td className="hidden text-center text-slate-500 md:table-cell">{r.goalsFor}</td>
                    <td className="hidden text-center text-slate-500 md:table-cell">{r.goalsAgainst}</td>
                    <td className="text-center text-slate-300">{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
                    <td className="pr-4 text-center font-display text-lg font-bold text-white sm:pr-5">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
        {(Object.keys(ZONE) as UclZone[]).filter((z) => z !== "out").map((z) => (
          <span key={z} className="inline-flex items-center gap-2">
            <span className="h-3 w-[3px]" style={{ background: ZONE[z].color }} /> {ZONE[z].label}
          </span>
        ))}
        <span className="text-slate-500">25–36 eliminated</span>
      </div>
      <p className="text-xs text-slate-500">League phase: 36 clubs, 8 matches each. The top eight go straight to the round of 16; 9th–24th enter the knockout play-offs.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Knockout bracket

const EXPECTED_TIES: Record<string, number> = { "Knockout Round Playoffs": 8, "Round of 16": 8, Quarterfinals: 4, Semifinals: 2, Final: 1 };

function Knockout({ rounds }: { rounds: UclKnockoutRound[] }) {
  const started = rounds.some((r) => r.ties.length > 0);
  return (
    <div className="space-y-5">
      {!started && (
        <p className="border-l-2 border-[#c9d3e6] pl-4 text-sm text-slate-300">
          The knockout stage hasn&apos;t started. Ties are confirmed by the draw after the league phase — they&apos;ll appear here automatically, with aggregate scores, as they&apos;re played.
        </p>
      )}
      <div className="ch-scrollbar-none -mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-max">
          {rounds.map((round, ri) => {
            const expected = EXPECTED_TIES[round.stage.label] ?? round.ties.length;
            const slots = Math.max(expected, round.ties.length);
            const last = ri === rounds.length - 1;
            return (
              <div key={round.stage.id} className="flex w-56 shrink-0 flex-col pr-8">
                <div className="mb-4 border-b pb-2" style={{ borderColor: round.stage.current ? SILVER : "rgb(255 255 255 / 0.1)" }}>
                  <p className={`font-display text-lg font-bold uppercase tracking-wide ${round.stage.current ? "text-white" : "text-slate-300"}`}>{round.stage.label}</p>
                  <p className="text-[11px] text-slate-500">{round.stage.detail}</p>
                </div>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {Array.from({ length: slots }).map((_, i) => {
                    const tie = round.ties[i];
                    const delay = { animationDelay: `${ri * 160 + i * 30}ms` };
                    const stubs = (
                      <>
                        {ri > 0 && <span className="ucl-stub ucl-stub-in" style={delay} aria-hidden />}
                        {!last && <span className="ucl-stub ucl-stub-out" style={delay} aria-hidden />}
                      </>
                    );
                    if (!tie) {
                      return (
                        <div key={i} className="relative border border-dashed border-white/10 px-3 py-2.5 text-xs text-slate-500">
                          {stubs}
                          <p>To be decided</p>
                          <p>To be decided</p>
                        </div>
                      );
                    }
                    return (
                      <Link key={tie.id} href={`/match/${tie.legs[tie.legs.length - 1].slug}`} className="relative block border border-white/10 bg-[#0d1733] px-3 py-2 transition-colors hover:border-[#c9d3e6]/60">
                        {stubs}
                        {tie.teams.map((t, ti) => (
                          <div key={t.id} className={`flex items-center gap-2 py-0.5 text-sm ${tie.winnerId && tie.winnerId !== t.id ? "text-slate-500" : "font-medium text-white"}`}>
                            <TeamLogo src={t.logo} name={t.name} className="h-5 w-5" />
                            <span className="flex-1 truncate">{t.shortName}</span>
                            {tie.aggregate && <span className="font-display font-bold tabular-nums">{tie.aggregate[ti]}</span>}
                          </div>
                        ))}
                        <p className="mt-1 border-t border-white/[0.06] pt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                          {tie.complete ? (tie.legs.length > 1 ? "Aggregate" : "Final score") : `${tie.legs.length} leg${tie.legs.length > 1 ? "s" : ""} · ${tie.legs.some((l) => l.state === "post") ? "in progress" : formatDate(tie.legs[0].date, { day: "numeric", month: "short" })}`}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clubs and top stats

function Clubs({ data, onOpenClub, teams }: { data: UclOverview; onOpenClub: (c: ClubRef) => void; teams: LeagueTeams[] | undefined }) {
  const hub = useMemo(() => new Map((teams ?? []).flatMap((l) => l.teams.map((t) => [t.id, { ...t, league: l.league }] as const))), [teams]);
  const byCountry = useMemo(() => {
    const m = new Map<string, typeof data.clubs>();
    for (const c of data.clubs) {
      const k = c.country ?? "Other";
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [data]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">{data.clubs.length} clubs from {byCountry.length} nations. Clubs from Football Hub&apos;s five leagues open in Club Hub.</p>
      <div className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
        {byCountry.map(([country, clubs]) => (
          <section key={country} className="border-t border-white/10 py-3">
            <h4 className="mb-1 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {country} <span className="font-display text-sm text-slate-500">{clubs.length}</span>
            </h4>
            <ul>
              {clubs.map((c) => {
                const ref = hub.get(c.id);
                const inner = (
                  <>
                    <TeamLogo src={c.logo} name={c.name} className="h-7 w-7" />
                    <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                    {ref && <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 transition group-hover:text-[#c9d3e6]">Club Hub</span>}
                  </>
                );
                return (
                  <li key={c.id}>
                    {ref ? (
                      <button
                        onClick={() => onOpenClub({ id: c.id, league: ref.league, name: ref.name, shortName: ref.shortName, logo: ref.logo })}
                        className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded px-2 py-1.5 text-left text-white transition hover:bg-white/[0.04]"
                        aria-label={`Open ${c.name} in Club Hub`}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 py-1.5 text-slate-300">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

type StatTab = "goals" | "assists" | "cleanSheets";
const STAT_TABS: { id: StatTab; label: string; unit: string }[] = [
  { id: "goals", label: "Top Goal Scorers", unit: "Goals" },
  { id: "assists", label: "Top Assist Makers", unit: "Assists" },
  // ESPN publishes no player match ratings, so a reliable average-rating table isn't possible;
  // clean sheets take that place (the agreed fallback), counted from completed matches.
  { id: "cleanSheets", label: "Top Clean Sheets", unit: "Clean sheets" },
];

interface BoardRow {
  id: string;
  name: string;
  headshot: string | null;
  team: { name: string; logo: string | null };
  value: number;
  sub: string | null;
}

/** Standard competition ranking: tied values share a rank (1, 2, 2, 4). */
function ranks(rows: BoardRow[]) {
  return rows.map((r, i) => (i > 0 && rows[i - 1].value === r.value ? null : i + 1)).reduce<number[]>((acc, r, i) => [...acc, r ?? acc[i - 1]], []);
}

/** Show the top 20 — extended to include everyone tied with the 20th, so no tie is split. */
function topWithTies(rows: BoardRow[], n = 20) {
  if (rows.length <= n) return rows;
  const cut = rows[n - 1].value;
  return rows.filter((r, i) => i < n || r.value === cut);
}

function Leaderboard({ rows, unit }: { rows: BoardRow[]; unit: string }) {
  const shown = topWithTies(rows);
  const rank = ranks(shown);
  const top = shown[0]?.value || 1;
  const face = (p: BoardRow, cls: string) => (
    <SafeImg
      src={p.headshot}
      alt={p.name}
      className={`${cls} bg-white/[0.05] object-cover object-top`}
      fallback={<span className={`${cls} flex items-center justify-center bg-white/[0.06] font-display text-sm font-bold text-slate-300`}>{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
    />
  );
  return (
    <ol className="border-t border-white/10" aria-label={`${unit} leaderboard`}>
      {shown.map((p, i) => {
        const podium = rank[i] <= 3;
        const tied = (i > 0 && rank[i - 1] === rank[i]) || (i < shown.length - 1 && rank[i + 1] === rank[i]);
        return (
          <li key={p.id} className="ch-fade-up grid grid-cols-[2.25rem_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.06] py-3 sm:grid-cols-[2.75rem_auto_minmax(0,1fr)_12rem_5rem] sm:gap-4" style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}>
            <span className={`font-display text-xl font-bold tabular-nums ${podium ? "text-white" : "text-slate-500"}`} title={tied ? "Tied" : undefined}>
              {rank[i]}
              {tied && <span className="text-xs text-slate-500">=</span>}
            </span>
            {face(p, podium ? "h-12 w-12 rounded" : "h-10 w-10 rounded")}
            <div className="min-w-0">
              <p className={`truncate ${podium ? "text-base font-semibold text-white" : "text-sm font-medium text-slate-200"}`}>{p.name}</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                <TeamLogo src={p.team.logo} name={p.team.name} className="h-3.5 w-3.5" /> <span className="truncate">{p.team.name}</span>
                {p.sub && <span className="shrink-0">· {p.sub}</span>}
              </p>
            </div>
            <div className="hidden h-[3px] bg-white/[0.06] sm:block" aria-hidden>
              <div className="ch-grow h-full bg-[#c9d3e6]" style={{ width: `${(p.value / top) * 100}%`, animationDelay: `${200 + Math.min(i, 15) * 40}ms` }} />
            </div>
            <span className="text-right font-display text-3xl font-bold leading-none tabular-nums text-white">
              {p.value}
              <span className="sr-only"> {unit.toLowerCase()}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CleanSheets({ season }: { season: string }) {
  const { data, error, loading, retry } = useApi<UclCleanSheets>("/api/ucl/clean-sheets", { refreshMs: 10 * 60_000 });
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) {
    return (
      <div className="space-y-2" aria-busy>
        <p className="text-xs text-slate-500">Counting clean sheets from every completed match…</p>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }
  if (!data.keepers.length) {
    return <StateMessage title="No clean sheets yet" message={`No goalkeeper has kept a clean sheet in the ${season.replace(/ UEFA Champions League$/, "")} competition so far.`} />;
  }
  const rows: BoardRow[] = data.keepers.map((k) => ({ id: k.id, name: k.name, headshot: null, team: k.team, value: k.cleanSheets, sub: `${k.appearances} ${k.appearances === 1 ? "match" : "matches"}` }));
  return (
    <div className="space-y-3">
      <Leaderboard rows={rows} unit="Clean sheets" />
      <p className="text-xs text-slate-500">
        Counted from the line-ups and scores of {data.matchesCounted} completed {data.matchesCounted === 1 ? "match" : "matches"}: a clean sheet is credited to a goalkeeper who started and
        played the whole match without conceding (extra time included, shoot-outs excluded).
        {data.matchesMissing > 0 && <span className="text-amber-400"> {data.matchesMissing} match line-up{data.matchesMissing === 1 ? "" : "s"} couldn&apos;t be loaded, so this table may be incomplete.</span>}
      </p>
    </div>
  );
}

function TopStats({ data }: { data: UclOverview }) {
  const [tab, setTab] = useState<StatTab>("goals");
  const toRows = (list: UclLeader[]): BoardRow[] => list.map((l) => ({ id: l.id, name: l.name, headshot: l.headshot, team: l.team, value: l.value, sub: l.matches != null ? `${l.matches} ${l.matches === 1 ? "match" : "matches"}` : null }));
  const current = STAT_TABS.find((t) => t.id === tab)!;
  return (
    <div className="space-y-6">
      <div className="ch-scrollbar-none -mx-4 flex gap-6 overflow-x-auto border-b border-white/10 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Top stats">
        {STAT_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative -mb-px shrink-0 pb-3 text-sm font-semibold transition-colors ${tab === t.id ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
          >
            {t.label}
            <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-[#c9d3e6] transition-transform duration-300 ${tab === t.id ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        ))}
      </div>
      <div key={tab} className="ch-fade-up">
        {tab === "cleanSheets" ? (
          <CleanSheets season={data.season} />
        ) : !data.leaders ? (
          <StateMessage title={`${current.label} unavailable`} message="ESPN's Champions League statistics couldn't be loaded right now. This page refreshes automatically." />
        ) : data.leaders[tab].length === 0 ? (
          <StateMessage title={`No ${current.unit.toLowerCase()} yet`} message="Leaders appear here once matches have been played." />
        ) : (
          <div className="space-y-3">
            <Leaderboard rows={toRows(data.leaders[tab])} unit={current.unit} />
            <p className="text-xs text-slate-500">{data.season} only — from ESPN&apos;s competition statistics. Tied players share a rank and are ordered by fewer matches.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function ChampionsLeague({ onGoToClubHub }: { onGoToClubHub: () => void }) {
  const { data, error, loading, retry } = useApi<UclOverview>("/api/ucl", { refreshMs: 30_000 });
  const { data: teams } = useApi<LeagueTeams[]>("/api/club-hub/teams");
  const { favorites } = useFavorites();
  const [, setActiveClub] = useActiveClub();
  const [section, setSection] = useState<Section>("standings");
  const favIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const openClub = (c: ClubRef) => {
    setActiveClub(c);
    onGoToClubHub();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="ucl -mt-8 space-y-8 sm:-mt-10">
      <Header data={error ? undefined : data} />

      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
        </div>
      ) : (
        <>
          <nav className="ch-scrollbar-none sticky top-[60px] z-30 -mx-4 flex gap-7 overflow-x-auto border-b border-white/10 bg-ink/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="Champions League sections">
            {SECTIONS.map((s) => {
              const on = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  aria-current={on ? "page" : undefined}
                  className={`relative shrink-0 py-3.5 text-sm font-semibold transition-colors ${on ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
                >
                  {s.label}
                  <span className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[#c9d3e6] transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
                </button>
              );
            })}
          </nav>

          <div key={section} className="ch-fade-up">
            {section === "fixtures" ? (
              <Fixtures data={data} />
            ) : section === "standings" ? (
              <Standings rows={data.standings} favIds={favIds} />
            ) : section === "knockout" ? (
              <Knockout rounds={data.knockout} />
            ) : section === "clubs" ? (
              <Clubs data={data} teams={teams} onOpenClub={openClub} />
            ) : (
              <TopStats data={data} />
            )}
          </div>

          <p className="text-xs text-slate-500">Data from ESPN · updated {relativeTime(data.generatedAt)}</p>
        </>
      )}
    </div>
  );
}
