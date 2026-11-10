"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A time-derived value that is hydration-safe: the server's value is used for the first render
 * (so server and client markup match), then the browser's clock takes over, re-read every `everyMs`.
 * `read` must return a primitive that only changes when the value really changes.
 */
export function useClock<T extends string | number>(serverValue: T, read: () => T, everyMs: number): T {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const t = window.setInterval(onChange, everyMs);
      return () => window.clearInterval(t);
    },
    [everyMs],
  );
  return useSyncExternalStore(subscribe, read, () => serverValue);
}

/** Milliseconds since the epoch, for callers outside React's render (keeps renders pure). */
export const nowMs = () => Date.now();
