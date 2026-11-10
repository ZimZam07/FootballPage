import Image from "next/image";
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
import LandingNav from "./LandingNav";
import { LiveHeadlines, LiveTable } from "./LiveData";
import MotionDirector from "./MotionDirector";

/*
 * Football Hub's front door. Concept: "the floodlights come on" — a night stadium and the
 * platform's own content (crests, competitions, classic scorelines, creators)
 * drifting past in depth. Then the six experiences, each with its own visual language and real data
 * where it can be loaded reliably, and a closing guide to every door.
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
  // The wall owns the right of the stage. On phones it sits in the lower half, clear of the text.
  return (
    <div className="pointer-events-none absolute -right-[10%] bottom-[2%] top-[52%] w-[118%] opacity-75 [perspective:1100px] lg:inset-y-[7%] lg:w-[94%] lg:opacity-100" aria-hidden>
      <div className="absolute right-[18%] top-1/2 hidden aspect-square w-[46%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,251,230,0.09),transparent_65%)] lg:block" />
      <div className="flex h-full flex-col justify-center gap-6 [transform:rotateY(-20deg)_rotateX(6deg)] [transform-style:preserve-3d] [mask-image:linear-gradient(to_right,transparent,black_24%,black_88%,transparent)]">
        {/* Far: club crests, small and slow */}
        <Drift dur={140} className="opacity-25">
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
              <div className="mx-2 h-24 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-panel lg:h-28 lg:w-28">{img(c.avatar, c.name, "h-full w-full object-cover", 112, true)}</div>
              {CLUBS[i] && crest(CLUBS[i], "h-24 w-24 lg:h-28 lg:w-28")}
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
    <section data-zone className="relative isolate overflow-hidden" aria-labelledby="lp-title">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_70%_10%,#1b2116_0%,#0d0f12_45%,#0b0c0f_75%)]" aria-hidden />
      <Floodlights />
      <ContentWall />
      <Pitch />
      {/* Keep the type side quiet so the headline reads first. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#0b0c0f_0%,rgba(11,12,15,0.84)_30%,rgba(11,12,15,0.1)_52%,transparent)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,15,0.9)_0%,rgba(11,12,15,0.55)_55%,rgba(11,12,15,0.2))]" aria-hidden />
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

      <div className="relative mx-auto grid min-h-[calc(100svh-60px)] max-w-7xl items-center gap-6 px-4 pb-16 pt-12 sm:px-6 lg:min-h-[min(calc(100svh-60px),920px)] lg:px-8 lg:pb-20">
        <div className="max-w-3xl" data-parallax style={{ "--py": "-60px" } as CSSProperties}>
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
            <Link href={sectionHref("live")} className="inline-flex h-12 items-center gap-2 rounded-md border border-white/20 bg-[#0b0c0f]/70 px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:border-white/50">
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
// The marquee band: club crests flowing left to right above and below, the type flowing right to
// left between them. Every row is a pure CSS loop (the same mechanism as the guide's ticker): a
// constant speed, never tied to scrolling, doubled content so the seam never shows.

/** Club crests from the same ESPN source Club Hub uses, in the variant made for dark backgrounds. */
const crestUrl = (id: number) => `https://a.espncdn.com/i/teamlogos/soccer/500-dark/${id}.png`;
const BAND_TOP: [string, number][] = [
  ["Real Madrid", 86], ["Manchester City", 382], ["Bayern Munich", 132], ["Inter", 110], ["Paris Saint-Germain", 160],
  ["Liverpool", 364], ["Barcelona", 83], ["Juventus", 111], ["Borussia Dortmund", 124], ["Marseille", 176],
  ["Arsenal", 359], ["Atlético Madrid", 1068], ["Napoli", 114],
];
const BAND_BOTTOM: [string, number][] = [
  ["Manchester United", 360], ["AC Milan", 103], ["Bayer Leverkusen", 131], ["Lyon", 167], ["Chelsea", 363],
  ["Valencia", 94], ["Roma", 104], ["Monaco", 174], ["Tottenham Hotspur", 367], ["Real Betis", 244],
  ["Lille", 166], ["Newcastle United", 361],
];

/** A row of crests moving left to right. Each half holds the list twice so it overfills wide screens. */
function CrestRow({ clubs, dur }: { clubs: [string, number][]; dur: number }) {
  return (
    <div className="border-y border-white/[0.06] py-4 sm:py-5">
      <Drift dur={dur} reverse>
        {[0, 1].flatMap((k) =>
          clubs.map(([name, id]) => (
            <span key={`${k}-${id}`} className="mx-4 flex h-9 w-9 shrink-0 items-center justify-center sm:mx-6 sm:h-12 sm:w-12 lg:mx-8 lg:h-14 lg:w-14">
              {img(crestUrl(id), name, "h-full w-full object-contain", 56)}
            </span>
          )),
        )}
      </Drift>
    </div>
  );
}

/** A line of oversized type moving right to left, four copies per half so it never shows a gap. */
function TypeRow({ text, dur, className }: { text: string; dur: number; className: string }) {
  return (
    <Drift dur={dur}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className={`shrink-0 whitespace-nowrap py-[0.04em] pr-[0.4em] ${className}`}>
          {text}
        </span>
      ))}
    </Drift>
  );
}

function KineticBand() {
  return (
    <section data-zone className="relative overflow-hidden py-16 sm:py-24" aria-label="One game. Six experiences.">
      <div className="relative" aria-hidden>
        <CrestRow clubs={BAND_TOP} dur={70} />
        <div className="my-6 space-y-1 font-display text-[clamp(3.6rem,11vw,10.5rem)] font-extrabold uppercase leading-[0.85] sm:my-10">
          <TypeRow text="One game." dur={45} className="text-white" />
          <TypeRow text="Six experiences." dur={85} className="lp-outline [-webkit-text-stroke-color:rgba(212,245,60,0.55)]" />
        </div>
        <CrestRow clubs={BAND_BOTTOM} dur={85} />
        {/* Soft edges, so rows enter and leave rather than being cut off */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent sm:w-24" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The guide (the last section): what each part of Football Hub actually does, in plain words.

const GUIDE = [
  {
    n: "01", id: "live", name: "Watch Live Matches", accent: "#ff6b4a", cta: "Find where to watch",
    headline: "Find where to watch the game.",
    body: "Quick links to two external football streaming websites showing matches. Football Hub doesn't host or stream anything; each link opens the other site in a new tab.",
  },
  {
    n: "02", id: "club", name: "Club Hub", accent: VOLT, cta: "Open Club Hub",
    headline: "Your club. Your football world.",
    body: "Follow everything about your favourite clubs: fixtures, results, league position, form, squad information and the latest news, across Europe's top five leagues.",
  },
  {
    n: "03", id: "ucl", name: "UEFA Champions League", accent: "#c9d3e6", cta: "Open the Champions League",
    headline: "Everything happening in Europe's biggest club competition.",
    body: "Follow the Champions League race with the standings, upcoming fixtures, results, the knockout stages and the top scorers, assists and clean sheets.",
  },
  {
    n: "04", id: "news", name: "TimesOfFootball", accent: "#5ad1ff", cta: "Read the latest",
    headline: "Never miss the stories everyone is talking about.",
    body: "Major football news as it happens: transfer developments, big match stories, managers, records and farewells, about the clubs and players fans care about.",
  },
  {
    n: "05", id: "big", name: "Big Clash", accent: "#ff6a52", cta: "Relive the classics",
    headline: "Relive football's greatest moments.",
    body: "Explore legendary matches, unforgettable scorelines, historic rivalries and dramatic comebacks, with a new classic on the cover every day.",
  },
  {
    n: "06", id: "creators", name: "Creators", accent: "#ff4d6d", cta: "Discover creators",
    headline: "Discover the voices behind the game.",
    body: "Find entertaining and insightful football YouTube creators from India and around the world, each one a tap away on YouTube.",
  },
];

function Guide() {
  return (
    <section data-zone className="relative mt-32 overflow-hidden border-t border-line pt-20" aria-labelledby="lp-guide">
      <div aria-hidden className="mb-16">
        <Drift dur={60}>
          {GUIDE.map((g) => (
            <span key={g.id} className="lp-outline mx-6 whitespace-nowrap font-display text-[clamp(3.5rem,9vw,8rem)] font-extrabold uppercase leading-none">
              {g.name} <span className="text-volt [-webkit-text-stroke:0]">·</span>
            </span>
          ))}
        </Drift>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <h2 id="lp-guide" className="font-display text-5xl font-extrabold uppercase leading-[0.9] text-white sm:text-6xl">
            One game.
            <br />
            <span className="text-volt">Six experiences.</span>
          </h2>
          <p className="max-w-md text-slate-400 lg:justify-self-end">New here? This is what each part of Football Hub does. Pick one and you&apos;re straight in.</p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {GUIDE.map((g, i) => (
            <li key={g.id} data-reveal style={{ "--d": `${(i % 3) * 80}ms` } as CSSProperties} className="bg-ink">
              <Link
                href={sectionHref(g.id)}
                className="group relative flex h-full flex-col gap-4 p-7 outline-none transition-colors duration-300 hover:bg-[#101216] focus-visible:bg-[#101216] focus-visible:ring-2 focus-visible:ring-inset sm:p-8"
                style={{ ["--tw-ring-color" as string]: g.accent }}
              >
                {/* An accent rule that grows on hover and focus */}
                <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.18] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" style={{ background: g.accent }} aria-hidden />
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-6xl font-extrabold leading-none text-transparent [-webkit-text-stroke:1px_currentColor]" style={{ color: g.accent }} aria-hidden>
                    {g.n}
                  </span>
                  <span className="text-right text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: g.accent }}>
                    {g.name}
                  </span>
                </span>
                <span className="font-display text-[1.7rem] font-extrabold uppercase leading-[0.98] text-white">{g.headline}</span>
                <span className="text-[15px] leading-relaxed text-slate-400">{g.body}</span>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-bold uppercase tracking-wide" style={{ color: g.accent }}>
                  {g.cta} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
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
        <Link href={href} className="lp-tile-cta mt-6 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-md px-4 text-[13px] font-bold uppercase text-slate-950 transition hover:brightness-110 sm:px-5 sm:text-sm sm:tracking-wide" style={{ background: accent }}>
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
      {/* The two real destinations as broadcast-graphic cards: each a real link to the external site. */}
      <div className="absolute inset-x-5 bottom-6 space-y-3 sm:inset-x-8">
        {STREAM_SITES.map((s, i) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.name}: external website, opens in a new tab`}
            className="lp-plate lp-dest group/dest relative block rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f12]"
            style={{ "--d": `${0.35 + i * 0.18}s`, "--c1": s.theme.primary, "--c2": s.theme.secondary, ["--tw-ring-color" as string]: s.theme.primary } as CSSProperties}
          >
            <span className="lp-dest-face relative flex items-stretch overflow-hidden rounded-[3px] border border-white/10 bg-[linear-gradient(100deg,#101318,#0b0d10_60%)] shadow-[0_24px_40px_-22px_rgba(0,0,0,0.95)]">
              {/* Brand edge: an angled, layered colour block like a broadcast lower third */}
              <span className="lp-dest-edge relative flex w-16 shrink-0 items-center justify-center [clip-path:polygon(0_0,100%_0,78%_100%,0_100%)] sm:w-20" style={{ background: `linear-gradient(160deg, ${s.theme.primary}, ${s.theme.secondary})` }}>
                <span className="font-display text-lg font-extrabold text-slate-950/85">0{i + 1}</span>
              </span>
              <span className="relative flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-2 pr-4">
                <span className="min-w-0">
                  <span className={`block truncate font-display text-[1.6rem] font-extrabold uppercase leading-none ${s.look === "slash" ? "italic" : "tracking-wide"}`}>
                    <span className="text-white">{s.wordmark[0]}</span>
                    <span style={{ color: s.theme.primary }}>{s.wordmark[1]}</span>
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    External site · {displayHost(s.url)}
                  </span>
                </span>
                <span className="lp-dest-arrow flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition duration-300">
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/dest:-translate-y-0.5 group-hover/dest:translate-x-0.5" />
                </span>
              </span>
              {/* A light sweep that crosses the card on hover */}
              <span className="lp-dest-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.10),transparent)]" aria-hidden />
            </span>
          </a>
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
          <span key={l.id} className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#0b0c0f]/95 p-1.5" title={l.name}>
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
  // The supplied photograph (trophy and starball artwork together), shown as it is. object-cover keeps
  // the trophy centred and whole; only the panel's blue edges are trimmed on narrow boxes.
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#071a6b]">
      <Image
        src="/landing/cl_trophy.avif"
        alt="The UEFA Champions League trophy on a blue starball background"
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
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

export default function Landing() {
  return (
    <div data-landing className="min-h-screen overflow-x-clip bg-ink text-slate-100">
      <LandingNav />
      <main>
        <Hero />
        <KineticBand />
        <Experiences />
        <Guide />
      </main>
      <Footer />
      <MotionDirector />
    </div>
  );
}
