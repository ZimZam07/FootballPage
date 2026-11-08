"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { ExternalLink, HeartPulse, Search, Users } from "lucide-react";
import { formatDate, useApi } from "@/lib/club-hub/client";
import type { ClubRef, Player, Squad } from "@/lib/club-hub/types";
import { ErrorState, Modal, SafeImg, Skeleton, StateMessage } from "./ui";

const GROUPS = ["Goalkeepers", "Defenders", "Midfielders", "Forwards", "Other"] as const;
type Filter = "All" | (typeof GROUPS)[number];

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** No headshot: a drawn silhouette in the frame, with the player's initials on the shirt. */
function Silhouette({ player, size }: { player: Player; size: string }) {
  return (
    <div className={`${size} relative`} aria-label={player.name}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="34" r="17" fill="rgb(255 255 255 / 0.16)" />
        <path d="M14 100c2-22 17-34 36-34s34 12 36 34z" fill="rgb(255 255 255 / 0.16)" />
      </svg>
      <span className="absolute inset-x-0 bottom-[12%] text-center font-display text-sm font-bold tracking-wider text-white/45">{initials(player.name)}</span>
    </div>
  );
}

function Avatar({ player, size = "h-16 w-16" }: { player: Player; size?: string }) {
  const fallback = <Silhouette player={player} size={size} />;
  return <SafeImg src={player.headshot} alt={player.name} className={`${size} object-cover object-top`} fallback={fallback} />;
}

const KEY_STATS: Record<string, string[]> = {
  Goalkeepers: ["appearances", "saves", "goalsConceded"],
  default: ["appearances", "totalGoals", "goalAssists"],
};
const SHORT: Record<string, string> = {
  appearances: "Apps", totalGoals: "Goals", goalAssists: "Assists", saves: "Saves", goalsConceded: "Conceded",
};

/** Squad-sheet card: headshot on a club-colour panel, shirt number set large, key numbers below. */
function PlayerCard({ p, accent, onOpen, delay }: { p: Player; accent: string; onOpen: () => void; delay: number }) {
  const keys = KEY_STATS[p.positionGroup] ?? KEY_STATS.default;
  const stats = keys.map((k) => p.stats.find((s) => s.key === k)).filter(Boolean);
  return (
    <div className="ch-fade-up h-full" style={{ animationDelay: `${delay}ms` }}>
      <button onClick={onOpen} className="ch-player group flex h-full w-full flex-col overflow-hidden rounded-md border border-line bg-panel text-left" style={{ "--club": accent } as CSSProperties}>
        <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 42%, #16181c), #121418 80%)` }}>
          <span className="pointer-events-none absolute -left-1 -top-3 select-none font-display text-[6.5rem] font-extrabold leading-none text-white/[0.09]">{p.jersey ?? ""}</span>
          <div className="ch-player-photo absolute bottom-0 right-3 h-32 w-32">
            <Avatar player={p} size="h-32 w-32" />
          </div>
          {p.injury && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-sm bg-[#ff4b3a] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <HeartPulse className="h-3 w-3" /> Injured
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start gap-3">
            {p.jersey && <span className="font-display text-2xl font-bold leading-none ch-accent-text" style={{ ["--accent" as string]: accent }}>{p.jersey}</span>}
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight text-white">{p.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{p.position}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            {p.flag && <SafeImg src={p.flag} alt="" className="h-3 w-4 rounded-[1px] object-cover" fallback={null} />}
            <span className="truncate">{p.nationality ?? "—"}</span>
            {p.age != null && <><span className="opacity-40">·</span><span>{p.age} yrs</span></>}
          </div>
          {p.injury && <p className="mt-2 text-xs text-[#ff8a7d]">{p.injury}</p>}
          {stats.length > 0 && (
            <div className="mt-auto grid grid-cols-3 divide-x divide-line border-t border-line pt-3">
              {stats.map((s) => (
                <div key={s!.key} className="px-2 text-center first:pl-0 last:pr-0">
                  <p className="font-display text-xl font-bold tabular-nums leading-none text-white">{s!.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{SHORT[s!.key] ?? s!.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function PlayerDetail({ p, accent, season }: { p: Player; accent: string; season: string | null }) {
  const bio = [
    ["Position", p.position],
    ["Shirt number", p.jersey ? `#${p.jersey}` : null],
    ["Nationality", p.nationality],
    ["Age", p.age != null ? String(p.age) : null],
    ["Date of birth", p.dateOfBirth ? formatDate(p.dateOfBirth, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null],
    ["Birthplace", p.birthPlace],
    ["Height", p.height],
    ["Weight", p.weight],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="space-y-7">
      <div className="flex items-end gap-5 border-b border-line pb-5">
        <div className="overflow-hidden rounded-md" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 45%, #16181c), #121418)` }}>
          <Avatar player={p} size="h-28 w-28" />
        </div>
        <div className="min-w-0 pb-1">
          {p.jersey && <p className="font-display text-3xl font-bold leading-none ch-accent-text" style={{ ["--accent" as string]: accent }}>#{p.jersey}</p>}
          <p className="mt-1 font-display text-3xl font-extrabold uppercase leading-none text-white sm:text-4xl">{p.name}</p>
          <p className="mt-1 text-slate-400">{p.position}</p>
          {p.injury && <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#ff8a7d]"><HeartPulse className="h-4 w-4" /> {p.injury}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        {bio.map(([k, v]) => (
          <div key={k} className="border-b border-line py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{k}</dt>
            <dd className="mt-0.5 font-medium leading-snug text-white">{v}</dd>
          </div>
        ))}
      </dl>
      {p.stats.length > 0 ? (
        <div>
          <p className="kicker mb-3">{season ? `${season} · league stats` : "Season stats"}</p>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
            {p.stats.map((s) => (
              <div key={s.key} className="bg-panel p-3">
                <p className="font-display text-3xl font-bold tabular-nums leading-none text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No league statistics recorded for this player this season.</p>
      )}
      {p.profileUrl && (
        <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white underline-offset-4 hover:underline">
          Full profile on ESPN <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

export default function PlayersView({ club, accent }: { club: ClubRef; accent: string }) {
  const { data, error, loading, retry } = useApi<Squad>(`/api/club-hub/squad?league=${club.league}&team=${club.id}`);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);
  const close = useCallback(() => setSelected(null), []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const players = (data?.players ?? []).filter(
      (p) => (filter === "All" || p.positionGroup === filter) && (!q || p.name.toLowerCase().includes(q) || p.jersey === q),
    );
    return GROUPS.map((g) => ({
      group: g,
      players: players.filter((p) => p.positionGroup === g).sort((a, b) => Number(a.jersey ?? 999) - Number(b.jersey ?? 999)),
    })).filter((g) => g.players.length);
  }, [data, filter, query]);

  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
      </div>
    );
  }
  if (!data.players.length) return <StateMessage icon={<Users className="h-5 w-5" />} title="Squad not available" message="The data provider has not published this club's squad." />;

  const present = GROUPS.filter((g) => data.players.some((p) => p.positionGroup === g));

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="ch-scrollbar-none -mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
          {(["All", ...present] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative -mb-px shrink-0 pb-3 text-sm font-semibold transition-colors ${filter === f ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
            >
              {f}
              <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left transition-transform duration-300 ${filter === f ? "scale-x-100" : "scale-x-0"}`} style={{ background: accent }} />
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or number…"
            aria-label="Search players"
            className="h-10 w-full rounded-md border border-line bg-white/[0.02] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <StateMessage icon={<Search className="h-5 w-5" />} title="No players match" message="Try a different name or position." />
      ) : (
        groups.map((g) => (
          <section key={g.group}>
            <h4 className="rule-after mb-4 font-display text-xl font-bold uppercase tracking-wide text-white">
              {g.group} <span className="font-display text-base text-slate-500">{g.players.length}</span>
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.players.map((p, i) => (
                <PlayerCard key={p.id} p={p} accent={accent} onOpen={() => setSelected(p)} delay={Math.min(i, 10) * 30} />
              ))}
            </div>
          </section>
        ))
      )}

      <p className="text-xs text-slate-500">Squad and {data.season ?? "season"} league statistics from ESPN.</p>

      <Modal open={Boolean(selected)} onClose={close} title="Player profile">
        {selected && <PlayerDetail p={selected} accent={accent} season={data.season} />}
      </Modal>
    </div>
  );
}
