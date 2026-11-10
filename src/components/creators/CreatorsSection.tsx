"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CREATORS_VERIFIED_ON, INDIAN_CREATORS, INTERNATIONAL_CREATORS, type Creator } from "@/data/creators";
import { SafeImg } from "@/components/club-hub/ui";
import Masthead from "@/components/Masthead";

/* Creators — a ranked roster rather than a wall of cards. Each profile sits on a hairline grid;
   the portrait rests on an offset colour frame and lifts off it on hover (profile-card depth). */

type Tab = "indian" | "international";
const RED = "#ff3d2e";

/** Small tricolour mark (flag emoji don't render on Windows). */
function IndiaMark() {
  return (
    <span className="inline-flex h-2.5 w-3.5 flex-col overflow-hidden rounded-[2px]" aria-hidden>
      <span className="flex-1 bg-[#FF9933]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#138808]" />
    </span>
  );
}

function YouTubeMark({ className = "h-3.5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden>
      <rect width="28" height="20" rx="5" fill="#FF0000" />
      <path d="M11 5.5v9l8-4.5z" fill="#fff" />
    </svg>
  );
}

const initials = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Portrait({ c, size }: { c: Creator; size: string }) {
  return (
    <span className={`cr-portrait relative block shrink-0 ${size}`}>
      <span className="cr-frame absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-md" aria-hidden />
      <span className="cr-photo relative block h-full w-full overflow-hidden rounded-md bg-slate-800 ring-1 ring-black/40">
        <SafeImg
          src={c.avatar}
          alt={`${c.name} YouTube profile picture`}
          className="h-full w-full object-cover"
          fallback={<span className="flex h-full w-full items-center justify-center bg-slate-800 font-display text-xl font-bold text-slate-300">{initials(c.name)}</span>}
        />
      </span>
    </span>
  );
}

function Country({ c }: { c: Creator }) {
  if (!c.country) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {c.country.name === "India" && <IndiaMark />}
      {c.country.name}
    </span>
  );
}

function Spotlight({ c, rank }: { c: Creator; rank: number }) {
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${c.name} on YouTube (opens in a new tab)`}
      className="cr-card ch-fade-up group relative grid gap-6 overflow-hidden border-b border-line py-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-10"
    >
      <Portrait c={c} size="h-24 w-24 sm:h-28 sm:w-28" />
      <div className="min-w-0">
        <p className="kicker flex items-center gap-2" style={{ color: RED }}>
          <YouTubeMark className="h-3 w-4" /> Featured creator · No. {String(rank).padStart(2, "0")}
        </p>
        <p className="mt-2 font-display text-4xl font-extrabold uppercase leading-none tracking-wide text-white sm:text-5xl">{c.name}</p>
        <p className="mt-2 text-sm text-slate-500">@{c.handle} · {c.category}</p>
        <p className="mt-3 max-w-xl leading-relaxed text-slate-300">{c.description}</p>
      </div>
      <div className="flex items-end justify-between gap-6 sm:flex-col sm:items-end">
        <p className="text-right">
          <span className="block font-display text-5xl font-bold leading-none text-white">{c.subscribers}</span>
          <span className="text-xs uppercase tracking-[0.14em] text-slate-500">subscribers</span>
        </p>
        <span className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 transition group-hover:bg-[#ff3d2e] group-hover:text-white">
          Open channel <ArrowUpRight className="cr-arrow h-4 w-4" />
        </span>
      </div>
    </a>
  );
}

function Profile({ c, rank, index }: { c: Creator; rank: number; index: number }) {
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${c.name} on YouTube (opens in a new tab)`}
      className="cr-card ch-fade-up group relative flex h-full flex-col bg-ink p-5 shadow-[0_0_0_0.5px_var(--color-line)] transition-colors duration-300 hover:bg-panel sm:p-6"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-start gap-4">
        <Portrait c={c} size="h-16 w-16" />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-[17px] font-semibold leading-tight text-white">{c.name}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">@{c.handle}</p>
          <p className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{c.category}</p>
        </div>
        <span className="font-display text-sm font-bold text-slate-500 transition-colors group-hover:text-[#ff3d2e]">{String(rank).padStart(2, "0")}</span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{c.description}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5 text-xs text-slate-500">
        <p>
          <span className="block font-display text-2xl font-bold leading-none text-slate-100">{c.subscribers}</span>
          subscribers
        </p>
        <span className="flex items-center gap-3">
          <Country c={c} />
          <ArrowUpRight className="cr-arrow h-4 w-4 text-slate-500 group-hover:text-white" />
        </span>
      </div>
    </a>
  );
}

const TABS: { id: Tab; label: string; list: Creator[] }[] = [
  { id: "indian", label: "Indian creators", list: INDIAN_CREATORS },
  { id: "international", label: "International creators", list: INTERNATIONAL_CREATORS },
];

export default function CreatorsSection() {
  const [tab, setTab] = useState<Tab>("indian");
  const active = TABS.find((t) => t.id === tab)!;
  const ranked = active.list.map((c, i) => ({ c, rank: i + 1 }));
  const featured = ranked.filter((r) => r.c.featured);
  const rest = ranked.filter((r) => !r.c.featured);

  return (
    <section className="space-y-8">
      <Masthead
        index="06"
        kicker="Creators"
        title="The voices of the game"
        intro="Twenty football channels worth following — tactics, reactions, transfers, history and Indian football. Every profile opens the channel on YouTube."
        accent={RED}
        aside={
          <div role="tablist" aria-label="Creator category" className="flex gap-6 border-b border-line">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  className={`relative -mb-px flex items-center gap-2 pb-3 text-sm font-semibold transition-colors ${on ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
                >
                  {t.id === "indian" && <IndiaMark />}
                  {t.label}
                  <span className="font-display text-base text-slate-500">{t.list.length}</span>
                  <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} style={{ background: RED }} />
                </button>
              );
            })}
          </div>
        }
      />

      <div key={tab}>
        {featured.map((r) => <Spotlight key={r.c.id} c={r.c} rank={r.rank} />)}
        <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-lg border border-line sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((r, i) => <Profile key={r.c.id} c={r.c} rank={r.rank} index={i} />)}
        </div>
      </div>

      <p className="text-xs text-slate-500">Ranked by audience size. Subscriber counts as of {CREATORS_VERIFIED_ON}.</p>
    </section>
  );
}
