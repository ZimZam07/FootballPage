import type { LeagueConfig } from "./leagues";
import type { NewsItem } from "./types";
import { getEspnNews } from "./espn";

/**
 * Club news is merged from two real sources:
 *  - ESPN's team news feed (with images and summaries)
 *  - Google News RSS, India edition (wide publisher coverage: The Hindu,
 *    NDTV, Khel Now, The Guardian, official club sites, ...)
 * Nothing is generated; items without a working link are dropped.
 */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .trim();
}

export const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
};

async function getGoogleNews(clubName: string): Promise<NewsItem[]> {
  const q = encodeURIComponent(`"${clubName}" football when:7d`);
  const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`, {
    next: { revalidate: 60 * 15 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.slice(0, 30).flatMap((item) => {
    const rawTitle = tag(item, "title");
    const link = tag(item, "link");
    const pub = tag(item, "pubDate");
    const source = tag(item, "source");
    if (!rawTitle || !link || !pub) return [];
    // Google appends " - Publisher" to every headline.
    const title = source && rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
    const date = new Date(pub);
    if (Number.isNaN(date.getTime())) return [];
    return [{
      id: `gn-${tag(item, "guid") ?? link}`,
      title,
      description: null,
      source: source ?? "Google News",
      url: link,
      image: null,
      published: date.toISOString(),
    }];
  });
}

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60);

export async function getClubNews(config: LeagueConfig, teamId: string, clubName: string): Promise<NewsItem[]> {
  const [espn, google] = await Promise.allSettled([getEspnNews(config, teamId), getGoogleNews(clubName)]);
  const espnItems: NewsItem[] =
    espn.status === "fulfilled" ? espn.value.map((n) => ({ ...n, source: "ESPN" })) : [];
  const googleItems = google.status === "fulfilled" ? google.value : [];
  if (espn.status === "rejected" && google.status === "rejected") {
    throw new Error("News sources are unavailable right now.");
  }

  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  // ESPN first so its richer (image + summary) version wins duplicates.
  for (const item of [...espnItems, ...googleItems]) {
    const key = normalize(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  return merged
    .filter((n) => new Date(n.published).getTime() > cutoff)
    .sort((a, b) => +new Date(b.published) - +new Date(a.published))
    .slice(0, 24);
}
