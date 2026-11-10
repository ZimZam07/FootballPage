/** TimesOfFootball: real football stories from established newsrooms, linked to the original articles. */

export type NewsCategory = "transfers" | "matches" | "managers" | "awards" | "injuries" | "international" | "tributes" | "retirements" | "football";

export type NewsSource = "BBC Sport" | "The Guardian" | "Sky Sports" | "ESPN";

export interface NewsStory {
  id: string;
  /** The publisher's own headline, unchanged. */
  title: string;
  summary: string | null;
  /** The original article on the publisher's site. */
  url: string;
  image: string | null;
  source: NewsSource;
  /** ISO timestamp from the publisher's feed. */
  published: string;
  category: NewsCategory;
  /**
   * Transfers only. "confirmed": the publisher reports a completed deal. "reported": negotiations,
   * bids or agreements in principle. "rumour": interest or speculation.
   */
  transfer?: "confirmed" | "reported" | "rumour";
  /** Retirements only: from international football, or from playing altogether. */
  retirement?: "international" | "professional";
  /** Whether the story is about football beyond England (for "Around the football world"). */
  world: boolean;
  /** How prominently the publisher placed it in its feed (0 = top story). */
  rank: number;
  /** Internal editorial weight (see relevance.ts). Used for placement only; never displayed. */
  score: number;
  /** A short, factual editorial cue for the story, e.g. "Done deal" or "In the dugout". */
  hook: string | null;
  /** The most prominent club or person in the story. */
  subject: string | null;
  /** A dated, verified story kept from earlier (not new today), e.g. a retirement spotlight. */
  spotlight?: boolean;
}

export interface NewsEdition {
  generatedAt: string;
  stories: NewsStory[];
  /** The most significant verified retirement story, shown with its original date. */
  retirementSpotlight: NewsStory | null;
  /** Stories left out because they fell below the editorial bar (count only). */
  filtered: number;
  sources: { name: NewsSource; ok: boolean; count: number }[];
}
