"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, ChevronDown, Search, Shuffle, Star, X } from "lucide-react";
import {
  ARCHIVE, CATEGORIES, COMPETITION_GROUPS, ERAS, NO_FILTERS, RIVALRIES,
  archiveClubForEspnId, clubMatchCount, filterArchive, formatHistoricDate, groupLabel, isFiltering, rivalryMatches, team, year,
  type ArchiveFilters,
} from "@/lib/big-clash/archive";
import { coverFor, utcDay } from "@/lib/big-clash/cover";
import { nowMs, useClock } from "@/lib/clock";
import type { Category, CompetitionGroup, HistoricMatch, Rivalry } from "@/lib/big-clash/types";
import { useFavorites } from "@/lib/club-hub/client";
import { Modal, StateMessage, TeamLogo } from "@/components/club-hub/ui";
import { LeagueLogo } from "@/components/club-hub/LeagueIdentity";
import Masthead from "@/components/Masthead";
import { ComebackCard, CoverStory, EuropeanNightCard, FILM_RED, FinalCard, MatchPoster, Reveal, matchHref, shade } from "./parts";

/** URL parameter names (prefixed so they never collide with other sections'). */
export const BIG_PARAMS = { q: "bq", group: "bcomp", era: "bera", category: "bcat", rivalry: "briv", club: "bclub" } as const;

const byCat = (c: Category) => ARCHIVE.filter((m) => m.categories.includes(c));
const firstYear = Math.min(...ARCHIVE.map(year));
const lastYear = Math.max(...ARCHIVE.map(year));

// ---------------------------------------------------------------------------
// Browse controls

function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const active = value !== options[0].value;
  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`h-10 cursor-pointer appearance-none rounded-md border bg-transparent py-0 pl-3 pr-8 text-sm font-medium outline-none transition focus-visible:border-[#efe4cc] ${active ? "border-[#efe4cc]/60 text-[#efe4cc]" : "border-line text-slate-300 hover:border-line-strong hover:text-white"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900 text-slate-100">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </label>
  );
}

function BrowseBar({ f, set, count }: { f: ArchiveFilters; set: (p: Partial<ArchiveFilters>) => void; count: number }) {
  const groups = COMPETITION_GROUPS.filter((g) => ARCHIVE.some((m) => m.group === g));
  return (
    <div className="relative z-30 -mx-4 border-y border-line bg-ink/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:sticky lg:top-[60px] lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search the archive</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={f.q}
            onChange={(e) => set({ q: e.target.value.slice(0, 60) })}
            placeholder="Search clubs, countries, players, stadiums, years…"
            className="h-10 w-full rounded-md border border-line bg-white/[0.02] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#efe4cc]/60"
          />
        </label>
        <div className="ch-scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Select<ArchiveFilters["group"]>
            label="Competition"
            value={f.group}
            onChange={(group) => set({ group })}
            options={[
              { value: "all", label: "All competitions" },
              { value: "club", label: "Club football" },
              { value: "international", label: "International football" },
              ...groups.map((g) => ({ value: g, label: groupLabel(g) })),
            ]}
          />
          <Select<ArchiveFilters["era"]> label="Era" value={f.era} onChange={(era) => set({ era })} options={[{ value: "all", label: "Every era" }, ...ERAS.map((e) => ({ value: e.id, label: e.label }))]} />
          <Select<ArchiveFilters["category"]>
            label="Category"
            value={f.category}
            onChange={(category) => set({ category })}
            options={[{ value: "all", label: "All categories" }, ...(Object.keys(CATEGORIES) as Category[]).map((c) => ({ value: c, label: CATEGORIES[c].label }))]}
          />
          <Select<string> label="Rivalry" value={f.rivalry} onChange={(rivalry) => set({ rivalry })} options={[{ value: "all", label: "All rivalries" }, ...RIVALRIES.map((r) => ({ value: r.id, label: r.name }))]} />
          {isFiltering(f) && (
            <button onClick={() => set(NO_FILTERS)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-slate-400 transition hover:text-white">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>
      {isFiltering(f) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400" aria-live="polite">
          {count} {count === 1 ? "match" : "matches"} found
          {f.club !== "all" && (
            <button onClick={() => set({ club: "all" })} className="inline-flex items-center gap-1.5 rounded border border-[#efe4cc]/30 px-2 py-0.5 text-[#efe4cc] transition hover:border-[#efe4cc]/60" aria-label={`Remove ${team(f.club).name} filter`}>
              <TeamLogo src={team(f.club).logo} name={team(f.club).name} className="h-3.5 w-3.5" /> Matches involving {team(f.club).name} <X className="h-3 w-3" />
            </button>
          )}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Your clubs: Club Hub favourites (same browser store), one tap from their history.

const noop = () => () => {};
const readDay = () => utcDay(nowMs());

function YourClubs({ f, set }: { f: ArchiveFilters; set: (p: Partial<ArchiveFilters>) => void }) {
  const { favorites } = useFavorites();
  // Favourites live in this browser only; render nothing on the server so the strip never flashes the wrong state.
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  if (!inBrowser) return null;
  if (!favorites.length) {
    return (
      <p className="text-sm text-slate-500">
        <Star className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-amber-400" />
        Star your clubs in{" "}
        <Link href="/?tab=club" className="font-medium text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white">
          Club Hub
        </Link>{" "}
        and they&apos;ll appear here, one tap from their greatest matches.
      </p>
    );
  }
  const clubs = favorites.map((fav) => {
    const key = archiveClubForEspnId(fav.id);
    return { fav, key, count: key ? clubMatchCount(key) : 0 };
  });
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="font-display text-xl font-extrabold uppercase leading-none tracking-wide text-[#efe4cc]">
          Your clubs. <span style={{ color: FILM_RED }}>Your history.</span>
        </p>
        {f.club !== "all" && (
          <button onClick={() => set({ club: "all" })} className="shrink-0 text-xs font-medium text-slate-400 transition hover:text-white">
            Show every match
          </button>
        )}
      </div>
      <div className="ch-scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Your clubs">
        {clubs.map(({ fav, key, count }) => {
          const on = !!key && f.club === key;
          return (
            <button
              key={fav.id}
              disabled={!count}
              aria-pressed={on}
              onClick={() => key && set(on ? { club: "all" } : { club: key, q: "" })}
              title={count ? `${count} historic ${count === 1 ? "match" : "matches"} with ${fav.name}` : `${fav.name} isn't in the archive yet`}
              className={`group flex h-12 shrink-0 items-center gap-2.5 rounded-md border pl-2.5 pr-3.5 text-left transition duration-200 ${
                on
                  ? "border-[#efe4cc]/70 bg-[#efe4cc]/[0.08] shadow-[0_10px_24px_-16px_rgba(239,228,204,0.6)]"
                  : count
                    ? "border-line bg-white/[0.02] hover:-translate-y-px hover:border-[#efe4cc]/40"
                    : "cursor-not-allowed border-line/60 opacity-45"
              }`}
            >
              <TeamLogo src={fav.logo} name={fav.name} className="h-7 w-7" />
              <span className="min-w-0">
                <span className={`block text-sm font-semibold leading-tight ${on ? "text-white" : "text-slate-200"}`}>{fav.shortName || fav.name}</span>
                <span className="flex items-center gap-1 text-[11px] leading-tight text-slate-500">
                  <LeagueLogo league={fav.league} className="h-3 w-3" />
                  {count ? `${count} ${count === 1 ? "match" : "matches"}` : "Not in the archive yet"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections

function Chapter({ numeral, title, subtitle, accent, action }: { numeral: string; title: string; subtitle: string; accent: string; action?: ReactNode }) {
  return (
    <Reveal>
      <div className="mb-8 grid gap-4 border-t pt-5 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-baseline" style={{ borderColor: `color-mix(in srgb, ${accent} 45%, transparent)` }}>
        <span className="font-display text-xl font-bold italic" style={{ color: accent }}>{numeral}</span>
        <div className="min-w-0">
          <h2 className="font-display text-3xl font-extrabold uppercase leading-none text-[#efe4cc] sm:text-4xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>
        </div>
        {action}
      </div>
    </Reveal>
  );
}

function ShowMore({ open, onClick, total }: { open: boolean; onClick: () => void; total: number }) {
  return (
    <div className="mt-8">
      <button onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm font-medium text-slate-200 transition hover:border-[#efe4cc]/50 hover:text-white">
        {open ? "Show fewer" : `Show all ${total}`} <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

function Greatest({ cover }: { cover: string }) {
  const all = useMemo(() => byCat("greatest").filter((m) => m.slug !== cover), [cover]);
  const [open, setOpen] = useState(false);
  const lead = ["argentina-france-2022-world-cup-final", "barcelona-psg-2017-la-remontada"];
  const ordered = [...lead.map((s) => all.find((m) => m.slug === s)!).filter(Boolean), ...all.filter((m) => !lead.includes(m.slug))];
  const shown = open ? ordered : ordered.slice(0, 8);
  return (
    <section>
      <Chapter numeral="I." title="All-time greatest matches" subtitle="The games every football fan should know — the drama, the stakes and the moments still replayed decades later." accent="#efe4cc" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((m, i) => (
          <Reveal key={m.slug} wipe delay={(i % 4) * 90} className={i < 2 ? "sm:col-span-2" : ""}>
            <MatchPoster m={m} featured={i < 2} />
          </Reveal>
        ))}
      </div>
      {ordered.length > 8 && <ShowMore open={open} onClick={() => setOpen((o) => !o)} total={ordered.length} />}
    </section>
  );
}

function EuropeanNights() {
  const nights = useMemo(() => byCat("european-night"), []);
  const [open, setOpen] = useState(false);
  const shown = open ? nights : nights.slice(0, 8);
  return (
    <section>
      <Chapter numeral="II." title="Legendary European nights" subtitle="Finals, semi-final comebacks and last-minute miracles from the European Cup and Champions League." accent="#9db8ff" />
      <div className="border-t border-white/[0.07]">
        {shown.map((m, i) => (
          <Reveal key={m.slug} delay={Math.min(i, 8) * 40}>
            <EuropeanNightCard m={m} />
          </Reveal>
        ))}
      </div>
      {nights.length > 8 && <ShowMore open={open} onClick={() => setOpen((o) => !o)} total={nights.length} />}
    </section>
  );
}

function RivalryCard({ r, onOpen, index }: { r: Rivalry; onOpen: () => void; index: number }) {
  const [a, b] = r.teams.map(team);
  const ms = rivalryMatches(r);
  return (
    <button onClick={onOpen} className="bc-rival group relative flex h-full w-full flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#14120f] text-left" aria-label={`Open ${r.name}: ${ms.length} historic matches`}>
      <div className="relative flex h-24 items-center justify-between overflow-hidden px-5" style={{ background: `linear-gradient(105deg, ${shade(a.color)} 0 50%, ${shade(b.color)} 50% 100%)` }}>
        <span className="pointer-events-none absolute inset-0 bg-black/30" aria-hidden />
        <TeamLogo src={a.logo} name={a.name} className="bc-rival-l relative h-12 w-12 drop-shadow-lg" />
        <span className="relative font-display text-sm font-bold text-white/70">{String(index + 1).padStart(2, "0")}</span>
        <TeamLogo src={b.logo} name={b.name} className="bc-rival-r relative h-12 w-12 drop-shadow-lg" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{r.region}</p>
        <h4 className="mt-1 font-display text-2xl font-extrabold uppercase leading-none text-[#efe4cc]">{r.name}</h4>
        <p className="mt-1 text-xs text-slate-500">{a.name} v {b.name}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">{r.description}</p>
        <p className="mt-auto flex items-center justify-between pt-4 text-xs font-semibold text-[#ff6a52]">
          {ms.length} historic {ms.length === 1 ? "match" : "matches"}
          <ArrowUpRight className="bc-arrow h-4 w-4" />
        </p>
      </div>
    </button>
  );
}

function RivalryCollection({ r, onFilter }: { r: Rivalry; onFilter: () => void }) {
  const [a, b] = r.teams.map(team);
  const ms = rivalryMatches(r);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-line pb-5">
        <TeamLogo src={a.logo} name={a.name} className="h-12 w-12" />
        <div className="min-w-0 flex-1 text-center">
          <p className="font-display text-3xl font-extrabold uppercase leading-none text-[#efe4cc]">{r.name}</p>
          <p className="mt-1 text-xs text-slate-400">{a.name} v {b.name} · {r.region}</p>
        </div>
        <TeamLogo src={b.logo} name={b.name} className="h-12 w-12" />
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{r.description}</p>
      <ol className="border-t border-line">
        {ms.map((m) => (
          <li key={m.slug}>
            <Link href={matchHref(m)} className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-3.5 transition hover:bg-white/[0.02]">
              <span className="font-display text-2xl font-bold text-[#ff6a52]">{year(m)}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-white">
                  {team(m.home).short} <span className="font-display text-lg tabular-nums">{m.score[0]}–{m.score[1]}</span> {team(m.away).short}
                  <span className="font-display text-base font-bold uppercase text-[#efe4cc]">· {m.title}</span>
                </p>
                <p className="truncate text-xs text-slate-500">{m.competition} · {m.stage} · {formatHistoricDate(m.date)}</p>
              </div>
              <ArrowUpRight className="bc-arrow h-4 w-4 text-slate-500 group-hover:text-white" />
            </Link>
          </li>
        ))}
      </ol>
      <button onClick={onFilter} className="text-sm font-semibold text-[#ff6a52] hover:text-[#ff8a76]">Show these matches in the archive →</button>
    </div>
  );
}

function Rivalries({ onFilter }: { onFilter: (id: string) => void }) {
  const [open, setOpen] = useState<Rivalry | null>(null);
  return (
    <section>
      <Chapter numeral="III." title="Historic rivalries" subtitle="Not every meeting — only the encounters that mattered. Open a rivalry to explore its defining matches." accent="#ff6a52" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {RIVALRIES.map((r, i) => (
          <Reveal key={r.id} delay={(i % 5) * 60}>
            <RivalryCard r={r} index={i} onOpen={() => setOpen(r)} />
          </Reveal>
        ))}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.name} · historic matches` : ""}>
        {open && (
          <RivalryCollection
            r={open}
            onFilter={() => {
              onFilter(open.id);
              setOpen(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}

function Comebacks() {
  const list = useMemo(() => byCat("comeback"), []);
  return (
    <section>
      <Chapter numeral="IV." title="Greatest comebacks" subtitle="Three down, four down, out on aggregate — and then the impossible. Scroll the reel." accent="#f0b74a" />
      <Reveal>
        <div className="bc-reel ch-scrollbar-none -mx-4 flex snap-x snap-mandatory gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {list.map((m) => <ComebackCard key={m.slug} m={m} />)}
        </div>
      </Reveal>
    </section>
  );
}

type FinalsTab = "all" | CompetitionGroup;

function Finals() {
  const finals = useMemo(() => byCat("final"), []);
  const tabs: FinalsTab[] = ["all", ...COMPETITION_GROUPS.filter((g) => finals.some((m) => m.group === g))];
  const [tab, setTab] = useState<FinalsTab>("all");
  const list = tab === "all" ? finals : finals.filter((m) => m.group === tab);
  return (
    <section>
      <Chapter numeral="V." title="Legendary finals" subtitle="Trophies won and lost on a single night. Explore by competition." accent="#cdb98a" />
      <div className="ch-scrollbar-none -mx-4 mb-4 flex gap-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Finals by competition">
        {tabs.map((t) => {
          const n = t === "all" ? finals.length : finals.filter((m) => m.group === t).length;
          const on = tab === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t)}
              className={`relative -mb-px shrink-0 pb-3 text-sm font-semibold transition-colors ${on ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
            >
              {t === "all" ? "All finals" : groupLabel(t)}
              <span className="ml-1.5 font-display text-sm text-slate-500">{n}</span>
              <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-[#cdb98a] transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          );
        })}
      </div>
      <div key={tab} className="ch-fade-up grid grid-cols-1 gap-x-10 md:grid-cols-2">
        {list.map((m) => <FinalCard key={m.slug} m={m} />)}
      </div>
    </section>
  );
}

function Results({ list, onClear }: { list: HistoricMatch[]; onClear: () => void }) {
  if (!list.length) {
    return (
      <StateMessage
        icon={<Search className="h-5 w-5" />}
        title="No matches in the archive fit those filters"
        message="Try a different club, competition or era — or clear the filters to see every match."
        action={<button onClick={onClear} className="mt-1 h-9 rounded-md bg-[#efe4cc] px-4 text-sm font-semibold text-slate-950">Clear filters</button>}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((m, i) => (
        <div key={m.slug} className="ch-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
          <MatchPoster m={m} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function BigClash({ initial, coverDay }: { initial?: Partial<ArchiveFilters>; coverDay: number }) {
  const router = useRouter();
  const [f, setF] = useState<ArchiveFilters>({ ...NO_FILTERS, ...initial });
  const results = useMemo(() => filterArchive(f), [f]);
  const filtering = isFiltering(f);

  // The cover is chosen for the server's UTC day (so hydration matches), then follows the browser's
  // clock: corrected at once if the page came from a cache on an earlier day, and turned over at 00:00 UTC.
  const day = useClock(coverDay, readDay, 60_000);
  const cover = coverFor(day);
  const coverLabel = cover.anniversary ? `On this day in football history · ${cover.yearsAgo} years ago` : "From football history";

  const set = (p: Partial<ArchiveFilters>) => setF((prev) => ({ ...prev, ...p }));

  // Mirror the filters in the URL, so the back button from a match page restores them.
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [k, param] of Object.entries(BIG_PARAMS)) {
      const v = f[k as keyof ArchiveFilters];
      if (v && v !== "all") url.searchParams.set(param, v);
      else url.searchParams.delete(param);
    }
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
    try {
      sessionStorage.setItem("bc-last", url.pathname + url.search);
    } catch {}
  }, [f]);

  const explore = () => document.getElementById("bc-archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const random = () => router.push(matchHref(ARCHIVE[Math.floor(Math.random() * ARCHIVE.length)]));
  const filterRivalry = (id: string) => {
    setF({ ...NO_FILTERS, rivalry: id });
    explore();
  };

  return (
    <div className="space-y-12">
      <Masthead
        index="05"
        kicker="Big Clash · The archive"
        title={<>The matches that<br className="hidden sm:block" /> made football history</>}
        intro={`${ARCHIVE.length} matches from ${firstYear} to ${lastYear}: historic finals, impossible comebacks and the rivalries that define the sport. Every entry checked against the record, with official highlights where they exist.`}
        accent={FILM_RED}
        aside={
          <div className="flex flex-col gap-4 lg:items-end">
            <dl className="grid grid-cols-3 gap-6 text-left lg:text-right">
              {([["Matches", ARCHIVE.length], ["Rivalries", RIVALRIES.length], ["Highlights", ARCHIVE.filter((m) => m.highlights).length]] as const).map(([k, v]) => (
                <div key={k}>
                  <dd className="font-display text-3xl font-bold leading-none text-[#efe4cc]">{v}</dd>
                  <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">{k}</dt>
                </div>
              ))}
            </dl>
            <div className="flex gap-2">
              <button onClick={explore} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#efe4cc] px-4 text-sm font-semibold text-slate-950 transition hover:bg-white">
                Explore the archive <ArrowDown className="h-4 w-4" />
              </button>
              <button onClick={random} className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm font-medium text-slate-200 transition hover:border-[#efe4cc]/50 hover:text-white">
                <Shuffle className="h-4 w-4" /> Surprise me
              </button>
            </div>
          </div>
        }
      />

      {!filtering && (
        <Reveal wipe key={cover.match.slug}>
          <CoverStory m={cover.match} label={coverLabel} />
        </Reveal>
      )}

      <div id="bc-archive" className="scroll-mt-20 space-y-8">
        <YourClubs f={f} set={set} />
        <BrowseBar f={f} set={set} count={results.length} />
        {filtering ? (
          <Results list={results} onClear={() => setF(NO_FILTERS)} />
        ) : (
          <div className="space-y-20">
            <Greatest cover={cover.match.slug} />
            <EuropeanNights />
            <Rivalries onFilter={filterRivalry} />
            <Comebacks />
            <Finals />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        A curated archive of real matches. Highlights open official club, league, competition or broadcaster uploads on YouTube. Team crests via ESPN.
      </p>
    </div>
  );
}
