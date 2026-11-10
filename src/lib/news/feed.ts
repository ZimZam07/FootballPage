import { decode, tag } from "@/lib/club-hub/news";
import type { NewsEdition, NewsSource, NewsStory } from "./types";
import { MIN_SCORE, assess } from "./relevance";
import { latestRetirementSpotlight } from "./retirements";

/**
 * A short, factual editorial cue shown above the publisher's headline. It only names what the
 * headline itself says happened (a done deal, a sacking, a record), never adds facts or drama.
 */
function hookFor(s: Pick<NewsStory, "category" | "transfer" | "retirement" | "title">, signal: string | null): string | null {
  if (s.category === "tributes") return "In memoriam";
  if (s.category === "retirements") return s.retirement === "international" ? "International farewell" : "Retirement";
  if (s.category === "transfers") return s.transfer === "confirmed" ? "Done deal" : s.transfer === "reported" ? "Transfer talks" : "Transfer whispers";
  if (s.category === "managers") {
    // A change only when the headline reports it as done; hedged ones ("expected to sack") are pressure.
    const done = /\b(sack|sacks|sacked|dismiss(?:es|ed)|appoint(?:s|ed)|resign(?:s|ed)|new (?:manager|head coach|boss)|named (?:as )?(?:new )?(?:manager|head coach|boss))\b/i.test(s.title);
    const hedged = /\b(likely|expected|set to|poised|could|would|may|might|consider(?:s|ing)?|candidate|frontrunner|favourite|risk|doubt|future|pressure|mulls?|weigh(?:s|ing)?|talks)\b|\?/i.test(s.title);
    return done && !hedged ? "Change in the dugout" : "Pressure in the dugout";
  }
  if (s.category === "injuries") return "Injury news";
  switch (signal) {
    case "honour":
      return "Awards";
    case "record":
      return "Record books";
    case "drama":
      return /\bcomeback|fight back\b/i.test(s.title) ? "Comeback" : /\bstun|shock|upset\b/i.test(s.title) ? "Shock result" : "Drama";
    case "stakes":
      return "Big game";
    case "controversy":
      return "Talking point";
    default:
      return null;
  }
}

/**
 * TimesOfFootball's sources: public football feeds from four established newsrooms. Headlines
 * are the publishers' own and every story links to the original article. Feeds are cached for ten
 * minutes, so visitors never trigger an upstream request each; a failing source is skipped.
 */
const REFRESH_SECONDS = 60 * 10;
const MAX_AGE_HOURS = 72;
const UA = "Mozilla/5.0 (compatible; FootballHub/1.0; +https://footballhub-live.vercel.app)";

type Raw = Omit<NewsStory, "id" | "category" | "transfer" | "world" | "retirement" | "score" | "hook" | "subject" | "spotlight">;

/** The fields we read from ESPN's news API. */
interface EspnArticle {
  headline?: string;
  description?: string;
  published?: string;
  type?: string;
  images?: { url?: string }[];
  links?: { web?: { href?: string } };
}

// RSS feeds get an identifying user-agent; ESPN's API (like the rest of the site's ESPN calls) is sent the default one, as it rejects bot-style agents.
async function get(url: string, headers: Record<string, string> = { "user-agent": UA }): Promise<Response> {
  const res = await fetch(url, { headers, next: { revalidate: REFRESH_SECONDS }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res;
}

const attr = (xml: string, el: string, name: string) => xml.match(new RegExp(`<${el}\\b[^>]*\\b${name}="([^"]+)"`))?.[1] ?? null;

/** Plain text from an RSS description: first paragraph, tags stripped, trimmed to a sentence or two. */
function summarise(html: string | null): string | null {
  if (!html) return null;
  const first = html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? html;
  const text = decode(first.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > 240 ? `${text.slice(0, 237).replace(/\s+\S*$/, "")}…` : text;
}

const items = (xml: string) => xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];

/** Not news: polls, quizzes, podcasts, live blogs, predictions and video-only items. */
const NOT_NEWS = /\b(quiz(zes)?|football daily|the fiver|newsletter|vote here|have your say|podcast|football weekly|predictions?|predictor|fantasy|as it happened|in pictures)\b|(^|[\s'"‘“])(live|watch|listen|video)\s*:/i;

function rss(source: NewsSource, xml: string, image: (item: string) => string | null, skip: (item: string, link: string) => boolean = () => false): Raw[] {
  return items(xml).flatMap((item, rank) => {
    const title = tag(item, "title");
    const url = tag(item, "link");
    const pub = tag(item, "pubDate");
    if (!title || !url || !pub || !/^https:\/\//.test(url) || NOT_NEWS.test(title) || skip(item, url)) return [];
    const date = new Date(pub);
    if (Number.isNaN(date.getTime())) return [];
    return [{ title, summary: summarise(tag(item, "description")), url: url.replace(/\?at_medium=RSS.*$/, ""), image: image(item), source, published: date.toISOString(), rank }];
  });
}

const SOURCES: { name: NewsSource; load: () => Promise<Raw[]> }[] = [
  {
    name: "BBC Sport",
    load: async () =>
      rss("BBC Sport", await (await get("https://feeds.bbci.co.uk/sport/football/rss.xml")).text(), (item) =>
        // The feed carries 240px thumbnails; BBC serves the same image at larger standard widths.
        attr(item, "media:thumbnail", "url")?.replace("/ace/standard/240/", "/ace/standard/800/") ?? null,
      ),
  },
  {
    name: "The Guardian",
    load: async () =>
      rss(
        "The Guardian",
        await (await get("https://www.theguardian.com/football/rss")).text(),
        (item) => {
          // Several signed sizes are listed; take the widest.
          const sizes = [...item.matchAll(/<media:content\b[^>]*width="(\d+)"[^>]*url="([^"]+)"/g)].map((m) => ({ w: Number(m[1]), url: decode(m[2]) }));
          return sizes.sort((a, b) => b.w - a.w)[0]?.url ?? null;
        },
        (_, link) => /\/(live|audio|video|gallery|picture)\//.test(link),
      ),
  },
  {
    name: "Sky Sports",
    load: async () =>
      rss("Sky Sports", await (await get("https://www.skysports.com/rss/11095")).text(), (item) =>
        attr(item, "enclosure", "url")?.replace("/1920x1080/", "/768x432/") ?? null,
      ),
  },
  {
    name: "ESPN",
    load: async () => {
      const data = (await (await get("https://site.api.espn.com/apis/site/v2/sports/soccer/all/news?limit=50", { accept: "application/json" })).json()) as { articles?: EspnArticle[] };
      return (data?.articles ?? []).flatMap((a, rank): Raw[] => {
        const url = String(a?.links?.web?.href ?? "").replace(/^http:/, "https:");
        const date = new Date(a?.published ?? "");
        // Video clips aren't articles; keep stories, news and match reports.
        if (!a?.headline || !url.startsWith("https://") || Number.isNaN(date.getTime()) || a.type === "Media" || NOT_NEWS.test(a.headline)) return [];
        return [{ title: String(a.headline), summary: a.description ? summarise(String(a.description)) : null, url, image: a.images?.[0]?.url ?? null, source: "ESPN", published: date.toISOString(), rank }];
      });
    },
  },
];

// ---------------------------------------------------------------------------
// Categories. Keyword rules over the publisher's own headline and summary; the most specific wins.

const RX = {
  tribute: /\b(dies|died|has died|death of|passed away|obituary|tributes? (paid|pour)|mourn(s|ing)?)\b/i,
  retirement: /\b(retire(s|d|ment)?|hangs? up (his|her) boots|calls? time on (his|her) career)\b/i,
  transfer: /\b(transfers?|signs?|signing|signed|joins?|joined|on loan|loan (move|deal|spell)|bid for|release clause|swoop|transfer fee|contract|new deal|pre-contract|wants? to sign|set to join|linked with|watchlist|(close|closing) in on|agree(s|d)? (a )?(fee|deal|terms))\b|[£€$]\s?\d+(\.\d+)?\s?(m|bn)\b/i,
  // Changes in charge and in the boardroom (not every quote from a "boss").
  manager: /\b(sack(s|ed|ing)?|appoint(s|ed|ment)?|interim (boss|manager|coach)|resign(s|ed|ation)?|replacement|takeover|ownership|new (manager|head coach|boss)|(manager|head coach|boss)('s)? (future|job|post|role)|job (on the line|security|race)|leading candidate)\b/i,
  // A player "ruled out of" a game, not a goal "ruled out" by VAR; "(knee)"-style notes count.
  injury: /\b(injur(y|ed|ies)|ruled out of|surgery|acl|hamstring|sidelined|fitness (doubt|blow|concern)|out for (the )?season|scan)\b|\((knee|ankle|hamstring|groin|calf|thigh|foot|back|illness)\)/i,
  international: /\b(world cup|euro 20\d\d|nations league|qualif(y|ier|iers|ying|ication)|international (break|duty|retirement)|national team|afcon|copa am[eé]rica|friendl(y|ies)|olympic)\b|\b(england|scotland|wales|northern ireland|republic of ireland|brazil|argentina|france|germany|spain|portugal|italy|netherlands|nigeria|usmnt|mexico|india)('s)? (squad|boss|coach|manager|call-?up)\b|\b(u2[13]|under-2[13]) squad\b/i,
  match: /\b(\d+-\d+|win(s|ning)?|won|beat(s|en)?|draw(s|n)?|held|rescue(s|d)?|edge(s|d)?|sink(s)?|hammer(s|ed)?|defeat(s|ed)?|thrash(es|ed)?|comeback|fight back|stun(s|ned)?|late (winner|goal|equaliser)|stoppage[- ]time|equalis(er|es|ed)|winner|scores?|scored|brace|double|hat-trick|victory|thriller|rout(s|ed)?|title race|derby|knocked out|through to|semi-final|quarter-?final|play-?offs?|relegation|promotion|clean sheet|vital win|on target)\b/i,
};
/** A deal the publisher reports as done. */
const CONFIRMED = /\b(here we go|signs?|signed|joins?|joined|completes?|completed|confirm(s|ed)|unveil(s|ed)|agrees? new (contract|deal)|extends? (his |her )?contract|pens new)\b/i;
/** Any hedge means it isn't done. */
const SPECULATIVE = /\b(could|would|might|set to|close to|closing in|nearing|eye(s|ing)?|wants?|interest(ed)?|considering|consider|in talks|talks|bid|target(s|ed|ing)?|linked|race|plan(s|ning)?|monitor(s|ing)?|rumou?rs?|reportedly|weigh(s|ing)?|gossip|keen|approach(ed)?|open to|watchlist|papers)\b|\?/i;
/** Speculation about interest, without negotiations or a bid: a rumour. */
const RUMOUR = /\b(linked|interest(ed)?|eye(s|ing)?|wants?|watchlist|monitor(s|ing)?|consider(s|ing)?|keen|rumou?rs?|gossip|papers|could|might|target(s|ed|ing)?)\b|\?/i;
const AWARD = /\b(ballon d['’]or|golden boy|golden boot|fifpro|the best|player of the (month|year|season)|manager of the (month|year|season)|team of the (year|season)|world (11|xi)|record-breaking|breaks? (his|her|the|a) record|sets? (a )?record|milestone)\b/i;
const INTERNATIONAL_RETIREMENT = /\binternational (football|duty|career|retirement)\b|\b(retires?|retirement|farewell) from (international|his country|her country|the national team)\b|\bnational team\b|\b(Portugal|Argentina|Brazil|France|England|Spain|Germany|Italy|Netherlands|Belgium|Croatia|Uruguay|Poland|Wales|Scotland)\b/i;
/** Football beyond England: other leagues, clubs, continents and international football. */
const WORLD = /\b(la ?liga|serie a|bundesliga|ligue 1|eredivisie|mls|liga mx|saudi pro league|saudi|brazil(ian)?|argentin(a|e)|africa(n)?|afcon|asia(n)?|j-league|a-league|copa|libertadores|real madrid|barcelona|atl[eé]tico|bayern|dortmund|psg|paris saint-germain|juventus|inter milan|internazionale|ac milan|napoli|roma|benfica|porto|ajax|celtic|rangers|al-?hilal|al-?nassr|inter miami|world cup|uefa|fifa|nations league|nigeria|ghana|morocco|egypt|japan|korea|australia|usmnt|mexico|canada|india(n)?|isl)\b/i;

function categorise(s: Raw): Pick<NewsStory, "category" | "transfer" | "world" | "retirement"> {
  const text = `${s.title} ${s.summary ?? ""}`;
  const head = s.title;
  const world = WORLD.test(text);
  // Most specific first: a death or retirement outranks everything; an injury or a sacking
  // outranks the transfer talk that often rides along in the same headline.
  if (RX.tribute.test(head)) return { category: "tributes", world };
  if (RX.retirement.test(head) && !/\b(rules? out|not (?:ready|going) to|won't|will not|no plans to|denies)\b/i.test(head)) {
    return { category: "retirements", world, retirement: INTERNATIONAL_RETIREMENT.test(text) ? "international" : "professional" };
  }
  if (RX.injury.test(head)) return { category: "injuries", world };
  if (RX.manager.test(head)) return { category: "managers", world };
  if (RX.transfer.test(head) || /\b(gossip|here we go)\b/i.test(head)) {
    // Confirmed only when the publisher reports a completed deal; interest alone is a rumour;
    // everything in between (talks, bids, agreements in principle) is reported.
    const transfer = CONFIRMED.test(head) && !SPECULATIVE.test(head) ? "confirmed" : RUMOUR.test(head) ? "rumour" : "reported";
    return { category: "transfers", transfer, world };
  }
  if (AWARD.test(head)) return { category: "awards", world };
  if (RX.international.test(head)) return { category: "international", world: true };
  if (RX.match.test(head)) return { category: "matches", world };
  return { category: "football", world };
}

// ---------------------------------------------------------------------------
// De-duplication: the same story from two newsrooms has near-identical key words.

const STOP = new Set("the a an and or of to in on at for with from by as is are was were be been his her their its it this that after before over into out up v vs new says say said will has have had not but".split(" "));
const words = (t: string) => new Set(t.toLowerCase().replace(/['’]s\b/g, "").split(/[^a-z0-9à-ÿ]+/).filter((w) => w.length > 2 && !STOP.has(w)));
function similar(a: Set<string>, b: Set<string>) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size || 1) >= 0.7 && shared >= 3;
}

/**
 * The people, clubs and places a headline names (its capitalised words), with common aliases folded
 * together. Different newsrooms word the same story differently but name the same people: three
 * shared names within a day and a half means the same story.
 */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ALIAS: Record<string, string> = { barca: "barcelona", atleti: "atletico", spurs: "tottenham", gunners: "arsenal" };
/** Multi-word clubs become one name, so "Man Utd" and "Manchester United" are one club, not two names. */
const CLUBS: [RegExp, string][] = [
  [/\bMan(?:chester)?\.? (?:Utd|United)\b/g, "ManUtd"],
  [/\bMan(?:chester)?\.? City\b/g, "ManCity"],
  [/\b(?:Atl[eé]tico(?: de)? Madrid|Atleti)\b/g, "Atletico"],
  [/\bReal Madrid\b/g, "RealMadrid"],
  [/\b(?:Paris Saint-Germain|Paris St-Germain|PSG)\b/g, "PSG"],
  [/\bAston Villa\b/g, "Villa"],
  [/\bCrystal Palace\b/g, "Palace"],
  [/\bBayern Munich\b/g, "Bayern"],
  [/\bNottingham Forest\b/g, "Forest"],
  [/\b(?:Inter Milan|Internazionale)\b/g, "Inter"],
  [/\bAC Milan\b/g, "Milan"],
  [/\bNewcastle United\b/g, "Newcastle"],
  [/\bWest Ham(?: United)?\b/g, "WestHam"],
  [/\bTottenham(?: Hotspur)?\b/g, "Tottenham"],
];
const GENERIC = new Set(
  "the a an and why how what who where when is are was it its this that he she they his her their after as at in on of to for with from by v vs stats watch premier league champions cup fa var monday tuesday wednesday thursday friday saturday sunday women men super world english scottish la liga serie bundesliga ligue mls wsl latest club chief boss news transfer rumors rumours gossip report live".split(" "),
);
function names(title: string) {
  const out = new Set<string>();
  const t = CLUBS.reduce((s, [re, name]) => s.replace(re, name), title);
  for (const raw of t.match(/[\p{Lu}][\p{L}'’-]+/gu) ?? []) {
    const w = fold(raw.replace(/['’]s$/, ""));
    const n = ALIAS[w] ?? w;
    if (n.length > 2 && !GENERIC.has(n)) out.add(n);
  }
  return out;
}
const sameStory = (a: { n: Set<string>; t: number }, b: { n: Set<string>; t: number }) => {
  if (Math.abs(a.t - b.t) > 36 * 3600_000) return false;
  let shared = 0;
  for (const x of a.n) if (b.n.has(x)) shared++;
  // Three shared names, or two that make up most of both headlines (e.g. the same two clubs' match).
  return shared >= 3 || (shared >= 2 && shared / Math.min(a.n.size, b.n.size) >= 0.66);
};

/** Rumour round-ups and question headlines: kept, but never chosen to stand for a reported story. */
const speculative = (s: Raw) => /\?\s*$|\brumou?rs?\b|\bgossip\b|^papers:/i.test(s.title);

/** Prefer the copy with an image and a summary. */
const richness = (s: Raw) => (s.image ? 2 : 0) + (s.summary ? 1 : 0);

let inFlight: Promise<NewsEdition> | null = null;

/** `keepAll` returns every assessed story (for editorial analysis scripts); the site never uses it. */
export async function getFootballNews(opts: { keepAll?: boolean } = {}): Promise<NewsEdition> {
  if (inFlight && !opts.keepAll) return inFlight;
  inFlight = (async () => {
    const results = await Promise.allSettled(SOURCES.map((s) => s.load()));
    const cutoff = Date.now() - MAX_AGE_HOURS * 3600_000;
    const future = Date.now() + 10 * 60_000;

    const raw = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter((s) => {
        const t = new Date(s.published).getTime();
        return t >= cutoff && t <= future;
      })
      // Which copy of a story survives: one with a picture and summary, then the one its publisher
      // placed most prominently, then the newest.
      .sort((a, b) => richness(b) - richness(a) || +speculative(a) - +speculative(b) || a.rank - b.rank || +new Date(b.published) - +new Date(a.published));

    const kept: { s: Raw; w: Set<string>; n: Set<string>; t: number }[] = [];
    const urls = new Set<string>();
    for (const s of raw) {
      const entry = { s, w: words(s.title), n: names(s.title), t: new Date(s.published).getTime() };
      if (urls.has(s.url) || kept.some((k) => similar(k.w, entry.w) || sameStory(k, entry))) continue;
      urls.add(s.url);
      kept.push(entry);
    }

    const now = Date.now();
    const assessed: NewsStory[] = kept.map(({ s }) => {
      const cat = categorise(s);
      const a = assess(s.title, s.summary, (now - new Date(s.published).getTime()) / 3600_000, s.rank);
      const story = { ...s, ...cat, id: `${s.source}:${s.url}`, score: a.score, subject: a.subject, hook: null as string | null };
      story.hook = hookFor(story, a.signal);
      return story;
    });
    // Editorial bar: fewer, better stories. Low-interest items are dropped rather than padded in.
    const stories = assessed.filter((s) => opts.keepAll || s.score >= MIN_SCORE).sort((a, b) => +new Date(b.published) - +new Date(a.published));

    // Retirement spotlight: a fresh, major retirement in today's news takes the slot itself;
    // otherwise the most recent verified one is kept, with its original date.
    const freshRetirement = stories.find((s) => s.category === "retirements" && s.score >= MIN_SCORE + 4);
    const verified = latestRetirementSpotlight(now);
    const retirementSpotlight = freshRetirement || !verified || stories.some((s) => s.url === verified.url) ? null : verified;

    return {
      generatedAt: new Date().toISOString(),
      stories,
      retirementSpotlight,
      filtered: assessed.length - stories.length,
      sources: SOURCES.map((s, i) => {
        const r = results[i];
        return { name: s.name, ok: r.status === "fulfilled", count: stories.filter((x) => x.source === s.name).length };
      }),
    };
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
