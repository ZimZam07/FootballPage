// Shared Club Hub types. Safe to import from both server and client code.

export type LeagueId = "pl" | "laliga" | "seriea" | "bundesliga" | "ligue1";

export interface TeamLite {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
}

/** A club the user can follow. Stored in localStorage, so keep it small. */
export interface ClubRef {
  id: string;
  league: LeagueId;
  name: string;
  shortName: string;
  logo: string;
}

export interface LeagueTeams {
  league: LeagueId;
  name: string;
  teams: (TeamLite & { color: string | null })[];
}

export type MatchState = "pre" | "in" | "post";

export interface MatchSide {
  team: TeamLite;
  score: number | null;
  shootout: number | null;
  winner: boolean;
}

export interface MatchSummary {
  id: string;
  date: string;
  competition: string;
  round: string | null;
  venue: string | null;
  state: MatchState;
  statusName: string;
  statusDetail: string;
  home: MatchSide;
  away: MatchSide;
}

export interface ClubOverview {
  /** Schedule feeds that failed to load. Empty lists then mean "unknown", not "none". */
  unavailable: ("fixtures" | "results")[];
  club: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    color: string | null;
    alternateColor: string | null;
    standingSummary: string | null;
    league: LeagueId;
    leagueName: string;
  };
  fixtures: MatchSummary[];
  results: MatchSummary[];
}

export interface StandingRow {
  position: number;
  team: TeamLite;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Points deducted by the league this season (0 when none). */
  deductions: number;
  zone: { color: string; description: string } | null;
}

export interface Standings {
  league: LeagueId;
  leagueName: string;
  season: string;
  rows: StandingRow[];
}

export interface PlayerStat {
  key: string;
  label: string;
  value: string;
}

export interface Player {
  id: string;
  name: string;
  jersey: string | null;
  position: string;
  positionGroup: "Goalkeepers" | "Defenders" | "Midfielders" | "Forwards" | "Other";
  age: number | null;
  dateOfBirth: string | null;
  height: string | null;
  weight: string | null;
  nationality: string | null;
  flag: string | null;
  headshot: string | null;
  birthPlace: string | null;
  injury: string | null;
  stats: PlayerStat[];
  profileUrl: string | null;
}

export interface Squad {
  season: string | null;
  players: Player[];
}

export interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  source: string;
  url: string;
  image: string | null;
  published: string;
}

export interface LineupPlayer {
  id: string;
  name: string;
  shortName: string;
  jersey: string | null;
  position: string;
  positionAbbr: string;
  formationPlace: number;
  subbedIn: boolean;
  subbedOut: boolean;
  /** Headshot URL when the provider publishes one for this match; null otherwise. */
  headshot: string | null;
  /**
   * This player's goals, assists and cards in this match, from the provider's per-player box score.
   * null when the provider has not published per-player match stats (e.g. before kick-off).
   */
  contributions: PlayerContributions | null;
  /** Substitution links, from the provider's substitution events (null when not published). */
  cameOn: SubstitutionLink | null;
  wentOff: SubstitutionLink | null;
}

export interface PlayerContributions {
  goals: number;
  ownGoals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  /** The red card was a second booking (from the provider's event label). */
  secondYellow: boolean;
}

export interface SubstitutionLink {
  minute: string;
  /** The other player in the substitution: who they replaced (cameOn) or who replaced them (wentOff). */
  other: { id: string; name: string; shortName: string; jersey: string | null } | null;
}

export interface MatchTeamDetail {
  team: TeamLite;
  score: number | null;
  formation: string | null;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface MatchStatLine {
  key: string;
  label: string;
  home: string;
  away: string;
  homeValue: number;
  awayValue: number;
}

export interface WinProbability {
  provider: string;
  home: number;
  draw: number;
  away: number;
}

export interface MatchDetail {
  id: string;
  date: string;
  competition: string;
  venue: string | null;
  attendance: number | null;
  state: MatchState;
  statusDetail: string;
  /** While in play: "H1 · 16'", "HT", "H2 · 67'", "ET · 105'" or "Penalties". */
  liveLabel: string | null;
  home: MatchTeamDetail;
  away: MatchTeamDetail;
  stats: MatchStatLine[];
  probability: WinProbability | null;
  /** Key match events, newest first (empty before kick-off). */
  events: MatchEvent[];
}

export type MatchEventKind =
  | "goal"
  | "own-goal"
  | "penalty-miss"
  | "yellow"
  | "red"
  | "sub"
  | "shot-on"
  | "shot-off"
  | "shot-blocked"
  | "woodwork"
  | "var"
  | "period";

export interface EventPlayer {
  name: string;
  id: string | null;
  jersey: string | null;
  position: string | null;
}

export interface MatchEvent {
  id: string;
  kind: MatchEventKind;
  /** Display label from the provider, e.g. "Goal - Volley", "Shot On Target", "Halftime". */
  label: string;
  minute: string;
  period: number;
  side: "home" | "away" | null;
  /** The provider's own description of the event. */
  text: string | null;
  player: EventPlayer | null;
  /** Assist provider for goals; the player coming off for substitutions. */
  related: { role: "assist" | "off"; player: EventPlayer } | null;
  /** Score after this event (goals only). */
  score: { home: number; away: number } | null;
  penalty: boolean;
}
