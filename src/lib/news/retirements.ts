import type { NewsStory } from "./types";

/**
 * Major retirement stories, kept so TimesOfFootball always has its most important retirement news
 * even on days without a new announcement. Each entry is a real, published article: the headline,
 * summary, date, picture and link are the publisher's own (checked against ESPN's article records), and the
 * facts were cross-checked with other established outlets. They are shown with their original
 * date and labelled as a spotlight, never as new.
 *
 * Add an entry only for a genuinely major figure, from an established publisher, after verifying it.
 */
const VERIFIED: NewsStory[] = [
  {
    id: "spotlight:ronaldo-international-2026",
    title: "Cristiano Ronaldo retires from international duty after Portugal boss fallout",
    summary: "Cristiano Ronaldo has retired from international football following a fallout with Portugal boss Jorge Jesus.",
    url: "https://www.espn.com/soccer/story/_/id/49266866/cristiano-ronaldo-portugal-jorge-jesus-retires-international",
    image: "https://a.espncdn.com/photo/2026/0720/r1691807_1296x729_16-9.jpg",
    source: "ESPN",
    published: "2026-11-05T17:53:44Z",
    category: "retirements",
    retirement: "international",
    world: true,
    rank: 0,
    score: 0,
    hook: "International farewell",
    subject: "Cristiano Ronaldo",
    spotlight: true,
  },
  {
    id: "spotlight:messi-international-2026",
    title: "Argentina legend Lionel Messi announces international retirement",
    summary: "Lionel Messi on Monday announced his retirement from international soccer with a heartfelt Instagram post.",
    url: "https://www.espn.com/soccer/story/_/id/49266819/lionel-messi-argentina-international-retirement-world-cup-copa-america",
    image: "https://a.espncdn.com/photo/2026/0831/r1709546_1296x729_16-9.jpg",
    source: "ESPN",
    published: "2026-09-01T01:36:54Z",
    category: "retirements",
    retirement: "international",
    world: true,
    rank: 0,
    score: 0,
    hook: "International farewell",
    subject: "Lionel Messi",
    spotlight: true,
  },
];

/** The most recent verified retirement story from the last year (spotlights age out). */
export function latestRetirementSpotlight(now: number): NewsStory | null {
  const year = 365 * 86_400_000;
  return [...VERIFIED].filter((s) => now - new Date(s.published).getTime() < year).sort((a, b) => +new Date(b.published) - +new Date(a.published))[0] ?? null;
}
