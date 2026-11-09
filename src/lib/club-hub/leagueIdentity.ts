import type { LeagueId } from "./types";

/**
 * Visual identity of each Club Hub league, kept in one place so the selector, standings,
 * club headers and match headers always agree.
 *
 * Logos are the competitions' official marks as published by ESPN (the site's data provider;
 * dark-background variants), stored locally under /public/leagues. ESPN's Serie A and Ligue 1
 * marks are their previous official logos; replacing a file updates it everywhere.
 */
export interface LeagueIdentity {
  id: LeagueId;
  name: string;
  logo: string;
  /** Brand colour for rules, highlights and selected states. */
  primary: string;
  /** A tint of the brand that stays legible as text on the dark surface. */
  ink: string;
}

export const LEAGUE_IDENTITY: Record<LeagueId, LeagueIdentity> = {
  pl: { id: "pl", name: "Premier League", logo: "/leagues/pl.png", primary: "#8b5cf6", ink: "#b9a2ff" },
  laliga: { id: "laliga", name: "La Liga", logo: "/leagues/laliga.png", primary: "#e8473f", ink: "#f2c45a" },
  seriea: { id: "seriea", name: "Serie A", logo: "/leagues/seriea.png", primary: "#2f7bf5", ink: "#86b4ff" },
  bundesliga: { id: "bundesliga", name: "Bundesliga", logo: "/leagues/bundesliga.png", primary: "#e2231a", ink: "#ff7a73" },
  ligue1: { id: "ligue1", name: "Ligue 1", logo: "/leagues/ligue1.png", primary: "#2c4cc4", ink: "#9aaef5" },
};

export const leagueIdentity = (id: string | null | undefined): LeagueIdentity | undefined =>
  id && id in LEAGUE_IDENTITY ? LEAGUE_IDENTITY[id as LeagueId] : undefined;

/** Maps ESPN competition names ("English Premier League", "Spanish LALIGA", …) to a Club Hub league. */
const COMPETITION_PATTERNS: [RegExp, LeagueId][] = [
  [/^(english )?premier league$/i, "pl"],
  [/^(spanish )?la ?liga$/i, "laliga"],
  [/^(italian )?serie a$/i, "seriea"],
  [/^(german )?bundesliga$/i, "bundesliga"],
  [/^(french )?ligue 1$/i, "ligue1"],
];
export function leagueForCompetition(name: string | null | undefined): LeagueIdentity | undefined {
  const n = (name ?? "").trim();
  const hit = COMPETITION_PATTERNS.find(([re]) => re.test(n));
  return hit ? LEAGUE_IDENTITY[hit[1]] : undefined;
}

/** "2026-27 English Premier League" -> "2026/27". */
export const seasonLabel = (s: string | null | undefined) => {
  const m = (s ?? "").match(/(\d{4})[-/](\d{2,4})/);
  return m ? `${m[1]}/${m[2].slice(-2)}` : "";
};

/**
 * Qualification and relegation zones. Which places get which zone comes from ESPN's own notes for
 * each league (so every league keeps its own rules); this only gives them one consistent palette.
 */
export interface StandingZone {
  key: string;
  label: string;
  color: string;
}
const ZONES: (StandingZone & { test: RegExp })[] = [
  { test: /champions league(?! qualifying)/i, key: "ucl", label: "Champions League", color: "#3e8bff" },
  { test: /champions league qualifying/i, key: "uclq", label: "Champions League qualifying", color: "#8db8ff" },
  { test: /europa league/i, key: "uel", label: "Europa League", color: "#f59e0b" },
  { test: /conference league/i, key: "uecl", label: "Conference League qualifying", color: "#34d399" },
  { test: /relegation play-?off/i, key: "relpo", label: "Relegation play-off", color: "#fda4af" },
  { test: /relegat/i, key: "rel", label: "Relegation", color: "#f43f5e" },
];
export const standingZone = (description: string | null | undefined): StandingZone | null =>
  description ? (ZONES.find((z) => z.test.test(description)) ?? null) : null;

/** The zones present in a table, in a fixed top-to-bottom order, for the key below it. */
export const zonesIn = (descriptions: (string | null | undefined)[]): StandingZone[] => {
  const keys = new Set(descriptions.map((d) => standingZone(d)?.key).filter(Boolean));
  return ZONES.filter((z) => keys.has(z.key));
};
