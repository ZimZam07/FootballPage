"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, CircleDashed, Clock, Goal, MapPin, ShieldOff, Target, Tv } from "lucide-react";
import { LIVE_REFRESH_MS, competitionLabel, formatDate, useApi } from "@/lib/club-hub/client";
import type { EventPlayer, MatchDetail, MatchEvent, TeamLite } from "@/lib/club-hub/types";
import { Lineups, StatBars } from "./MatchInsight";
import { ErrorState, Skeleton, StateMessage, TeamLogo } from "./ui";

type Tab = "timeline" | "lineups" | "stats";
const TABS: { id: Tab; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "lineups", label: "Lineups" },
  { id: "stats", label: "Match Stats" },
];

const OPPONENT = "#64748b";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const lastName = (name: string) => name.trim().split(/\s+/).slice(-1)[0] ?? name;

// ---------------------------------------------------------------------------
// Scoreboard

function Scorers({ events, side, align }: { events: MatchEvent[]; side: "home" | "away"; align: "left" | "right" }) {
  const goals = events
    .filter((e) => (e.kind === "goal" || e.kind === "own-goal") && e.side === side && e.player)
    .slice()
    .reverse(); // chronological
  if (!goals.length) return null;
  return (
    <ul className={`mt-2 space-y-0.5 text-xs text-slate-400 sm:text-sm ${align === "right" ? "text-right" : "text-left"}`}>
      {goals.map((g) => (
        <li key={g.id} className="ch-fade-up">
          {lastName(g.player!.name)} {g.minute}
          {g.kind === "own-goal" ? " (OG)" : g.penalty ? " (P)" : ""}
        </li>
      ))}
    </ul>
  );
}

function Scoreboard({ detail, homeColor, awayColor }: { detail: MatchDetail; homeColor: string; awayColor: string }) {
  const live = detail.state === "in";
  const side = (team: TeamLite, which: "home" | "away") => (
    <div className={`flex min-w-0 flex-1 flex-col ${which === "home" ? "items-start text-left" : "items-end text-right"}`}>
      <TeamLogo src={team.logo} name={team.name} className="h-14 w-14 sm:h-20 sm:w-20" />
      <p className="mt-3 line-clamp-2 font-display text-xl font-bold uppercase leading-none text-white sm:text-3xl">{team.name}</p>
      <Scorers events={detail.events} side={which} align={which === "home" ? "left" : "right"} />
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel">
      {/* Club-colour split rule, like a broadcast score bug */}
      <div className="absolute inset-x-0 top-0 flex h-[3px]" aria-hidden>
        <div className="flex-1" style={{ background: homeColor }} />
        <div className="flex-1" style={{ background: awayColor }} />
      </div>
      <div className="relative p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{competitionLabel(detail.competition)}</span>
          <span className="text-xs text-slate-500">{formatDate(detail.date, { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          {side(detail.home.team, "home")}
          <div className="flex shrink-0 flex-col items-center gap-2 pt-1 text-center">
            <div className="flex items-center font-display font-extrabold leading-none tabular-nums text-white">
              <span key={`h${detail.home.score}`} className="ch-pop text-6xl sm:text-7xl">{detail.home.score ?? "–"}</span>
              <span className="mx-1.5 text-4xl text-slate-500 sm:text-5xl">:</span>
              <span key={`a${detail.away.score}`} className="ch-pop text-6xl sm:text-7xl">{detail.away.score ?? "–"}</span>
            </div>
            {live ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#ff4b3a]">
                <span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" /> {detail.liveLabel ?? detail.statusDetail}
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{detail.state === "post" ? "Full time" : detail.statusDetail}</span>
            )}
          </div>
          {side(detail.away.team, "away")}
        </div>

        {detail.venue && (
          <p className="mt-6 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0" /> {detail.venue}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline

function PlayerAvatar({ player, color }: { player: EventPlayer; color: string }) {
  return (
    <div className="relative shrink-0">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-md font-display text-base font-bold text-white sm:h-12 sm:w-12"
        style={{ background: `color-mix(in srgb, ${color} 70%, #0b0c0f)` }}
      >
        {initials(player.name)}
      </div>
      {player.jersey && (
        <span className="absolute -bottom-1 -right-1 rounded-sm bg-ink px-1 py-px font-display text-[11px] font-bold text-white ring-1 ring-white/15">
          {player.jersey}
        </span>
      )}
    </div>
  );
}

const playerMeta = (p: EventPlayer, team: TeamLite | null) =>
  [p.name, team?.name, p.position, p.jersey ? `#${p.jersey}` : null].filter(Boolean).join(" · ");

function MinuteChip({ minute }: { minute: string; tone?: "light" | "dark" }) {
  return <span className="w-12 shrink-0 font-display text-2xl font-bold tabular-nums leading-none text-white">{minute}</span>;
}

function GoalCard({ e, detail, color }: { e: MatchEvent; detail: MatchDetail; color: string }) {
  const team = e.side === "home" ? detail.home.team : e.side === "away" ? detail.away.team : null;
  const title = e.kind === "own-goal" ? "Own goal" : e.penalty ? "Penalty goal" : "Goal";
  const abbr = (t: TeamLite) => t.abbreviation || t.shortName;
  return (
    <div className="relative overflow-hidden rounded-md border border-line bg-panel">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} aria-hidden />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-3 pl-5 pr-4">
        <MinuteChip minute={e.minute} />
        <span className="font-display text-xl font-extrabold uppercase tracking-wide" style={{ color: `color-mix(in srgb, ${color} 55%, white)` }}>{title}</span>
        {e.score && (
          <span className="ml-auto font-display text-lg font-bold tabular-nums text-white">
            {abbr(detail.home.team)} {e.score.home}<span className="mx-1 text-slate-500">–</span>{e.score.away} {abbr(detail.away.team)}
          </span>
        )}
      </div>
      <div className="py-4 pl-5 pr-4">
        {e.player && (
          <div className="flex items-center gap-4">
            <PlayerAvatar player={e.player} color={color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-white">{e.player.name}</p>
              <p className="text-sm text-slate-400">
                {[team?.name, e.player.position, e.player.jersey ? `#${e.player.jersey}` : null].filter(Boolean).join(" · ")}
                {e.related?.role === "assist" && (
                  <>
                    <span className="mx-2 text-slate-500">|</span>
                    Assist: <span className="font-semibold text-slate-200">{e.related.player.name}</span>
                  </>
                )}
              </p>
            </div>
            {team && <TeamLogo src={team.logo} name={team.name} className="hidden h-9 w-9 sm:block" />}
          </div>
        )}
        {e.text && <p className="mt-3 text-sm leading-relaxed text-slate-400">{e.text}</p>}
      </div>
    </div>
  );
}

const EVENT_STYLE: Record<string, { icon: ReactNode; tint: string }> = {
  yellow: { icon: <span className="h-[18px] w-3 rounded-[2px] bg-yellow-400" />, tint: "" },
  red: { icon: <span className="h-[18px] w-3 rounded-[2px] bg-red-500" />, tint: "" },
  sub: { icon: <ArrowLeftRight className="h-5 w-5 text-sky-400" />, tint: "ring-sky-400/15" },
  "shot-on": { icon: <Target className="h-5 w-5 text-emerald-400" />, tint: "ring-white/[0.06]" },
  "shot-off": { icon: <CircleDashed className="h-5 w-5 text-slate-400" />, tint: "ring-white/[0.06]" },
  "shot-blocked": { icon: <ShieldOff className="h-5 w-5 text-slate-400" />, tint: "ring-white/[0.06]" },
  woodwork: { icon: <Goal className="h-5 w-5 text-amber-400" />, tint: "ring-amber-400/15" },
  "penalty-miss": { icon: <Target className="h-5 w-5 text-red-400" />, tint: "ring-red-500/15" },
  var: { icon: <Tv className="h-5 w-5 text-violet-400" />, tint: "ring-violet-400/15" },
};

function EventCard({ e, detail }: { e: MatchEvent; detail: MatchDetail }) {
  const team = e.side === "home" ? detail.home.team : e.side === "away" ? detail.away.team : null;
  const style = EVENT_STYLE[e.kind] ?? EVENT_STYLE["shot-off"];
  // ESPN labels every dismissal "Red Card"; its text says when it was a second booking.
  const label = e.kind === "red" && (/yellow/i.test(e.label) || /second yellow/i.test(e.text ?? "")) ? "Second yellow card" : e.label;
  return (
    <div className="flex gap-4 border-b border-line py-3.5 pl-5 pr-2">
      <MinuteChip minute={e.minute} />
      <span className="flex h-7 w-6 shrink-0 items-center justify-center">{style.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{label}</span>
          {team && <TeamLogo src={team.logo} name={team.name} className="h-4 w-4" />}
        </div>
        {e.kind === "sub" && e.player ? (
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <p className="flex items-center gap-1.5 text-slate-200">
              <ArrowUp className="h-3.5 w-3.5 shrink-0 text-[#3ccf7a]" strokeWidth={3} />
              {e.player.name}
              {e.player.jersey && <span className="text-slate-500">#{e.player.jersey}</span>}
            </p>
            {e.related?.role === "off" && (
              <p className="flex items-center gap-1.5 text-slate-400">
                <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[#ff4b3a]" strokeWidth={3} />
                {e.related.player.name}
                {e.related.player.jersey && <span className="text-slate-500">#{e.related.player.jersey}</span>}
              </p>
            )}
          </div>
        ) : (
          <>
            {e.player && <p className="mt-0.5 text-sm text-slate-400">{playerMeta(e.player, team)}</p>}
            {e.text && <p className="mt-1 text-sm leading-relaxed text-slate-500">{e.text}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function PeriodMarker({ e }: { e: MatchEvent }) {
  return (
    <div className="flex items-center gap-3 py-3" role="separator">
      <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-slate-300">{e.label}</span>
      {e.minute && e.label !== "Kick-off" ? <span className="font-display text-sm text-slate-500">{e.minute}</span> : null}
      <span className="h-px flex-1 bg-line-strong" />
    </div>
  );
}

type Filter = "all" | "goals" | "cards" | "shots" | "subs";
const FILTERS: { id: Filter; label: string; test: (e: MatchEvent) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "goals", label: "Goals", test: (e) => e.kind === "goal" || e.kind === "own-goal" || e.kind === "penalty-miss" },
  { id: "cards", label: "Cards", test: (e) => e.kind === "yellow" || e.kind === "red" },
  { id: "shots", label: "Shots", test: (e) => e.kind.startsWith("shot") || e.kind === "woodwork" },
  { id: "subs", label: "Subs", test: (e) => e.kind === "sub" },
];

function Timeline({ detail, homeColor, awayColor }: { detail: MatchDetail; homeColor: string; awayColor: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, detail.events.filter((e) => e.kind !== "period" && f.test(e)).length])),
    [detail.events],
  );
  const shown = detail.events.filter((e) => (filter === "all" ? true : e.kind !== "period" && FILTERS.find((f) => f.id === filter)!.test(e)));

  if (!detail.events.length) {
    return (
      <StateMessage
        icon={<Clock className="h-5 w-5" />}
        title="No key events yet"
        message={detail.state === "in" ? "Goals, cards, shots and substitutions will appear here as they happen." : "The data provider has not published events for this match."}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="ch-scrollbar-none flex gap-5 overflow-x-auto border-b border-line">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`relative -mb-px shrink-0 pb-2.5 text-sm font-semibold transition-colors ${filter === f.id ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
          >
            {f.label}
            <span className="ml-1.5 font-display text-sm text-slate-500">{counts[f.id]}</span>
            <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-white transition-transform duration-300 ${filter === f.id ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nothing in this category yet.</p>
      ) : (
        <ol className="space-y-2">
          {shown.map((e, i) => (
            <li key={e.id} className="ch-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              {e.kind === "period" ? (
                <PeriodMarker e={e} />
              ) : e.kind === "goal" || e.kind === "own-goal" ? (
                <GoalCard e={e} detail={detail} color={e.side === "home" ? homeColor : e.side === "away" ? awayColor : OPPONENT} />
              ) : (
                <EventCard e={e} detail={detail} />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match centre

export default function MatchCentre({
  detail,
  clubId,
  accent,
  showScoreboard = true,
}: {
  detail: MatchDetail;
  clubId: string;
  accent: string;
  showScoreboard?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("timeline");
  const homeColor = detail.home.team.id === clubId ? accent : OPPONENT;
  const awayColor = detail.away.team.id === clubId ? accent : OPPONENT;

  return (
    <div className="space-y-6">
      {showScoreboard && <Scoreboard detail={detail} homeColor={homeColor} awayColor={awayColor} />}

      <div className="flex gap-8 border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative -mb-px pb-3 font-display text-lg font-bold uppercase tracking-wide transition-colors ${tab === t.id ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
          >
            {t.label}
            <span className={`absolute inset-x-0 -bottom-px h-[3px] origin-left transition-transform duration-300 ${tab === t.id ? "scale-x-100" : "scale-x-0"}`} style={{ background: accent }} />
          </button>
        ))}
      </div>

      <div key={tab} className="ch-fade-up">
        {tab === "timeline" ? (
          <Timeline detail={detail} homeColor={homeColor} awayColor={awayColor} />
        ) : tab === "lineups" ? (
          <Lineups detail={detail} homeColor={homeColor} awayColor={awayColor} />
        ) : (
          <StatBars stats={detail.stats} home={detail.home.team} away={detail.away.team} homeColor={homeColor} awayColor={awayColor} />
        )}
      </div>

      {detail.state === "in" && (
        <p className="text-center text-xs text-slate-500">Updates automatically every {LIVE_REFRESH_MS / 1000} seconds · Data: ESPN</p>
      )}
    </div>
  );
}

/** Self-loading Match Centre (used from the Matches list), refreshing while the match is live. */
export function LiveMatchCentre({ eventId, clubId, accent, live }: { eventId: string; clubId: string; accent: string; live: boolean }) {
  const { data, error, loading, retry } = useApi<MatchDetail>(`/api/club-hub/match?event=${eventId}`, {
    refreshMs: live ? LIVE_REFRESH_MS : undefined,
  });
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-56" />
        <Skeleton className="h-10" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  return <MatchCentre detail={data} clubId={clubId} accent={accent} />;
}
