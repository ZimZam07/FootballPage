"use client";

import { useEffect, useRef, useState } from "react";

export interface TableSlide {
  league: string;
  name: string;
  logo: string;
  rows: { id: string; position: number; name: string; logo: string | null; points: number }[];
}

const INTERVAL_MS = 5000;

/**
 * The Club Hub panel's live table, cycling through each league's real top five every five seconds.
 * All slides share one fixed-size frame and crossfade, so nothing shifts. It only rotates while on
 * screen, pauses on hover/focus, and with reduced motion it doesn't rotate on its own (the league
 * markers still switch it).
 */
export default function RotatingTable({ slides }: { slides: TableSlide[] }) {
  const [index, setIndex] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const start = () => {
      if (!timer) timer = window.setInterval(() => !paused.current && !document.hidden && setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    return () => {
      stop();
      io.disconnect();
    };
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div
      ref={box}
      className="w-[15.5rem] rounded-md border border-white/10 bg-[#0b0c0f]/90 p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="League tables, top five"
    >
      <div className="relative h-[10.75rem]" aria-live="polite">
        {slides.map((s, i) => {
          const on = i === index;
          return (
            <div
              key={s.league}
              className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
              aria-hidden={!on}
            >
              <p className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.logo} alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                  {s.name} · now
                </span>
                <span className="text-slate-500">Pts</span>
              </p>
              <ol className="space-y-1.5">
                {s.rows.map((r) => (
                  <li key={r.id} className="flex items-center gap-2.5 text-sm">
                    <span className="w-4 text-right font-display font-bold text-slate-500">{r.position}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.logo ?? ""} alt="" width={20} height={20} className="h-5 w-5 object-contain" loading="lazy" />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{r.name}</span>
                    <span className="font-display text-base font-bold text-white">{r.points}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      {slides.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-white/[0.07] pt-2">
          {slides.map((s, i) => (
            <button
              key={s.league}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show the ${s.name} table`}
              aria-pressed={i === index}
              className={`h-1.5 rounded-full transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt ${i === index ? "w-6 bg-volt" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
