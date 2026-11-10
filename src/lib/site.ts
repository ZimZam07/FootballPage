/** Public production origin, used for canonical URLs, Open Graph, robots.txt and the sitemap. */
export const SITE_URL = "https://footballhub-live.vercel.app";

export const SITE_TITLE = "Football Hub | Your Ultimate Football Destination";
export const SITE_DESCRIPTION =
  "Explore football clubs, live match coverage, the latest football news, creators, iconic football matches and UEFA Champions League information, all in one place.";

/** The landing page at "/". */
export const LANDING_TITLE = "Football Hub — Your World of Football";
export const LANDING_DESCRIPTION =
  "Every side of the beautiful game: where to watch live matches, your club across Europe's top five leagues, the Champions League, today's football news, the greatest matches in history and the best football creators.";

/** Home-page sections opened with ?tab= (order used by the sitemap). */
export const SECTION_TABS = ["club", "ucl", "big", "creators"] as const;

/** Watch Live Matches and TimesOfFootball have their own routes; the other sections live on the home page. */
export const WATCH_LIVE_PATH = "/watch-live";
export const NEWS_PATH = "/football-news";

/** Where a primary-navigation section lives. */
export const sectionHref = (id: string) => (id === "live" ? WATCH_LIVE_PATH : id === "news" ? NEWS_PATH : `/?tab=${id}`);
