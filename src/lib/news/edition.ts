import type { NewsCategory, NewsStory } from "./types";

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  transfers: "Transfers",
  matches: "Matchday",
  managers: "Managers & clubs",
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
  injuries: "#f87171",
  international: "#5ad1ff",
  tributes: "#cbd5e1",
  retirements: "#c4b5fd",
  football: "#94a3b8",
};

/** A story counts as "just in" for its first hour, and only then. */
export const isJustIn = (s: NewsStory, now: number) => now - new Date(s.published).getTime() < 60 * 60_000;

/**
 * Editorial weight for choosing the lead: recency, the publisher's own prominence (its top stories)
 * and a usable picture. It decides placement only — nothing is shown as a ranking.
 */
function weight(s: NewsStory, now: number) {
  const hours = (now - new Date(s.published).getTime()) / 3600_000;
  const fresh = Math.max(0, 1 - hours / 36);
  const prominence = 1 - Math.min(s.rank, 20) / 20;
  // Rumours and question headlines can appear anywhere, but they shouldn't lead the page.
  const speculative = s.transfer === "reported" || /\?\s*$/.test(s.title) ? 1.5 : 0;
  return fresh * 3 + prominence * 2 + (s.image ? 1 : 0) + (s.summary ? 0.5 : 0) - speculative;
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

/** Lays the stories out once each: lead, its companions, then themed sections, then the rest. */
export function arrange(stories: NewsStory[], now: number): Edition {
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
  const byWeight = [...stories].sort((a, b) => weight(b, now) - weight(a, now));
  const byTime = [...stories].sort((a, b) => +new Date(b.published) - +new Date(a.published));

  const lead = take(byWeight.filter((s) => s.image && s.summary), 1)[0] ?? take(byWeight, 1)[0] ?? null;
  const headlines = take(byWeight.filter((s) => s.image), 3);
  const transfers = take(byTime.filter((s) => s.category === "transfers"), 6);
  const people = take(byTime.filter((s) => ["managers", "injuries", "tributes", "retirements"].includes(s.category)), 6);
  const world = take(byTime.filter((s) => s.world || s.category === "international"), 6);
  const latest = take(byTime, 8);
  const more = take(byTime, 40);
  return { lead, headlines, latest, transfers, world, people, more };
}
