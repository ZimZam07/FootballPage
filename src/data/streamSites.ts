/**
 * External football websites listed on Watch Live Matches. Football Hub only links to them —
 * nothing is fetched, embedded or scraped. To add a site later, append an entry here.
 */
export interface StreamSite {
  id: string;
  name: string;
  /** Exact destination, opened in a new tab. */
  url: string;
  /** Short label describing the site's general purpose. */
  label: string;
  description: string;
  /** Text wordmark (no official logos are used): the name split into a plain and an accented part. */
  wordmark: [string, string];
  theme: {
    /** Main brand-treatment colour and a second colour for gradients. */
    primary: string;
    secondary: string;
    /** Deep, brand-tinted panel background. */
    ground: string;
  };
  /** Typographic treatment and background figure for the destination panel. */
  look: "slash" | "arcs";
}

export const STREAM_SITES: StreamSite[] = [
  {
    id: "totalsportek",
    name: "TotalSportek",
    url: "https://totalsportekl.is/",
    label: "Football coverage hub",
    description: "A football-focused destination for discovering match coverage and football streaming information.",
    wordmark: ["Total", "Sportek"],
    theme: { primary: "#ff6a2b", secondary: "#e8233f", ground: "#170d09" },
    look: "slash",
  },
  {
    id: "epic-sports",
    name: "Epic Sports",
    url: "https://www.epicsports.xyz/",
    label: "Multi-sport platform",
    description: "A sports platform where football fans can explore match coverage and available viewing options.",
    wordmark: ["Epic ", "Sports"],
    theme: { primary: "#9b7bff", secondary: "#35c8e8", ground: "#0e0c1a" },
    look: "arcs",
  },
];

/** "https://www.epicsports.xyz/" -> "epicsports.xyz" */
export const displayHost = (url: string) => new URL(url).hostname.replace(/^www\./, "");
