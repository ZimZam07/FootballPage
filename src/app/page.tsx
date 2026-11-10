import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HomeClient from "@/components/HomeClient";
import Landing from "@/components/landing/Landing";
import { CATEGORIES, COMPETITION_GROUPS, ERAS, RIVALRIES, type ArchiveFilters } from "@/lib/big-clash/archive";
import { todayUtc } from "@/lib/big-clash/cover";
import { TEAMS } from "@/data/big-clash/teams";
import { LANDING_DESCRIPTION, LANDING_TITLE, NEWS_PATH, SITE_URL, WATCH_LIVE_PATH } from "@/lib/site";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Sections opened with ?tab= keep their own title and description, so shared links describe what they open. */
const SECTION_META: Record<string, { title: string; description: string }> = {
  club: { title: "Club Hub", description: "Fixtures, live scores, match stats, line-ups, standings, squads and news for clubs in Europe's top five leagues." },
  creators: { title: "Creators", description: "Twenty football YouTube channels worth following, from Indian football to tactics and transfers." },
  big: { title: "Big Clash", description: "The matches that made football history: legendary finals, comebacks and rivalries, with official highlights and a new cover story every day." },
  ucl: { title: "UEFA Champions League", description: "Champions League standings, fixtures, results, knockout bracket, clubs and top stats." },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const tab = one((await searchParams).tab);
  const meta = tab ? SECTION_META[tab] : undefined;
  // The bare address is the landing page (and the canonical for unknown tabs).
  if (!meta) {
    return {
      title: { absolute: LANDING_TITLE },
      description: LANDING_DESCRIPTION,
      alternates: { canonical: "/" },
      openGraph: { url: "/", title: LANDING_TITLE, description: LANDING_DESCRIPTION },
      twitter: { title: LANDING_TITLE, description: LANDING_DESCRIPTION },
    };
  }
  const title = `${meta.title} | Football Hub`;
  return {
    title: { absolute: title },
    description: meta.description,
    alternates: { canonical: `/?tab=${tab}` },
    openGraph: { url: `/?tab=${tab}`, title, description: meta.description },
    twitter: { title, description: meta.description },
  };
}

/** Structured data for the landing page: the site and its six sections. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Football Hub",
  url: SITE_URL,
  description: LANDING_DESCRIPTION,
  hasPart: [
    ["Watch Live Matches", WATCH_LIVE_PATH],
    ["Club Hub", "/?tab=club"],
    ["UEFA Champions League", "/?tab=ucl"],
    ["TimesOfFootball", NEWS_PATH],
    ["Big Clash", "/?tab=big"],
    ["Creators", "/?tab=creators"],
  ].map(([name, path]) => ({ "@type": "WebPage", name, url: `${SITE_URL}${path}` })),
};

/**
 * "/" is the landing page; "/?tab=…" opens a section (existing links and bookmarks keep working).
 * Watch Live and TimesOfFootball have their own routes; their old ?tab= links redirect there.
 */
export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = one(sp.tab);
  if (tab === "news") redirect(NEWS_PATH);
  if (tab === "live") redirect(WATCH_LIVE_PATH);
  if (!tab || !(tab in SECTION_META)) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <Landing />
      </>
    );
  }

  // Big Clash archive filters (prefixed params, validated against the archive's own lists).
  const bclub = one(sp.bclub);
  const bcomp = one(sp.bcomp), bera = one(sp.bera), bcat = one(sp.bcat), briv = one(sp.briv);
  const bigFilters: Partial<ArchiveFilters> = {
    q: (one(sp.bq) ?? "").slice(0, 60),
    group: bcomp === "club" || bcomp === "international" || COMPETITION_GROUPS.includes(bcomp as never) ? (bcomp as ArchiveFilters["group"]) : "all",
    era: ERAS.some((e) => e.id === bera) ? (bera as ArchiveFilters["era"]) : "all",
    category: bcat && bcat in CATEGORIES ? (bcat as ArchiveFilters["category"]) : "all",
    rivalry: RIVALRIES.some((r) => r.id === briv) ? briv! : "all",
    club: bclub && bclub in TEAMS ? bclub : "all",
  };

  // The day (UTC) the cover story is chosen for, fixed at render so server and client agree.
  return <HomeClient bigFilters={bigFilters} coverDay={todayUtc()} />;
}
