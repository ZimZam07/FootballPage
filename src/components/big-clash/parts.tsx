"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, formatHistoricDate, primaryCategory, team, year } from "@/lib/big-clash/archive";
import type { Category, HistoricMatch } from "@/lib/big-clash/types";
import { TeamLogo } from "@/components/club-hub/ui";

/* Big Clash — the archive. Posters are printed artwork (two kit colours meeting on a diagonal,
   the year set large, the score at the seam); motion is cinematic: a projector wipe on reveal,
   a slow push-in on hover, a caption that rises. */

export const IVORY = "#efe4cc";
export const FILM_RED = "#e0442f";

export const matchHref = (m: HistoricMatch) => `/big-clash/${m.slug}`;

/** Keeps very light kit colours (white, yellow) from washing out the dark artwork. */
export function shade(hex: string, fallback = "#334155") {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 190 ? `color-mix(in srgb, ${hex} 55%, #1e293b)` : hex;
}

/** Reveals content as it scrolls into view — a fade-rise by default, or a projector wipe. */
export function Reveal({ children, className = "", delay = 0, wipe = false }: { children: ReactNode; className?: string; delay?: number; wipe?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("bc-in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("bc-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${wipe ? "bc-wipe" : "bc-reveal"} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

export function CategoryBadge({ category }: { category: Category; size?: "sm" | "md" }) {
  const c = CATEGORIES[category];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: c.color }}>
      <span className="h-1.5 w-1.5" style={{ background: c.color }} />
      {c.short}
    </span>
  );
}

/** "3 – 3" in the condensed display face. */
export function Score({ m, className = "" }: { m: HistoricMatch; className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-display font-extrabold leading-none tabular-nums text-white ${className}`}>
      <span>{m.score[0]}</span>
      <span className="mx-[0.1em] inline-block h-[0.07em] w-[0.3em] self-center bg-white/35" aria-label="to" />
      <span>{m.score[1]}</span>
    </span>
  );
}

const decidedBy = (m: HistoricMatch) => (m.outcome?.includes("penalties") ? "Pens" : m.extraTime ? "A.e.t." : m.outcome ? "Agg." : null);

/** The printed artwork: kit colours meeting on a diagonal, crests, a large year behind. */
function Artwork({ m, large = false }: { m: HistoricMatch; large?: boolean }) {
  const h = team(m.home), a = team(m.away);
  return (
    <div className="bc-art relative h-full overflow-hidden" style={{ "--h": shade(h.color), "--a": shade(a.color) } as CSSProperties}>
      <div className="bc-art-inner absolute inset-0" aria-hidden />
      <span className={`pointer-events-none absolute -bottom-[0.18em] left-1/2 -translate-x-1/2 select-none font-display font-extrabold leading-none tracking-tight text-black/20 ${large ? "text-[13rem] sm:text-[17rem]" : "text-[8.5rem]"}`} aria-hidden>
        {year(m)}
      </span>
      <div className={`relative flex h-full items-center justify-between ${large ? "px-8 sm:px-14" : "px-5"}`}>
        {[h, a].map((t, i) => (
          // Crests sit on a dark disc so they read on any kit colour (e.g. red on red).
          <span key={i} className={`flex items-center justify-center rounded-full bg-[#0b0c0f]/55 ring-1 ring-white/10 backdrop-blur-[2px] ${large ? "h-28 w-28 sm:h-36 sm:w-36" : "h-[4.5rem] w-[4.5rem]"}`}>
            <TeamLogo src={t.logo} name={t.name} className={large ? "h-16 w-16 sm:h-24 sm:w-24" : "h-11 w-11"} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** The signature card: a match poster with a caption plate. */
export function MatchPoster({ m, featured = false }: { m: HistoricMatch; featured?: boolean }) {
  const h = team(m.home), a = team(m.away);
  const by = decidedBy(m);
  return (
    <Link href={matchHref(m)} className="bc-poster group flex h-full flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#14120f]" aria-label={`${h.name} ${m.score[0]}–${m.score[1]} ${a.name}, ${year(m)}`}>
      <div className={featured ? "h-48 sm:h-56" : "h-36"}>
        <Artwork m={m} />
      </div>
      <div className="relative flex flex-1 flex-col px-5 pb-5">
        {/* The score sits on the seam between artwork and caption */}
        <div className="-mt-7 flex items-end justify-between gap-3">
          <span className="bg-[#14120f] px-3 pt-1.5">
            <Score m={m} className={featured ? "text-6xl" : "text-5xl"} />
          </span>
          {by && <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#efe4cc]/60">{by}</span>}
        </div>
        <p className="mt-3 flex items-center justify-between gap-2">
          <CategoryBadge category={primaryCategory(m)} />
          <span className="font-display text-sm font-bold text-[#efe4cc]/50">{year(m)}</span>
        </p>
        <h4 className={`mt-2 font-display font-bold uppercase leading-[0.95] text-[#efe4cc] ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{m.title}</h4>
        <p className="mt-1 text-xs text-slate-500">{h.short} v {a.short}</p>
        <p className={`bc-caption mt-3 text-sm leading-relaxed text-slate-400 ${featured ? "" : "line-clamp-3"}`}>{m.summary}</p>
        <p className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
          <span className="min-w-0 truncate">{m.competition} · {m.stage}<br />{m.stadium} · {formatHistoricDate(m.date, { day: "numeric", month: "short", year: "numeric" })}</span>
          <ArrowUpRight className="bc-arrow h-4 w-4 shrink-0 text-[#efe4cc]/50" />
        </p>
      </div>
    </Link>
  );
}

/** The cover story: one match given the full width of the page. */
export function CoverStory({ m }: { m: HistoricMatch }) {
  const h = team(m.home), a = team(m.away);
  return (
    <Link href={matchHref(m)} className="bc-poster group grid overflow-hidden rounded-md border border-white/[0.08] bg-[#14120f] lg:grid-cols-[1.25fr_1fr]">
      <div className="h-64 sm:h-80 lg:h-auto lg:min-h-[26rem]">
        <Artwork m={m} large />
      </div>
      <div className="flex flex-col p-6 sm:p-9">
        <p className="kicker" style={{ color: FILM_RED }}>Cover story · {m.competition}</p>
        <h3 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.88] text-[#efe4cc] sm:text-6xl">{m.title}</h3>
        <div className="mt-6 flex items-end gap-4">
          <Score m={m} className="text-7xl sm:text-8xl" />
          <div className="pb-2 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">{h.name} v {a.name}</p>
            <p>{m.outcome ?? (m.extraTime ? "After extra time" : m.stage)}</p>
          </div>
        </div>
        <p className="mt-6 max-w-lg leading-relaxed text-slate-300">{m.summary}</p>
        <p className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8 text-sm text-slate-500">
          <span>{m.stadium}, {m.city} · {formatHistoricDate(m.date)}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#efe4cc]">Read the story <ArrowUpRight className="bc-arrow h-4 w-4" /></span>
        </p>
      </div>
    </Link>
  );
}

/** European nights as a ledger: year, the tie, the verdict. */
export function EuropeanNightCard({ m }: { m: HistoricMatch }) {
  const h = team(m.home), a = team(m.away);
  return (
    <Link href={matchHref(m)} className="bc-ledger group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/[0.07] py-4 sm:grid-cols-[4.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:gap-6">
      <span className="font-display text-3xl font-bold leading-none text-[#9db8ff]">{year(m)}</span>
      <div className="min-w-0">
        <p className="flex min-w-0 items-center gap-2 overflow-hidden text-sm font-semibold text-white">
          <TeamLogo src={h.logo} name={h.name} className="h-5 w-5" />
          <span className="min-w-0 truncate">{h.short}</span>
          <span className="shrink-0 font-display text-xl font-bold tabular-nums">{m.score[0]}–{m.score[1]}</span>
          <span className="min-w-0 truncate">{a.short}</span>
          <TeamLogo src={a.logo} name={a.name} className="h-5 w-5" />
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{m.stage} · {m.stadium}</p>
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate font-display text-lg font-bold uppercase text-[#efe4cc]">{m.title}</p>
        {m.outcome && <p className="truncate text-xs text-slate-500">{m.outcome}</p>}
      </div>
      <ArrowUpRight className="bc-arrow h-4 w-4 text-slate-500 group-hover:text-[#9db8ff]" />
    </Link>
  );
}

/** Comebacks as frames on a strip of film. */
export function ComebackCard({ m }: { m: HistoricMatch }) {
  const h = team(m.home), a = team(m.away);
  return (
    <Link href={matchHref(m)} className="bc-frame group relative flex h-full w-72 shrink-0 snap-start flex-col bg-[#0f0e0c] px-5 py-9 sm:w-80">
      <span className="bc-sprockets absolute inset-x-0 top-0 h-5" aria-hidden />
      <span className="bc-sprockets absolute inset-x-0 bottom-0 h-5" aria-hidden />
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f0b74a]">
        <span className="truncate">{m.competition}</span>
        <span className="font-display text-sm text-[#efe4cc]/60">{year(m)}</span>
      </div>
      <div className="my-5 flex items-center justify-between">
        <TeamLogo src={h.logo} name={h.name} className="h-10 w-10" />
        <Score m={m} className="text-5xl" />
        <TeamLogo src={a.logo} name={a.name} className="h-10 w-10" />
      </div>
      <p className="font-display text-2xl font-bold uppercase leading-[0.95] text-[#efe4cc]">{m.title}</p>
      <p className="mt-1 text-xs text-slate-500">{h.short} v {a.short}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">{m.summary}</p>
      {m.outcome && <p className="mt-auto pt-4 text-xs font-semibold text-[#f0b74a]">{m.outcome}</p>}
    </Link>
  );
}

/** Compact final entry for the finals explorer. */
export function FinalCard({ m }: { m: HistoricMatch }) {
  const h = team(m.home), a = team(m.away);
  return (
    <Link href={matchHref(m)} className="bc-ledger group flex items-center gap-4 border-b border-white/[0.07] py-3.5">
      <span className="w-14 shrink-0 font-display text-2xl font-bold leading-none text-[#cdb98a]">{year(m)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
          <TeamLogo src={h.logo} name={h.name} className="h-5 w-5" />
          <span className="min-w-0 truncate font-medium text-white">{h.short}</span>
          <span className="shrink-0 font-display text-lg font-bold tabular-nums text-white">{m.score[0]}–{m.score[1]}</span>
          <span className="min-w-0 truncate font-medium text-white">{a.short}</span>
          <TeamLogo src={a.logo} name={a.name} className="h-5 w-5" />
        </div>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{m.competition} · {m.outcome ?? (m.extraTime ? "After extra time" : m.stadium)}</p>
      </div>
      <ArrowUpRight className="bc-arrow h-4 w-4 shrink-0 text-slate-500 group-hover:text-[#cdb98a]" />
    </Link>
  );
}
