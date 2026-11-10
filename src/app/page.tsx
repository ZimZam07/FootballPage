import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import { redirect } from "next/navigation";
import { CATEGORIES, COMPETITION_GROUPS, ERAS, RIVALRIES, type ArchiveFilters } from "@/lib/big-clash/archive";
import { todayUtc } from "@/lib/big-clash/cover";
import { TEAMS } from "@/data/big-clash/teams";
import { NEWS_PATH } from "@/lib/site";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Each section gets its own title and description, so shared links describe what they open. */
const SECTION_META: Record<string, { title: string; description: string }> = {
  live: { title: "Watch Live Matches", description: "Football streaming websites to explore match coverage across the web." },
  club: { title: "Club Hub", description: "Fixtures, live scores, match stats, line-ups, standings, squads and news for clubs in Europe's top five leagues." },
  creators: { title: "Creators", description: "Twenty football YouTube channels worth following, from Indian football to tactics and transfers." },
  big: { title: "Big Clash", description: "The matches that made football history: legendary finals, comebacks and rivalries, with official highlights and a new cover story every day." },
  ucl: { title: "UEFA Champions League", description: "Champions League standings, fixtures, results, knockout bracket, clubs and top stats." },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const tab = one((await searchParams).tab);
  const meta = tab ? SECTION_META[tab] : undefined;
  // The bare homepage (and unknown tabs) use the site title; linked sections get their own.
  if (!meta || tab === "live") {
    return {
      title: { absolute: SITE_TITLE },
      description: SITE_DESCRIPTION,
      alternates: { canonical: "/" },
      openGraph: { url: "/", title: SITE_TITLE, description: SITE_DESCRIPTION },
      twitter: { title: SITE_TITLE, description: SITE_DESCRIPTION },
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

/** Reads the Big Clash archive filters from the URL so links and the back button restore them. */
export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  // TimesOfFootball has its own page; keep old-style links working.
  if (one(sp.tab) === "news") redirect(NEWS_PATH);
  const bclub = one(sp.bclub);
  // Big Clash archive filters (prefixed params, validated against the archive's own lists).
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
