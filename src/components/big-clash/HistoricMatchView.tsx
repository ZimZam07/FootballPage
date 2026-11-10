"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { sectionHref } from "@/lib/site";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowUpRight, Play, VideoOff } from "lucide-react";
import { formatHistoricDate, getRivalry, relatedMatches, team, year } from "@/lib/big-clash/archive";
import type { HistoricMatch, KeyMoment } from "@/lib/big-clash/types";
import { TeamLogo } from "@/components/club-hub/ui";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CategoryBadge, FILM_RED, MatchPoster, Reveal, Score, shade } from "./parts";

const minuteValue = (min: string) => {
  const m = /^(\d+)(?:\+(\d+))?/.exec(min);
  return m ? Number(m[1]) + Number(m[2] ?? 0) : null;
};
const isGoal = (k: KeyMoment) => k.type === "goal" || k.type === "penalty" || k.type === "own-goal";

/** Full-bleed title sequence: the poster artwork across the page, the score set very large. */
function TitleSequence({ m }: { m: HistoricMatch }) {
  const h = team(m.home), a = team(m.away);
  return (
    <header className="bc-titles relative isolate overflow-hidden border-b border-line">
      <div className="bc-art absolute inset-0" style={{ "--h": shade(h.color), "--a": shade(a.color) } as CSSProperties} aria-hidden>
        <div className="bc-art-inner bc-title-art absolute inset-0" />
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/55 to-ink" aria-hidden />
      <span className="pointer-events-none absolute -bottom-[0.2em] right-[-0.04em] select-none font-display text-[12rem] font-extrabold leading-none text-white/[0.06] sm:text-[22rem]" aria-hidden>{year(m)}</span>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {m.categories.map((c) => <CategoryBadge key={c} category={c} />)}
        </div>
        <p className="kicker mt-8 text-[#efe4cc]/70">{m.competition} · {m.stage}</p>
        <h1 className="mt-2 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.86] text-[#efe4cc] sm:text-7xl">{m.title}</h1>

        <div className="mt-10 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0b0c0f]/55 ring-1 ring-white/10 sm:h-24 sm:w-24"><TeamLogo src={h.logo} name={h.name} className="h-10 w-10 sm:h-16 sm:w-16" /></span>
            <p className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-4xl">{h.name}</p>
          </div>
          <div className="text-center">
            <Score m={m} className="text-8xl sm:text-[9rem]" />
            {(m.extraTime || m.outcome) && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#efe4cc]/70">{m.outcome ?? "After extra time"}</p>}
          </div>
          <div className="flex items-center gap-4 sm:flex-row-reverse sm:text-right">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0b0c0f]/55 ring-1 ring-white/10 sm:h-24 sm:w-24"><TeamLogo src={a.logo} name={a.name} className="h-10 w-10 sm:h-16 sm:w-16" /></span>
            <p className="font-display text-2xl font-bold uppercase leading-none text-white sm:text-4xl">{a.name}</p>
          </div>
        </div>

        <p className="mt-10 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/15 pt-4 text-sm text-slate-300">
          <span>{formatHistoricDate(m.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="text-slate-400">{m.stadium}, {m.city}</span>
        </p>
      </div>
    </header>
  );
}

function HighlightsPanel({ m }: { m: HistoricMatch }) {
  const hl = m.highlights;
  if (!hl) {
    return (
      <div className="flex items-start gap-4 border-y border-line py-5">
        <VideoOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <div>
          <p className="font-semibold text-slate-200">Highlights unavailable</p>
          <p className="mt-0.5 text-sm text-slate-500">We couldn&apos;t find an official upload for this match, so we don&apos;t link to one. We only link to verified club, league, competition or broadcaster videos.</p>
        </div>
      </div>
    );
  }
  const label = hl.kind === "full-match" ? "Watch Full Match" : hl.kind === "key-moment" ? "Watch the Decisive Moment" : "Watch Match Highlights";
  return (
    <a
      href={hl.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bc-ledger group flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: FILM_RED }}>
        <Play className="h-5 w-5 translate-x-px fill-white text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl font-bold uppercase leading-none text-white">{label}</span>
        <span className="mt-1 block text-sm text-slate-400">Official video from <span className="font-semibold text-slate-200">{hl.source}</span> on YouTube · opens in a new tab</span>
      </span>
      <ArrowUpRight className="bc-arrow h-5 w-5 text-slate-400 group-hover:text-white" />
    </a>
  );
}

function Timeline({ m }: { m: HistoricMatch }) {
  const h = team(m.home), a = team(m.away);
  if (!m.moments?.length) {
    return <p className="text-sm text-slate-500">A minute-by-minute record isn&apos;t shown for this match because we couldn&apos;t verify every goal time. The story above covers the key moments.</p>;
  }
  const suffix = (k: KeyMoment) => (k.type === "penalty" ? " (pen)" : k.type === "own-goal" ? " (o.g.)" : "");
  const mark = (k: KeyMoment) =>
    isGoal(k) ? <span className="h-2.5 w-2.5 rounded-full bg-[#efe4cc]" /> : k.type === "red" ? <span className="h-3 w-2 rounded-[1px] bg-red-500" /> : k.type === "save" ? <span className="h-2.5 w-2.5 rounded-full border-2 border-sky-300" /> : <span className="h-2 w-2 rotate-45 bg-[#f0b74a]" />;
  return (
    <ol className="relative">
      <span className="absolute bottom-3 left-[4.25rem] top-3 w-px bg-line" aria-hidden />
      {m.moments.map((k, i) => {
        const t = k.side === "home" ? h : k.side === "away" ? a : null;
        return (
          <li key={i} className="relative grid grid-cols-[3.5rem_1.5rem_minmax(0,1fr)] items-center gap-2 py-2.5">
            <span className="text-right font-display text-lg font-bold tabular-nums text-[#efe4cc]">{k.minute}</span>
            <span className="relative z-10 flex justify-center bg-ink py-1">{mark(k)}</span>
            <span className="flex min-w-0 items-center gap-2.5 text-[15px] text-slate-200">
              {t && <TeamLogo src={t.logo} name={t.name} className="h-5 w-5" />}
              <span className={isGoal(k) ? "font-medium text-white" : ""}>{k.text}{suffix(k)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Facts derived only from the verified record — nothing invented. */
function Facts({ m }: { m: HistoricMatch }) {
  const ms = m.moments ?? [];
  const late = ms.filter((k) => isGoal(k) && (minuteValue(k.minute) ?? 0) >= 85).length;
  const reds = ms.filter((k) => k.type === "red").length;
  const decided = m.outcome?.includes("penalties") ? "Penalty shoot-out" : m.outcome?.includes("away goals") ? "Away goals" : m.outcome?.includes("aggregate") ? "On aggregate" : m.extraTime ? "Extra time" : "90 minutes";
  const facts: [string, string | number][] = [
    ["Goals", m.score[0] + m.score[1]],
    ["Decided by", decided],
    ...(ms.length ? ([["Goals from the 85th minute", late], ["Red cards", reds]] as [string, number][]) : []),
    ["Venue", `${m.stadium}, ${m.city}`],
    ["Competition", m.competition],
  ];
  return (
    <dl className="divide-y divide-line border-y border-line">
      {facts.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-xs uppercase tracking-[0.12em] text-slate-500">{k}</dt>
          <dd className={`text-right ${typeof v === "number" ? "font-display text-2xl font-bold text-white" : "text-sm font-medium text-slate-200"}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function HistoricMatchView({ m }: { m: HistoricMatch }) {
  const router = useRouter();
  const rivalry = getRivalry(m.rivalry);
  const related = relatedMatches(m);
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <Navbar activeTab="big" setActiveTab={(t) => router.push(sectionHref(t))} />
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <button
          onClick={() => {
            // Return to the archive with whatever filters were active (saved by the landing page).
            let to = "/?tab=big";
            try {
              const saved = sessionStorage.getItem("bc-last");
              if (saved?.startsWith("/?")) to = saved;
            } catch {}
            router.push(to);
          }}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" /> Big Clash archive
        </button>
      </div>

      <div className="mt-4 ch-fade-up"><TitleSequence m={m} /></div>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
        <HighlightsPanel m={m} />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal>
            <article>
              <p className="kicker">The story</p>
              <div className="bc-story mt-4 space-y-5 text-[17px] leading-[1.75] text-slate-300">
                {m.context.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </article>
          </Reveal>
          <Reveal delay={80}>
            <aside className="space-y-8">
              <section>
                <p className="kicker mb-3">Why it&apos;s remembered</p>
                <ul className="space-y-3">
                  {m.legacy.map((l) => (
                    <li key={l} className="border-l-2 pl-4 text-[15px] leading-snug text-slate-200" style={{ borderColor: FILM_RED }}>{l}</li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="kicker mb-1">Match facts</p>
                <Facts m={m} />
                <p className="mt-3 text-xs text-slate-500">Starting line-ups and full match statistics aren&apos;t shown: we only publish data we can verify for historic matches.</p>
              </section>
            </aside>
          </Reveal>
        </div>

        <Reveal>
          <section>
            <h2 className="mb-5 font-display text-3xl font-extrabold uppercase text-[#efe4cc]">Key moments</h2>
            <Timeline m={m} />
          </section>
        </Reveal>

        {rivalry && (
          <Reveal>
            <Link href={`/?tab=big&briv=${rivalry.id}`} className="bc-ledger group flex items-center gap-5 border-y border-line py-5">
              <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-[#ff6a52]">Rivalry</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-extrabold uppercase leading-none text-white">{rivalry.name}</p>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">{rivalry.description}</p>
              </div>
              <ArrowUpRight className="bc-arrow h-5 w-5 shrink-0 text-slate-500 group-hover:text-white" />
            </Link>
          </Reveal>
        )}

        {related.length > 0 && (
          <section>
            <h2 className="mb-5 font-display text-3xl font-extrabold uppercase text-[#efe4cc]">More from the archive</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.slug} wipe delay={i * 90}>
                  <MatchPoster m={r} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
