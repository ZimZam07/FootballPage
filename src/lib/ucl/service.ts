/* eslint-disable @typescript-eslint/no-explicit-any -- raw ESPN payloads are untyped; normalized here */
import { SITE, UpstreamError, espnGet, liveLabel, toScore, toState, toTeam } from "@/lib/club-hub/espn";
import { matchSlug } from "@/lib/match/slug";
import type { TeamLite } from "@/lib/club-hub/types";
import type { UclCleanSheetRow, UclCleanSheets, UclClub, UclKnockoutRound, UclLeader, UclLeaders, UclMatch, UclOverview, UclStage, UclStandingRow, UclTie, UclZone } from "./types";

/**
 * UEFA Champions League data from ESPN's "uefa.champions" competition feeds.
 * Everything is fetched live: the season, its stage calendar, the 36-team
 * league-phase table (with ESPN's official qualification notes), all fixtures,
 * the knockout ties (only once real ties exist), clubs and top scorers.
 */
const UCL = `${SITE}/uefa.champions`;
const STANDINGS = "https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings";

/** Country for a club, from its domestic league code (e.g. "gre.1" -> Greece). */
const LEAGUE_COUNTRY: Record<string, string> = {
  eng: "England", esp: "Spain", ita: "Italy", ger: "Germany", fra: "France", por: "Portugal", ned: "Netherlands",
  bel: "Belgium", tur: "Türkiye", gre: "Greece", sco: "Scotland", aut: "Austria", sui: "Switzerland", cze: "Czechia",
  den: "Denmark", nor: "Norway", swe: "Sweden", ukr: "Ukraine", cro: "Croatia", srb: "Serbia", cyp: "Cyprus",
  aze: "Azerbaijan", kaz: "Kazakhstan", pol: "Poland", isr: "Israel", rus: "Russia", hun: "Hungary", rou: "Romania",
  svk: "Slovakia", svn: "Slovenia", bul: "Bulgaria", irl: "Ireland", mlt: "Malta", fin: "Finland", isl: "Iceland",
};

function zoneFor(position: number): { zone: UclZone; label: string } {
  // 2024+ format: 1–8 straight to the round of 16, 9–24 knockout play-offs (9–16 seeded), 25–36 eliminated.
  if (position <= 8) return { zone: "r16", label: "Round of 16" };
  if (position <= 16) return { zone: "playoff-seeded", label: "Play-offs (seeded)" };
  if (position <= 24) return { zone: "playoff-unseeded", label: "Play-offs (unseeded)" };
  return { zone: "out", label: "Eliminated" };
}

function monthsBetween(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const d = new Date(startIso);
  d.setUTCDate(1);
  const end = new Date(endIso);
  while (d <= end && out.length < 14) {
    out.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

function stageFor(date: string, stages: UclStage[]): string {
  const t = +new Date(date);
  return stages.find((s) => t >= +new Date(s.startDate) && t < +new Date(s.endDate))?.label ?? "Champions League";
}

function toUclMatch(e: any, stages: UclStage[], crests: Map<string, string>): UclMatch | null {
  const comp = e?.competitions?.[0];
  const sides = comp?.competitors ?? [];
  const home = sides.find((c: any) => c.homeAway === "home") ?? sides[0];
  const away = sides.find((c: any) => c.homeAway === "away") ?? sides[1];
  if (!comp || !home || !away) return null;
  const status = comp.status ?? e.status ?? {};
  const state = toState(status.type?.state);
  const side = (c: any) => {
    const team = toTeam(c.team);
    team.logo = crests.get(team.id) ?? team.logo;
    return { team, score: state === "pre" ? null : toScore(c.score), shootout: toScore(c.shootoutScore), winner: Boolean(c.winner) };
  };
  const h = side(home);
  const a = side(away);
  return {
    id: String(e.id),
    slug: matchSlug(String(e.id), h.team.name, a.team.name),
    date: e.date ?? comp.date,
    state,
    statusName: status.type?.name ?? "",
    statusDetail: status.type?.shortDetail ?? "",
    liveLabel: state === "in" ? liveLabel(status) : null,
    stage: stageFor(e.date ?? comp.date, stages),
    leg: comp.leg?.value ?? null,
    venue: comp.venue?.fullName ?? null,
    home: h,
    away: a,
  };
}

async function getStages(): Promise<{ season: string; logo: string; stages: UclStage[] }> {
  const data = await espnGet(`${UCL}/scoreboard`, 60 * 60);
  const league = data?.leagues?.[0];
  if (!league) throw new UpstreamError("Champions League data is unavailable right now.");
  const logos: any[] = league.logos ?? [];
  const now = Date.now();
  const entries: any[] = league.calendar?.[0]?.entries ?? [];
  const stages: UclStage[] = entries.map((c) => ({
    id: String(c.value ?? c.label),
    label: c.label === "Rd of 16" ? "Round of 16" : c.label,
    detail: c.detail ?? "",
    startDate: c.startDate,
    endDate: c.endDate,
    current: now >= +new Date(c.startDate) && now < +new Date(c.endDate),
  }));
  return {
    season: league.season?.displayName ?? "UEFA Champions League",
    logo: (logos.find((l) => l.rel?.includes("dark")) ?? logos[0])?.href ?? "",
    stages,
  };
}

async function getClubs(): Promise<{ clubs: UclClub[]; crests: Map<string, string> }> {
  const data = await espnGet(`${UCL}/teams`, 60 * 60 * 12);
  const teams: any[] = (data?.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t: any) => t.team).filter(Boolean);
  // Each club's domestic league tells us its country (cached for a day).
  const details = await Promise.allSettled(teams.map((t) => espnGet(`${UCL}/teams/${t.id}`, 60 * 60 * 24)));
  const clubs = teams.map((t, i) => {
    const d = details[i];
    const leagueHref: string | undefined =
      d.status === "fulfilled" ? d.value?.team?.defaultLeague?.links?.find((l: any) => /name\//.test(l.href))?.href : undefined;
    const code = leagueHref?.match(/name\/([a-z]+)\./)?.[1];
    return { ...toTeam(t), country: (code && LEAGUE_COUNTRY[code]) || null };
  });
  clubs.sort((a, b) => (a.country ?? "~").localeCompare(b.country ?? "~") || a.name.localeCompare(b.name));
  return { clubs, crests: new Map(clubs.map((c) => [c.id, c.logo])) };
}

async function getStandings(crests: Map<string, string>): Promise<UclStandingRow[]> {
  const data = await espnGet(STANDINGS, 60 * 5);
  const entries: any[] = data?.children?.[0]?.standings?.entries ?? [];
  const stat = (e: any, name: string) => Number(e.stats?.find((s: any) => s.name === name)?.value ?? 0);
  return entries
    .map((e) => {
      const position = stat(e, "rank") || e.note?.rank || 0;
      const team = toTeam(e.team);
      team.logo = crests.get(team.id) ?? team.logo;
      const z = zoneFor(position);
      return {
        position,
        team,
        played: stat(e, "gamesPlayed"),
        won: stat(e, "wins"),
        drawn: stat(e, "ties"),
        lost: stat(e, "losses"),
        goalsFor: stat(e, "pointsFor"),
        goalsAgainst: stat(e, "pointsAgainst"),
        goalDifference: stat(e, "pointDifferential"),
        points: stat(e, "points"),
        zone: z.zone,
        zoneLabel: z.label,
      };
    })
    .sort((a, b) => a.position - b.position);
}

/**
 * ESPN's Champions League leaderboards (this season's competition only): goals and assists.
 * Players are de-duplicated by id and ordered by value, then fewer matches, then name.
 */
async function getLeaders(): Promise<UclLeaders> {
  const data = await espnGet(`${UCL}/statistics`, 60 * 30);
  const board = (name: string): UclLeader[] => {
    const cat = (data?.stats ?? []).find((s: any) => s.name === name);
    const seen = new Set<string>();
    const rows: UclLeader[] = [];
    for (const l of cat?.leaders ?? []) {
      const id = String(l.athlete?.id ?? "");
      const value = Number(l.value);
      if (!id || seen.has(id) || !Number.isFinite(value) || value <= 0) continue;
      seen.add(id);
      const matches = String(l.displayValue ?? "").match(/Matches:\s*(\d+)/);
      rows.push({ id, name: l.athlete?.displayName ?? "", headshot: l.athlete?.headshot?.href ?? null, team: toTeam(l.athlete?.team), value, matches: matches ? Number(matches[1]) : null });
    }
    return rows.sort((a, b) => b.value - a.value || (a.matches ?? 99) - (b.matches ?? 99) || a.name.localeCompare(b.name));
  };
  const leaders = { goals: board("goalsLeaders"), assists: board("assistsLeaders") };
  if (!leaders.goals.length && !leaders.assists.length) throw new UpstreamError("Champions League statistics are unavailable right now.");
  return leaders;
}

/** Groups knockout matches into two-legged ties per stage, with aggregate scores from the real results. */
function buildKnockout(matches: UclMatch[], stages: UclStage[]): UclKnockoutRound[] {
  const koStages = stages.filter((s) => !/league/i.test(s.label));
  return koStages.map((stage) => {
    const inStage = matches.filter((m) => m.stage === stage.label);
    const ties = new Map<string, UclTie>();
    for (const m of inStage) {
      const key = [m.home.team.id, m.away.team.id].sort().join("-");
      const tie = ties.get(key) ?? { id: key, teams: [m.home.team, m.away.team] as [TeamLite, TeamLite], legs: [], aggregate: null, winnerId: null, complete: false };
      tie.legs.push(m);
      ties.set(key, tie);
    }
    for (const tie of ties.values()) {
      tie.legs.sort((a, b) => +new Date(a.date) - +new Date(b.date));
      const [t1] = tie.teams;
      let a = 0, b = 0, played = 0;
      for (const leg of tie.legs) {
        if (leg.state === "pre" || leg.home.score == null || leg.away.score == null) continue;
        played++;
        const t1Home = leg.home.team.id === t1.id;
        a += t1Home ? leg.home.score : leg.away.score;
        b += t1Home ? leg.away.score : leg.home.score;
      }
      tie.aggregate = played ? [a, b] : null;
      const finalLeg = tie.legs[tie.legs.length - 1];
      tie.complete = tie.legs.every((l) => l.state === "post") && (stage.label === "Final" || tie.legs.length >= 2);
      if (tie.complete) {
        const w = finalLeg.home.winner ? finalLeg.home.team.id : finalLeg.away.winner ? finalLeg.away.team.id : a > b ? tie.teams[0].id : b > a ? tie.teams[1].id : null;
        tie.winnerId = w;
      }
    }
    return { stage, ties: [...ties.values()].sort((x, y) => +new Date(x.legs[0].date) - +new Date(y.legs[0].date)) };
  });
}

let inFlight: Promise<UclOverview> | null = null;

export async function getUclOverview(): Promise<UclOverview> {
  // Collapse concurrent requests into one upstream refresh.
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const { season, logo, stages } = await getStages();
    const [clubsRes, leaders] = await Promise.all([getClubs(), getLeaders().catch(() => null)]);
    const { clubs, crests } = clubsRes;
    const standings = await getStandings(crests).catch(() => [] as UclStandingRow[]);

    const seasonStart = stages[0]?.startDate;
    const seasonEnd = stages[stages.length - 1]?.endDate;
    if (!seasonStart || !seasonEnd) throw new UpstreamError("The Champions League calendar is unavailable right now.");
    const now = new Date();
    const thisMonth = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const months = monthsBetween(seasonStart, seasonEnd);
    const monthly = await Promise.allSettled(
      months.map((m) => espnGet(`${UCL}/scoreboard?dates=${m}`, m === thisMonth ? 20 : 60 * 30)),
    );
    const byId = new Map<string, UclMatch>();
    const venueCountry = new Map<string, string>();
    for (const r of monthly) {
      if (r.status !== "fulfilled") continue;
      for (const e of r.value?.events ?? []) {
        if (+new Date(e.date) < +new Date(seasonStart)) continue; // ignore last season's games in the same month
        const m = toUclMatch(e, stages, crests);
        if (m) byId.set(m.id, m);
        // A club's home stadium address gives its country when ESPN has no domestic league for it.
        const country = e?.competitions?.[0]?.venue?.address?.country;
        const home = e?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.id;
        if (country && home && !e?.competitions?.[0]?.neutralSite) venueCountry.set(String(home), country);
      }
    }
    for (const c of clubs) if (!c.country) c.country = venueCountry.get(c.id) ?? null;
    clubs.sort((x, y) => (x.country ?? "~").localeCompare(y.country ?? "~") || x.name.localeCompare(y.name));
    const matches = [...byId.values()].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return {
      generatedAt: now.toISOString(),
      season,
      logo,
      stages,
      currentStage: stages.find((s) => s.current) ?? null,
      matches,
      standings,
      knockout: buildKnockout(matches, stages),
      clubs,
      leaders,
    };
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

// ---------------------------------------------------------------------------
// Clean sheets. ESPN publishes no clean-sheet leaderboard, so the table is built from the
// line-ups and scores of every completed match in this season's competition. A goalkeeper is
// credited with a clean sheet when they started, played the whole match (not substituted off,
// not sent off) and their team conceded no goals (extra time included; shoot-outs excluded).

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        try {
          out[i] = { status: "fulfilled", value: await fn(items[i]) };
        } catch (reason) {
          out[i] = { status: "rejected", reason };
        }
      }
    }),
  );
  return out;
}

const isKeeper = (p: any) => /^(G|GK)$/i.test(String(p?.position?.abbreviation ?? ""));
const statOf = (p: any, name: string) => Number((p?.stats ?? []).find((s: any) => s?.name === name)?.value) || 0;

let cleanSheetsInFlight: Promise<UclCleanSheets> | null = null;

export async function getUclCleanSheets(): Promise<UclCleanSheets> {
  if (cleanSheetsInFlight) return cleanSheetsInFlight;
  cleanSheetsInFlight = (async () => {
    const overview = await getUclOverview();
    const completed = overview.matches.filter((m) => m.state === "post" && !/POSTPONED|CANCEL|ABANDON/.test(m.statusName));
    const crest = new Map(overview.clubs.map((c) => [c.id, c.logo]));

    // Finished matches don't change, so their summaries can be cached for hours.
    const summaries = await mapLimit(completed, 6, (m) => espnGet(`${SITE}/all/summary?event=${m.id}`, 60 * 60 * 6));

    const table = new Map<string, UclCleanSheetRow>();
    let counted = 0;
    summaries.forEach((res, i) => {
      if (res.status !== "fulfilled") return;
      const data = res.value;
      const m = completed[i];
      const rosters: any[] = data?.rosters ?? [];
      if (rosters.length < 2) return;
      counted++;
      for (const r of rosters) {
        const conceded = r.homeAway === "home" ? m.away.score : m.home.score;
        if (conceded == null) continue;
        const team = toTeam(r.team);
        if (crest.get(team.id)) team.logo = crest.get(team.id)!;
        for (const p of r.roster ?? []) {
          if (!isKeeper(p) || !(p.starter || p.subbedIn)) continue;
          const id = String(p.athlete?.id ?? "");
          if (!id) continue;
          const row = table.get(id) ?? { id, name: p.athlete?.displayName ?? "", team, cleanSheets: 0, appearances: 0 };
          row.appearances++;
          if (conceded === 0 && p.starter && !p.subbedOut && statOf(p, "redCards") === 0) row.cleanSheets++;
          table.set(id, row);
        }
      }
    });
    if (completed.length && !counted) throw new UpstreamError("Match line-ups couldn't be loaded, so clean sheets can't be counted right now.");

    const keepers = [...table.values()]
      .filter((k) => k.cleanSheets > 0)
      .sort((a, b) => b.cleanSheets - a.cleanSheets || a.appearances - b.appearances || a.name.localeCompare(b.name));
    return {
      generatedAt: new Date().toISOString(),
      season: overview.season,
      matchesCounted: counted,
      matchesMissing: completed.length - counted,
      keepers,
    };
  })();
  try {
    return await cleanSheetsInFlight;
  } finally {
    cleanSheetsInFlight = null;
  }
}
