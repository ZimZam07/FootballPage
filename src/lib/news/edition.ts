import type { NewsCategory, NewsStory } from "./types";

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  transfers: "Transfers",
  matches: "Matchday",
  managers: "Managers & clubs",
  awards: "Awards & records",
  injuries: "Injuries",
  international: "International",
  tributes: "Tributes",
  retirements: "Retirements",
  football: "Football",
};

export const CATEGORY_COLOR: Record<NewsCategory, string> = {
  transfers: "#f5b83d",
  matches: "#d4f53c",
  managers: "#ff7a59",
  awards: "#e9c46a",
  injuries: "#f87171",
  international: "#5ad1ff",
  tributes: "#cbd5e1",
  retirements: "#c4b5fd",
  football: "#94a3b8",
};

/** A story counts as "just in" for its first hour, and only then — never a kept spotlight. */
export const isJustIn = (s: NewsStory, now: number) => !s.spotlight && now - new Date(s.published).getTime() < 60 * 60_000;

/**
 * Placement weight: the editorial score (who, what, where, when — see relevance.ts), plus a usable
 * picture. Rumours and question headlines can appear anywhere but never lead the page.
 */
function weight(s: NewsStory) {
  const speculative = s.transfer === "rumour" || /\?\s*$/.test(s.title) ? 3 : s.transfer === "reported" ? 1 : 0;
  return s.score + (s.image ? 1 : 0) + (s.summary ? 0.5 : 0) - speculative;
}

export interface Edition {
  lead: NewsStory | null;
  headlines: NewsStory[];
  latest: NewsStory[];
  transfers: NewsStory[];
  world: NewsStory[];
  people: NewsStory[];
  more: NewsStory[];
}

/** Lays the stories out once each: lead, its companions, then themed desks, then the rest. */
export function arrange(stories: NewsStory[]): Edition {
  const used = new Set<string>();
  const take = (list: NewsStory[], n: number) => {
    const out: NewsStory[] = [];
    for (const s of list) {
      if (out.length >= n) break;
      if (used.has(s.id)) continue;
      used.add(s.id);
      out.push(s);
    }
    return out;
  };
  const byWeight = [...stories].sort((a, b) => weight(b) - weight(a));
  const byTime = [...stories].sort((a, b) => +new Date(b.published) - +new Date(a.published));
  /** Within a desk: the most significant first, so the best transfer leads the transfer centre. */
  const desk = (match: (s: NewsStory) => boolean, n: number) => take(byWeight.filter(match), n);

  const lead = take(byWeight.filter((s) => s.image && s.summary), 1)[0] ?? take(byWeight, 1)[0] ?? null;
  const headlines = take(byWeight.filter((s) => s.image), 3);
  const transfers = desk((s) => s.category === "transfers", 6);
  const people = desk((s) => ["managers", "awards", "injuries", "tributes", "retirements"].includes(s.category), 6);
  const world = desk((s) => s.world || s.category === "international", 6);
  const latest = take(byTime, 8);
  const more = take(byWeight, 30);
  return { lead, headlines, latest, transfers, world, people, more };
}
