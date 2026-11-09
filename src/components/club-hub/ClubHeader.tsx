"use client";

import type { CSSProperties } from "react";
import { ChevronLeft, Star } from "lucide-react";
import { competitionLabel, useFavorites } from "@/lib/club-hub/client";
import type { ClubRef } from "@/lib/club-hub/types";
import { LeagueLogo } from "./LeagueIdentity";
import { Skeleton, TeamLogo } from "./ui";

export type ClubView = "overview" | "matches" | "news" | "standings" | "players";

export const VIEWS: { id: ClubView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "matches", label: "Matches" },
  { id: "news", label: "News" },
  { id: "standings", label: "Standings" },
  { id: "players", label: "Players" },
];

/** "3rd in Spanish LALIGA" -> "3rd in LALIGA · La Liga", without repeating the league name. */
function formatSummary(summary: string | null, leagueName: string) {
  const s = summary ? competitionLabel(summary.replace(/ in (English|Spanish|Italian|German|French) /, " in ")) : null;
  if (!s) return leagueName;
  const squash = (t: string) => t.toLowerCase().replace(/\s/g, "");
  return squash(s).includes(squash(leagueName)) ? s : `${s} · ${leagueName}`;
}

/** Club colour as readable text on the dark page. */
const onDark = (c: string) => `color-mix(in srgb, ${c} 55%, white)`;

export default function ClubHeader({
  club,
  leagueName,
  standingSummary,
  accent,
  view,
  onView,
  onBack,
  onSwitch,
}: {
  club: ClubRef;
  leagueName: string;
  standingSummary: string | null | undefined;
  accent: string;
  view: ClubView;
  onView: (v: ClubView) => void;
  onBack: () => void;
  onSwitch: (c: ClubRef) => void;
}) {
  const { favorites, isFavorite, toggle } = useFavorites();
  const followed = isFavorite(club.id);
  const others = favorites.filter((f) => f.id !== club.id);

  return (
    <div className="ch-fade-up" style={{ "--club": accent } as CSSProperties}>
      {/* Club band: the club's colour washes in from the left, crest set large */}
      <div className="ch-band relative -mx-4 -mt-8 overflow-hidden border-b border-line px-4 pb-0 pt-6 sm:-mx-6 sm:-mt-10 sm:px-6 lg:-mx-8 lg:px-8">
        <TeamLogo src={club.logo} name="" className="pointer-events-none absolute -right-16 top-1/2 h-80 w-80 -translate-y-1/2 opacity-[0.06] sm:right-4" />

        <div className="relative flex items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white">
            <ChevronLeft className="h-4 w-4" /> All clubs
          </button>
          <button
            onClick={() => toggle(club)}
            aria-pressed={followed}
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-sm font-semibold transition ${
              followed ? "border-amber-400/40 bg-amber-400/10 text-amber-200" : "border-white/15 text-white hover:border-white/30"
            }`}
          >
            <Star className={`h-4 w-4 ${followed ? "fill-amber-400 text-amber-400" : ""}`} />
            {followed ? "Following" : "Follow"}
          </button>
        </div>

        <div className="relative mt-6 flex items-center gap-5 sm:gap-7">
          <TeamLogo src={club.logo} name={club.name} className="h-16 w-16 drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)] sm:h-24 sm:w-24" />
          <div className="min-w-0">
            <p className="kicker flex items-center gap-2" style={{ color: onDark(accent) }}>
              <LeagueLogo league={club.league} className="h-4 w-4" />
              {leagueName}
            </p>
            <h2 className="mt-1 truncate font-display text-4xl font-extrabold uppercase leading-[0.9] text-white sm:text-6xl">{club.name}</h2>
            <div className="mt-2 text-sm text-slate-300">
              {standingSummary === undefined ? <Skeleton className="h-5 w-48" /> : <span>{formatSummary(standingSummary, leagueName)}</span>}
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <div className="relative mt-5 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Switch</span>
            <div className="ch-scrollbar-none flex gap-1 overflow-x-auto">
              {others.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onSwitch(f)}
                  title={f.name}
                  aria-label={`Switch to ${f.name}`}
                  className="shrink-0 rounded-md border border-transparent p-1.5 transition hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <TeamLogo src={f.logo} name={f.name} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section tabs, sitting on the band's base line */}
        <nav className="ch-scrollbar-none relative mt-6 flex gap-7 overflow-x-auto" aria-label="Club sections">
          {VIEWS.map((v) => {
            const active = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onView(v.id)}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 pb-3.5 text-sm font-semibold transition-colors ${active ? "text-white" : "text-slate-400 hover:text-slate-100"}`}
              >
                {v.label}
                <span className={`absolute inset-x-0 bottom-0 h-[3px] origin-left transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} style={{ background: accent }} />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
