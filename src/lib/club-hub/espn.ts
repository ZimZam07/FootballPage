/* eslint-disable @typescript-eslint/no-explicit-any -- raw ESPN payloads are untyped; they are normalized into typed shapes at this boundary */
import { LEAGUES, getLeague, type LeagueConfig } from "./leagues";
import type {
  ClubOverview,
  LeagueTeams,
  LineupPlayer,
  MatchDetail,
  MatchStatLine,
  MatchSummary,
  MatchState,
  MatchTeamDetail,
  Player,
  PlayerStat,
  Squad,
  StandingRow,
  Standings,
  TeamLite,
  WinProbability,
  EventPlayer,
  MatchEvent,
  MatchEventKind,
  PlayerContributions,
} from "./types";

/**
 * ESPN's public site API (no key required). It is unofficial, so every call
 * goes through the Next.js data cache to keep request volume low and the UI
 * fast. Revalidation windows are tuned per data type.
 */
export const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const STANDINGS = "https://site.api.espn.com/apis/v2/sports/soccer";

export class UpstreamError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

/**
 * Live data (cache windows of 30s or less) uses a small in-memory cache that
 * never serves expired entries. The Next.js data cache serves a stale entry
 * once before revalidating, and survives restarts, which could show a score
 * that is minutes old on the first view. Slower-changing data keeps using it.
 */
const LIVE_MAX_SECONDS = 30;
const liveCache = new Map<string, { at: number; ttl: number; promise: Promise<any> }>();

async function fetchJson(url: string, init: RequestInit & { next?: { revalidate: number } }): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  } catch {
    throw new UpstreamError("The football data provider could not be reached.");
  }
  if (!res.ok) {
    throw new UpstreamError(`The football data provider returned ${res.status}.`, res.status === 404 ? 404 : 502);
  }
  return res.json();
}

export async function espnGet(url: string, revalidate: number): Promise<any> {
  if (revalidate > LIVE_MAX_SECONDS) return fetchJson(url, { next: { revalidate } });

  const now = Date.now();
  const hit = liveCache.get(url);
  if (hit && now - hit.at < hit.ttl) return hit.promise;
  const promise = fetchJson(url, { cache: "no-store" });
  liveCache.set(url, { at: now, ttl: revalidate * 1000, promise });
  promise.catch(() => liveCache.delete(url)); // never cache failures
  if (liveCache.size > 500) {
    for (const [k, v] of liveCache) if (now - v.at >= v.ttl) liveCache.delete(k);
  }
  return promise;
}

export function requireLeague(id: string | null): LeagueConfig {
  const league = getLeague(id);
  if (!league) throw new UpstreamError("Unknown league.", 400);
  return league;
}

export function requireId(id: string | null): string {
  if (!id || !/^\d{1,10}$/.test(id)) throw new UpstreamError("Invalid id.", 400);
  return id;
}

// ---------------------------------------------------------------------------
// Normalizers

// Prefer ESPN's dark-background crest variant (the site is permanently dark), then the default.
const logoOf = (team: any): string =>
  team?.logos?.find((l: any) => l.rel?.includes("dark"))?.href ??
  team?.logos?.find((l: any) => l.rel?.includes("default"))?.href ??
  team?.logos?.[0]?.href ??
  team?.logo ??
  (team?.id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${team.id}.png` : "");

export function toTeam(team: any): TeamLite {
  return {
    id: String(team?.id ?? ""),
    name: team?.displayName ?? team?.name ?? "Unknown",
    shortName: team?.shortDisplayName ?? team?.displayName ?? team?.name ?? "Unknown",
    abbreviation: team?.abbreviation ?? "",
    logo: logoOf(team),
  };
}

export function toScore(score: any): number | null {
  if (score == null) return null;
  const raw = typeof score === "object" ? (score.value ?? score.displayValue) : score;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export const toState = (s: any): MatchState => (s === "in" || s === "post" ? s : "pre");

export function toMatchSummary(event: any): MatchSummary | null {
  const comp = event?.competitions?.[0];
  if (!comp) return null;
  const sides = comp.competitors ?? [];
  const home = sides.find((c: any) => c.homeAway === "home") ?? sides[0];
  const away = sides.find((c: any) => c.homeAway === "away") ?? sides[1];
  if (!home || !away) return null;
  const status = comp.status ?? event.status ?? {};
  const state = toState(status.type?.state);
  const side = (c: any) => ({
    team: toTeam(c.team),
    score: state === "pre" ? null : toScore(c.score),
    shootout: toScore(c.shootoutScore),
    winner: Boolean(c.winner),
  });
  return {
    id: String(event.id),
    date: event.date ?? comp.date,
    competition: event.league?.name ?? event.season?.displayName ?? "",
    round: comp.notes?.[0]?.headline ?? null,
    venue: comp.venue?.fullName ?? null,
    state,
    statusName: status.type?.name ?? "",
    statusDetail: status.type?.shortDetail ?? status.type?.detail ?? "",
    home: side(home),
    away: side(away),
  };
}

// ---------------------------------------------------------------------------
// Teams

function orderTeams(config: LeagueConfig, teams: LeagueTeams["teams"]): LeagueTeams["teams"] {
  const rank = new Map(config.popularity.map((id, i) => [id, i]));
  return [...teams].sort((a, b) => {
    const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ra - rb || a.name.localeCompare(b.name);
  });
}

export async function getLeagueTeams(config: LeagueConfig): Promise<LeagueTeams> {
  const data = await espnGet(`${SITE}/${config.espn}/teams`, 60 * 60 * 12);
  const raw = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  const teams = raw
    .map((t: any) => t.team)
    .filter((t: any) => t?.id && t.isActive !== false)
    .map((t: any) => ({ ...toTeam(t), color: t.color ? `#${t.color}` : null }));
  return { league: config.id, name: config.name, teams: orderTeams(config, teams) };
}

export async function getAllTeams(): Promise<LeagueTeams[]> {
  const settled = await Promise.allSettled(LEAGUES.map(getLeagueTeams));
  const ok = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (!ok.length) throw new UpstreamError("Could not load clubs from the football data provider.");
  return ok;
}

// ---------------------------------------------------------------------------
// Club overview: identity, fixtures (all competitions) and results

const FAILED = Symbol("failed");

export async function getClubOverview(config: LeagueConfig, teamId: string): Promise<ClubOverview> {
  const [info, upcoming, past] = await Promise.all([
    espnGet(`${SITE}/${config.espn}/teams/${teamId}`, 60 * 30),
    espnGet(`${SITE}/all/teams/${teamId}/schedule?fixture=true`, 30).catch(() => FAILED),
    espnGet(`${SITE}/all/teams/${teamId}/schedule`, 30).catch(() => FAILED),
  ]);
  // If neither schedule loads, fail the request (the UI offers a retry) rather than
  // telling the user the club has no fixtures and no results.
  if (upcoming === FAILED && past === FAILED) {
    throw new UpstreamError("Fixtures and results couldn't be loaded from the football data provider.");
  }
  const team = info?.team;
  if (!team?.id) throw new UpstreamError("Club not found.", 404);

  const now = Date.now();
  const summaries = (d: any): MatchSummary[] =>
    (d === FAILED ? [] : (d?.events ?? [])).map(toMatchSummary).filter(Boolean) as MatchSummary[];

  // Merge both feeds and dedupe: a match can appear in either while it is live.
  const all = new Map<string, MatchSummary>();
  for (const m of [...summaries(past), ...summaries(upcoming)]) all.set(m.id, m);
  const matches = [...all.values()];

  const fixtures = matches
    .filter((m) => m.state !== "post" && !(m.state === "pre" && /POSTPONED|CANCELED|CANCELLED/.test(m.statusName) && new Date(m.date).getTime() < now))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const results = matches
    .filter((m) => m.state === "post" && !/POSTPONED|CANCELED|CANCELLED/.test(m.statusName))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return {
    club: {
      id: String(team.id),
      name: team.displayName,
      shortName: team.shortDisplayName ?? team.displayName,
      logo: logoOf(team),
      color: team.color ? `#${team.color}` : null,
      alternateColor: team.alternateColor ? `#${team.alternateColor}` : null,
      standingSummary: team.standingSummary ?? null,
      league: config.id,
      leagueName: config.name,
    },
    fixtures,
    results,
    unavailable: [...(upcoming === FAILED ? (["fixtures"] as const) : []), ...(past === FAILED ? (["results"] as const) : [])],
  };
}

// ---------------------------------------------------------------------------
// Standings

export async function getStandings(config: LeagueConfig): Promise<Standings> {
  const data = await espnGet(`${STANDINGS}/${config.espn}/standings`, 60 * 5);
  const group = data?.children?.[0];
  const entries: any[] = group?.standings?.entries ?? [];
  if (!entries.length) throw new UpstreamError("Standings are not available right now.");

  const stat = (e: any, name: string) => {
    const v = e.stats?.find((s: any) => s.name === name)?.value;
    return typeof v === "number" ? v : Number(v ?? 0);
  };
  const rows: StandingRow[] = entries
    .map((e) => ({
      position: stat(e, "rank") || e.note?.rank || 0,
      team: toTeam(e.team),
      played: stat(e, "gamesPlayed"),
      won: stat(e, "wins"),
      drawn: stat(e, "ties"),
      lost: stat(e, "losses"),
      goalsFor: stat(e, "pointsFor"),
      goalsAgainst: stat(e, "pointsAgainst"),
      goalDifference: stat(e, "pointDifferential"),
      points: stat(e, "points"),
      deductions: Math.abs(stat(e, "deductions")) || 0,
      // ESPN occasionally sends malformed colours such as "##B5E7CE".
      zone: e.note?.color ? { color: `#${String(e.note.color).replace(/^#+/, "")}`, description: e.note.description ?? "" } : null,
    }))
    .sort((a, b) => a.position - b.position);

  return {
    league: config.id,
    leagueName: config.name,
    season: group?.standings?.seasonDisplayName ?? group?.name ?? "",
    rows,
  };
}

// ---------------------------------------------------------------------------
// Squad

const STAT_ORDER = [
  "appearances",
  "subIns",
  "totalGoals",
  "goalAssists",
  "totalShots",
  "shotsOnTarget",
  "saves",
  "goalsConceded",
  "shotsFaced",
  "foulsCommitted",
  "foulsSuffered",
  "offsides",
  "yellowCards",
  "redCards",
];

function playerStats(athlete: any): PlayerStat[] {
  const found = new Map<string, PlayerStat>();
  for (const cat of athlete?.statistics?.splits?.categories ?? []) {
    for (const s of cat.stats ?? []) {
      if (STAT_ORDER.includes(s.name) && !found.has(s.name)) {
        found.set(s.name, { key: s.name, label: s.displayName ?? s.name, value: s.displayValue ?? String(s.value ?? "") });
      }
    }
  }
  const isKeeper = athlete?.position?.abbreviation === "G";
  return STAT_ORDER.filter((k) => found.has(k))
    .filter((k) => (isKeeper ? !["totalShots", "shotsOnTarget", "offsides"].includes(k) : !["saves", "goalsConceded", "shotsFaced"].includes(k)))
    .map((k) => found.get(k)!);
}

function positionGroup(name: string | undefined): Player["positionGroup"] {
  switch (name) {
    case "Goalkeeper":
      return "Goalkeepers";
    case "Defender":
      return "Defenders";
    case "Midfielder":
      return "Midfielders";
    case "Forward":
      return "Forwards";
    default:
      return "Other";
  }
}

export async function getSquad(config: LeagueConfig, teamId: string): Promise<Squad> {
  const data = await espnGet(`${SITE}/${config.espn}/teams/${teamId}/roster`, 60 * 60 * 6);
  const athletes: any[] = data?.athletes ?? [];
  // ESPN's roster `coach` field lists historical managers (e.g. Wenger for Arsenal), so it is deliberately not used.
  return {
    season: data?.season?.displayName ?? (data?.season?.year ? String(data.season.year) : null),
    players: athletes.map((a) => ({
      id: String(a.id),
      name: a.displayName ?? a.fullName,
      jersey: a.jersey ?? null,
      position: a.position?.displayName ?? "Unknown",
      positionGroup: positionGroup(a.position?.displayName),
      age: typeof a.age === "number" ? a.age : null,
      dateOfBirth: a.dateOfBirth ?? null,
      height: a.displayHeight ?? null,
      weight: a.displayWeight ?? null,
      nationality: a.citizenship ?? a.citizenshipCountry?.name ?? null,
      flag: a.flag?.href ?? null,
      headshot: a.headshot?.href ?? null,
      birthPlace: [a.birthPlace?.city, a.birthPlace?.country].filter(Boolean).join(", ") || null,
      injury: a.injuries?.[0] ? [a.injuries[0].status, a.injuries[0].details?.type].filter(Boolean).join(" · ") || "Injured" : null,
      stats: playerStats(a),
      profileUrl: a.links?.find((l: any) => l.rel?.includes("playercard"))?.href ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Match detail: stats, lineups, and odds-implied win probability

const MATCH_STATS: { key: string; label: string; pct?: boolean; ratio?: boolean }[] = [
  { key: "possessionPct", label: "Possession", pct: true },
  { key: "totalShots", label: "Total shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "passPct", label: "Pass accuracy", ratio: true },
  { key: "totalPasses", label: "Total passes" },
  { key: "wonCorners", label: "Corners" },
  { key: "foulsCommitted", label: "Fouls" },
  { key: "offsides", label: "Offsides" },
  { key: "saves", label: "Saves" },
  { key: "yellowCards", label: "Yellow cards" },
  { key: "redCards", label: "Red cards" },
];

function matchStats(homeTeam: any, awayTeam: any): MatchStatLine[] {
  const read = (t: any, key: string) => {
    const s = t?.statistics?.find((x: any) => x.name === key);
    if (!s) return null;
    const n = Number(s.value ?? s.displayValue);
    return Number.isFinite(n) ? n : null;
  };
  const lines: MatchStatLine[] = [];
  for (const def of MATCH_STATS) {
    let h = read(homeTeam, def.key);
    let a = read(awayTeam, def.key);
    if (h == null || a == null) continue;
    if (def.ratio) {
      // ESPN rounds passPct to one decimal; derive it from the raw counts when possible.
      const ha = read(homeTeam, "accuratePasses"), ht = read(homeTeam, "totalPasses");
      const aa = read(awayTeam, "accuratePasses"), at = read(awayTeam, "totalPasses");
      h = ha != null && ht ? (ha / ht) * 100 : h * 100;
      a = aa != null && at ? (aa / at) * 100 : a * 100;
    }
    const fmt = (v: number) => (def.pct || def.ratio ? `${Math.round(v)}%` : String(v));
    lines.push({ key: def.key, label: def.label, home: fmt(h), away: fmt(a), homeValue: h, awayValue: a });
  }
  return lines;
}

/** Goals, assists and cards from a roster entry's per-player match box score (null if not published). */
function contributionsOf(stats: any): PlayerContributions | null {
  if (!Array.isArray(stats) || !stats.length) return null;
  const v = (name: string) => {
    const n = Number(stats.find((x: any) => x?.name === name)?.value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };
  return { goals: v("totalGoals"), ownGoals: v("ownGoals"), assists: v("goalAssists"), yellowCards: v("yellowCards"), redCards: v("redCards"), secondYellow: false };
}

/** ESPN labels every dismissal "Red Card"; a second booking is identified by the event text ("Second yellow card to ..."). */
export const isSecondYellow = (e: { label: string; text: string | null }) => /yellow/i.test(e.label) || /second yellow/i.test(e.text ?? "");

/**
 * Links each substitution to the players on both teams' sheets, and marks second-yellow dismissals,
 * using the provider's own substitution and card events. Players are matched by id, then by name.
 */
function linkMatchEvents(side: MatchTeamDetail, events: MatchEvent[], which: "home" | "away") {
  const all = [...side.starters, ...side.substitutes];
  const find = (p: EventPlayer | null | undefined) =>
    p ? all.find((x) => (p.id && x.id === p.id) || x.name === p.name) ?? null : null;
  const ref = (x: LineupPlayer) => ({ id: x.id, name: x.name, shortName: x.shortName, jersey: x.jersey });
  // Cards come from the events when there are any: ESPN's per-player box score can omit the
  // booking that preceded a second-yellow dismissal (verified against its own event feed).
  const cardEvents = events.filter((e) => e.side === which && (e.kind === "yellow" || e.kind === "red"));
  if (events.length) {
    for (const p of all) if (p.contributions) Object.assign(p.contributions, { yellowCards: 0, redCards: 0, secondYellow: false });
    for (const e of cardEvents) {
      const c = find(e.player)?.contributions;
      if (!c) continue;
      if (e.kind === "yellow") c.yellowCards++;
      else {
        c.redCards++;
        if (isSecondYellow(e)) c.secondYellow = true;
      }
    }
  }
  for (const e of events) {
    if (e.side !== which) continue;
    if (e.kind === "sub") {
      const on = find(e.player);
      const off = e.related?.role === "off" ? find(e.related.player) : null;
      if (on) on.cameOn = { minute: e.minute, other: off ? ref(off) : null };
      if (off) off.wentOff = { minute: e.minute, other: on ? ref(on) : null };
    }
  }
}

function lineup(roster: any): { formation: string | null; starters: LineupPlayer[]; substitutes: LineupPlayer[] } {
  const entries: any[] = roster?.roster ?? [];
  const toPlayer = (p: any): LineupPlayer => ({
    id: String(p.athlete?.id ?? ""),
    name: p.athlete?.displayName ?? "",
    shortName: p.athlete?.shortName ?? p.athlete?.displayName ?? "",
    jersey: p.jersey ?? null,
    position: p.position?.displayName ?? "",
    positionAbbr: p.position?.abbreviation ?? "",
    formationPlace: Number(p.formationPlace) || 0,
    subbedIn: Boolean(p.subbedIn),
    subbedOut: Boolean(p.subbedOut),
    headshot: p.athlete?.headshot?.href ?? null,
    contributions: contributionsOf(p.stats),
    cameOn: null,
    wentOff: null,
  });
  return {
    formation: roster?.formation ?? null,
    starters: entries.filter((p) => p.starter).map(toPlayer),
    substitutes: entries.filter((p) => !p.starter).map(toPlayer),
  };
}

/** Converts American moneyline odds to probabilities with the bookmaker margin removed. */
function oddsToProbability(odds: any): WinProbability | null {
  const ml = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0 ? n : null;
  };
  const h = ml(odds?.homeTeamOdds?.moneyLine);
  const a = ml(odds?.awayTeamOdds?.moneyLine);
  const d = ml(odds?.drawOdds?.moneyLine);
  if (h == null || a == null || d == null) return null;
  const implied = (m: number) => (m < 0 ? -m / (-m + 100) : 100 / (m + 100));
  const [ph, pd, pa] = [implied(h), implied(d), implied(a)];
  const total = ph + pd + pa;
  return {
    provider: odds?.provider?.name ?? "Bookmaker",
    home: (ph / total) * 100,
    draw: (pd / total) * 100,
    away: (pa / total) * 100,
  };
}

// ---------------------------------------------------------------------------
// Match events (timeline). Built from ESPN's key events and commentary; the
// descriptions are ESPN's own text. Routine plays (fouls, offsides, corners)
// are left out so the timeline stays readable.

function classifyEvent(type: string): MatchEventKind | null {
  if (type === "own-goal") return "own-goal";
  if (/penalty.*(saved|missed)|missed-penalty|penalty-miss/.test(type)) return "penalty-miss";
  if (/^goal|^penalty---scored|penalty-goal/.test(type)) return "goal";
  if (/yellow-red|second-yellow|red-card/.test(type)) return "red";
  if (type === "yellow-card") return "yellow";
  if (type === "substitution") return "sub";
  if (type === "shot-on-target") return "shot-on";
  if (type === "shot-off-target") return "shot-off";
  if (type === "shot-blocked") return "shot-blocked";
  if (/woodwork|hit-post|hit-bar/.test(type)) return "woodwork";
  if (/^var/.test(type)) return "var";
  if (/^kickoff$|halftime|half-time|end-regular|full-time|fulltime|start-2nd|second-half|end-of|start-extra|end-extra/.test(type)) return "period";
  return null;
}

const PERIOD_LABEL: [RegExp, string][] = [
  [/^kickoff$/, "Kick-off"],
  [/halftime|half-time/, "Half-time"],
  [/start-2nd|second-half/, "Second half"],
  [/end-regular|full-time|fulltime/, "Full-time"],
  [/start-extra/, "Extra time"],
  [/end-extra/, "End of extra time"],
];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Official squad positions (Goalkeeper / Defender / Midfielder / Forward) by athlete id.
 * The match lineup only carries formation slots ("Right Back" for a midfielder
 * covering there), so the squad feed is used for the player's real position.
 */
async function squadPositions(leagueSlug: string | undefined, teamIds: string[]): Promise<Map<string, string>> {
  const positions = new Map<string, string>();
  if (!leagueSlug || !/^[a-z0-9._-]+$/i.test(leagueSlug)) return positions;
  const rosters = await Promise.allSettled(
    teamIds.filter(Boolean).map((id) => espnGet(`${SITE}/${leagueSlug}/teams/${id}/roster`, 60 * 60 * 6)),
  );
  for (const r of rosters) {
    if (r.status !== "fulfilled") continue;
    for (const a of r.value?.athletes ?? []) {
      if (a?.id && a.position?.displayName) positions.set(String(a.id), a.position.displayName);
    }
  }
  return positions;
}

function matchEvents(data: any, homeTeam: TeamLite, awayTeam: TeamLite, positions: Map<string, string>): MatchEvent[] {
  // Roster index for shirt numbers, positions and sides.
  const people = new Map<string, EventPlayer & { side: "home" | "away" }>();
  for (const r of data.rosters ?? []) {
    const side: "home" | "away" = r.homeAway === "away" ? "away" : "home";
    for (const p of r.roster ?? []) {
      const id = p.athlete?.id ? String(p.athlete.id) : null;
      const entry = {
        name: p.athlete?.displayName ?? "",
        id,
        jersey: p.jersey ?? null,
        position: (id && positions.get(id)) || null,
        side,
      };
      if (entry.id) people.set(`id:${entry.id}`, entry);
      if (entry.name) people.set(`n:${fold(entry.name)}`, entry);
    }
  }
  const person = (a: any): (EventPlayer & { side?: "home" | "away" }) | null => {
    if (!a?.displayName && !a?.id) return null;
    const hit = (a.id && people.get(`id:${a.id}`)) || (a.displayName && people.get(`n:${fold(a.displayName)}`));
    return hit ?? { name: a.displayName, id: a.id ? String(a.id) : null, jersey: null, position: null };
  };
  const byName = (name: string) => person({ displayName: name.trim() });
  const sideOfTeam = (t: any): "home" | "away" | null => {
    if (!t) return null;
    if (t.id && String(t.id) === homeTeam.id) return "home";
    if (t.id && String(t.id) === awayTeam.id) return "away";
    const n = fold(t.displayName ?? "");
    if (n && n === fold(homeTeam.name)) return "home";
    if (n && n === fold(awayTeam.name)) return "away";
    return null;
  };

  // Merge both feeds by play id; commentary often has the fuller text (e.g. assists).
  type Raw = { id: string; play: any; text: string | null; seq: number };
  const raw = new Map<string, Raw>();
  (data.keyEvents ?? []).forEach((e: any, i: number) => {
    if (e?.id) raw.set(String(e.id), { id: String(e.id), play: e, text: e.text ?? null, seq: i });
  });
  for (const c of data.commentary ?? []) {
    const p = c.play;
    if (!p?.id) continue;
    const id = String(p.id);
    const prev = raw.get(id);
    const text = [prev?.text, p.text, c.text].filter(Boolean).sort((a, b) => b.length - a.length)[0] ?? null;
    raw.set(id, { id, play: { ...p, ...(prev?.play ?? {}) }, text, seq: Number(c.sequence) || prev?.seq || 0 });
  }

  const ordered = [...raw.values()]
    .filter((r) => !r.play.shootout)
    .sort(
      (a, b) =>
        (Number(a.play.period?.number) || 0) - (Number(b.play.period?.number) || 0) ||
        (Number(a.play.clock?.value) || 0) - (Number(b.play.clock?.value) || 0) ||
        a.seq - b.seq,
    );

  const events: MatchEvent[] = [];
  let score = { home: 0, away: 0 };
  for (const r of ordered) {
    const type: string = r.play.type?.type ?? "";
    const kind = classifyEvent(type);
    if (!kind) continue;
    const parts = r.play.participants ?? [];
    let player = person(parts[0]?.athlete);
    let related: MatchEvent["related"] = null;
    let side = sideOfTeam(r.play.team) ?? (player && "side" in player ? player.side ?? null : null);
    let eventScore: MatchEvent["score"] = null;
    const text = r.text;

    if (kind === "goal" || kind === "own-goal") {
      // "Goal! Valencia 0, Real Madrid 2." — read the score after the goal when present.
      const m = text?.match(/([^.!]+?)\s(\d+),\s([^.!]+?)\s(\d+)\./);
      let next = { ...score };
      if (m) {
        const firstIsHome = fold(m[1]).endsWith(fold(homeTeam.name)) || fold(homeTeam.name).endsWith(fold(m[1]));
        const [a, b] = [Number(m[2]), Number(m[4])];
        next = firstIsHome ? { home: a, away: b } : { home: b, away: a };
      } else if (side) {
        // Own goals count for the other side.
        const scorer = kind === "own-goal" ? (side === "home" ? "away" : "home") : side;
        next = { ...score, [scorer]: score[scorer] + 1 };
      }
      if (next.home !== score.home || next.away !== score.away) {
        side = next.home > score.home ? "home" : "away"; // the side the goal counts for
      }
      score = next;
      eventScore = { ...next };
      const assist = text?.match(/Assisted by ([^.]+?)(?: with | following |\.|$)/);
      if (assist) related = { role: "assist", player: byName(assist[1])! };
    } else if (kind === "sub") {
      // "Substitution, Real Madrid. Rodrygo replaces Vinícius Júnior."
      const m = text?.match(/\.\s*(.+?) replaces (.+?)(?: because[^.]*)?\.?$/);
      if (m) {
        player = byName(m[1]);
        related = { role: "off", player: byName(m[2])! };
      } else if (parts[1]?.athlete) {
        related = { role: "off", player: person(parts[1].athlete)! };
      }
    }

    const clean = (p: (EventPlayer & { side?: unknown }) | null): EventPlayer | null =>
      p ? { name: p.name, id: p.id, jersey: p.jersey, position: p.position } : null;

    events.push({
      id: r.id,
      kind,
      label: kind === "period" ? (PERIOD_LABEL.find(([re]) => re.test(type))?.[1] ?? r.play.type?.text ?? "") : (r.play.type?.text ?? type),
      minute: r.play.clock?.displayValue ?? "",
      period: Number(r.play.period?.number) || 0,
      side: kind === "period" ? null : side,
      text: kind === "period" ? null : text,
      player: kind === "period" ? null : clean(player),
      related: related ? { role: related.role, player: clean(related.player)! } : null,
      score: eventScore,
      penalty: /penalty/.test(type) || /\(penalty\)|penalty kick|from the penalty spot/i.test(text ?? ""),
    });
  }
  return events.reverse();
}

/** Human label for the in-play clock, e.g. "H1 · 16'". */
export function liveLabel(status: any): string {
  const name: string = status?.type?.name ?? "";
  const clock: string = status?.displayClock ?? status?.type?.shortDetail ?? "";
  const period = Number(status?.period) || 0;
  if (/HALFTIME/.test(name)) return "HT";
  if (/SHOOTOUT|PENALT/.test(name)) return "Penalties";
  if (/END_OF_REGULATION|END_PERIOD/.test(name)) return "Break";
  if (period >= 3) return `ET · ${clock}`;
  if (period >= 1) return `H${period} · ${clock}`;
  return clock || "Live";
}

export async function getMatchDetail(eventId: string): Promise<MatchDetail> {
  // Short cache window so live scores and stats stay current.
  const data = await espnGet(`${SITE}/all/summary?event=${eventId}`, 15);
  const comp = data?.header?.competitions?.[0];
  if (!comp) throw new UpstreamError("Match not found.", 404);

  const state = toState(comp.status?.type?.state);
  const competitors = comp.competitors ?? [];
  const sideOf = (ha: "home" | "away"): MatchTeamDetail => {
    const c = competitors.find((x: any) => x.homeAway === ha) ?? {};
    const r = (data.rosters ?? []).find((x: any) => x.homeAway === ha);
    return { team: toTeam(c.team), score: state === "pre" ? null : toScore(c.score), ...lineup(r) };
  };

  const box = data.boxscore?.teams ?? [];
  const homeBox = box.find((t: any) => t.homeAway === "home") ?? box[0];
  const awayBox = box.find((t: any) => t.homeAway === "away") ?? box[1];
  const home = sideOf("home");
  const away = sideOf("away");
  const positions =
    state === "pre" ? new Map<string, string>() : await squadPositions(data.header?.league?.slug, [home.team.id, away.team.id]);
  // Box score entries are keyed by team id; make sure the sides line up.
  const [hb, ab] = String(homeBox?.team?.id) === home.team.id ? [homeBox, awayBox] : [awayBox, homeBox];
  const events = state === "pre" ? [] : matchEvents(data, home.team, away.team, positions);
  linkMatchEvents(home, events, "home");
  linkMatchEvents(away, events, "away");

  return {
    id: String(eventId),
    date: comp.date,
    competition: data.header?.league?.name ?? "",
    venue: data.gameInfo?.venue?.fullName ?? null,
    attendance: data.gameInfo?.attendance || null,
    state,
    statusDetail: comp.status?.type?.shortDetail ?? comp.status?.type?.detail ?? "",
    liveLabel: state === "in" ? liveLabel(comp.status) : null,
    home,
    away,
    stats: state === "pre" ? [] : matchStats(hb, ab),
    probability: state === "pre" ? oddsToProbability(data.odds?.[0] ?? data.pickcenter?.[0]) : null,
    events,
  };
}

// ---------------------------------------------------------------------------
// ESPN news for a team

export interface RawNews {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  published: string;
}

const NON_FOOTBALL = /espn\.com\/(nfl|nba|mlb|nhl|wnba|college-|mens-college|womens-college|tennis|f1|golf|mma|boxing|racing|cricket)\//;

export async function getEspnNews(config: LeagueConfig, teamId: string): Promise<RawNews[]> {
  const data = await espnGet(`${SITE}/${config.espn}/news?team=${teamId}&limit=25`, 60 * 15);
  return (data?.articles ?? [])
    .filter((a: any) => a.links?.web?.href && !NON_FOOTBALL.test(a.links.web.href))
    .map((a: any) => ({
      id: `espn-${a.id ?? a.links.web.href}`,
      title: a.headline,
      description: a.description && a.description !== a.headline ? a.description : null,
      url: a.links.web.href.replace(/^http:/, "https:"),
      image: a.images?.[0]?.url ?? null,
      published: a.published ?? a.lastModified,
    }));
}
