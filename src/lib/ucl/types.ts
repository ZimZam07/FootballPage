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

export interface UclScorer {
  id: string;
  name: string;
  headshot: string | null;
  team: TeamLite;
  goals: number;
  matches: number | null;
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
  scorers: UclScorer[];
}
