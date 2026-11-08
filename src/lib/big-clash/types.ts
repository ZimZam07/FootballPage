/**
 * Big Clash is a curated archive of historic football matches. Everything here
 * is static, hand-researched data — it never touches the live fixtures APIs.
 */

export type Category = "greatest" | "european-night" | "rivalry" | "comeback" | "final";

export type CompetitionGroup =
  | "Champions League"
  | "Premier League"
  | "La Liga"
  | "Serie A"
  | "Bundesliga"
  | "World Cup"
  | "European Championship"
  | "Domestic Cups"
  | "Other";

export interface HistoricTeam {
  name: string;
  short: string;
  logo: string;
  /** Primary kit colour, used for poster gradients. */
  color: string;
  country: string;
  national?: boolean;
}

export interface KeyMoment {
  /** Display minute, e.g. "90+3'". */
  minute: string;
  type: "goal" | "own-goal" | "penalty" | "red" | "save" | "info";
  side?: "home" | "away";
  text: string;
}

export interface Highlights {
  url: string;
  /** Who published the video, e.g. "UEFA" or "Liverpool FC". */
  source: string;
  /** What the video shows; defaults to highlights. */
  kind?: "highlights" | "full-match" | "key-moment";
}

export interface HistoricMatch {
  slug: string;
  /** Keys into TEAMS. "home" is the side listed first in the official record. */
  home: string;
  away: string;
  score: [number, number];
  /** e.g. "Liverpool won 3–2 on penalties" or "Barcelona won 6–5 on aggregate". */
  outcome?: string;
  extraTime?: boolean;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  competition: string;
  group: CompetitionGroup;
  stage: string;
  stadium: string;
  city: string;
  categories: Category[];
  /** The poster's tagline, a few words. */
  title: string;
  /** One or two sentences for cards. */
  summary: string;
  /** Paragraphs of historical context for the detail page. */
  context: string[];
  /** Why the match is remembered — short points. */
  legacy: string[];
  /** Verified goals and turning points. Omitted where we couldn't verify minutes. */
  moments?: KeyMoment[];
  /** Verified official highlights. Omitted when no verified link exists. */
  highlights?: Highlights;
  rivalry?: string;
}

export interface Rivalry {
  id: string;
  name: string;
  teams: [string, string];
  region: string;
  description: string;
}
