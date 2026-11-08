import { MATCHES } from "@/data/big-clash/matches";
import { HIGHLIGHTS } from "@/data/big-clash/highlights";
import { RIVALRIES, TEAMS } from "@/data/big-clash/teams";
import type { Category, CompetitionGroup, HistoricMatch, HistoricTeam, Rivalry } from "./types";

/** The full archive, newest first, with verified highlights attached. */
export const ARCHIVE: HistoricMatch[] = MATCHES.map((m) => ({ ...m, highlights: HIGHLIGHTS[m.slug] })).sort((a, b) => b.date.localeCompare(a.date));

const bySlug = new Map(ARCHIVE.map((m) => [m.slug, m]));
export const getMatch = (slug: string) => bySlug.get(slug);
export const getRivalry = (id: string | undefined) => RIVALRIES.find((r) => r.id === id);
export const team = (key: string): HistoricTeam => TEAMS[key];
export { RIVALRIES };

export const CATEGORIES: Record<Category, { label: string; short: string; color: string }> = {
  greatest: { label: "All-Time Great", short: "All-Time Great", color: "#efe4cc" },
  "european-night": { label: "European Night", short: "European Night", color: "#9db8ff" },
  rivalry: { label: "Classic Rivalry", short: "Rivalry", color: "#ff6a52" },
  comeback: { label: "Legendary Comeback", short: "Comeback", color: "#f0b74a" },
  final: { label: "Historic Final", short: "Final", color: "#cdb98a" },
};

/** The label shown on a card: the most specific category the match belongs to. */
export function primaryCategory(m: HistoricMatch): Category {
  for (const c of ["comeback", "final", "rivalry", "european-night", "greatest"] as Category[]) if (m.categories.includes(c)) return c;
  return m.categories[0];
}

export const COMPETITION_GROUPS: CompetitionGroup[] = [
  "Champions League", "Premier League", "La Liga", "Serie A", "Bundesliga", "World Cup", "European Championship", "Domestic Cups", "Other",
];
export const groupLabel = (g: CompetitionGroup) => (g === "Premier League" ? "English League" : g === "Other" ? "Other competitions" : g);

export const ERAS = [
  { id: "pre-1980", label: "Before 1980", from: 0, to: 1979 },
  { id: "1980s-90s", label: "1980s–90s", from: 1980, to: 1999 },
  { id: "2000s", label: "2000s", from: 2000, to: 2009 },
  { id: "2010s", label: "2010s", from: 2010, to: 2019 },
  { id: "2020s", label: "2020s", from: 2020, to: 2099 },
] as const;
export type EraId = (typeof ERAS)[number]["id"];

export const year = (m: HistoricMatch) => Number(m.date.slice(0, 4));
export const isInternational = (m: HistoricMatch) => Boolean(TEAMS[m.home].national);

export function formatHistoricDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  // Parse as UTC so a historic date never shifts with the viewer's time zone.
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

export interface ArchiveFilters {
  q: string;
  group: CompetitionGroup | "all" | "international" | "club";
  era: EraId | "all";
  category: Category | "all";
  rivalry: string | "all";
}
export const NO_FILTERS: ArchiveFilters = { q: "", group: "all", era: "all", category: "all", rivalry: "all" };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Text a search can match: teams, competition, stage, venue, title, year and scorers. */
function haystack(m: HistoricMatch) {
  const h = TEAMS[m.home], a = TEAMS[m.away];
  return fold(
    [h.name, h.short, h.country, a.name, a.short, a.country, m.competition, m.stage, m.stadium, m.city, m.title, m.date.slice(0, 4), getRivalry(m.rivalry)?.name ?? "", ...(m.moments ?? []).map((k) => k.text)].join(" "),
  );
}
const HAY = new Map(ARCHIVE.map((m) => [m.slug, haystack(m)]));

export function filterArchive(f: ArchiveFilters): HistoricMatch[] {
  const terms = fold(f.q).split(/\s+/).filter(Boolean);
  const era = ERAS.find((e) => e.id === f.era);
  return ARCHIVE.filter((m) => {
    if (f.group === "international" ? !isInternational(m) : f.group === "club" ? isInternational(m) : f.group !== "all" && m.group !== f.group) return false;
    if (era && (year(m) < era.from || year(m) > era.to)) return false;
    if (f.category !== "all" && !m.categories.includes(f.category)) return false;
    if (f.rivalry !== "all" && m.rivalry !== f.rivalry) return false;
    const hay = HAY.get(m.slug)!;
    return terms.every((t) => hay.includes(t));
  });
}

export const isFiltering = (f: ArchiveFilters) => f.q.trim() !== "" || f.group !== "all" || f.era !== "all" || f.category !== "all" || f.rivalry !== "all";

export const rivalryMatches = (r: Rivalry) => ARCHIVE.filter((m) => m.rivalry === r.id).sort((a, b) => a.date.localeCompare(b.date));

/** Related matches for a detail page: same rivalry first, then shared teams, then same category. */
export function relatedMatches(m: HistoricMatch, n = 3): HistoricMatch[] {
  const score = (o: HistoricMatch) =>
    (m.rivalry && o.rivalry === m.rivalry ? 4 : 0) +
    ([o.home, o.away].some((t) => t === m.home || t === m.away) ? 2 : 0) +
    (o.categories.some((c) => m.categories.includes(c)) ? 1 : 0);
  return ARCHIVE.filter((o) => o.slug !== m.slug)
    .map((o) => [o, score(o)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1] || b[0].date.localeCompare(a[0].date))
    .slice(0, n)
    .map(([o]) => o);
}
