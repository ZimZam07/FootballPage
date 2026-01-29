export interface LiveSite {
  name: string;
  description: string;
  url: string;
}

export interface HighlightLink {
  name: string;
  link: string;
  logo: string;
}

export interface League {
  id: string;
  name: string;
  teams: Record<string, HighlightLink>;
}

export interface Creator {
  name: string;
  description: string;
  url: string;
  badge: string;
}

export interface Match {
  vs: string;
  date: string;
  league: string;
  stage?: string;
}

export interface TimelineItem {
  minute: string;
  type: 'goal' | 'sub' | 'yellow' | 'red' | 'info';
  team: 'home' | 'away' | 'neutral';
  player?: string;
  description?: string;
}

export interface StatItem {
  label: string;
  home: number | string;
  away: number | string;
  homePercentage?: number;
  awayPercentage?: number;
}

export interface LineupPlayer {
  name: string;
  number: string;
}

export interface LineupCategory {
  category: string;
  players: LineupPlayer[];
}

export interface MatchDetails {
  league: string;
  matchDate: string;
  status: string;
  homeTeam: { name: string; logo: string; score: number; formation: string };
  awayTeam: { name: string; logo: string; score: number; formation: string };
  timeline: TimelineItem[];
  stats: StatItem[];
  lineups: {
    home: LineupCategory[];
    away: LineupCategory[];
  };
}

export interface RivalryMatch {
  season: string;
  league: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  score: string;
  highlight: boolean;
  link: string;
}

export const liveSites: LiveSite[] = [
  {
    name: "Total Sportek",
    description: "Football streams • Reddit-style links",
    url: "https://totalsportek.ms/league/soccerstreams",
  },
  {
    name: "Epic Sports",
    description: "Football streams • Reddit-style links",
    url: "https://www.epicsports.me/",
  },
];

export const leagues: League[] = [
  {
    id: "pl",
    name: "Premier League",
    teams: {
      arsenal: { name: "Arsenal", link: "https://www.youtube.com/results?search_query=arsenal+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
      liverpool: { name: "Liverpool", link: "https://www.youtube.com/results?search_query=Liverpool+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
      mancity: { name: "Man City", link: "https://www.youtube.com/results?search_query=man+city+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
      manutd: { name: "Man United", link: "https://www.youtube.com/results?search_query=man+utd+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" },
      chelsea: { name: "Chelsea", link: "https://www.youtube.com/results?search_query=chelsea+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
      tottenham: { name: "Tottenham", link: "https://www.youtube.com/results?search_query=tottenham+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" },
    }
  },
  {
    id: "laliga",
    name: "La Liga",
    teams: {
      real: { name: "Real Madrid", link: "https://www.youtube.com/results?search_query=+Real+Madrid+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
      barca: { name: "Barcelona", link: "https://www.youtube.com/results?search_query=barcelona+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
      atletico: { name: "Atletico Madrid", link: "https://www.youtube.com/results?search_query=atletico+madrid+highlights", logo: "/logos/atletico.png" },
      villarreal: { name: "Villarreal", link: "https://www.youtube.com/results?search_query=villarreal+highlights", logo: "/logos/villarreal.png" },
      sevilla: { name: "Sevilla", link: "https://www.youtube.com/results?search_query=sevilla+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg" },
      betis: { name: "Real Betis", link: "https://www.youtube.com/results?search_query=real+betis+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg" },
      sociedad: { name: "Real Sociedad", link: "https://www.youtube.com/results?search_query=real+sociedad+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg" },
      athletic: { name: "Athletic Bilbao", link: "https://www.youtube.com/results?search_query=athletic+bilbao+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg" },
      girona: { name: "Girona", link: "https://www.youtube.com/results?search_query=girona+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/9/94/Girona_FC_logo.svg" },
      osasuna: { name: "Osasuna", link: "https://www.youtube.com/results?search_query=osasuna+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/d/db/CA_Osasuna_logo.svg" },
      getafe: { name: "Getafe", link: "https://www.youtube.com/results?search_query=getafe+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/7/7f/Getafe_logo.svg" },
      celta: { name: "Celta Vigo", link: "https://www.youtube.com/results?search_query=celta+vigo+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg" },
      rayo: { name: "Rayo Vallecano", link: "https://www.youtube.com/results?search_query=rayo+vallecano+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Rayo_Vallecano_logo.svg" },
      mallorca: { name: "Mallorca", link: "https://www.youtube.com/results?search_query=mallorca+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca_logo.svg" },
      laspalmas: { name: "Las Palmas", link: "https://www.youtube.com/results?search_query=las+palmas+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/e/ec/UD_Las_Palmas_logo.svg" },
      alaves: { name: "Alaves", link: "https://www.youtube.com/results?search_query=alaves+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/f/f8/Deportivo_Alav%C3%A9s_logo.svg" },
      valencia: { name: "Valencia", link: "https://www.youtube.com/results?search_query=valencia+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg" },
      espanyol: { name: "Espanyol", link: "https://www.youtube.com/results?search_query=espanyol+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg" },
      leganes: { name: "Leganes", link: "https://www.youtube.com/results?search_query=leganes+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/b/b8/CD_Legan%C3%A9s_logo.svg" },
      valladolid: { name: "Real Valladolid", link: "https://www.youtube.com/results?search_query=real+valladolid+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_Logo.svg" },
    }
  },
  {
    id: "seriea",
    name: "Serie A",
    teams: {
      juventus: { name: "Juventus", link: "https://www.youtube.com/results?search_query=juventus+highlights", logo: "/logos/juventus.png" },
      milan: { name: "AC Milan", link: "https://www.youtube.com/results?search_query=ac+milan+highlights", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg" },
      inter: { name: "Inter Milan", link: "https://www.youtube.com/results?search_query=inter+milan+highlights", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" },
      napoli: { name: "Napoli", link: "https://www.youtube.com/results?search_query=napoli+highlights", logo: "/logos/napoli.png" },
      roma: { name: "AS Roma", link: "https://www.youtube.com/results?search_query=as+roma+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg" },
    }
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    teams: {
      bayern: { name: "Bayern Munich", link: "https://www.youtube.com/results?search_query=bayern+munich+highlights", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg" },
      dortmund: { name: "Borussia Dortmund", link: "https://www.youtube.com/results?search_query=borussia+dortmund+highlights", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg" },
      leverkusen: { name: "Bayer Leverkusen", link: "https://www.youtube.com/results?search_query=bayer+leverkusen+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg" },
      leipzig: { name: "RB Leipzig", link: "https://www.youtube.com/results?search_query=rb+leipzig+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg" },
    }
  },
  {
    id: "ligue1",
    name: "Ligue 1",
    teams: {
      psg: { name: "PSG", link: "https://www.youtube.com/results?search_query=psg+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
      marseille: { name: "Marseille", link: "https://www.youtube.com/results?search_query=marseille+highlights", logo: "/logos/marseille.png" },
      lyon: { name: "Lyon", link: "https://www.youtube.com/results?search_query=olympique+lyonnais+highlights", logo: "/logos/lyon.png" },
      monaco: { name: "AS Monaco", link: "https://www.youtube.com/results?search_query=as+monaco+highlights", logo: "/logos/monaco.png" },
      lille: { name: "Lille", link: "https://www.youtube.com/results?search_query=lille+osc+highlights", logo: "https://upload.wikimedia.org/wikipedia/en/3/3f/Lille_OSC_2018_logo.svg" },
    }
  },
];

// Keep highlightLinks for backward compatibility if needed, but we'll use leagues primarily
export const highlightLinks: Record<string, HighlightLink> = {
  ...leagues.reduce((acc, league) => ({ ...acc, ...league.teams }), {}),
};

export const creators: Creator[] = [
  {
    name: "YJR",
    badge: "🇮🇳 Indian Creator",
    description: "Real Madrid • Tactical breakdowns",
    url: "https://www.youtube.com/@yashyjr",
  },
  {
    name: "Markaroni",
    badge: "🇮🇳 Indian Creator",
    description: "FC Barcelona • Humour & Mastikhor",
    url: "https://www.youtube.com/@Markaroni",
  },
  {
    name: "Drog Baba",
    badge: "🇮🇳 Indian Creator",
    description: "Chelsea FC • Detailed Analysis",
    url: "https://www.youtube.com/@TFGFootball",
  },
];

export const bigMatches: Record<string, Match[]> = {
  real: [
    { vs: "Barcelona", date: "28/05/2023", league: "La Liga", stage: "Semi-Final" },
    { vs: "Man City", date: "10/04/2023", league: "Champions League", stage: "Quarter-Final" },
  ],
  barca: [
    { vs: "Real Madrid", date: "28/05/2023", league: "La Liga", stage: "Semi-Final" },
  ],
  manutd: [
    { vs: "Real Madrid", date: "28/05/2023", league: "La Liga", stage: "Semi-Final" },
  ],
  arsenal: [
    { vs: "Real Madrid", date: "28/05/2023", league: "La Liga", stage: "Semi-Final" },
  ],
  liverpool: [
    { vs: "Real Madrid", date: "28/05/2023", league: "La Liga", stage: "Semi-Final" },
  ],
};

export const iconicRivalries: RivalryMatch[] = [
  {
    season: "2010 / 11",
    league: "La Liga",
    team1: { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    team2: { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    score: "5 × 0",
    highlight: true,
    link: "https://youtu.be/Md7P9X4SFck",
  },
  {
    season: "2011 / 12",
    league: "La Liga",
    team1: { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    team2: { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    score: "1 × 2",
    highlight: false,
    link: "https://youtu.be/t9XrZw839-o",
  },
  {
    season: "2013 / 14",
    league: "La Liga",
    team1: { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    team2: { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    score: "3 × 4",
    highlight: true,
    link: "https://youtu.be/Sy6emSOKlQY",
  },
  {
    season: "2016 / 17",
    league: "UEFA Champions League",
    team1: { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    team2: { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    score: "2 × 3",
    highlight: true,
    link: "https://youtu.be/LavH7audJww",
  },
];

export const derbies = [
  {
    title: "⚔️ El Clásico",
    description: "Barcelona vs Real Madrid",
    matches: iconicRivalries,
  },
  {
    title: "⚪ North London Derby",
    name: "Arsenal vs Tottenham",
    description: "Premier League • North London",
    link: "https://www.youtube.com/results?search_query=arsenal+vs+tottenham+highlights",
  },
  {
    title: "🔵 Merseyside Derby",
    name: "Liverpool vs Everton",
    description: "Premier League • Merseyside",
    link: "https://www.youtube.com/results?search_query=merseyside+derby+highlights",
  },
];

export const matchDetails: Record<string, MatchDetails> = {
  real: {
    league: "UEFA Champions League",
    matchDate: "Jan 28, 2026",
    status: "Full-time",
    homeTeam: { name: "Benfica", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg", score: 4, formation: "4-2-3-1" },
    awayTeam: { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", score: 2, formation: "4-3-3" },
    timeline: [
      { minute: "30'", type: "goal", team: "away", player: "Kylian Mbappé" },
      { minute: "36'", type: "goal", team: "home", player: "Andreas Schjelderup" },
      { minute: "45+5'", type: "goal", team: "home", player: "Vangelis Pavlidis (P)" },
      { minute: "Half Time", type: "info", team: "neutral" },
      { minute: "54'", type: "goal", team: "home", player: "Andreas Schjelderup" },
      { minute: "58'", type: "goal", team: "away", player: "Kylian Mbappé" },
      { minute: "90+2'", type: "red", team: "away", player: "Raúl Asencio" },
      { minute: "90+7'", type: "red", team: "away", player: "Rodrygo" },
      { minute: "90+8'", type: "goal", team: "home", player: "Anatoliy Trubin" },
      { minute: "End of match", type: "info", team: "neutral" },
    ],
    stats: [
      { label: "Shots on goal", home: 12, away: 6, homePercentage: 67, awayPercentage: 33 },
      { label: "Total Shots", home: 22, away: 16, homePercentage: 58, awayPercentage: 42 },
      { label: "Possession %", home: "33%", away: "67%", homePercentage: 33, awayPercentage: 67 },
      { label: "Fouls", home: 11, away: 12, homePercentage: 48, awayPercentage: 52 },
      { label: "Yellow cards", home: 2, away: 4, homePercentage: 33, awayPercentage: 67 },
    ],
    lineups: {
      home: [
        { category: "Goalkeeper", players: [{ name: "Anatoliy Trubin", number: "#1" }] },
        { category: "Defenders", players: [{ name: "Amar Dedic", number: "#17" }, { name: "Otamendi", number: "#30" }] },
        { category: "Forwards", players: [{ name: "Pavlidis", number: "#14" }, { name: "Schjelderup", number: "#21" }] },
      ],
      away: [
        { category: "Goalkeeper", players: [{ name: "Thibaut Courtois", number: "#1" }] },
        { category: "Defenders", players: [{ name: "Raúl Asencio", number: "#17" }, { name: "Dean Huijsen", number: "#24" }] },
        { category: "Midfielders", players: [{ name: "Bellingham", number: "#5" }, { name: "Arda Guler", number: "#15" }] },
        { category: "Forwards", players: [{ name: "Kylian Mbappé", number: "#10" }, { name: "Vinicius Jr", number: "#7" }] },
      ]
    }
  },
  barca: {
    league: "UEFA Champions League",
    matchDate: "Jan 28, 2026",
    status: "Full-time",
    homeTeam: { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg", score: 4, formation: "4-3-3" },
    awayTeam: { name: "FC Copenhagen", logo: "https://upload.wikimedia.org/wikipedia/en/9/93/FC_Kobenhavn.svg", score: 1, formation: "5-4-1" },
    timeline: [
      { minute: "4'", type: "goal", team: "away", player: "Viktor Dadason" },
      { minute: "37'", type: "yellow", team: "home", player: "Lamine Yamal" },
      { minute: "48'", type: "goal", team: "home", player: "Robert Lewandowski" },
      { minute: "60'", type: "goal", team: "home", player: "Lamine Yamal" },
      { minute: "69'", type: "goal", team: "home", player: "Raphinha (P)" },
      { minute: "85'", type: "goal", team: "home", player: "Marcus Rashford" },
    ],
    stats: [
      { label: "Shots on target", home: 9, away: 1, homePercentage: 90, awayPercentage: 10 },
      { label: "Possession %", home: "68%", away: "32%", homePercentage: 68, awayPercentage: 32 },
      { label: "Fouls", home: 12, away: 11, homePercentage: 52, awayPercentage: 48 },
      { label: "Offsides", home: 1, away: 6, homePercentage: 14, awayPercentage: 86 },
    ],
    lineups: {
      home: [
        { category: "Goalkeeper", players: [{ name: "Joan Garcia", number: "#1" }] },
        { category: "Defenders", players: [{ name: "Cubarsi", number: "#2" }, { name: "Balde", number: "#3" }] },
        { category: "Forwards", players: [{ name: "Yamal", number: "#19" }, { name: "Lewandowski", number: "#9" }, { name: "Raphinha", number: "#11" }, { name: "Rashford", number: "#10" }] },
      ],
      away: [
        { category: "Goalkeeper", players: [{ name: "Kotarski", number: "#1" }] },
        { category: "Defenders", players: [{ name: "Meling", number: "#2" }, { name: "Gabriel Pereira", number: "#4" }] },
        { category: "Forwards", players: [{ name: "Dadason", number: "#9" }, { name: "Elyounoussi", number: "#10" }] },
      ]
    }
  },
  atletico: {
    league: "UEFA Champions League",
    matchDate: "Jan 28, 2026",
    status: "Full-time",
    homeTeam: { name: "Bodo/Glimt", logo: "https://upload.wikimedia.org/wikipedia/en/e/e3/FK_Bod%C3%B8_Glimt_logo.svg", score: 2, formation: "4-3-3" },
    awayTeam: { name: "Atletico Madrid", logo: "/logos/atletico.png", score: 1, formation: "4-4-2" },
    timeline: [
      { minute: "22'", type: "goal", team: "away", player: "Alexander Sorloth" },
      { minute: "41'", type: "goal", team: "home", player: "Zinckernagel" },
      { minute: "78'", type: "goal", team: "home", player: "Hauge" },
    ],
    stats: [
      { label: "Possession %", home: "45%", away: "55%", homePercentage: 45, awayPercentage: 55 },
      { label: "Shots", home: 10, away: 15, homePercentage: 40, awayPercentage: 60 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Haikin", number: "#12" }, { name: "Hauge", number: "#10" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Jan Oblak", number: "#13" }, { name: "Sorloth", number: "#11" }, { name: "Julian Alvarez", number: "#19" }] },
      ]
    }
  },
  girona: {
    league: "La Liga",
    matchDate: "Jan 26, 2026",
    status: "Full-time",
    homeTeam: { name: "Girona", logo: "https://upload.wikimedia.org/wikipedia/en/9/94/Girona_FC_logo.svg", score: 1, formation: "4-3-3" },
    awayTeam: { name: "Getafe", logo: "https://upload.wikimedia.org/wikipedia/en/7/7f/Getafe_logo.svg", score: 1, formation: "5-3-2" },
    timeline: [
      { minute: "44'", type: "goal", team: "home", player: "Viktor Tsygankov" },
      { minute: "82'", type: "goal", team: "away", player: "Borja Mayoral" },
    ],
    stats: [
      { label: "Possession %", home: "62%", away: "38%", homePercentage: 62, awayPercentage: 38 },
      { label: "Shots", home: 14, away: 8, homePercentage: 64, awayPercentage: 36 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Gazzaniga", number: "#13" }, { name: "Tsygankov", number: "#8" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "David Soria", number: "#13" }, { name: "Mayoral", number: "#9" }] },
      ]
    }
  },
  sociedad: {
    league: "La Liga",
    matchDate: "Jan 25, 2026",
    status: "Full-time",
    homeTeam: { name: "Real Sociedad", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg", score: 3, formation: "4-4-2" },
    awayTeam: { name: "Celta Vigo", logo: "https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg", score: 1, formation: "3-4-3" },
    timeline: [
      { minute: "15'", type: "goal", team: "home", player: "Mikel Oyarzabal" },
      { minute: "42'", type: "goal", team: "home", player: "Takefusa Kubo" },
      { minute: "67'", type: "goal", team: "away", player: "Iago Aspas" },
      { minute: "89'", type: "goal", team: "home", player: "Brais Mendez" },
    ],
    stats: [
      { label: "Possession %", home: "52%", away: "48%", homePercentage: 52, awayPercentage: 48 },
      { label: "Shots", home: 17, away: 11, homePercentage: 61, awayPercentage: 39 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Remiro", number: "#1" }, { name: "Oyarzabal", number: "#10" }, { name: "Kubo", number: "#7" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Guaita", number: "#13" }, { name: "Aspas", number: "#10" }] },
      ]
    }
  },
  valencia: {
    league: "La Liga",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Valencia", logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg", score: 3, formation: "4-4-2" },
    awayTeam: { name: "Espanyol", logo: "https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg", score: 2, formation: "4-2-3-1" },
    timeline: [
      { minute: "18'", type: "goal", team: "home", player: "Hugo Duro" },
      { minute: "35'", type: "goal", team: "away", player: "Alejo Veliz" },
      { minute: "55'", type: "goal", team: "home", player: "Eray Comert" },
      { minute: "72'", type: "goal", team: "home", player: "Largie Ramazani" },
      { minute: "90+2'", type: "goal", team: "away", player: "Puado" },
    ],
    stats: [
      { label: "Shots", home: 15, away: 12, homePercentage: 55, awayPercentage: 45 },
      { label: "Possession %", home: "51%", away: "49%", homePercentage: 51, awayPercentage: 49 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Dimitrievski", number: "#1" }, { name: "Hugo Duro", number: "#9" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Joan Garcia", number: "#13" }, { name: "Veliz", number: "#9" }] },
      ]
    }
  },
  sevilla: {
    league: "La Liga",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Sevilla", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg", score: 2, formation: "4-3-3" },
    awayTeam: { name: "Athletic Bilbao", logo: "https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg", score: 1, formation: "4-2-3-1" },
    timeline: [
      { minute: "28'", type: "goal", team: "home", player: "Isaac Romero" },
      { minute: "56'", type: "goal", team: "away", player: "Nico Williams" },
      { minute: "81'", type: "goal", team: "home", player: "Dodi Lukebakio" },
    ],
    stats: [
      { label: "Possession %", home: "46%", away: "54%", homePercentage: 46, awayPercentage: 54 },
      { label: "Shots", home: 11, away: 14, homePercentage: 44, awayPercentage: 56 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Nyland", number: "#13" }, { name: "Isaac Romero", number: "#20" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Agirrezabala", number: "#13" }, { name: "Nico Williams", number: "#11" }] },
      ]
    }
  },
  osasuna: {
    league: "La Liga",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Osasuna", logo: "https://upload.wikimedia.org/wikipedia/en/d/db/CA_Osasuna_logo.svg", score: 3, formation: "4-3-3" },
    awayTeam: { name: "Rayo Vallecano", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Rayo_Vallecano_logo.svg", score: 1, formation: "4-4-2" },
    timeline: [
      { minute: "12'", type: "goal", team: "home", player: "Ante Budimir" },
      { minute: "38'", type: "goal", team: "home", player: "Bryan Zaragoza" },
      { minute: "65'", type: "goal", team: "away", player: "Isi Palazon" },
      { minute: "88'", type: "goal", team: "home", player: "Aimar Oroz" },
    ],
    stats: [
      { label: "Shots", home: 13, away: 9, homePercentage: 59, awayPercentage: 41 },
      { label: "Possession %", home: "54%", away: "46%", homePercentage: 54, awayPercentage: 46 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Sergio Herrera", number: "#1" }, { name: "Budimir", number: "#17" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Batalla", number: "#13" }, { name: "Isi", number: "#7" }] },
      ]
    }
  },
  leganes: {
    league: "La Liga 2",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Leganes", logo: "https://upload.wikimedia.org/wikipedia/en/b/b8/CD_Legan%C3%A9s_logo.svg", score: 2, formation: "4-4-2" },
    awayTeam: { name: "Real Sociedad B", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg", score: 0, formation: "4-3-3" },
    timeline: [
      { minute: "32'", type: "goal", team: "home", player: "Alejandro Millán" },
      { minute: "75'", type: "goal", team: "home", player: "Miguel de la Fuente" },
    ],
    stats: [
      { label: "Possession %", home: "42%", away: "58%", homePercentage: 42, awayPercentage: 58 },
      { label: "Shots", home: 9, away: 11, homePercentage: 45, awayPercentage: 55 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Juan Soriano", number: "#1" }, { name: "Miguel", number: "#9" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Fraga", number: "#1" }] },
      ]
    }
  },
  athletic: {
    league: "UEFA Champions League",
    matchDate: "Jan 28, 2026",
    status: "Full-time",
    homeTeam: { name: "Athletic Bilbao", logo: "https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg", score: 2, formation: "4-2-3-1" },
    awayTeam: { name: "Sporting CP", logo: "https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_Clube_de_Portugal.svg", score: 3, formation: "3-4-3" },
    timeline: [
      { minute: "15'", type: "goal", team: "away", player: "Gyokeres" },
      { minute: "34'", type: "goal", team: "home", player: "Inaki Williams" },
      { minute: "58'", type: "goal", team: "away", player: "Pedro Goncalves" },
      { minute: "67'", type: "goal", team: "home", player: "Guruzeta" },
      { minute: "89'", type: "goal", team: "away", player: "Trincao" },
    ],
    stats: [
      { label: "Possession %", home: "48%", away: "52%", homePercentage: 48, awayPercentage: 52 },
      { label: "Shots", home: 12, away: 14, homePercentage: 46, awayPercentage: 54 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Agirrezabala", number: "#13" }, { name: "Inaki Williams", number: "#9" }, { name: "Guruzeta", number: "#12" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Franco Israel", number: "#1" }, { name: "Gyokeres", number: "#9" }] },
      ]
    }
  },
  villarreal: {
    league: "La Liga",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", score: 2, formation: "4-3-3" },
    awayTeam: { name: "Villarreal", logo: "/logos/villarreal.png", score: 0, formation: "4-2-3-1" },
    timeline: [
      { minute: "55'", type: "goal", team: "home", player: "Kylian Mbappé" },
      { minute: "78'", type: "goal", team: "home", player: "Kylian Mbappé" },
    ],
    stats: [
      { label: "Possession %", home: "66%", away: "34%", homePercentage: 66, awayPercentage: 34 },
      { label: "Shots", home: 16, away: 6, homePercentage: 73, awayPercentage: 27 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Courtois", number: "#1" }, { name: "Mbappé", number: "#10" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Diego Conde", number: "#1" }] },
      ]
    }
  },
  betis: {
    league: "La Liga",
    matchDate: "Jan 25, 2026",
    status: "Full-time",
    homeTeam: { name: "Alaves", logo: "https://upload.wikimedia.org/wikipedia/en/f/f8/Deportivo_Alav%C3%A9s_logo.svg", score: 2, formation: "4-4-2" },
    awayTeam: { name: "Real Betis", logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg", score: 1, formation: "4-2-3-1" },
    timeline: [
      { minute: "23'", type: "goal", team: "home", player: "Kike Garcia" },
      { minute: "58'", type: "goal", team: "away", player: "Chimy Avila" },
      { minute: "77'", type: "goal", team: "home", player: "Carlos Vicente" },
    ],
    stats: [
      { label: "Possession %", home: "45%", away: "55%", homePercentage: 45, awayPercentage: 55 },
      { label: "Shots", home: 12, away: 11, homePercentage: 52, awayPercentage: 48 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Sivera", number: "#1" }, { name: "Kike Garcia", number: "#17" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Rui Silva", number: "#1" }, { name: "Chimy Avila", number: "#9" }] },
      ]
    }
  },
  alaves: {
    league: "La Liga",
    matchDate: "Jan 25, 2026",
    status: "Full-time",
    homeTeam: { name: "Alaves", logo: "https://upload.wikimedia.org/wikipedia/en/f/f8/Deportivo_Alav%C3%A9s_logo.svg", score: 2, formation: "4-4-2" },
    awayTeam: { name: "Real Betis", logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg", score: 1, formation: "4-2-3-1" },
    timeline: [
      { minute: "23'", type: "goal", team: "home", player: "Kike Garcia" },
      { minute: "58'", type: "goal", team: "away", player: "Chimy Avila" },
      { minute: "77'", type: "goal", team: "home", player: "Carlos Vicente" },
    ],
    stats: [
      { label: "Possession %", home: "45%", away: "55%", homePercentage: 45, awayPercentage: 55 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Sivera", number: "#1" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Rui Silva", number: "#1" }] },
      ]
    }
  },
  celta: {
    league: "La Liga",
    matchDate: "Jan 25, 2026",
    status: "Full-time",
    homeTeam: { name: "Real Sociedad", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg", score: 3, formation: "4-4-2" },
    awayTeam: { name: "Celta Vigo", logo: "https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg", score: 1, formation: "3-4-3" },
    timeline: [
      { minute: "15'", type: "goal", team: "home", player: "Mikel Oyarzabal" },
      { minute: "42'", type: "goal", team: "home", player: "Takefusa Kubo" },
      { minute: "67'", type: "goal", team: "away", player: "Iago Aspas" },
      { minute: "89'", type: "goal", team: "home", player: "Brais Mendez" },
    ],
    stats: [
      { label: "Possession %", home: "52%", away: "48%", homePercentage: 52, awayPercentage: 48 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Remiro", number: "#1" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Guaita", number: "#13" }] },
      ]
    }
  },
  rayo: {
    league: "La Liga",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Osasuna", logo: "https://upload.wikimedia.org/wikipedia/en/d/db/CA_Osasuna_logo.svg", score: 3, formation: "4-3-3" },
    awayTeam: { name: "Rayo Vallecano", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Rayo_Vallecano_logo.svg", score: 1, formation: "4-4-2" },
    timeline: [
      { minute: "12'", type: "goal", team: "home", player: "Ante Budimir" },
      { minute: "38'", type: "goal", team: "home", player: "Bryan Zaragoza" },
      { minute: "65'", type: "goal", team: "away", player: "Isi Palazon" },
      { minute: "88'", type: "goal", team: "home", player: "Aimar Oroz" },
    ],
    stats: [
      { label: "Possession %", home: "54%", away: "46%", homePercentage: 54, awayPercentage: 46 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Sergio Herrera", number: "#1" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Batalla", number: "#13" }] },
      ]
    }
  },
  mallorca: {
    league: "La Liga",
    matchDate: "Jan 25, 2026",
    status: "Full-time",
    homeTeam: { name: "Atletico Madrid", logo: "/logos/atletico.png", score: 3, formation: "4-4-2" },
    awayTeam: { name: "Mallorca", logo: "https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca_logo.svg", score: 0, formation: "4-4-2" },
    timeline: [
      { minute: "22'", type: "goal", team: "home", player: "Alexander Sorloth" },
      { minute: "75'", type: "goal", team: "home", player: "David Lopez (OG)" },
      { minute: "87'", type: "goal", team: "home", player: "Thiago Almada" },
    ],
    stats: [
      { label: "Possession %", home: "61%", away: "39%", homePercentage: 61, awayPercentage: 39 },
      { label: "Shots", home: 17, away: 6, homePercentage: 74, awayPercentage: 26 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Jan Oblak", number: "#13" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Leo Román", number: "#1" }] },
      ]
    }
  },
  laspalmas: {
    league: "La Liga 2",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Las Palmas", logo: "https://upload.wikimedia.org/wikipedia/en/e/ec/UD_Las_Palmas_logo.svg", score: 1, formation: "4-4-2" },
    awayTeam: { name: "Cordoba", logo: "https://upload.wikimedia.org/wikipedia/en/b/b5/Cordoba_CF_logo.svg", score: 2, formation: "4-2-3-1" },
    timeline: [
      { minute: "15'", type: "goal", team: "away", player: "Adilson" },
      { minute: "44'", type: "goal", team: "home", player: "Ale Garcia" },
      { minute: "82'", type: "goal", team: "away", player: "Casas" },
    ],
    stats: [
      { label: "Possession %", home: "59%", away: "41%", homePercentage: 59, awayPercentage: 41 },
      { label: "Shots", home: 11, away: 8, homePercentage: 58, awayPercentage: 42 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Horkaš", number: "#1" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Carlos Marin", number: "#1" }] },
      ]
    }
  },
  espanyol: {
    league: "La Liga",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Valencia", logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg", score: 3, formation: "4-4-2" },
    awayTeam: { name: "Espanyol", logo: "https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg", score: 2, formation: "4-2-3-1" },
    timeline: [
      { minute: "18'", type: "goal", team: "home", player: "Hugo Duro" },
      { minute: "35'", type: "goal", team: "away", player: "Alejo Veliz" },
      { minute: "55'", type: "goal", team: "home", player: "Eray Comert" },
      { minute: "72'", type: "goal", team: "home", player: "Largie Ramazani" },
      { minute: "90+2'", type: "goal", team: "away", player: "Puado" },
    ],
    stats: [
      { label: "Possession %", home: "51%", away: "49%", homePercentage: 51, awayPercentage: 49 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Dimitrievski", number: "#1" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Joan Garcia", number: "#13" }] },
      ]
    }
  },
  valladolid: {
    league: "La Liga 2",
    matchDate: "Jan 24, 2026",
    status: "Full-time",
    homeTeam: { name: "Real Valladolid", logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_Logo.svg", score: 0, formation: "4-4-2" },
    awayTeam: { name: "Albacete", logo: "https://upload.wikimedia.org/wikipedia/en/3/3a/Albacete_Balompie_logo.svg", score: 1, formation: "4-2-3-1" },
    timeline: [
      { minute: "72'", type: "goal", team: "away", player: "Quiles" },
    ],
    stats: [
      { label: "Possession %", home: "55%", away: "45%", homePercentage: 55, awayPercentage: 45 },
    ],
    lineups: {
      home: [
        { category: "Starting XI", players: [{ name: "Ferreira", number: "#1" }] },
      ],
      away: [
        { category: "Starting XI", players: [{ name: "Lizoain", number: "#1" }] },
      ]
    }
  }
};
