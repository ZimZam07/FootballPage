import type { HistoricTeam, Rivalry } from "@/lib/big-clash/types";

const club = (id: number) => `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`;
const nation = (code: string) => `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;

/** Clubs and national teams that appear in the Big Clash archive. Logos are ESPN's. */
export const TEAMS: Record<string, HistoricTeam> = {
  // Clubs
  "real-madrid": { name: "Real Madrid", short: "Real Madrid", logo: club(86), color: "#d4af37", country: "Spain" },
  barcelona: { name: "Barcelona", short: "Barcelona", logo: club(83), color: "#a50044", country: "Spain" },
  "atletico-madrid": { name: "Atlético Madrid", short: "Atlético", logo: club(1068), color: "#cb3524", country: "Spain" },
  deportivo: { name: "Deportivo La Coruña", short: "Deportivo", logo: club(90), color: "#1f5ccc", country: "Spain" },
  "man-utd": { name: "Manchester United", short: "Man Utd", logo: club(360), color: "#da291c", country: "England" },
  "man-city": { name: "Manchester City", short: "Man City", logo: club(382), color: "#6cabdd", country: "England" },
  liverpool: { name: "Liverpool", short: "Liverpool", logo: club(364), color: "#c8102e", country: "England" },
  chelsea: { name: "Chelsea", short: "Chelsea", logo: club(363), color: "#034694", country: "England" },
  arsenal: { name: "Arsenal", short: "Arsenal", logo: club(359), color: "#ef0107", country: "England" },
  tottenham: { name: "Tottenham Hotspur", short: "Spurs", logo: club(367), color: "#132257", country: "England" },
  everton: { name: "Everton", short: "Everton", logo: club(368), color: "#003399", country: "England" },
  newcastle: { name: "Newcastle United", short: "Newcastle", logo: club(361), color: "#241f20", country: "England" },
  qpr: { name: "Queens Park Rangers", short: "QPR", logo: club(334), color: "#1d5ba4", country: "England" },
  "west-ham": { name: "West Ham United", short: "West Ham", logo: club(371), color: "#7a263a", country: "England" },
  bayern: { name: "Bayern Munich", short: "Bayern", logo: club(132), color: "#dc052d", country: "Germany" },
  dortmund: { name: "Borussia Dortmund", short: "Dortmund", logo: club(124), color: "#fde100", country: "Germany" },
  eintracht: { name: "Eintracht Frankfurt", short: "Frankfurt", logo: club(125), color: "#e1000f", country: "Germany" },
  "ac-milan": { name: "AC Milan", short: "Milan", logo: club(103), color: "#fb090b", country: "Italy" },
  inter: { name: "Inter Milan", short: "Inter", logo: club(110), color: "#0068a8", country: "Italy" },
  roma: { name: "Roma", short: "Roma", logo: club(104), color: "#8e1f2f", country: "Italy" },
  psg: { name: "Paris Saint-Germain", short: "PSG", logo: club(160), color: "#004170", country: "France" },
  ajax: { name: "Ajax", short: "Ajax", logo: club(139), color: "#d2122e", country: "Netherlands" },
  celtic: { name: "Celtic", short: "Celtic", logo: club(256), color: "#018749", country: "Scotland" },
  rangers: { name: "Rangers", short: "Rangers", logo: club(257), color: "#1b458f", country: "Scotland" },
  "river-plate": { name: "River Plate", short: "River", logo: club(16), color: "#e30613", country: "Argentina" },
  "boca-juniors": { name: "Boca Juniors", short: "Boca", logo: club(5), color: "#103f79", country: "Argentina" },

  // National teams
  argentina: { name: "Argentina", short: "Argentina", logo: nation("arg"), color: "#6cace4", country: "Argentina", national: true },
  france: { name: "France", short: "France", logo: nation("fra"), color: "#002395", country: "France", national: true },
  brazil: { name: "Brazil", short: "Brazil", logo: nation("bra"), color: "#009c3b", country: "Brazil", national: true },
  germany: { name: "Germany", short: "Germany", logo: nation("ger"), color: "#3a3a3a", country: "Germany", national: true },
  "west-germany": { name: "West Germany", short: "W. Germany", logo: nation("ger"), color: "#3a3a3a", country: "West Germany", national: true },
  italy: { name: "Italy", short: "Italy", logo: nation("ita"), color: "#0064aa", country: "Italy", national: true },
  england: { name: "England", short: "England", logo: nation("eng"), color: "#cf081f", country: "England", national: true },
  netherlands: { name: "Netherlands", short: "Netherlands", logo: nation("ned"), color: "#f36c21", country: "Netherlands", national: true },
  spain: { name: "Spain", short: "Spain", logo: nation("esp"), color: "#c60b1e", country: "Spain", national: true },
  portugal: { name: "Portugal", short: "Portugal", logo: nation("por"), color: "#006600", country: "Portugal", national: true },
  greece: { name: "Greece", short: "Greece", logo: nation("gre"), color: "#0d5eaf", country: "Greece", national: true },
  uruguay: { name: "Uruguay", short: "Uruguay", logo: nation("uru"), color: "#5cbfeb", country: "Uruguay", national: true },
};

export const RIVALRIES: Rivalry[] = [
  {
    id: "el-clasico", name: "El Clásico", teams: ["real-madrid", "barcelona"], region: "Spain",
    description: "Real Madrid against Barcelona: two clubs, two cities and two ideas of Spain, in the most watched club fixture in the world.",
  },
  {
    id: "manchester-derby", name: "Manchester Derby", teams: ["man-utd", "man-city"], region: "England",
    description: "Once lopsided, transformed in the 2010s into a fight for English football's biggest prizes on both sides of one city.",
  },
  {
    id: "north-west-derby", name: "North West Derby", teams: ["liverpool", "man-utd"], region: "England",
    description: "England's two most successful clubs, thirty-odd miles apart, in a rivalry rooted in the industrial history of the North West.",
  },
  {
    id: "north-london-derby", name: "North London Derby", teams: ["arsenal", "tottenham"], region: "England",
    description: "Arsenal and Tottenham, a few miles apart, where a single result can define a season — or a legacy.",
  },
  {
    id: "madrid-derby", name: "Madrid Derby", teams: ["real-madrid", "atletico-madrid"], region: "Spain",
    description: "The capital's establishment against its proud working-class neighbours, played out on the biggest European stages.",
  },
  {
    id: "derby-della-madonnina", name: "Derby della Madonnina", teams: ["ac-milan", "inter"], region: "Italy",
    description: "Milan and Inter share San Siro and a city split in two — red-and-black against blue-and-black.",
  },
  {
    id: "der-klassiker", name: "Der Klassiker", teams: ["bayern", "dortmund"], region: "Germany",
    description: "German football's dominant power against its loudest challenger, a rivalry that reached Wembley in 2013.",
  },
  {
    id: "merseyside-derby", name: "Merseyside Derby", teams: ["liverpool", "everton"], region: "England",
    description: "Liverpool and Everton, separated by Stanley Park, in the 'friendly derby' that families split down the middle.",
  },
  {
    id: "old-firm", name: "Old Firm", teams: ["celtic", "rangers"], region: "Scotland",
    description: "Celtic against Rangers in Glasgow: more than a century of Scottish football's fiercest, most charged rivalry.",
  },
  {
    id: "superclasico", name: "Superclásico", teams: ["river-plate", "boca-juniors"], region: "Argentina",
    description: "River Plate against Boca Juniors — Buenos Aires' great divide, and for many the most passionate derby on earth.",
  },
];
