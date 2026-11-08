"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clubAccent, useActiveClub, useApi } from "@/lib/club-hub/client";
import { getLeague } from "@/lib/club-hub/leagues";
import type { ClubOverview, ClubRef } from "@/lib/club-hub/types";
import ClubHeader, { VIEWS, type ClubView } from "./ClubHeader";
import ClubPicker from "./ClubPicker";
import MatchesView from "./MatchesView";
import NewsView from "./NewsView";
import Overview from "./Overview";
import PlayersView from "./PlayersView";
import StandingsView from "./StandingsView";
import { ErrorState, Skeleton, card } from "./ui";
import Masthead from "@/components/Masthead";

type HistoryState = { clubHub: { club: ClubRef | null; view: ClubView } };

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[26rem] lg:col-span-2" />
        <div className="space-y-6"><Skeleton className="h-36" /><Skeleton className="h-60" /></div>
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function ClubHub() {
  const [club, setClub] = useActiveClub();
  const [view, setView] = useState<ClubView>("overview");
  const [focusStandings, setFocusStandings] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Refreshed every minute so kick-offs, live scores and full-time results move through on their own.
  const { data: overview, error, loading, retry } = useApi<ClubOverview>(
    club ? `/api/club-hub/club?league=${club.league}&team=${club.id}` : null,
    { refreshMs: 60_000 },
  );
  // Ignore a stale overview while the next club loads.
  const current = overview && club && overview.club.id === club.id ? overview : undefined;
  const accent = club ? clubAccent(club.id, current?.club.color, current?.club.alternateColor) : "#d4f53c";

  const scrollTop = () => {
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Browser back/forward moves between club views and the club list.
  const navigate = useCallback(
    (next: { club: ClubRef | null; view: ClubView }, opts: { focusStandings?: boolean } = {}) => {
      setClub(next.club);
      setView(next.view);
      setFocusStandings(Boolean(opts.focusStandings));
      window.history.pushState({ clubHub: next } satisfies HistoryState, "");
      if (!opts.focusStandings) scrollTop();
    },
    [setClub],
  );

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      // The entry from before Club Hub navigation began has no state: treat it as the club list.
      const s = (e.state as HistoryState | null)?.clubHub ?? { club: null, view: "overview" as ClubView };
      setClub(s.club);
      setView(VIEWS.some((v) => v.id === s.view) ? s.view : "overview");
      setFocusStandings(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setClub]);

  const leagueName = club ? (getLeague(club.league)?.name ?? "") : "";

  return (
    <div ref={top} className="scroll-mt-20">
      {!club ? (
        <>
          <Masthead
            index="02"
            kicker="Club Hub"
            title="Everything about your club"
            intro="Follow clubs from Europe's top five leagues for live fixtures, results, match stats, line-ups, standings, squads and news."
            className="mb-10"
          />
          <ClubPicker onOpen={(c) => navigate({ club: c, view: "overview" })} />
        </>
      ) : (
        <div className="space-y-8">
          <ClubHeader
            club={club}
            leagueName={leagueName}
            standingSummary={current ? current.club.standingSummary : undefined}
            accent={accent}
            view={view}
            onView={(v) => navigate({ club, view: v })}
            onBack={() => navigate({ club: null, view: "overview" })}
            onSwitch={(c) => navigate({ club: c, view })}
          />

          <div key={`${club.id}-${view}`} className="ch-fade-up">
            {view === "news" ? (
              <NewsView club={club} />
            ) : view === "standings" ? (
              <StandingsView club={club} accent={accent} focusClub={focusStandings} />
            ) : view === "players" ? (
              <PlayersView club={club} accent={accent} />
            ) : error ? (
              <div className={`${card} p-6`}><ErrorState error={error} onRetry={retry} /></div>
            ) : loading || !current ? (
              <OverviewSkeleton />
            ) : view === "matches" ? (
              <MatchesView overview={current} accent={accent} />
            ) : (
              <Overview
                overview={current}
                accent={accent}
                onMatches={() => navigate({ club, view: "matches" })}
                onStandings={() => navigate({ club, view: "standings" }, { focusStandings: true })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
