/**
 * TimesOfFootball's editorial judgement: how much a story matters to a typical football fan.
 *
 * A story's score combines WHO it is about (clubs, players, managers), WHERE (competition), WHAT
 * happened (significance: a done deal, a sacking, a record, a retirement...) and WHEN (recency),
 * minus penalties for routine items and low-visibility leagues. Famous names raise a story; they
 * don't carry it alone — an ordinary item about a giant can still fall below an extraordinary one
 * about a smaller club. Scores are internal placement signals and are never shown to visitors.
 *
 * Names are matched case-sensitively against the publisher's headline, so "Rice" the player
 * isn't confused with rice, and "Son" with son.
 */

type Entity = [RegExp, number, string];

/** Clubs, weighted by global following. Not a whitelist: unlisted clubs simply start from zero. */
const CLUBS: Entity[] = [
  // The global giants
  [/\bReal Madrid\b|\bLos Blancos\b/, 5, "Real Madrid"],
  [/\bBarcelona\b|\bBar[çc]a\b/, 5, "Barcelona"],
  [/\bMan(?:chester)?\.? (?:United|Utd)\b|\bMan U\b/, 5, "Manchester United"],
  [/\bMan(?:chester)?\.? City\b/, 5, "Manchester City"],
  [/\bLiverpool\b/, 5, "Liverpool"],
  [/\bArsenal\b/, 5, "Arsenal"],
  [/\bChelsea\b/, 5, "Chelsea"],
  [/\bBayern\b/, 5, "Bayern Munich"],
  [/\bParis Saint-Germain\b|\bPSG\b/, 5, "Paris Saint-Germain"],
  [/\bJuventus\b|\bJuve\b/, 5, "Juventus"],
  [/\bInter Milan\b|\bInternazionale\b|\bInter\b(?! Miami)/, 4.5, "Inter"],
  [/\bAC Milan\b|\bMilan\b(?! derby)/, 4.5, "AC Milan"],
  // Major clubs
  [/\bTottenham\b|\bSpurs\b/, 4, "Tottenham"],
  [/\bNewcastle\b/, 3.5, "Newcastle"],
  [/\bAtl[eé]tico\b|\bAtleti\b/, 4, "Atlético Madrid"],
  [/\bDortmund\b/, 4, "Borussia Dortmund"],
  [/\bLeverkusen\b/, 3.5, "Bayer Leverkusen"],
  [/\bNapoli\b/, 3.5, "Napoli"],
  [/\bInter Miami\b/, 3.5, "Inter Miami"],
  [/\bAl[- ]Nassr\b/, 3, "Al-Nassr"],
  [/\bAl[- ]Hilal\b/, 3, "Al-Hilal"],
  [/\bAston Villa\b|\bVilla\b/, 3, "Aston Villa"],
  [/\bRoma\b/, 3, "Roma"],
  [/\bLazio\b/, 3, "Lazio"],
  [/\bAtalanta\b/, 3, "Atalanta"],
  [/\bBenfica\b/, 3, "Benfica"],
  [/\bPorto\b/, 3, "Porto"],
  [/\bSporting\b/, 3, "Sporting CP"],
  [/\bAjax\b/, 3, "Ajax"],
  [/\bMarseille\b/, 3, "Marseille"],
  [/\bRB Leipzig\b|\bLeipzig\b/, 3, "RB Leipzig"],
  [/\bSevilla\b/, 2.5, "Sevilla"],
  [/\bAthletic Club\b|\bAthletic Bilbao\b/, 2.5, "Athletic Club"],
  [/\bMonaco\b/, 2.5, "Monaco"],
  [/\bLyon\b/, 2.5, "Lyon"],
  [/\bPSV\b/, 2.5, "PSV"],
  [/\bFeyenoord\b/, 2.5, "Feyenoord"],
  [/\bCeltic\b/, 2.5, "Celtic"],
  [/\bRangers\b(?! (?:women|u\d))/, 2.5, "Rangers"],
  [/\bComo\b/, 2.5, "Como"],
  [/\bGalatasaray\b|\bFenerbah[çc]e\b/, 2.5, "Turkish giants"],
  [/\bBoca Juniors\b|\bRiver Plate\b|\bFlamengo\b|\bPalmeiras\b|\bSantos\b/, 2.5, "South American giants"],
  [/\bReal Sociedad\b|\bVillarreal\b|\bBetis\b|\bValencia\b|\bFiorentina\b|\bLille\b|\bNice\b|\bFrankfurt\b|\bStuttgart\b/, 2, "European regulars"],
  // The rest of the Premier League: relevant, but on the strength of the story.
  [/\bBrighton\b|\bWest Ham\b|\bEverton\b|\bCrystal Palace\b|\bPalace\b|\bBrentford\b|\bFulham\b|\bBournemouth\b|\bWolves\b|\bNottingham Forest\b|\bForest\b|\bLeeds\b|\bSunderland\b|\bBurnley\b|\bIpswich\b/, 2, "Premier League club"],
];

/** Players and managers people follow. A starting point, not a ceiling: anyone can make headlines. */
const PEOPLE: Entity[] = [
  [/\bRonaldo\b/, 6, "Cristiano Ronaldo"],
  [/\bMessi\b/, 6, "Lionel Messi"],
  [/\bMbapp[eé]\b/, 5, "Kylian Mbappé"],
  [/\bHaaland\b/, 5, "Erling Haaland"],
  [/\bYamal\b/, 5, "Lamine Yamal"],
  [/\bBellingham\b/, 4.5, "Jude Bellingham"],
  [/\bVin[ií]cius\b|\bVini Jr\b/, 4.5, "Vinícius Júnior"],
  [/\bSalah\b/, 4.5, "Mohamed Salah"],
  [/\bKane\b/, 4.5, "Harry Kane"],
  [/\bNeymar\b/, 4.5, "Neymar"],
  [/\bDe Bruyne\b/, 4, "Kevin De Bruyne"],
  [/\bLewandowski\b/, 4, "Robert Lewandowski"],
  [/\bModri[cć]\b/, 4, "Luka Modrić"],
  [/\bBruno Fernandes\b/, 4, "Bruno Fernandes"],
  [/\bSaka\b/, 4, "Bukayo Saka"],
  [/\bPalmer\b/, 4, "Cole Palmer"],
  [/\bFoden\b/, 3.5, "Phil Foden"],
  [/\bVan Dijk\b/, 3.5, "Virgil van Dijk"],
  [/\bPedri\b/, 3.5, "Pedri"],
  [/\bRodri\b/, 3.5, "Rodri"],
  [/\bSon Heung-min\b|\bHeung-min Son\b/, 3.5, "Son Heung-min"],
  [/\bGriezmann\b/, 3.5, "Antoine Griezmann"],
  [/\bRaphinha\b|\bWirtz\b|\bMusiala\b|\b(?:Ø|O)degaard\b|\bDeclan Rice\b|\bRice\b|\bIsak\b|\bOsimhen\b|\bLautaro\b|\bKvaratskhelia\b|\bDembélé\b|\bDembele\b|\bGy(?:ö|o)keres\b|\bOlise\b|\bCubars[ií]\b|\bFerm[ií]n\b|\bG[uü]ler\b|\bValverde\b|\bAlexander-Arnold\b|\bTrent\b|\bRashford\b|\bSesko\b|\bŠeško\b|\bEkitike\b|\bEkitiké\b/, 3, "Star player"],
  [/\bGuardiola\b|\bAncelotti\b|\bArteta\b|\bKlopp\b|\bMourinho\b|\bXabi Alonso\b|\bAlonso\b|\bSimeone\b|\bAmorim\b|\bTuchel\b|\bZidane\b|\bPochettino\b|\bConte\b|\bFlick\b|\bLuis Enrique\b|\bSlot\b|\bMaresca\b|\bCarrick\b|\bPostecoglou\b|\bEmery\b|\bSarri\b|\bAllegri\b|\bScaloni\b|\bDeschamps\b/, 3, "Major manager"],
];

/** Competitions, by how many fans follow them. */
const COMPETITIONS: Entity[] = [
  [/\bBallon d['’]Or\b/, 4, "Ballon d'Or"],
  [/\bChampions League\b|\bUCL\b/, 3, "Champions League"],
  [/\bWorld Cup\b(?! qualif)/, 3, "World Cup"],
  [/\bEuro(?:s|pean Championship)?\b(?= ?20\d\d)|\bEuro 20\d\d\b/, 2.5, "Euros"],
  [/\bClub World Cup\b/, 2.5, "Club World Cup"],
  [/\bCopa Am[eé]rica\b/, 2, "Copa América"],
  [/\bPremier League\b/, 2, "Premier League"],
  [/\bLa ?Liga\b|\bEl Cl[aá]sico\b/, 2, "La Liga"],
  [/\bSerie A\b/, 2, "Serie A"],
  [/\bBundesliga\b/, 2, "Bundesliga"],
  [/\bLigue 1\b/, 1.5, "Ligue 1"],
  [/\bEuropa League\b/, 1.5, "Europa League"],
  [/\bConference League\b/, 1, "Conference League"],
  [/\bFA Cup\b|\bCopa del Rey\b|\bCoppa Italia\b|\bDFB-Pokal\b/, 1.5, "Domestic cup"],
  [/\bNations League\b|\bWorld Cup qualif/, 1.5, "International"],
  [/\bGolden Boy\b|\bFIFPRO\b|\bFifpro\b|\bThe Best\b|\bGolden Boot\b|\bPlayer of the (?:Month|Year|Season)\b|\bManager of the (?:Month|Year|Season)\b/, 2, "Awards"],
];

/** Low-visibility football: welcome when extraordinary, otherwise kept off the page. */
const LOW_VISIBILITY: [RegExp, number][] = [
  [/\bA-League\b|\bChinese Super League\b|\bChinese\b|\bJ1?[- ]League\b|\bK League\b|\bISL\b|\bIndian Super League\b|\bUSL\b|\bAllsvenskan\b|\bEliteserien\b/, 4],
  [/\bScottish (?:Championship|League One|League Two)\b|\bLeague (?:One|Two)\b|\bNational League\b|\bnon-league\b|\b(?:sixth|seventh|eighth)-tier\b|\bSPFL\b|\bScottish Cup\b|\bChallenge Cup\b/, 3],
  [/\bNWSL\b|\bLiga MX\b|\bMLS\b(?!.*\bMessi\b)/, 2],
  [/\bU-?(?:17|18|19|20|21|23)\b|\bunder-(?:17|18|19|20|21|23)\b|\byouth\b|\bacademy\b|\breserves?\b/i, 2.5],
  [/\bWomen\b|\bWSL\b|\bLionesses\b|\bWomen's\b/, 1],
];

/** What happened: the events fans talk about. The strongest match counts, plus half of the next. */
const SIGNIFICANCE: [RegExp, number, string][] = [
  [/\b(?:dies|died|has died|passed away|death of)\b/i, 7, "death"],
  [/\bretire(?:s|d|ment)?\b|\bhangs? up (?:his|her) boots\b|\bfarewell\b/i, 5, "retirement"],
  [/\bBallon d['’]Or\b|\bGolden Boy\b|\bwins? (?:the )?(?:award|title|trophy|Golden Boot)\b|\bcrowned\b|\bchampions\b(?! league)/i, 4.5, "honour"],
  [/\bsack(?:s|ed|ing)?\b|\bdismiss(?:es|ed)\b|\bresign(?:s|ed|ation)?\b|\bappoint(?:s|ed|ment)?\b|\bnew (?:manager|head coach|boss)\b|\bjob (?:at (?:serious )?risk|on the line)\b|\bleading candidate\b|\bfrontrunner\b/i, 4.5, "dugout"],
  [/\bhere we go\b|\bcompletes?\b|\bsigns?\b|\bjoins?\b|\bunveil(?:s|ed)\b|\bagree(?:s|d)? (?:a )?(?:fee|deal|terms)\b|\bnew (?:contract|deal)\b|\bextends? (?:his |her )?contract\b|\brelease clause\b|\b[£€$]\s?\d+(?:\.\d+)?\s?(?:m|bn)\b/i, 4, "transfer"],
  [/\brecord\b|\bhistor(?:y|ic)\b|\bfirst (?:ever|time)\b|\bmilestone\b|\b\d{2,4}(?:th|st|nd|rd) (?:goal|appearance|cap|career goal)\b/i, 3.5, "record"],
  [/\bcomeback\b|\bfight back\b|\bstun(?:s|ned)?\b|\bshock\b|\bupset\b|\bthrash(?:es|ed)?\b|\bhammer(?:s|ed)?\b|\brout(?:s|ed)?\b|\bthriller\b|\blate (?:winner|equaliser|goal)\b|\bstoppage[- ]time\b|\bpenalt(?:y|ies) shoot-?out\b|\bhat-trick\b|\bbrace\b|\bdouble\b/i, 3, "drama"],
  [/\bfinal\b|\bsemi-final\b|\bderby\b|\bEl Cl[aá]sico\b|\btitle race\b|\btop of the (?:table|league)\b|\bgo(?:es)? (?:top|clear|second)\b|\brelegation zone\b|\bdrop zone\b/i, 2.5, "stakes"],
  [/\bVAR\b|\bred card\b|\bsent off\b|\bcontrovers(?:y|ial)\b|\bban(?:ned)?\b|\bcharged\b|\bfined\b|\bracis[mt]\b|\babuse\b/i, 2.5, "controversy"],
  [/\binjur(?:y|ed|ies)\b|\bruled out\b|\bsurgery\b|\bACL\b|\bout for\b|\bscan\b/i, 2.5, "injury"],
  [/\btransfer\b|\bbid\b|\btalks\b|\bset to join\b|\bclose to\b|\bnegotiat/i, 2.5, "transfer-talk"],
  [/\blinked\b|\binterest(?:ed)?\b|\bwatchlist\b|\bgossip\b|\brumou?rs?\b|\btarget\b|\beye(?:s|ing)?\b|\bwant(?:s|ed)?\b/i, 1.5, "rumour"],
];

/** Routine items fans scroll past. */
const ROUTINE = /\b(?:preview|predicted|line-?ups?|team news|how to watch|where to watch|live stream|tickets?|kit launch|training (?:session|camp|update)|betting|odds|tips|fantasy|ratings|talking points|stocks|power rankings|mailbag|explained|what we learned|five things|x things)\b/i;

export interface Assessment {
  score: number;
  /** The single strongest editorial signal (e.g. "retirement", "dugout"). */
  signal: string | null;
  /** The most prominent club or person named, for display context. */
  subject: string | null;
  /** Whether a recognised club, player or manager is involved. */
  recognised: boolean;
}

const strongest = (list: Entity[], text: string) => {
  let best: Entity | null = null;
  let name: string | null = null;
  let second = 0;
  for (const e of list) {
    const hit = text.match(e[0]);
    if (!hit) continue;
    if (!best || e[1] > best[1]) {
      if (best) second = Math.max(second, best[1]);
      best = e;
      // Grouped entries ("Star player") name whoever actually matched.
      name = /^(Star player|Major manager|Premier League club|European regulars|Turkish giants|South American giants)$/.test(e[2]) ? hit[0] : e[2];
    } else second = Math.max(second, e[1]);
  }
  return { best, second, name };
};

export function assess(title: string, summary: string | null, hoursOld: number, feedRank: number): Assessment {
  const head = title;
  const club = strongest(CLUBS, head);
  const person = strongest(PEOPLE, head);
  // Competitions are often only in the summary; count them at a discount there.
  const compHead = strongest(COMPETITIONS, head).best?.[1] ?? 0;
  const compBody = strongest(COMPETITIONS, summary ?? "").best?.[1] ?? 0;
  const competition = Math.max(compHead, compBody * 0.6);

  const signals = SIGNIFICANCE.filter(([re]) => re.test(head)).sort((a, b) => b[1] - a[1]);
  const significance = (signals[0]?.[1] ?? 0) + (signals[1]?.[1] ?? 0) * 0.5;

  const who = (club.best?.[1] ?? 0) + Math.min(club.second, 4) * 0.5 + (person.best?.[1] ?? 0);
  const recognised = who >= 2.5;
  let penalty = 0;
  for (const [re, p] of LOW_VISIBILITY) if (re.test(`${head} ${summary ?? ""}`)) penalty = Math.max(penalty, p);
  // A famous name lifts a low-visibility league story (e.g. Messi in MLS) but doesn't erase the penalty.
  if (recognised) penalty *= 0.4;
  if (ROUTINE.test(head)) penalty += 2.5;
  if (/\?\s*$/.test(head)) penalty += 0.75;

  const recency = 3 * Math.max(0, 1 - hoursOld / 48);
  const prominence = 1.5 * (1 - Math.min(feedRank, 20) / 20);
  // Without a recognised subject, a story needs a genuinely big event to compete.
  const obscurity = recognised ? 0 : significance >= 4.5 ? 0.5 : 2;

  const score = who + competition + significance + recency + prominence - penalty - obscurity;
  return {
    score: Math.round(score * 10) / 10,
    signal: signals[0]?.[2] ?? null,
    subject: person.name ?? club.name ?? null,
    recognised,
  };
}

/** Stories below this aren't worth a fan's attention today; they're left out rather than padded in. */
export const MIN_SCORE = 6;
