"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Newspaper, RotateCw } from "lucide-react";
import Masthead from "@/components/Masthead";
import { SafeImg, StateMessage } from "@/components/club-hub/ui";
import { useClock, nowMs } from "@/lib/clock";
import { CATEGORY_COLOR, CATEGORY_LABEL, arrange, isJustIn } from "@/lib/news/edition";
import type { NewsCategory, NewsEdition, NewsStory } from "@/lib/news/types";

export const ACCENT = "#5ad1ff";
const REFRESH_MS = 10 * 60_000;

// ---------------------------------------------------------------------------
// Time: the first render uses the edition's own timestamp (identical on server and client), then
// switches to the visitor's clock and keeps ticking, so relative times never mismatch on hydration.

const readNow = () => Math.floor(nowMs() / 30_000) * 30_000;
const useNow = (initial: number) => useClock(initial, readNow, 30_000);

function ago(iso: string, now: number) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Pieces

function Picture({ s, className = "" }: { s: NewsStory; className?: string }) {
  return (
    <SafeImg
      src={s.image}
      alt=""
      className={`h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04] ${className}`}
      fallback={
        <span className="flex h-full w-full items-end bg-[radial-gradient(120%_90%_at_0%_0%,rgba(90,209,255,0.18),transparent_60%),linear-gradient(160deg,#16191f,#0c0e12)] p-3">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-white/40">{s.source}</span>
        </span>
      }
    />
  );
}

function Kicker({ s, now }: { s: NewsStory; now: number }) {
  const fresh = isJustIn(s, now);
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] font-semibold uppercase tracking-[0.16em]">
      {fresh && (
        <span className="inline-flex items-center gap-1.5 text-[#ff5a4f]">
          <span className="ch-live-dot h-1.5 w-1.5 rounded-full bg-[#ff5a4f]" aria-hidden />
          Just in
        </span>
      )}
      {/* The editorial cue (what kind of moment this is) and who it's about, then the desk. */}
      <span style={{ color: CATEGORY_COLOR[s.category] }}>{s.hook ?? CATEGORY_LABEL[s.category]}</span>
      {s.subject && <span className="text-slate-300">{s.subject}</span>}
      {s.transfer && <TransferStatus s={s} />}
    </p>
  );
}

/** Three clearly different badges: a done deal, a reported development, and a rumour. */
function TransferStatus({ s }: { s: NewsStory }) {
  if (s.transfer === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300 ring-1 ring-emerald-400/40" title="The publisher reports a completed deal">
        <CheckCircle2 className="h-3 w-3" /> Confirmed
      </span>
    );
  }
  if (s.transfer === "reported") {
    return (
      <span className="rounded-sm bg-amber-400/10 px-1.5 py-0.5 text-amber-300 ring-1 ring-amber-400/30" title="Negotiations or a bid reported by the publisher; not an official announcement">
        Reported
      </span>
    );
  }
  return (
    <span className="rounded-sm px-1.5 py-0.5 text-slate-400 outline-1 -outline-offset-1 outline-dashed outline-slate-400/45" title="Interest or speculation; unconfirmed">
      Rumour
    </span>
  );
}

/**
 * A major retirement kept from earlier, shown with its original date so it never reads as new.
 */
function RetirementSpotlight({ s }: { s: NewsStory }) {
  const date = new Date(s.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <StoryLink s={s} className="relative grid overflow-hidden rounded-md border border-[#c4b5fd]/25 bg-[#120f1a] sm:grid-cols-[16rem_minmax(0,1fr)] md:col-span-2">
      <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto">
        <Picture s={s} />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-[#120f1a]/60" aria-hidden />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <p className="flex flex-wrap items-center gap-x-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]">
          <span className="text-[#c4b5fd]">Retirement spotlight</span>
          <span className="text-slate-300">{s.retirement === "international" ? "International retirement" : "Retirement"}</span>
        </p>
        <h3 className="font-display text-2xl font-bold uppercase leading-[1.02] text-white">{s.title}</h3>
        {s.summary && <p className="text-sm leading-relaxed text-slate-400">{s.summary}</p>}
        <p className="mt-auto pt-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-300">{s.source}</span> · First published {date}
        </p>
      </div>
    </StoryLink>
  );
}

function Byline({ s, now }: { s: NewsStory; now: number }) {
  return (
    <p className="flex items-center gap-2 text-xs text-slate-500">
      <span className="font-semibold text-slate-300">{s.source}</span>
      <span aria-hidden>·</span>
      <time dateTime={s.published} title={new Date(s.published).toUTCString()}>
        {ago(s.published, now)}
      </time>
    </p>
  );
}

/** Every story opens the publisher's original article in a new tab. */
function StoryLink({ s, className = "", children }: { s: NewsStory; className?: string; children: ReactNode }) {
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className={`group ${className}`} aria-label={`${s.title} (${s.source}, opens in a new tab)`}>
      {children}
    </a>
  );
}

function Desk({ kicker, title, accent, note, children }: { kicker: string; title: string; accent: string; note?: string; children: ReactNode }) {
  return (
    <section className="ch-fade-up">
      <div className="mb-6 grid gap-2 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
            {kicker}
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase leading-none text-white sm:text-4xl">{title}</h2>
        </div>
        {note && <p className="max-w-sm text-xs text-slate-500 sm:text-right">{note}</p>}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Layouts

function Lead({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="relative block overflow-hidden rounded-lg border border-white/[0.08] bg-[#0f1115] lg:min-h-[30rem]">
      <div className="relative aspect-[16/9] overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto">
        <Picture s={s} />
        <span className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#07080a] via-[#07080a]/70 to-transparent lg:block" aria-hidden />
      </div>
      <div className="relative flex flex-col gap-3 p-5 sm:p-7 lg:absolute lg:inset-x-0 lg:bottom-0 lg:p-9">
        <Kicker s={s} now={now} />
        <h2 className="max-w-3xl font-display text-3xl font-extrabold uppercase leading-[0.95] text-white sm:text-4xl lg:text-5xl">{s.title}</h2>
        {s.summary && <p className="max-w-2xl text-[15px] leading-relaxed text-slate-300">{s.summary}</p>}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <Byline s={s} now={now} />
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            Read at {s.source} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </StoryLink>
  );
}

function Headline({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-4 border-b border-line py-4 first:pt-0 last:border-0">
      <div className="min-w-0 space-y-2">
        <Kicker s={s} now={now} />
        <h3 className="text-[15px] font-semibold leading-snug text-slate-100 transition-colors group-hover:text-white">{s.title}</h3>
        <Byline s={s} now={now} />
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-md bg-white/[0.03]">
        <Picture s={s} />
      </div>
    </StoryLink>
  );
}

function ReelCard({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-md border border-white/[0.07] bg-[#101216] transition duration-300 hover:-translate-y-0.5 hover:border-white/15 sm:w-72">
      <div className="aspect-[16/9] overflow-hidden">
        <Picture s={s} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Kicker s={s} now={now} />
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-100 group-hover:text-white">{s.title}</h3>
        <div className="mt-auto pt-1">
          <Byline s={s} now={now} />
        </div>
      </div>
    </StoryLink>
  );
}

function TransferCard({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="grid grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-md border border-white/[0.07] bg-[#121109] transition duration-300 hover:-translate-y-0.5 hover:border-[#f5b83d]/30 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <div className="relative overflow-hidden">
        <Picture s={s} />
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: s.transfer === "confirmed" ? "#34d399" : "#f5b83d" }} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-2 p-4">
        <Kicker s={s} now={now} />
        <h3 className="line-clamp-3 font-semibold leading-snug text-slate-100 group-hover:text-white">{s.title}</h3>
        {s.summary && <p className="hidden line-clamp-2 text-sm text-slate-400 sm:block">{s.summary}</p>}
        <div className="mt-auto pt-1">
          <Byline s={s} now={now} />
        </div>
      </div>
    </StoryLink>
  );
}

function FeatureCard({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="flex flex-col">
      <div className="aspect-[3/2] overflow-hidden rounded-md bg-white/[0.03] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]">
        <Picture s={s} />
      </div>
      <div className="mt-4 space-y-2">
        <Kicker s={s} now={now} />
        <h3 className="font-display text-2xl font-bold uppercase leading-[1.02] text-white">{s.title}</h3>
        {s.summary && <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{s.summary}</p>}
        <Byline s={s} now={now} />
      </div>
    </StoryLink>
  );
}

function RowCard({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="relative grid grid-cols-[minmax(0,1fr)_5.5rem] gap-4 border-b border-line py-4 pl-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
      <span className="absolute inset-y-4 left-0 w-[3px]" style={{ background: CATEGORY_COLOR[s.category] }} aria-hidden />
      <div className="min-w-0 space-y-1.5">
        <Kicker s={s} now={now} />
        <h3 className="font-semibold leading-snug text-slate-100 group-hover:text-white">{s.title}</h3>
        {s.summary && <p className="hidden line-clamp-2 text-sm text-slate-400 sm:block">{s.summary}</p>}
        <Byline s={s} now={now} />
      </div>
      <div className="aspect-[4/3] self-start overflow-hidden rounded-md bg-white/[0.03]">
        <Picture s={s} />
      </div>
    </StoryLink>
  );
}

function BriefCard({ s, now }: { s: NewsStory; now: number }) {
  return (
    <StoryLink s={s} className="flex gap-3 border-t border-line py-4">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded bg-white/[0.03]">
        <Picture s={s} />
      </div>
      <div className="min-w-0 space-y-1.5">
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-200 group-hover:text-white">{s.title}</h3>
        <p className="text-[11px] text-slate-500">
          <span style={{ color: CATEGORY_COLOR[s.category] }}>{CATEGORY_LABEL[s.category]}</span> · {s.source} · {ago(s.published, now)}
        </p>
      </div>
    </StoryLink>
  );
}

// ---------------------------------------------------------------------------

const ORDER: NewsCategory[] = ["transfers", "matches", "managers", "awards", "injuries", "international", "retirements", "tributes", "football"];

export default function TimesOfFootball({ edition }: { edition: NewsEdition }) {
  const router = useRouter();
  const generated = new Date(edition.generatedAt).getTime();
  const now = useNow(generated);
  const [filter, setFilter] = useState<NewsCategory | "all">("all");
  // Arranged against the edition's timestamp, so the layout is identical on server and client.
  const ed = useMemo(() => arrange(edition.stories), [edition]);
  const counts = useMemo(() => ORDER.map((c) => [c, edition.stories.filter((s) => s.category === c).length] as const).filter(([, n]) => n > 0), [edition]);

  // Keep the page current: re-request the (cached) edition every ten minutes while it is visible.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [router]);

  const failed = edition.sources.filter((s) => !s.ok).map((s) => s.name);
  const working = edition.sources.filter((s) => s.ok && s.count > 0).map((s) => s.name);
  const newest = edition.stories[0];
  const live = newest && now - new Date(newest.published).getTime() < 3 * 3600_000;

  return (
    <div className="space-y-12">
      <Masthead
        index="04"
        kicker="Football news"
        title={
          // The brand keeps its own casing (the masthead is otherwise all caps); "Of" is set off in the accent.
          <span className="normal-case tracking-[-0.01em]" aria-label="TimesOfFootball">
            Times<span style={{ color: ACCENT }}>Of</span>Football
          </span>
        }
        intro="The football stories everyone is talking about: the biggest clubs and players, done deals and transfer talk, shocks, records and farewells, from the newsrooms of BBC Sport, The Guardian, Sky Sports and ESPN."
        accent={ACCENT}
        aside={
          <div className="space-y-1.5 lg:text-right">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              {live && <span className="ch-live-dot h-2 w-2 rounded-full" style={{ background: ACCENT }} aria-hidden />}
              Updated {ago(edition.generatedAt, now).toLowerCase()}
            </p>
            <p className="text-xs text-slate-500">
              {edition.stories.length} stories worth your time from the last 72 hours · refreshes every 10 minutes
            </p>
          </div>
        }
      />

      {edition.stories.length === 0 ? (
        <StateMessage
          tone="error"
          icon={<Newspaper className="h-5 w-5" />}
          title="The newsroom is quiet right now"
          message="We couldn't reach our news sources just now. They are checked again every few minutes."
          action={
            <button onClick={() => router.refresh()} className="mt-1 inline-flex h-9 items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-950">
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          }
        />
      ) : (
        <>
          {/* Desks: every story is in exactly one place; pick a desk to see all of its stories. */}
          <div className="ch-scrollbar-none -mx-4 -mt-4 flex gap-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="News desks">
            {([["all", edition.stories.length] as const, ...counts]).map(([c, n]) => {
              const on = filter === c;
              const color = c === "all" ? ACCENT : CATEGORY_COLOR[c];
              return (
                <button key={c} role="tab" aria-selected={on} onClick={() => setFilter(c)} className={`relative -mb-px shrink-0 pb-3 text-sm font-semibold transition-colors ${on ? "text-white" : "text-slate-500 hover:text-slate-200"}`}>
                  {c === "all" ? "All stories" : CATEGORY_LABEL[c]}
                  <span className="ml-1.5 font-display text-sm text-slate-500">{n}</span>
                  <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} style={{ background: color }} />
                </button>
              );
            })}
          </div>

          {filter !== "all" ? (
            <div key={filter} className="ch-fade-up grid gap-x-10 gap-y-2 md:grid-cols-2">
              {edition.stories.filter((s) => s.category === filter).map((s) => <RowCard key={s.id} s={s} now={now} />)}
            </div>
          ) : (
            <div key="all" className="space-y-16">
              {ed.lead && (
                <div className="ch-fade-up grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                  <Lead s={ed.lead} now={now} />
                  {ed.headlines.length > 0 && (
                    <aside aria-label="Also making headlines">
                      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Also making headlines</p>
                      {ed.headlines.map((s) => <Headline key={s.id} s={s} now={now} />)}
                    </aside>
                  )}
                </div>
              )}

              {ed.latest.length > 0 && (
                <Desk kicker="Just in" title="The latest" accent="#ff5a4f">
                  <div className="ch-scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {ed.latest.map((s) => <ReelCard key={s.id} s={s} now={now} />)}
                  </div>
                </Desk>
              )}

              {ed.transfers.length > 0 && (
                <Desk kicker="Transfer centre" title="Deals, bids and whispers" accent="#f5b83d" note="Confirmed: the publisher reports a completed deal. Reported: talks, bids or agreements in principle. Rumour: interest or speculation.">
                  <div className="grid gap-4 md:grid-cols-2">
                    {ed.transfers.map((s) => <TransferCard key={s.id} s={s} now={now} />)}
                  </div>
                </Desk>
              )}

              {ed.world.length > 0 && (
                <Desk kicker="Around the football world" title="Beyond the Premier League" accent={ACCENT}>
                  <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {ed.world.map((s) => <FeatureCard key={s.id} s={s} now={now} />)}
                  </div>
                </Desk>
              )}

              {(ed.people.length > 0 || edition.retirementSpotlight) && (
                <Desk kicker="Players & clubs" title="Dugouts, honours and farewells" accent="#ff7a59">
                  <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
                    {edition.retirementSpotlight && <RetirementSpotlight s={edition.retirementSpotlight} />}
                    {ed.people.map((s) => <RowCard key={s.id} s={s} now={now} />)}
                  </div>
                </Desk>
              )}

              {ed.more.length > 0 && (
                <Desk kicker="Keep reading" title="More football stories" accent="#94a3b8">
                  <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
                    {ed.more.map((s) => <BriefCard key={s.id} s={s} now={now} />)}
                  </div>
                </Desk>
              )}
            </div>
          )}

          <p className="border-t border-line pt-5 text-xs leading-relaxed text-slate-500">
            Headlines, summaries and pictures belong to their publishers ({working.join(", ") || "none available"}); every story opens the original article. Stories are chosen and
            categorised automatically from each headline: the cue above a headline only describes what the headline reports.
            {edition.filtered > 0 && <> {edition.filtered} lower-interest items were left out today.</>}
            {failed.length > 0 && <span className="text-amber-400/90"> {failed.join(" and ")} couldn&apos;t be reached on the last update.</span>}
          </p>
        </>
      )}
    </div>
  );
}
