"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ClubRef, MatchSummary } from "./types";

// ---------------------------------------------------------------------------
// Data fetching with a small in-memory cache shared by every component, so
// switching tabs or clubs back and forth is instant.

const CACHE_TTL = 2 * 60 * 1000;
type Entry = { data?: unknown; error?: string; at: number };
const cache = new Map<string, Entry>();

export interface ApiState<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  retry: () => void;
}

/**
 * Fetches JSON from one of our API routes. With `refreshMs`, the data is
 * re-fetched on that interval (used for live matches) while the current data
 * stays on screen; a failed background refresh keeps the last good data.
 */
export function useApi<T>(
  url: string | null,
  opts: { refreshMs?: number; refreshWhile?: (data: T) => boolean } = {},
): ApiState<T> {
  const { refreshMs } = opts;
  const [result, setResult] = useState<{ url: string; data?: T; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Optional predicate, e.g. "keep polling while the match is not finished".
  const refreshWhile = useRef(opts.refreshWhile);
  useEffect(() => {
    refreshWhile.current = opts.refreshWhile;
  });

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    const load = (background: boolean) => {
      const hit = cache.get(url);
      if (!background && hit && !hit.error && Date.now() - hit.at < CACHE_TTL) return;
      fetch(url, { signal: ctrl.signal, cache: background ? "no-store" : "default" })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
          return body as T;
        })
        .then((data) => {
          cache.set(url, { data, at: Date.now() });
          setResult({ url, data });
        })
        .catch((err: Error) => {
          if (ctrl.signal.aborted) return;
          const prev = cache.get(url);
          if (background && prev && !prev.error) return; // keep showing the last good data
          const error = err.message || "Something went wrong.";
          cache.set(url, { error, at: Date.now() });
          setResult({ url, error });
        });
    };
    load(false);
    const timer = refreshMs
      ? window.setInterval(() => {
          const hit = cache.get(url);
          if (refreshWhile.current && hit?.data !== undefined && !refreshWhile.current(hit.data as T)) return;
          load(true);
        }, refreshMs)
      : undefined;
    return () => {
      ctrl.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [url, attempt, refreshMs]);

  const retry = useCallback(() => {
    if (url) cache.delete(url);
    setResult(null);
    setAttempt((a) => a + 1);
  }, [url]);

  // Cached data is shown immediately (even if stale); the effect above refreshes stale entries.
  const hit = url ? cache.get(url) : undefined;
  const current =
    result && result.url === url
      ? result
      : hit && !hit.error
        ? { url, data: hit.data as T, error: undefined }
        : null;

  return {
    data: current?.data,
    error: current?.error,
    loading: Boolean(url) && !current,
    retry,
  };
}

// ---------------------------------------------------------------------------
// localStorage-backed state that is safe during SSR/hydration.

function createStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let raw: string | null | undefined;
  let value = fallback;
  let memory: T | undefined; // used if localStorage is unavailable (private mode)

  const read = (): T => {
    if (memory !== undefined) return memory;
    let next: string | null = null;
    try {
      next = window.localStorage.getItem(key);
    } catch {
      return value;
    }
    if (next !== raw) {
      raw = next;
      try {
        value = next ? (JSON.parse(next) as T) : fallback;
      } catch {
        value = fallback;
      }
    }
    return value;
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => e.key === key && cb();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };

  const write = (next: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      memory = undefined;
    } catch {
      memory = next;
    }
    listeners.forEach((l) => l());
  };

  return {
    use: () => useSyncExternalStore(subscribe, read, () => fallback),
    get: read,
    set: write,
  };
}

const EMPTY: ClubRef[] = [];
const favoritesStore = createStore<ClubRef[]>("clubHub.favorites", EMPTY);
const activeStore = createStore<ClubRef | null>("clubHub.activeClub", null);

export function useFavorites() {
  const favorites = favoritesStore.use();
  const isFavorite = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites]);
  const toggle = useCallback((club: ClubRef) => {
    const current = favoritesStore.get();
    favoritesStore.set(
      current.some((f) => f.id === club.id) ? current.filter((f) => f.id !== club.id) : [...current, club],
    );
  }, []);
  return { favorites, isFavorite, toggle };
}

export function useActiveClub() {
  const active = activeStore.use();
  const setActive = useCallback((club: ClubRef | null) => activeStore.set(club), []);
  return [active, setActive] as const;
}

// ---------------------------------------------------------------------------
// Formatting

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) =>
  new Intl.DateTimeFormat(undefined, opts).format(new Date(iso));

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** The viewer's time zone, e.g. "India Standard Time". */
export function timeZoneLabel(): string {
  const part = new Intl.DateTimeFormat(undefined, { timeZoneName: "long" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "your local time";
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" });
  if (abs < 60 * 60) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 60 * 60 * 24) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 60 * 60 * 24 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(iso, { day: "numeric", month: "short", year: "numeric" });
}

/** Refresh interval while a match is in play. */
export const LIVE_REFRESH_MS = 20_000;

/**
 * True when a match is in play, or its kickoff is within 15 minutes either side
 * (so the page notices kickoff on its own) or it started under 3 hours ago.
 */
export function isMatchActive(match: Pick<MatchSummary, "state" | "date"> | undefined | null): boolean {
  if (!match) return false;
  if (match.state === "in") return true;
  if (match.state === "post") return false;
  const diff = Date.now() - new Date(match.date).getTime();
  return diff > -15 * 60 * 1000 && diff < 3 * 60 * 60 * 1000;
}

/** Short competition label, e.g. "Spanish LALIGA" -> "LALIGA". */
export const competitionLabel = (name: string) =>
  name.replace(/^(English|Spanish|Italian|German|French)\s+/, "");

export type Outcome = "W" | "D" | "L";

export function outcomeFor(match: MatchSummary, teamId: string): Outcome | null {
  if (match.state !== "post" || match.home.score == null || match.away.score == null) return null;
  const isHome = match.home.team.id === teamId;
  const us = isHome ? match.home : match.away;
  const them = isHome ? match.away : match.home;
  if (us.score! > them.score!) return "W";
  if (us.score! < them.score!) return "L";
  if (us.shootout != null && them.shootout != null) return us.shootout > them.shootout ? "W" : "L";
  if (us.winner) return "W";
  if (them.winner) return "L";
  return "D";
}

// ---------------------------------------------------------------------------
// Club branding

/** ESPN lists several clubs with a white primary colour; use their recognisable brand colour instead. */
const BRAND_OVERRIDES: Record<string, string> = {
  "86": "#0b3b8c", // Real Madrid
  "367": "#132257", // Tottenham
  "357": "#1d428a", // Leeds
  "243": "#c8102e", // Sevilla
  "167": "#14387f", // Lyon
  "176": "#1f9bd7", // Marseille
  "11420": "#dd0741", // RB Leipzig
  "125": "#e1000f", // Eintracht Frankfurt
  "134": "#e32219", // VfB Stuttgart
  "124": "#1a1a1a", // Borussia Dortmund
  "102": "#c9a400", // Villarreal
};

function luminance(hex: string): number {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return 1;
  const [r, g, b] = m.slice(1).map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable text colour (near-black or white) for a solid club-colour surface, by WCAG contrast. */
export function onAccent(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const L = luminance(hex);
  // Contrast against near-black (#0b0c0f, L≈0.004) vs white (L=1); pick the larger.
  return (L + 0.05) / (0.004 + 0.05) >= 1.05 / (L + 0.05) ? "#0b0c0f" : "#ffffff";
}

export function clubAccent(id: string, color?: string | null, alternate?: string | null): string {
  if (BRAND_OVERRIDES[id]) return BRAND_OVERRIDES[id];
  for (const c of [color, alternate]) {
    if (c && /^#[0-9a-f]{6}$/i.test(c) && luminance(c) < 0.6) return c;
  }
  return "#0f766e";
}
