"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarX2, ChevronRight, MapPin } from "lucide-react";
import { competitionLabel, formatDate, formatTime, outcomeFor, type Outcome } from "@/lib/club-hub/client";
import type { ClubOverview, MatchSummary } from "@/lib/club-hub/types";
import { LiveMatchCentre } from "./MatchCentre";
import { MatchInsight } from "./MatchInsight";
import { Modal, Segmented, StateMessage, TeamLogo, card } from "./ui";

const BADGE: Record<Outcome, string> = {
  W: "bg-[#3ccf7a] text-slate-950",
  D: "bg-slate-500 text-white",
  L: "bg-[#ff4b3a] text-white",
};

function MatchRow({ m, clubId, onOpen }: { m: MatchSummary; clubId: string; onOpen?: () => void }) {
  const outcome = outcomeFor(m, clubId);
  const done = m.state === "post";
  const live = m.state === "in";
  const postponed = /POSTPONED|SUSPENDED|CANCEL/.test(m.statusName);

  const line = (s: MatchSummary["home"], other: MatchSummary["home"]) => {
    const bold = s.team.id === clubId || (done && (s.score ?? 0) > (other.score ?? 0));
    return (
      <div className="flex items-center gap-3">
        <TeamLogo src={s.team.logo} name={s.team.name} className="h-6 w-6" />
        <span className={`flex-1 truncate text-[15px] ${bold ? "font-semibold text-white" : "text-slate-400"}`}>{s.team.name}</span>
        {(done || live) && (
          <span className={`w-8 text-right font-display text-xl font-bold tabular-nums ${bold ? "text-white" : "text-slate-500"}`}>
            {s.score}
            {s.shootout != null && <sup className="ml-0.5 text-[10px] text-slate-500">({s.shootout})</sup>}
          </span>
        )}
      </div>
    );
  };

  const Wrapper = onOpen ? "button" : "div";
  return (
    <Wrapper
      onClick={onOpen}
      className={`group flex w-full items-stretch gap-4 px-4 py-4 text-left transition sm:px-5 ${onOpen ? "cursor-pointer hover:bg-white/[0.025]" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-3 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {[m.round, competitionLabel(m.competition)].filter(Boolean).join(" · ")}
        </p>
        <div className="space-y-2.5">
          {line(m.home, m.away)}
          {line(m.away, m.home)}
        </div>
        {!done && m.venue && (
          <p className="mt-3 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{m.venue}</p>
        )}
      </div>
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1.5 border-l border-line pl-4 text-center">
        {live ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[#ff4b3a]"><span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" />{m.statusDetail}</span>
        ) : done ? (
          <>
            {outcome && <span className={`flex h-7 w-7 items-center justify-center rounded font-display text-base font-bold ${BADGE[outcome]}`}>{outcome}</span>}
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{/PEN/.test(m.statusName) ? "Pens" : /AET|EXTRA/.test(m.statusName) ? "AET" : "FT"}</span>
          </>
        ) : postponed ? (
          <span className="text-xs font-bold uppercase text-amber-400">Postponed</span>
        ) : (
          <span className="whitespace-nowrap font-display text-xl font-bold tabular-nums text-white">{formatTime(m.date)}</span>
        )}
        <span className="text-xs text-slate-500">{formatDate(m.date, { day: "numeric", month: "short", year: "2-digit" })}</span>
        {onOpen && <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />}
      </div>
    </Wrapper>
  );
}

function groupByMonth(matches: MatchSummary[]) {
  const groups: { label: string; items: MatchSummary[] }[] = [];
  for (const m of matches) {
    const label = formatDate(m.date, { month: "long", year: "numeric" });
    const g = groups[groups.length - 1];
    if (g?.label === label) g.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}

export default function MatchesView({ overview, accent }: { overview: ClubOverview; accent: string }) {
  const { fixtures, results, club } = overview;
  const [tab, setTab] = useState<"upcoming" | "results">(fixtures.length ? "upcoming" : "results");
  const [open, setOpen] = useState<MatchSummary | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const list = tab === "upcoming" ? fixtures : results;
  const down = overview.unavailable?.includes(tab === "upcoming" ? "fixtures" : "results") ?? false;
  const groups = useMemo(() => groupByMonth(list), [list]);

  const summary = useMemo(() => {
    const s = { W: 0, D: 0, L: 0 };
    for (const r of results) {
      const o = outcomeFor(r, club.id);
      if (o) s[o]++;
    }
    return s;
  }, [results, club.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: <>Upcoming <span className="opacity-50">{fixtures.length}</span></> },
            { value: "results", label: <>Results <span className="opacity-50">{results.length}</span></> },
          ]}
        />
        {tab === "results" && results.length > 0 && (
          <dl className="flex gap-5">
            {(["W", "D", "L"] as Outcome[]).map((o) => (
              <div key={o} className="flex items-center gap-2">
                <dt className={`flex h-5 w-5 items-center justify-center rounded-sm font-display text-xs font-bold ${BADGE[o]}`}>{o}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums text-white">{summary[o]}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {list.length === 0 ? (
        <StateMessage
          icon={<CalendarX2 className="h-5 w-5" />}
          title={down ? (tab === "upcoming" ? "Fixtures couldn't be loaded" : "Results couldn't be loaded") : tab === "upcoming" ? "No upcoming fixtures" : "No results yet"}
          message={down ? "The football data provider didn't respond. This refreshes automatically every minute." : tab === "upcoming" ? "Fixtures will appear once they are scheduled." : "Completed matches this season will appear here."}
        />
      ) : (
        <div key={tab} className="ch-fade-up space-y-8">
          {groups.map((g) => (
            <section key={g.label}>
              <h4 className="mb-2 font-display text-xl font-bold uppercase tracking-wide text-white">{g.label}</h4>
              <div className={`${card} grid divide-y divide-line overflow-hidden xl:grid-cols-2 xl:divide-y-0 xl:[&>*:nth-child(n+3)]:border-t xl:[&>*:nth-child(even)]:border-l xl:[&>*]:border-line`}>
                {g.items.map((m) => (
                  <MatchRow key={m.id} m={m} clubId={club.id} onOpen={m.state !== "pre" ? () => setOpen(m) : undefined} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        wide={open?.state === "in"}
        open={Boolean(open)}
        onClose={close}
        title={open ? `${open.home.team.shortName} vs ${open.away.team.shortName}` : ""}
      >
        {open && (open.state === "in" ? (
          <LiveMatchCentre eventId={open.id} clubId={club.id} accent={accent} live />
        ) : (
          <MatchInsight eventId={open.id} clubId={club.id} accent={accent} />
        ))}
      </Modal>
    </div>
  );
}
