/** The Football Wire: real football stories from established newsrooms, linked to the original articles. */

export type NewsCategory = "transfers" | "matches" | "managers" | "injuries" | "international" | "tributes" | "retirements" | "football";

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
  /** Transfers only: "confirmed" when the publisher reports a completed deal, otherwise "reported". */
  transfer?: "confirmed" | "reported";
  /** Whether the story is about football beyond England (for "Around the football world"). */
  world: boolean;
  /** How prominently the publisher placed it in its feed (0 = top story). */
  rank: number;
}

export interface NewsEdition {
  generatedAt: string;
  stories: NewsStory[];
  sources: { name: NewsSource; ok: boolean; count: number }[];
}
