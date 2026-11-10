import Link from "next/link";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, MonitorPlay } from "lucide-react";
import Footer from "@/components/Footer";
import { TEAMS } from "@/data/big-clash/teams";
import { INDIAN_CREATORS, INTERNATIONAL_CREATORS } from "@/data/creators";
import { STREAM_SITES, displayHost } from "@/data/streamSites";
import { ARCHIVE, team, year } from "@/lib/big-clash/archive";
import { coverFor, todayUtc } from "@/lib/big-clash/cover";
import { LEAGUE_IDENTITY } from "@/lib/club-hub/leagueIdentity";
import { NEWS_PATH, sectionHref } from "@/lib/site";
import HeroBallSlot from "./HeroBallSlot";
import LandingNav from "./LandingNav";
import { LiveHeadlines, LiveTable } from "./LiveData";
import MotionDirector from "./MotionDirector";

/*
 * Football Hub's front door. Concept: "the floodlights come on" — a night stadium, a real 3D ball
 * in the light, and the platform's own content (crests, competitions, classic scorelines, creators)
 * drifting past in depth. Then the six experiences, each with its own visual language and real data
 * where it can be loaded reliably, and a closing call to every door.
 */

const VOLT = "#d4f53c";
const CLUBS = Object.values(TEAMS).filter((t) => !t.national);
const LEAGUES = Object.values(LEAGUE_IDENTITY);
const CREATORS = [...INDIAN_CREATORS, ...INTERNATIONAL_CREATORS];
const CLASSICS = ARCHIVE.filter((m) => m.categories.includes("greatest") || m.categories.includes("final")).slice(0, 12);

/** Above-the-fold images (the hero wall) load immediately; lazy-loading is unreliable inside 3D-transformed layers. */
const img = (src: string, alt: string, className: string, size: number, eager = false) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} width={size} height={size} loading={eager ? "eager" : "lazy"} decoding="async" className={className} draggable={false} />
);

/** A row that loops from right to left; the content is doubled for a seamless loop. */
function Drift({ children, dur, reverse = false, className = "" }: { children: ReactNode; dur: number; reverse?: boolean; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={`lp-track ${reverse ? "lp-reverse" : ""}`} style={{ "--dur": `${dur}s` } as CSSProperties}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero

function Floodlights() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {[
        { side: "left-[6%]", a0: "14deg", a1: "22deg", dur: "11s" },
        { side: "right-[6%]", a0: "-14deg", a1: "-22deg", dur: "13s" },
      ].map((b) => (
        <div key={b.side} className={`absolute -top-[6%] ${b.side}`}>
          {/* The lamp bank */}
          <div className="relative flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-1.5 w-3 rounded-full bg-[#fffbe6] shadow-[0_0_18px_6px_rgba(255,251,230,0.45)]" />
            ))}
          </div>
          {/* The beam */}
          <div
            className="lp-beam absolute left-1/2 top-1 h-[115vh] w-[46vw] max-w-[700px] -translate-x-1/2 mix-blend-screen blur-2xl"
            style={{
              // A cone of light that softens and spreads with distance.
              background: "radial-gradient(60% 100% at 50% 0%, rgba(255,251,230,0.22), rgba(255,251,230,0.06) 45%, transparent 75%)",
              clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)",
              ["--a0" as string]: b.a0,
              ["--a1" as string]: b.a1,
              animationDuration: b.dur,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function Pitch() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] [perspective:700px]" aria-hidden>
      <div className="lp-pitch absolute inset-x-[-30%] bottom-0 h-[260%] origin-bottom [transform:rotateX(74deg)] [mask-image:linear-gradient(to_top,black_20%,transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}

/** The content wall: three depths, three speeds, all moving right to left. */
function ContentWall() {
  const crest = (c: (typeof CLUBS)[number], size: string) => (
    <div key={c.name} className={`mx-2 flex shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.035] ${size}`}>
      {img(c.logo, c.name, "h-[62%] w-[62%] object-contain", 96, true)}
    </div>
  );
  // On phones the wall sits in the lower half, behind the ball, so it never runs under the text.
  return (
    <div className="pointer-events-none absolute -right-[12%] bottom-[2%] top-[52%] w-[118%] opacity-70 [perspective:1100px] lg:inset-y-[6%] lg:w-[88%] lg:opacity-100" aria-hidden>
      <div className="flex h-full flex-col justify-center gap-5 [transform:rotateY(-24deg)_rotateX(7deg)] [transform-style:preserve-3d] [mask-image:linear-gradient(to_right,transparent,black_28%,black_86%,transparent)]">
        {/* Far: club crests, small and slow */}
        <Drift dur={140} className="opacity-30 blur-[1px]">
          {CLUBS.map((c) => crest(c, "h-14 w-14"))}
        </Drift>
        {/* Middle: competitions and classic scorelines */}
        <Drift dur={95} className="opacity-60">
          {CLASSICS.map((m, i) => (
            <div key={m.slug} className="flex shrink-0">
              {i % 2 === 0 && LEAGUES[(i / 2) % LEAGUES.length] && (
                <div className="mx-2 flex h-20 w-20 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04]">
                  {img(LEAGUE_IDENTITY[LEAGUES[(i / 2) % LEAGUES.length].id].logo, LEAGUES[(i / 2) % LEAGUES.length].name, "h-12 w-12 object-contain", 48, true)}
                </div>
              )}
              <div className="mx-2 flex h-20 shrink-0 flex-col justify-center rounded-md border border-white/[0.07] bg-white/[0.035] px-4">
                <p className="font-display text-2xl font-extrabold leading-none text-[#efe4cc]">
                  {team(m.home).short} {m.score[0]}–{m.score[1]} {team(m.away).short}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {year(m)} · {m.competition}
                </p>
              </div>
            </div>
          ))}
        </Drift>
        {/* Near: creators and the biggest crests, larger and faster */}
        <Drift dur={70} className="opacity-90">
          {CREATORS.map((c, i) => (
            <div key={c.id} className="flex shrink-0">
              <div className="mx-2 h-24 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-panel">{img(c.avatar, c.name, "h-full w-full object-cover", 96, true)}</div>
              {CLUBS[i] && crest(CLUBS[i], "h-24 w-24")}
            </div>
          ))}
        </Drift>
      </div>
    </div>
  );
}

const ROTATOR = ["live matches.", "your club.", "Champions League nights.", "the biggest stories.", "the classics.", "the creators.", "live matches."];

function Hero() {
  const stats = [
    [String(LEAGUES.length), "leagues"],
    ["6", "experiences"],
    [String(ARCHIVE.length), "classic matches"],
    [String(CREATORS.length), "creators"],
  ];
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="lp-title">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_70%_10%,#1b2116_0%,#0d0f12_45%,#0b0c0f_75%)]" aria-hidden />
      <Floodlights />
      <ContentWall />
      <Pitch />
      {/* Keep the type side quiet so the headline reads first. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#0b0c0f_0%,rgba(11,12,15,0.86)_34%,rgba(11,12,15,0.15)_62%,transparent)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,15,0.9)_0%,rgba(11,12,15,0.55)_55%,rgba(11,12,15,0.2))]" aria-hidden />
      {/* Motes in the floodlight */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="lp-mote absolute h-1 w-1 rounded-full bg-[#fffbe6]/40"
            style={{ left: `${(i * 37) % 100}%`, top: `${10 + ((i * 53) % 60)}%`, ["--t" as string]: `${7 + (i % 5) * 2}s`, opacity: 0.2 + (i % 4) * 0.12 }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-60px)] max-w-7xl items-center gap-6 px-4 pb-16 pt-12 sm:px-6 lg:min-h-[min(calc(100svh-60px),920px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8 lg:pb-20">
        <div data-parallax style={{ "--py": "-60px" } as CSSProperties}>
          <p className="kicker lp-fade flex items-center gap-3" style={{ "--d": "0.05s" } as CSSProperties}>
            <span className="h-px w-8 bg-volt" aria-hidden />
            Six experiences · one home for the game
          </p>
          <h1 id="lp-title" aria-label="Football Hub" className="mt-5 font-display font-extrabold uppercase leading-[0.8] tracking-[-0.01em] text-white [perspective:600px]">
            <span className="block overflow-hidden pb-1 text-[clamp(4.2rem,15vw,10.5rem)]" aria-hidden>
              {"FOOTBALL".split("").map((ch, i) => (
                <span key={i} className="lp-letter" style={{ "--i": i } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="lp-wipe block text-[clamp(4.2rem,15vw,10.5rem)] text-volt" aria-hidden>
              HUB
            </span>
          </h1>
          <p className="lp-fade mt-6 max-w-xl text-lg text-slate-300 sm:text-xl" style={{ "--d": "0.9s" } as CSSProperties}>
            Every side of the beautiful game.
            <span className="mt-1 flex flex-col text-slate-400 sm:flex-row sm:items-baseline sm:gap-2">
              <span className="sr-only">Your home for live matches, your club, Champions League nights, the biggest stories, the classics and the creators.</span>
              <span aria-hidden className="whitespace-nowrap">Your home for</span>
              <span className="relative inline-block h-[1.5em] overflow-hidden align-bottom font-semibold text-white" aria-hidden>
                <span className="lp-words flex flex-col">
                  {ROTATOR.map((w, i) => (
                    <span key={i} className="h-[1.5em] whitespace-nowrap">
                      {w}
                    </span>
                  ))}
                </span>
              </span>
            </span>
          </p>
          <div className="lp-fade mt-9 flex flex-wrap gap-3" style={{ "--d": "1.1s" } as CSSProperties}>
            <a href="#experiences" className="inline-flex h-12 items-center gap-2 rounded-md bg-volt px-6 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-[0_18px_40px_-18px_rgba(212,245,60,0.7)] transition hover:bg-white">
              Explore Football Hub <ArrowDown className="h-4 w-4" />
            </a>
            <Link href={sectionHref("live")} className="inline-flex h-12 items-center gap-2 rounded-md border border-white/20 bg-white/[0.03] px-6 text-sm font-bold uppercase tracking-wide text-white backdrop-blur transition hover:border-white/50">
              <MonitorPlay className="h-4 w-4" /> Watch Live Matches
            </Link>
          </div>
          <dl className="lp-fade mt-10 flex flex-wrap gap-x-8 gap-y-3" style={{ "--d": "1.3s" } as CSSProperties}>
            {stats.map(([n, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dd className="font-display text-3xl font-bold leading-none text-white">{n}</dd>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* The ball, hanging in the light above its shadow on the grass */}
        <div className="relative mx-auto flex w-full max-w-[460px] items-center justify-center lg:max-w-none" data-parallax style={{ "--py": "90px" } as CSSProperties}>
          <div className="absolute aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,rgba(212,245,60,0.16),transparent_62%)] blur-2xl" aria-hidden />
          <div className="lp-fade relative w-[min(72vw,440px)]" style={{ "--d": "0.4s" } as CSSProperties}>
            <div className="lp-bob">
              <HeroBallSlot />
            </div>
            <div className="lp-shadow mx-auto mt-4 h-6 w-[60%] rounded-[50%] bg-black/70 blur-md" aria-hidden />
          </div>
        </div>
      </div>

      <a href="#experiences" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:text-white sm:flex">
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <span className="lp-cue absolute inset-0 bg-volt" />
        </span>
      </a>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The guide: one statement, and a plain-language index of the six experiences

const GUIDE = [
  { n: "01", id: "live", name: "Watch Live Matches", line: "Two external football streaming directories, one tap away." },
  { n: "02", id: "club", name: "Club Hub", line: "Your clubs across five leagues: fixtures, results, tables, squads and news." },
  { n: "03", id: "ucl", name: "UEFA Champions League", line: "Standings, fixtures, the knockout bracket and the top-stats race." },
  { n: "04", id: "news", name: "TimesOfFootball", line: "The football stories everyone is talking about, refreshed through the day." },
  { n: "05", id: "big", name: "Big Clash", line: "Football's greatest matches, with a new cover story every day." },
  { n: "06", id: "creators", name: "Creators", line: "The best football channels from India and around the world." },
];

function Statement() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32" aria-labelledby="lp-statement">
      <div className="space-y-1 font-display font-extrabold uppercase leading-[0.85]" aria-hidden>
        <p data-parallax className="whitespace-nowrap text-[clamp(4rem,12vw,11rem)] text-white" style={{ "--px": "-14vw" } as CSSProperties}>
          One game. One game. One game.
        </p>
        <p data-parallax className="lp-outline whitespace-nowrap text-[clamp(4rem,12vw,11rem)] [-webkit-text-stroke-color:rgba(212,245,60,0.5)]" style={{ "--px": "14vw", marginLeft: "-30vw" } as CSSProperties}>
          Six experiences. Six experiences.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:px-8">
        <div data-reveal>
          <h2 id="lp-statement" className="font-display text-4xl font-extrabold uppercase leading-[0.95] text-white sm:text-5xl">
            One game.
            <br />
            <span className="text-volt">Six experiences.</span>
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-slate-400">
            Football Hub brings together everything a fan reaches for on matchday and in between: where to watch, how your club is doing, the Champions League race, the
            day&apos;s big stories, the matches that made history and the people who talk about the game best.
          </p>
        </div>
        <ol className="border-t border-line">
          {GUIDE.map((g, i) => (
            <li key={g.id} data-reveal style={{ "--d": `${i * 70}ms` } as CSSProperties}>
              <a href={`#exp-${g.id}`} className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line py-4 transition hover:bg-white/[0.02] sm:grid-cols-[4rem_minmax(0,14rem)_minmax(0,1fr)_auto]">
                <span className="font-display text-2xl font-bold text-slate-600 transition group-hover:text-volt">{g.n}</span>
                <span className="font-display text-xl font-bold uppercase text-white">{g.name}</span>
                <span className="col-span-2 col-start-2 text-sm text-slate-400 sm:col-span-1 sm:col-start-auto">{g.line}</span>
                <ArrowDown className="hidden h-4 w-4 text-slate-500 transition group-hover:translate-y-0.5 group-hover:text-white sm:block" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The six experiences: an asymmetric editorial composition, each with its own visual language.

function Experience({
  id,
  n,
  name,
  title,
  body,
  features,
  cta,
  href,
  accent,
  className = "",
  delay = 0,
  children,
}: {
  id: string;
  n: string;
  name: string;
  title: string;
  body: string;
  features: string[];
  cta: string;
  href: string;
  accent: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <article
      id={`exp-${id}`}
      data-reveal
      data-tilt
      className={`lp-tile group relative flex scroll-mt-24 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0f1013] ${className}`}
      style={{ "--d": `${delay}ms` } as CSSProperties}
      aria-labelledby={`exp-${id}-title`}
    >
      <div className="relative min-h-[18rem] flex-1 overflow-hidden sm:min-h-[22rem]">{children}</div>
      <div className="relative border-t border-white/[0.06] p-6 sm:p-8">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          <span className="font-display text-base tracking-[0.08em]">{n}</span>
          <span className="h-px w-6 opacity-60" style={{ background: accent }} aria-hidden />
          {name}
        </p>
        <h3 id={`exp-${id}-title`} className="mt-3 font-display text-3xl font-extrabold uppercase leading-[0.92] text-white sm:text-4xl">
          {title}
        </h3>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-400">{body}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-300">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full" style={{ background: accent }} aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <Link href={href} className="lp-tile-cta mt-6 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold uppercase tracking-wide text-slate-950 transition hover:brightness-110" style={{ background: accent }}>
          {cta} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function WatchLiveVisual() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,#20271a,#0d0f12_70%)]">
      <div className="absolute inset-x-0 top-0 h-full [perspective:500px]" aria-hidden>
        <div className="lp-pitch absolute inset-x-[-40%] bottom-0 h-[230%] origin-bottom opacity-80 [transform:rotateX(70deg)] [mask-image:linear-gradient(to_top,black_10%,transparent_75%)]" />
      </div>
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,251,230,0.18),transparent)]" aria-hidden />
      {/* Broadcast-style plates naming the two real destinations */}
      <div className="absolute inset-x-5 bottom-6 space-y-2.5 sm:inset-x-8">
        {STREAM_SITES.map((s, i) => (
          <div key={s.id} className="lp-plate flex items-stretch overflow-hidden rounded-sm shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]" style={{ "--d": `${0.35 + i * 0.18}s` } as CSSProperties}>
            <span className="flex items-center px-3 font-display text-sm font-extrabold uppercase tracking-wide text-slate-950" style={{ background: s.theme.primary }}>
              0{i + 1}
            </span>
            <span className="flex flex-1 items-center justify-between gap-3 bg-[#0b0c0f]/90 px-4 py-2.5 backdrop-blur">
              <span className="font-display text-xl font-extrabold uppercase italic text-white">{s.name}</span>
              <span className="text-[11px] text-slate-400">{displayHost(s.url)} · external site</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClubHubVisual() {
  const row = (start: number, n: number) => CLUBS.slice(start, start + n).concat(CLUBS.slice(0, Math.max(0, start + n - CLUBS.length)));
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#141a12,#0d0f12_60%)]">
      <div className="absolute inset-0 -rotate-6 scale-125 space-y-4 pt-6 opacity-80 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" aria-hidden>
        {[
          [0, 10, 46, false],
          [8, 10, 60, true],
          [16, 10, 52, false],
        ].map(([s, n, dur, rev], i) => (
          <Drift key={i} dur={dur as number} reverse={rev as boolean}>
            {row(s as number, n as number).map((c) => (
              <div key={c.name} className="mx-2.5 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03]">
                {img(c.logo, c.name, "h-11 w-11 object-contain", 44)}
              </div>
            ))}
          </Drift>
        ))}
      </div>
      {/* The five leagues */}
      <div className="absolute left-5 top-5 flex gap-2 sm:left-8">
        {LEAGUES.map((l) => (
          <span key={l.id} className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#0b0c0f]/80 p-1.5 backdrop-blur" title={l.name}>
            {img(l.logo, l.name, "h-full w-full object-contain", 28)}
          </span>
        ))}
      </div>
      {/* The real table, right now */}
      <div className="absolute bottom-5 right-5 sm:right-8" data-parallax style={{ "--py": "-30px" } as CSSProperties}>
        <Suspense fallback={null}>
          <LiveTable />
        </Suspense>
      </div>
    </div>
  );
}

function ChampionsVisual() {
  const stars = Array.from({ length: 10 });
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(80%_90%_at_70%_30%,#16224a,#0a0e1f_55%,#07080d)]">
      {/* A field of stars */}
      <div className="absolute inset-0" aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="lp-twinkle absolute h-[2px] w-[2px] rounded-full bg-white"
            style={{ left: `${(i * 29) % 100}%`, top: `${(i * 47) % 100}%`, ["--t" as string]: `${2 + (i % 5)}s`, ["--d" as string]: `${(i % 7) * 0.4}s` }}
          />
        ))}
      </div>
      {/* Orbits and a turning ring of stars: a night of European football, not a logo */}
      <svg className="absolute -right-16 top-1/2 h-[135%] -translate-y-1/2 sm:right-0" viewBox="0 0 400 400" fill="none" aria-hidden>
        {[70, 110, 150, 190].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} stroke="#c9d3e6" strokeOpacity={0.16 - i * 0.03} strokeDasharray={i % 2 ? "2 6" : undefined} />
        ))}
        <g className="lp-spin" style={{ transformOrigin: "200px 200px", ["--dur" as string]: "80s" }}>
          {stars.map((_, i) => {
            const a = (i / stars.length) * Math.PI * 2;
            const x = 200 + Math.cos(a) * 130, y = 200 + Math.sin(a) * 130;
            const pts = Array.from({ length: 10 }, (_, k) => {
              const rr = k % 2 ? 4 : 10;
              const t = (Math.PI / 5) * k - Math.PI / 2;
              return `${(x + rr * Math.cos(t)).toFixed(1)},${(y + rr * Math.sin(t)).toFixed(1)}`;
            }).join(" ");
            return <polygon key={i} points={pts} fill="#e7ecf7" fillOpacity={0.85} />;
          })}
        </g>
        <circle cx="200" cy="200" r="46" fill="url(#lp-ucl-glow)" />
        <defs>
          <radialGradient id="lp-ucl-glow">
            <stop offset="0" stopColor="#c9d3e6" stopOpacity="0.5" />
            <stop offset="1" stopColor="#c9d3e6" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <div className="absolute left-5 top-6 space-y-2 sm:left-8" aria-hidden>
        {["Standings", "Fixtures & results", "Knockout bracket", "Top scorers", "Top assists", "Clean sheets"].map((t, i) => (
          <p key={t} className="lp-plate font-display text-lg font-bold uppercase tracking-wide text-[#c9d3e6]" style={{ "--d": `${0.3 + i * 0.09}s`, opacity: 1 - i * 0.1 } as CSSProperties}>
            {t}
          </p>
        ))}
      </div>
    </div>
  );
}

function NewsVisual() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#0d1418,#0b0c0f)]">
      <p className="absolute -left-2 top-3 font-display text-[5.5rem] font-extrabold uppercase leading-none text-white/[0.04]" aria-hidden>
        News
      </p>
      <div className="absolute inset-x-5 bottom-14 top-5 sm:inset-x-8">
        <Suspense fallback={<p className="pt-10 text-sm text-slate-500">Loading today&apos;s stories…</p>}>
          <LiveHeadlines />
        </Suspense>
      </div>
      <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.07] bg-[#5ad1ff] py-2 text-slate-950" aria-hidden>
        <Drift dur={36}>
          {["Transfers", "Big matches", "Managers", "Awards & records", "Injuries", "International", "Retirements", "Transfers", "Big matches", "Managers"].map((t, i) => (
            <span key={i} className="mx-4 font-display text-sm font-extrabold uppercase tracking-[0.12em]">
              {t} <span className="ml-4 opacity-40">/</span>
            </span>
          ))}
        </Drift>
      </div>
    </div>
  );
}

function BigClashVisual() {
  const cover = coverFor(todayUtc()).match;
  const reel = [cover, ...CLASSICS.filter((m) => m.slug !== cover.slug).slice(0, 3)];
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#14120f]">
      <div className="lp-cycle absolute inset-0">
        {reel.map((m, i) => {
          const h = team(m.home), a = team(m.away);
          return (
            <div key={m.slug} className="absolute inset-0 opacity-0" style={{ background: `linear-gradient(110deg, color-mix(in srgb, ${h.color} 42%, #14120f) 0 50%, color-mix(in srgb, ${a.color} 42%, #14120f) 50% 100%)` }}>
              <p className="absolute -bottom-6 right-2 font-display text-[9rem] font-extrabold leading-none text-black/25 sm:text-[12rem]" aria-hidden>
                {year(m)}
              </p>
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff8a76]">{i === 0 ? "Today's cover story" : m.competition}</p>
                <div className="mt-3 flex items-center gap-4">
                  {img(h.logo, h.name, "h-12 w-12 object-contain drop-shadow-lg sm:h-16 sm:w-16", 64)}
                  <p className="font-display text-6xl font-extrabold leading-none text-white sm:text-7xl">
                    {m.score[0]}
                    <span className="mx-1 text-white/40">–</span>
                    {m.score[1]}
                  </p>
                  {img(a.logo, a.name, "h-12 w-12 object-contain drop-shadow-lg sm:h-16 sm:w-16", 64)}
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold uppercase leading-none text-[#efe4cc]">{m.title}</p>
                <p className="mt-1 text-xs text-white/60">
                  {h.name} v {a.name} · {year(m)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreatorsVisual() {
  const half = Math.ceil(CREATORS.length / 2);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(80%_80%_at_30%_20%,#2a1214,#0d0f12_70%)] [perspective:900px]">
      <div className="absolute -inset-x-1/4 -inset-y-1/2 flex justify-center gap-3 [transform:rotateX(48deg)_rotateZ(-28deg)] [transform-style:preserve-3d]" aria-hidden>
        {[0, 1, 2, 3].map((col) => {
          const list = (col % 2 ? CREATORS.slice(half) : CREATORS.slice(0, half)).slice(col % 2).concat(CREATORS.slice(0, col));
          return (
            <div key={col} className="w-24 overflow-hidden sm:w-28">
              <div className={`lp-track-y ${col % 2 ? "lp-reverse" : ""}`} style={{ "--dur": `${40 + col * 8}s` } as CSSProperties}>
                {[0, 1].map((dup) => (
                  <div key={dup} className="flex flex-col gap-3 pb-3">
                    {list.map((c) => (
                      <div key={c.id} className="aspect-square overflow-hidden rounded-md border border-white/10 bg-panel shadow-[0_20px_30px_-20px_rgba(0,0,0,0.9)]">
                        {img(c.avatar, "", "h-full w-full object-cover", 112)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(13,15,18,0.95),transparent)]" aria-hidden />
    </div>
  );
}

function Experiences() {
  return (
    <section id="experiences" className="relative mx-auto max-w-7xl scroll-mt-16 px-4 sm:px-6 lg:px-8" aria-labelledby="lp-experiences">
      <div data-reveal className="mb-10 flex flex-col justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-end">
        <h2 id="lp-experiences" className="font-display text-5xl font-extrabold uppercase leading-[0.9] text-white sm:text-6xl">
          Pick your <span className="text-volt">game.</span>
        </h2>
        <p className="max-w-sm text-sm text-slate-400">Six ways into football. Every panel opens the real thing.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Experience
          id="club"
          n="02"
          name="Club Hub"
          title="Your club. Every detail."
          body="Pick from five leagues and follow your clubs. Each club gets its own dashboard: next match, form, fixtures, results, the league table, squad and news, with match centres for every game."
          features={["5 leagues", "Follow your clubs", "Live league tables", "Fixtures & results", "Match centres", "Squads & news"]}
          cta="Explore Club Hub"
          href={sectionHref("club")}
          accent={VOLT}
          className="lg:col-span-7 lg:min-h-[640px]"
        >
          <ClubHubVisual />
        </Experience>
        <Experience
          id="live"
          n="01"
          name="Watch Live Matches"
          title="Matchday starts here."
          body="A directory of two external football streaming sites. Football Hub doesn't host or stream matches; it takes you straight to where the coverage is."
          features={["2 destinations", "Opens in a new tab"]}
          cta="Explore Watch Live"
          href={sectionHref("live")}
          accent="#ff6b4a"
          className="lg:col-span-5"
          delay={120}
        >
          <WatchLiveVisual />
        </Experience>
        <Experience
          id="news"
          n="04"
          name="TimesOfFootball"
          title="The stories everyone's talking about."
          body="Transfers, big-match drama, managers under pressure, records and farewells, chosen for what matters and refreshed through the day from established newsrooms."
          features={["Transfers: confirmed, reported, rumour", "Match stories", "Managers", "Retirements", "International"]}
          cta="Explore Football News"
          href={NEWS_PATH}
          accent="#5ad1ff"
          className="lg:col-span-5 lg:min-h-[620px]"
        >
          <NewsVisual />
        </Experience>
        <Experience
          id="ucl"
          n="03"
          name="UEFA Champions League"
          title="Under the lights of Europe."
          body="Follow the whole competition: the league-phase table, fixtures and results, the knockout bracket and the race for top scorer, top assists and clean sheets."
          features={["Standings", "Fixtures & results", "Knockout bracket", "Top scorers", "Top assists", "Clean sheets"]}
          cta="Explore Champions League"
          href={sectionHref("ucl")}
          accent="#c9d3e6"
          className="lg:col-span-7"
          delay={120}
        >
          <ChampionsVisual />
        </Experience>
        <Experience
          id="big"
          n="05"
          name="Big Clash"
          title="The matches that made history."
          body="Legendary finals, impossible comebacks and the great rivalries, each told with the score, the moments and official highlights. Your clubs' classics are one tap away, and there's a new cover story every day."
          features={[`${ARCHIVE.length} historic matches`, "Finals & comebacks", "Rivalries", "Your clubs' classics", "Daily cover story"]}
          cta="Relive the Classics"
          href={sectionHref("big")}
          accent="#ff6a52"
          className="lg:col-span-7 lg:min-h-[600px]"
        >
          <BigClashVisual />
        </Experience>
        <Experience
          id="creators"
          n="06"
          name="Creators"
          title="The voices of the game."
          body="A hand-picked guide to the football channels worth following, from Indian football's best to the biggest international names, each opening straight on YouTube."
          features={[`${INDIAN_CREATORS.length} Indian creators`, `${INTERNATIONAL_CREATORS.length} international creators`, "Opens on YouTube"]}
          cta="Discover Creators"
          href={sectionHref("creators")}
          accent="#ff4d6d"
          className="lg:col-span-5"
          delay={120}
        >
          <CreatorsVisual />
        </Experience>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Closing

function Closing() {
  const doors = GUIDE.map((g) => ({ ...g, href: sectionHref(g.id) }));
  return (
    <section className="relative mt-32 overflow-hidden border-t border-line pt-20" aria-labelledby="lp-closing">
      <div aria-hidden className="mb-14">
        <Drift dur={60}>
          {doors.map((d) => (
            <span key={d.id} className="lp-outline mx-6 whitespace-nowrap font-display text-[clamp(3.5rem,9vw,8rem)] font-extrabold uppercase leading-none">
              {d.name} <span className="text-volt [-webkit-text-stroke:0]">·</span>
            </span>
          ))}
        </Drift>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:px-8">
        <div data-reveal>
          <h2 id="lp-closing" className="font-display text-5xl font-extrabold uppercase leading-[0.9] text-white sm:text-6xl">
            The game never stops.
            <br />
            <span className="text-volt">Neither do we.</span>
          </h2>
          <p className="mt-5 max-w-md text-slate-400">Pick a door. Everything on Football Hub is one tap from here.</p>
        </div>
        <nav aria-label="Football Hub sections" className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {doors.map((d, i) => (
            <Link key={d.id} href={d.href} data-reveal style={{ "--d": `${i * 60}ms` } as CSSProperties} className="group flex items-center justify-between gap-4 bg-ink px-5 py-5 transition hover:bg-panel">
              <span>
                <span className="block font-display text-sm font-bold text-slate-600 group-hover:text-volt">{d.n}</span>
                <span className="block font-display text-xl font-bold uppercase text-white">{d.name}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div data-landing className="min-h-screen overflow-x-clip bg-ink text-slate-100">
      <LandingNav />
      <main>
        <Hero />
        <Statement />
        <Experiences />
        <Closing />
      </main>
      <Footer />
      <MotionDirector />
    </div>
  );
}
