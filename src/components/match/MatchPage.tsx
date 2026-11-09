"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { clubAccent, formatDate, formatTime, relativeTime, timeZoneLabel, useApi, useFavorites } from "@/lib/club-hub/client";
import type { MatchDetail } from "@/lib/club-hub/types";
import MatchCentre from "@/components/club-hub/MatchCentre";
import { LeagueLogo } from "@/components/club-hub/LeagueIdentity";
import { leagueForCompetition } from "@/lib/club-hub/leagueIdentity";
import { ErrorState, Skeleton, StateMessage, TeamLogo } from "@/components/club-hub/ui";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LIVE_POLL_MS = 20_000;

function StatusBadge({ m }: { m: MatchDetail }) {
  if (/CANCEL|ABANDON/i.test(m.statusDetail)) return <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-red-400">Cancelled</span>;
  if (/POSTPONED|SUSPENDED|DELAYED/i.test(m.statusDetail)) return <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-400">Postponed</span>;
  if (m.state === "in")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff4b3a]">
        <span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" /> Live
      </span>
    );
  if (m.state === "post") return <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Full time</span>;
  return null;
}

function Header({ m }: { m: MatchDetail }) {
  const live = m.state === "in";
  const team = (s: MatchDetail["home"], which: "home" | "away") => (
    <div className={`flex min-w-0 flex-1 flex-col gap-3 ${which === "away" ? "items-end text-right" : "items-start text-left"}`}>
      <TeamLogo src={s.team.logo} name={s.team.name} className="h-14 w-14 sm:h-24 sm:w-24" />
      <div className="min-w-0">
        <p className="line-clamp-3 break-words font-display text-xl font-bold uppercase leading-none text-white sm:text-4xl">{s.team.name}</p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{which}</p>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: live ? "#ff4b3a" : "#d4f53c" }} aria-hidden />
      <div className="relative p-6 sm:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            {leagueForCompetition(m.competition) && <LeagueLogo league={leagueForCompetition(m.competition)!.id} className="h-5 w-5" />}
            {m.competition}
          </span>
          <StatusBadge m={m} />
        </div>

        <div className="flex items-center justify-between gap-3 sm:gap-8">
          {team(m.home, "home")}
          <div className="flex shrink-0 flex-col items-center gap-2 text-center">
            {m.state === "pre" ? (
              <>
                <span className="font-display text-5xl font-bold leading-none tabular-nums text-white sm:text-8xl">{formatTime(m.date)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{timeZoneLabel()}</span>
                {!/POSTPONED|CANCEL/i.test(m.statusDetail) && <span className="rounded bg-volt px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-950">{relativeTime(m.date)}</span>}
              </>
            ) : (
              <>
                <div className="flex items-center font-display text-6xl font-extrabold leading-none tabular-nums text-white sm:text-9xl">
                  <span key={`h${m.home.score}`} className="ch-pop">{m.home.score ?? 0}</span>
                  <span className="mx-1.5 text-slate-500 sm:mx-3">:</span>
                  <span key={`a${m.away.score}`} className="ch-pop">{m.away.score ?? 0}</span>
                </div>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-[#ff4b3a]">
                    <span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" /> {m.liveLabel ?? m.statusDetail}
                  </span>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{m.statusDetail || "Full time"}</span>
                )}
              </>
            )}
          </div>
          {team(m.away, "away")}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-slate-500" />{formatDate(m.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-500" />Kick-off {formatTime(m.date)} ({timeZoneLabel()})</span>
          {m.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-500" />{m.venue}</span>}
        </div>
      </div>
    </div>
  );
}

/** Match centre for any ESPN match — linked from the Champions League and Club Hub. */
export default function MatchPage({ id }: { id: string }) {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { data: m, error, loading, retry } = useApi<MatchDetail>(`/api/club-hub/match?event=${id}`, {
    refreshMs: LIVE_POLL_MS,
    refreshWhile: (d) => d.state !== "post",
  });

  // Use the colour of a followed club if one is playing, otherwise the site's teal.
  const followed = m && favorites.find((f) => f.id === m.home.team.id || f.id === m.away.team.id);
  const accent = followed ? clubAccent(followed.id) : "#14b8a6";
  // Highlight the section a visitor most likely came from.
  const section = m && /champions league/i.test(m.competition) ? "ucl" : "club";

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(section === "ucl" ? "/?tab=ucl" : "/?tab=club");
  };

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <Navbar activeTab={section} setActiveTab={(t) => router.push(t === "live" ? "/" : `/?tab=${t}`)} />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <button onClick={back} className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" /> Back
        </button>

        {error ? (
          <ErrorState error={error} onRetry={retry} />
        ) : loading || !m ? (
          <div className="space-y-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-8 w-56" />
            <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
          </div>
        ) : (
          <div className="ch-fade-up space-y-12">
            <Header m={m} />
            <section>
              <h2 className="mb-5 font-display text-3xl font-extrabold uppercase text-white">Match Centre</h2>
              {m.state === "pre" ? (
                <StateMessage title="The match hasn't started yet" message="The timeline, line-ups and statistics appear here from kick-off and update automatically." />
              ) : (
                <MatchCentre detail={m} clubId={followed?.id ?? ""} accent={accent} showScoreboard={false} />
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
