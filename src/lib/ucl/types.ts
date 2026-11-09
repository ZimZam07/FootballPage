import type { MatchSide, MatchState, TeamLite } from "@/lib/club-hub/types";

export interface UclMatch {
  id: string;
  slug: string;
  date: string;
  state: MatchState;
  statusName: string;
  statusDetail: string;
  liveLabel: string | null;
  /** Stage label from the official calendar, e.g. "League Phase", "Rd of 16". */
  stage: string;
  leg: number | null;
  venue: string | null;
  home: MatchSide;
  away: MatchSide;
}

export type UclZone = "r16" | "playoff-seeded" | "playoff-unseeded" | "out";

export interface UclStandingRow {
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
  zone: UclZone;
  zoneLabel: string;
}

export interface UclStage {
  id: string;
  label: string;
  detail: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface UclTie {
  /** Stable key: the two team ids sorted. */
  id: string;
  teams: [TeamLite, TeamLite];
  legs: UclMatch[];
  aggregate: [number, number] | null;
  winnerId: string | null;
  complete: boolean;
}

export interface UclKnockoutRound {
  stage: UclStage;
  ties: UclTie[];
}

export interface UclClub extends TeamLite {
  country: string | null;
}

/** A player on one of ESPN's Champions League leaderboards (goals or assists). */
export interface UclLeader {
  id: string;
  name: string;
  headshot: string | null;
  team: TeamLite;
  /** The leaderboard's statistic: goals or assists in this season's competition. */
  value: number;
  matches: number | null;
}

/** Competition leaderboards from ESPN, or null when ESPN's statistics couldn't be loaded. */
export interface UclLeaders {
  goals: UclLeader[];
  assists: UclLeader[];
}

export interface UclCleanSheetRow {
  id: string;
  name: string;
  team: TeamLite;
  cleanSheets: number;
  /** Matches the goalkeeper played in, among the matches counted. */
  appearances: number;
}

export interface UclCleanSheets {
  generatedAt: string;
  season: string;
  /** Completed matches whose line-ups were read. */
  matchesCounted: number;
  /** Completed matches whose line-ups couldn't be loaded (the table may be incomplete). */
  matchesMissing: number;
  keepers: UclCleanSheetRow[];
}

export interface UclOverview {
  generatedAt: string;
  season: string;
  logo: string;
  stages: UclStage[];
  currentStage: UclStage | null;
  matches: UclMatch[];
  standings: UclStandingRow[];
  knockout: UclKnockoutRound[];
  clubs: UclClub[];
  leaders: UclLeaders | null;
}
