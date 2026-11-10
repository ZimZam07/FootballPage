/** Public production origin, used for canonical URLs, Open Graph, robots.txt and the sitemap. */
export const SITE_URL = "https://footballhub-live.vercel.app";

export const SITE_TITLE = "Football Hub | Your Ultimate Football Destination";
export const SITE_DESCRIPTION =
  "Explore football clubs, live match coverage, the latest football news, creators, iconic football matches and UEFA Champions League information, all in one place.";

/** Home-page sections that are linkable via ?tab= (order used by the sitemap). */
export const SECTION_TABS = ["live", "club", "ucl", "big", "creators"] as const;

/** TimesOfFootball (football news) has its own route; every other section lives on the home page. */
export const NEWS_PATH = "/football-news";

/** Where a primary-navigation section lives. */
export const sectionHref = (id: string) => (id === "live" ? "/" : id === "news" ? NEWS_PATH : `/?tab=${id}`);
