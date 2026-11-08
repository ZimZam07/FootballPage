/**
 * Football YouTube creators shown in the Creators tab.
 *
 * Curated and verified on 7 November 2026 against each channel's public
 * YouTube page (no YouTube API): channel name, handle, channel id, subscriber
 * count and description all come from the live channel page. Avatars are the
 * channels' own profile pictures, stored locally in /public/creators so the
 * site makes no requests to YouTube. Re-verify periodically; channels can be
 * renamed or change focus (e.g. one previously listed creator switched to
 * cricket and was removed).
 */

export interface Creator {
  id: string;
  name: string;
  handle: string;
  /** Verified YouTube channel id (stable even if the handle changes). */
  channelId: string;
  url: string;
  avatar: string;
  /** Only set where the channel's origin is verified. */
  country: { name: string; flag: string } | null;
  category: string;
  description: string;
  /** Subscriber count as displayed on the channel page at verification time. */
  subscribers: string;
  featured?: boolean;
}

export const CREATORS_VERIFIED_ON = "7 Nov 2026";

const yt = (handle: string) => `https://www.youtube.com/@${handle}`;
const INDIA = { name: "India", flag: "🇮🇳" };
const UK = { name: "United Kingdom", flag: "🇬🇧" };

/** Ordered by audience size and influence. */
export const INDIAN_CREATORS: Creator[] = [
  {
    id: "indiansuperleague", name: "MG Indian Super League", handle: "IndianSuperLeague", channelId: "UCJk-aQ7NZtqYtpcqKDt_vZg",
    url: yt("IndianSuperLeague"), avatar: "/creators/indiansuperleague.jpg", country: INDIA, category: "Official league",
    description: "The official home of India's top flight: ISL highlights, goals and the latest league updates.", subscribers: "2.99M",
  },
  {
    id: "khelnowtv", name: "Khel Now TV", handle: "KhelNowTV", channelId: "UCgq3yo_CiroLdMzd3DG3ihw",
    url: yt("KhelNowTV"), avatar: "/creators/khelnowtv.jpg", country: INDIA, category: "Indian football",
    description: "New Delhi sports production house making explainers and features on Indian football.", subscribers: "1.24M",
  },
  {
    id: "indianfootball", name: "Indian Football", handle: "IndianFootball", channelId: "UCjiPxzIyNtfQ2HZZ1eVjZlg",
    url: yt("IndianFootball"), avatar: "/creators/indianfootball.jpg", country: INDIA, category: "National team",
    description: "Official channel of the All India Football Federation and the Blue Tigers, India's national team.", subscribers: "1.22M",
  },
  {
    id: "markaroni", name: "Markaroni", handle: "Markaroni", channelId: "UC62efsUgKggjHCQvabTAeUg",
    url: yt("Markaroni"), avatar: "/creators/markaroni.jpg", country: INDIA, category: "Discussion & reactions",
    description: "Long-form football talk, reactions and humour from a fan who loves the game — with a soft spot for Barça.", subscribers: "796K",
    featured: true,
  },
  {
    id: "talkfootballhd", name: "Talk Football HD", handle: "talkfootballhd", channelId: "UCV-aKADhLal5ki1ZqEAqjjw",
    url: yt("talkfootballhd"), avatar: "/creators/talkfootballhd.jpg", country: INDIA, category: "Match analysis",
    description: "Match analysis and breakdowns of Europe's biggest games, including the Champions League.", subscribers: "630K",
  },
  {
    id: "yashyjr", name: "YjR", handle: "yashyjr", channelId: "UCXWWK4Qj0AS_EqXoYSET-8Q",
    url: yt("yashyjr"), avatar: "/creators/yashyjr.jpg", country: INDIA, category: "Analysis & stories",
    description: "Football storytelling and season analysis, with plenty of Real Madrid in the mix.", subscribers: "417K",
  },
  {
    id: "thefootballrealm", name: "The Football Realm", handle: "thefootballrealm", channelId: "UCz8d-0rl-4UgkPhY70WBMSg",
    url: yt("thefootballrealm"), avatar: "/creators/thefootballrealm.jpg", country: INDIA, category: "Transfers & talking points",
    description: "Transfer news, rankings and the biggest talking points across world football.", subscribers: "354K",
  },
  {
    id: "techtro", name: "TECHTRO – Indian Football Hub", handle: "TECHTROIndianFootballHUB", channelId: "UCG2HEh0H_BuqDFaePTcsCeA",
    url: yt("TECHTROIndianFootballHUB"), avatar: "/creators/techtroindianfootballhub.jpg", country: INDIA, category: "Indian football",
    description: "A one-stop hub for everything happening in Indian football: news, vlogs and tournament coverage.", subscribers: "265K",
  },
  {
    id: "akgfootball", name: "AKG", handle: "AKGfootball", channelId: "UCWC3_b5zr-vopNhCyX3cdEw",
    url: yt("AKGfootball"), avatar: "/creators/akgfootball.jpg", country: INDIA, category: "Tactics",
    description: "Tactical analysis and match breakdowns made by a creator who simply loves watching football.", subscribers: "174K",
  },
  {
    id: "dhanrajdhurve", name: "Dhanraj Dhurve", handle: "DhanrajDhurve", channelId: "UC8wlamcrk30eDkby81qrfwA",
    url: yt("DhanrajDhurve"), avatar: "/creators/dhanrajdhurve.jpg", country: INDIA, category: "Coaching & training",
    description: "Training tips and on-pitch insight from a semi-professional footballer and licensed coach.", subscribers: "173K",
  },
];

/** Ordered by audience size; a mix of styles rather than ten similar channels. */
export const INTERNATIONAL_CREATORS: Creator[] = [
  {
    id: "442oons", name: "442oons", handle: "442oons", channelId: "UC4SUUloEcrgjsxbmy_rQQXA",
    url: yt("442oons"), avatar: "/creators/442oons.jpg", country: UK, category: "Animation & comedy",
    description: "The ridiculous world of football — animated. Songs, skits and parodies of the game's biggest stars.", subscribers: "4.77M",
  },
  {
    id: "brfootball", name: "B/R Football", handle: "brfootball", channelId: "UClvow1RFSyeh5CRwRB_m5sA",
    url: yt("brfootball"), avatar: "/creators/brfootball.jpg", country: { name: "United States", flag: "🇺🇸" }, category: "Football culture",
    description: "Where football meets the internet: viral moments, big-match reactions and the culture around the game.", subscribers: "3.82M",
  },
  {
    id: "fabrizioromano", name: "Fabrizio Romano", handle: "FabrizioRomanoYT", channelId: "UCX1em-uaFMS02Rrk_Bowyng",
    url: yt("FabrizioRomanoYT"), avatar: "/creators/fabrizioromanoyt.jpg", country: { name: "Italy", flag: "🇮🇹" }, category: "Transfers",
    description: "Here we go! Transfer news, exclusives and updates from football's best-known transfer journalist.", subscribers: "3.3M",
    featured: true,
  },
  {
    id: "aftv", name: "AFTV", handle: "AFTVMedia", channelId: "UCBTy8j2cPy6zw68godcE7MQ",
    url: yt("AFTVMedia"), avatar: "/creators/aftvmedia.jpg", country: UK, category: "Fan reactions",
    description: "The world's largest football fan network, with Arsenal-leaning match reactions and debates.", subscribers: "1.84M",
  },
  {
    id: "rioferdinand", name: "Rio Ferdinand Presents", handle: "RioFerdinandPresents", channelId: "UCPAiS32go3-GwTO0kmlVX7g",
    url: yt("RioFerdinandPresents"), avatar: "/creators/rioferdinandpresents.jpg", country: UK, category: "Stories & interviews",
    description: "Football stories and in-depth conversations with the game's biggest names, told by Rio Ferdinand.", subscribers: "1.82M",
  },
  {
    id: "theoverlap", name: "The Overlap", handle: "TheOverlap", channelId: "UCjXIw1GlwaY1IzpW_jN9iCQ",
    url: yt("TheOverlap"), avatar: "/creators/theoverlap.jpg", country: UK, category: "Discussion",
    description: "Award-winning football conversations featuring some of the biggest names in the game.", subscribers: "1.81M",
  },
  {
    id: "copa90", name: "COPA90", handle: "Copa90", channelId: "UCEPKlFeUjRY_1mpZP8GnkVg",
    url: yt("Copa90"), avatar: "/creators/copa90.jpg", country: UK, category: "Culture & documentaries",
    description: "Documentaries and stories from football culture around the world — the game beyond the 90 minutes.", subscribers: "1.34M",
  },
  {
    id: "theathleticfc", name: "The Athletic FC", handle: "TheAthleticFC", channelId: "UC6ZMmQaL9wZYo4iLw8n8xiA",
    url: yt("TheAthleticFC"), avatar: "/creators/theathleticfc.jpg", country: null, category: "Tactics & explainers",
    description: "Tactical explainers and the stories that matter from The Athletic's football team (formerly Tifo Football).", subscribers: "710K",
  },
  {
    id: "hitcsevens", name: "HITC Sevens", handle: "HITCSevens", channelId: "UCi9SqUCnW_flgsrl6_PRJFQ",
    url: yt("HITCSevens"), avatar: "/creators/hitcsevens.jpg", country: UK, category: "History & lists",
    description: "Football history and countdowns in sevens — from the most prolific goalscorers to the worst owners.", subscribers: "651K",
  },
  {
    id: "statmandave", name: "Statman Dave", handle: "StatmanDave", channelId: "UCXzrxvm0Jqq1OpSZQhT6lEQ",
    url: yt("StatmanDave"), avatar: "/creators/statmandave.jpg", country: null, category: "Stats & analysis",
    description: "Data-led tactics and player analysis from the biggest matches across Europe.", subscribers: "370K",
  },
];
