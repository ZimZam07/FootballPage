"use client";

import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { STREAM_SITES, displayHost, type StreamSite } from "@/data/streamSites";
import Masthead from "@/components/Masthead";

/* Watch Live Matches — two destination panels. On wide screens the panels share one row and
   the one under the pointer widens; its extruded wordmark deepens and its background figure
   shifts. Each destination has its own type treatment rather than a shared card template. */

function Figure({ site }: { site: StreamSite }) {
  const { primary: p, secondary: s } = site.theme;
  if (site.look === "slash") {
    // A broad diagonal band, like a kit stripe.
    return (
      <div className="sd-figure pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-[20%] -top-1/4 h-[150%] w-[46%] rotate-[22deg]" style={{ background: `linear-gradient(180deg, ${p}, ${s})`, opacity: 0.16 }} />
        <div className="absolute -right-[4%] -top-1/4 h-[150%] w-[3%] rotate-[22deg]" style={{ background: p, opacity: 0.35 }} />
      </div>
    );
  }
  // Concentric arcs, like a corner arc drawn large.
  return (
    <svg className="sd-figure pointer-events-none absolute -right-24 -top-24 h-[130%] w-auto" viewBox="0 0 400 400" fill="none" aria-hidden>
      {[60, 120, 180, 240, 300].map((r, i) => (
        <circle key={r} cx="400" cy="0" r={r} stroke={i % 2 ? s : p} strokeOpacity={0.28 - i * 0.04} strokeWidth={i === 2 ? 2 : 1} />
      ))}
    </svg>
  );
}

function Wordmark({ site }: { site: StreamSite }) {
  const { primary: p, secondary: s } = site.theme;
  if (site.look === "slash") {
    return (
      <p className="sd-word font-display text-[3.4rem] font-extrabold uppercase italic leading-[0.82] tracking-[-0.01em] sm:text-[5.2rem]" style={{ "--ex": `color-mix(in srgb, ${s} 70%, #000)` } as CSSProperties}>
        <span className="text-white">{site.wordmark[0]}</span>
        <br />
        <span style={{ color: p }}>{site.wordmark[1]}</span>
      </p>
    );
  }
  return (
    <p className="sd-word text-[2.9rem] font-bold lowercase leading-[0.95] tracking-[-0.045em] sm:text-[4.4rem]" style={{ "--ex": `color-mix(in srgb, ${p} 60%, #000)` } as CSSProperties}>
      <span className="text-white">{site.wordmark[0].trim()}</span>
      <span style={{ color: s }}>.</span>
      <br />
      <span style={{ color: p }}>{site.wordmark[1]}</span>
    </p>
  );
}

function Destination({ site, index }: { site: StreamSite; index: number }) {
  const { primary: p, secondary: s, ground } = site.theme;
  const host = displayHost(site.url);
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${site.name} at ${host} (opens in a new tab)`}
      className="sd-panel ch-fade-up group relative isolate flex min-h-[25rem] flex-col overflow-hidden rounded-lg border border-line sm:min-h-[28rem]"
      style={{ background: ground, "--p": p, "--s": s, animationDelay: `${120 + index * 110}ms` } as CSSProperties}
    >
      <Figure site={site} />
      {/* Brand edge: a rule that fills across the top on hover */}
      <span className="sd-edge absolute inset-x-0 top-0 h-[3px] origin-left" style={{ background: `linear-gradient(90deg, ${p}, ${s})` }} aria-hidden />

      <div className="relative flex items-start justify-between gap-4 p-6 sm:p-8">
        <div>
          <p className="font-display text-sm font-bold tracking-[0.12em] text-slate-500">No. {String(index + 1).padStart(2, "0")}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: `color-mix(in srgb, ${p} 70%, white)` }}>{site.label}</p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">External site</span>
      </div>

      <div className="relative mt-auto grid gap-6 p-6 pt-0 sm:p-8 sm:pt-0">
        <Wordmark site={site} />
        <div className="grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="max-w-md text-[15px] leading-relaxed text-slate-300">{site.description}</p>
            <p className="mt-2 text-sm text-slate-500">{host}</p>
          </div>
          <span className="sd-cta inline-flex h-11 w-fit items-center gap-3 rounded-md pl-4 pr-3 text-sm font-semibold text-slate-950" style={{ background: p }}>
            Visit {site.name}
            <span className="sd-cta-arrow flex h-7 w-7 items-center justify-center rounded bg-black/15">
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </span>
        </div>
      </div>
    </a>
  );
}

export default function StreamDirectory() {
  return (
    <div className="space-y-10">
      <Masthead
        index="01"
        kicker="Watch Live Matches"
        title={<>Explore football<br className="hidden sm:block" /> streams</>}
        intro="Your gateway to football match coverage across the web. Pick a destination below — it opens in a new tab."
        accent="#ff4b3a"
        aside={
          <div className="flex items-baseline gap-3 lg:flex-col lg:items-end lg:gap-1">
            <span className="font-display text-4xl font-bold leading-none text-white lg:text-5xl">{String(STREAM_SITES.length).padStart(2, "0")}</span>
            <span className="text-sm text-slate-500">destinations · each opens in a new tab</span>
          </div>
        }
      />

      <section aria-label="Football streaming websites" className="sd-row flex flex-col gap-4 lg:flex-row">
        {STREAM_SITES.map((s, i) => <Destination key={s.id} site={s} index={i} />)}
      </section>
    </div>
  );
}
