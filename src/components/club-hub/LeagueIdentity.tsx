"use client";

import type { CSSProperties } from "react";
import { leagueIdentity, seasonLabel } from "@/lib/club-hub/leagueIdentity";
import { SafeImg } from "./ui";

/** The league's official mark, never stretched; falls back to its initials if the file can't load. */
export function LeagueLogo({ league, className = "h-5 w-5", style }: { league: string; className?: string; style?: CSSProperties }) {
  const id = leagueIdentity(league);
  if (!id) return null;
  const initials = id.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
  return (
    <SafeImg
      src={id.logo}
      alt=""
      className={`${className} shrink-0 object-contain`}
      fallback={
        <span className={`${className} inline-flex shrink-0 items-center justify-center rounded-sm bg-white/[0.06] font-display text-[10px] font-bold text-slate-300`} style={style} aria-hidden>
          {initials}
        </span>
      }
    />
  );
}

/**
 * League identity block: the official logo on a softly lit tile beside the league name, with an
 * optional kicker and season. `lg` heads the league standings; `md` heads a club's standings tab.
 */
export function LeagueIdentity({
  league,
  size = "lg",
  kicker,
  season,
  titleId,
}: {
  league: string;
  size?: "md" | "lg";
  kicker?: string;
  season?: string | null;
  titleId?: string;
}) {
  const id = leagueIdentity(league);
  if (!id) return null;
  const tile = size === "lg" ? "h-14 w-14 sm:h-16 sm:w-16 p-2 sm:p-2.5" : "h-11 w-11 p-1.5";
  const label = seasonLabel(season);
  return (
    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
      {/* Keyed by league so the mark re-enters (and never lingers) when the league changes. */}
      <span
        key={id.id}
        className={`ch-pop relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 ${tile}`}
        style={{
          background: "linear-gradient(150deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.12))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 24px -14px rgba(0,0,0,0.85)",
        }}
      >
        <LeagueLogo league={id.id} className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)]" />
        <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: id.primary }} aria-hidden />
      </span>
      <div className="min-w-0">
        {kicker && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: id.ink }}>
            {kicker}
          </p>
        )}
        <h3 id={titleId} className={`truncate font-display font-bold uppercase leading-none tracking-wide text-white ${size === "lg" ? "mt-1 text-3xl" : "text-2xl"}`}>
          {id.name}
        </h3>
        {/* The large header reserves the season line while it loads, so nothing shifts. */}
        {(label || size === "lg") && <p className={`text-slate-400 ${size === "lg" ? "mt-1.5 text-sm" : "mt-1 text-xs"}`}>{label ? `${label} season` : " "}</p>}
      </div>
    </div>
  );
}
