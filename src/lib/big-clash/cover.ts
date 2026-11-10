import { ARCHIVE } from "./archive";
import type { HistoricMatch } from "./types";

/**
 * Big Clash's daily cover story. The day is a UTC calendar day, so every visitor sees the same
 * cover all day and it turns over at 00:00 UTC. The choice is a pure function of the day: no
 * randomness, so server rendering, hydration and every refresh agree.
 *
 *  - If an archive match was played on today's date (any year), it leads: "On this day".
 *  - Otherwise the archive is walked in a fixed shuffled order, one match per day, so consecutive
 *    days always differ and every match gets its turn before any repeats.
 */
export const utcDay = (ms: number) => Math.floor(ms / 86_400_000);

/** A stable shuffle of the archive (by a hash of each slug), so the rotation isn't chronological. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const ROTATION = [...ARCHIVE].sort((a, b) => hash(a.slug) - hash(b.slug) || a.slug.localeCompare(b.slug));

const monthDay = (day: number) => new Date(day * 86_400_000).toISOString().slice(5, 10);
const onThisDay = (day: number) => ARCHIVE.filter((m) => m.date.slice(5) === monthDay(day));
const inRotation = (day: number) => ROTATION[((day % ROTATION.length) + ROTATION.length) % ROTATION.length];

function candidate(day: number): HistoricMatch {
  const anniversaries = onThisDay(day);
  return anniversaries.length ? anniversaries[day % anniversaries.length] : inRotation(day);
}

export interface Cover {
  match: HistoricMatch;
  /** True only when the match was played on this calendar date. */
  anniversary: boolean;
  /** Whole years since the match, for the "On this day" label. */
  yearsAgo: number;
}

/** The day's match, never the same as the previous day's final pick (looks back a bounded week). */
function pick(day: number, depth = 7): HistoricMatch {
  const match = candidate(day);
  if (depth === 0) return match;
  const yesterday = pick(day - 1, depth - 1);
  if (match.slug !== yesterday.slug) return match;
  // Jump half-way round the rotation (not to tomorrow's slot), so one adjustment can't cascade.
  const half = Math.floor(ROTATION.length / 2);
  return inRotation(day + half).slug !== yesterday.slug ? inRotation(day + half) : inRotation(day + half + 1);
}

export function coverFor(day: number): Cover {
  const match = pick(day);
  const date = new Date(day * 86_400_000);
  const anniversary = match.date.slice(5) === monthDay(day);
  return { match, anniversary, yearsAgo: date.getUTCFullYear() - Number(match.date.slice(0, 4)) };
}

/** Today's UTC day, for the server render. */
export const todayUtc = () => utcDay(Date.now());
