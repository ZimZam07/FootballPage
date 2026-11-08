import type { LeagueId } from "./types";

/**
 * The leagues offered by Club Hub. These are exactly the leagues from the
 * original Recent Highlights dropdown (ids match `leagues` in footballData.ts).
 *
 * Team membership is NOT hardcoded: it is fetched live from ESPN, so promoted
 * and relegated clubs are picked up automatically each season.
 */
export interface LeagueConfig {
  id: LeagueId;
  name: string;
  espn: string;
  /**
   * ESPN team ids in display order, most widely followed clubs first. Only
   * used for ordering: clubs missing from this list (e.g. newly promoted
   * ones) are appended alphabetically, and ids that are not in the league
   * this season are simply ignored.
   */
  popularity: string[];
}

export const LEAGUES: LeagueConfig[] = [
  {
    id: "pl",
    name: "Premier League",
    espn: "eng.1",
    popularity: [
      "360", // Manchester United
      "364", // Liverpool
      "359", // Arsenal
      "363", // Chelsea
      "382", // Manchester City
      "367", // Tottenham Hotspur
      "361", // Newcastle United
      "362", // Aston Villa
      "371", // West Ham United
      "368", // Everton
      "357", // Leeds United
      "393", // Nottingham Forest
      "375", // Leicester City
      "331", // Brighton & Hove Albion
      "380", // Wolverhampton Wanderers
      "370", // Fulham
      "384", // Crystal Palace
      "366", // Sunderland
      "349", // AFC Bournemouth
      "337", // Brentford
      "376", // Southampton
      "379", // Burnley
      "373", // Ipswich Town
      "388", // Coventry City
      "306", // Hull City
    ],
  },
  {
    id: "laliga",
    name: "La Liga",
    espn: "esp.1",
    popularity: [
      "86", // Real Madrid
      "83", // Barcelona
      "1068", // Atlético Madrid
      "243", // Sevilla
      "94", // Valencia
      "93", // Athletic Club
      "244", // Real Betis
      "89", // Real Sociedad
      "102", // Villarreal
      "85", // Celta Vigo
      "88", // Espanyol
      "90", // Deportivo
      "99", // Málaga
      "97", // Osasuna
      "2922", // Getafe
      "101", // Rayo Vallecano
      "87", // Racing Santander
      "96", // Alavés
      "1538", // Levante
      "3751", // Elche
    ],
  },
  {
    id: "seriea",
    name: "Serie A",
    espn: "ita.1",
    popularity: [
      "111", // Juventus
      "103", // AC Milan
      "110", // Internazionale
      "114", // Napoli
      "104", // AS Roma
      "112", // Lazio
      "105", // Atalanta
      "109", // Fiorentina
      "239", // Torino
      "107", // Bologna
      "2572", // Como
      "3263", // Genoa
      "118", // Udinese
      "115", // Parma
      "4007", // Monza
      "2925", // Cagliari
      "113", // Lecce
      "3997", // Sassuolo
      "17530", // Venezia
      "4057", // Frosinone
    ],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    espn: "ger.1",
    popularity: [
      "132", // Bayern Munich
      "124", // Borussia Dortmund
      "131", // Bayer Leverkusen
      "11420", // RB Leipzig
      "133", // Schalke 04
      "125", // Eintracht Frankfurt
      "268", // Borussia Mönchengladbach
      "134", // VfB Stuttgart
      "127", // Hamburg SV
      "137", // Werder Bremen
      "122", // FC Cologne
      "598", // Union Berlin
      "126", // SC Freiburg
      "7911", // TSG Hoffenheim
      "2950", // Mainz
      "3841", // FC Augsburg
      "3307", // SC Paderborn 07
      "10388", // SV Elversberg
    ],
  },
  {
    id: "ligue1",
    name: "Ligue 1",
    espn: "fra.1",
    popularity: [
      "160", // Paris Saint-Germain
      "176", // Marseille
      "167", // Lyon
      "174", // AS Monaco
      "166", // Lille
      "2502", // Nice
      "169", // Stade Rennais
      "175", // Lens
      "180", // Strasbourg
      "6851", // Paris FC
      "179", // Toulouse
      "6997", // Brest
      "273", // Lorient
      "3236", // Le Havre
      "172", // Auxerre
      "7868", // Angers
      "170", // Troyes
      "2697", // Le Mans
    ],
  },
];

export function getLeague(id: string | null | undefined): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.id === id);
}
