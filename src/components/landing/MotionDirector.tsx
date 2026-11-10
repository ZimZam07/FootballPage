"use client";

import { useEffect } from "react";

/**
 * One controller, one animation loop, for every scroll-driven effect on the landing page:
 *
 *  - [data-reveal]   gets data-in="1" the first time it enters the viewport (CSS does the motion).
 *  - [data-parallax] gets --p, its progress through the viewport (-1 entering .. 0 centred .. 1
 *                    leaving), EASED toward the scroll position every frame — wheel notches and
 *                    trackpad bursts never show up as jumps.
 *  - [data-kinetic]  a line of type that drifts continuously at data-speed px/s, picks up smoothed
 *                    momentum from scrolling (data-boost), and wraps seamlessly by one copy's width.
 *  - [data-tilt]     gets --rx/--ry/--mx/--my from the pointer, batched to one write per frame.
 *
 * Only transforms and opacity change; nothing triggers layout. The loop runs only while a
 * parallax or kinetic element is on screen (or still easing) and stops otherwise. With reduced
 * motion, content is simply shown and nothing moves.
 */
export default function MotionDirector() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (reduced || !("IntersectionObserver" in window)) {
      reveal.forEach((el) => (el.dataset.in = "1"));
      return;
    }

    // --- Reveals --------------------------------------------------------------------------
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "1";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    reveal.forEach((el) => io.observe(el));

    // --- Parallax & kinetic type: shared loop -----------------------------------------------
    type Layer = { el: HTMLElement; p: number; target: number; py: number };
    type Line = { el: HTMLElement; track: HTMLElement; speed: number; boost: number; x: number; width: number };
    const layers = new Map<HTMLElement, Layer>();
    const lines = new Map<HTMLElement, Line>();
    const visibleLayers = new Set<Layer>();
    const visibleLines = new Set<Line>();

    root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) =>
      layers.set(el, { el, p: 0, target: 0, py: parseFloat(getComputedStyle(el).getPropertyValue("--py")) || 0 }),
    );
    root.querySelectorAll<HTMLElement>("[data-kinetic]").forEach((el) => {
      const track = el.firstElementChild as HTMLElement | null;
      if (!track) return;
      lines.set(el, { el, track, speed: Number(el.dataset.speed ?? -40), boost: Number(el.dataset.boost ?? 0.5), x: 0, width: 0 });
    });

    const measure = () => {
      for (const l of lines.values()) {
        // One copy of the phrase: the loop wraps by exactly this width, so the seam never shows.
        l.width = (l.track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
        if (l.speed > 0 && l.x === 0) l.x = -l.width;
      }
    };
    measure();

    const near = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const layer = layers.get(e.target as HTMLElement);
          const line = lines.get(e.target as HTMLElement);
          if (layer) {
            if (e.isIntersecting) visibleLayers.add(layer);
            else visibleLayers.delete(layer);
          }
          if (line) {
            if (e.isIntersecting) visibleLines.add(line);
            else visibleLines.delete(line);
          }
        }
        wake();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    layers.forEach((_, el) => near.observe(el));
    lines.forEach((_, el) => near.observe(el));

    let frame = 0;
    let last = 0;
    let scrollY = window.scrollY;
    let velocity = 0; // px/s, smoothed
    let lastScrollTime = performance.now();

    const targets = () => {
      const vh = window.innerHeight;
      for (const l of visibleLayers) {
        const r = l.el.getBoundingClientRect();
        // Measure the element's resting position: remove the offset the parallax itself applied.
        const centre = r.top + r.height / 2 - l.p * l.py;
        const p = (vh / 2 - centre) / (vh / 2 + r.height / 2);
        l.target = Math.max(-1, Math.min(1, p));
      }
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      // Frame-rate-independent easing: the same feel at 60 Hz and 120 Hz.
      const ease = 1 - Math.exp(-dt * 9);
      let busy = false;

      for (const l of visibleLayers) {
        l.p += (l.target - l.p) * ease;
        if (Math.abs(l.target - l.p) > 0.0005) busy = true;
        l.el.style.setProperty("--p", l.p.toFixed(4));
      }

      // Scroll momentum decays smoothly once scrolling stops.
      velocity *= Math.exp(-dt * 3.2);
      for (const l of visibleLines) {
        if (!l.width) continue;
        const dir = Math.sign(l.speed) || -1;
        l.x += (l.speed + dir * Math.min(900, Math.abs(velocity)) * l.boost) * dt;
        if (l.x <= -l.width) l.x += l.width;
        if (l.x > 0) l.x -= l.width;
        l.track.style.transform = `translate3d(${l.x.toFixed(2)}px,0,0)`;
        busy = true;
      }

      if (busy || Math.abs(velocity) > 1) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    function wake() {
      if (!frame && (visibleLayers.size || visibleLines.size) && !document.hidden) frame = requestAnimationFrame(tick);
    }

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(8, now - lastScrollTime) / 1000;
      velocity = velocity * 0.6 + ((y - scrollY) / dt) * 0.4;
      scrollY = y;
      lastScrollTime = now;
      targets();
      wake();
    };
    const onResize = () => {
      measure();
      targets();
      wake();
    };
    const onVisibility = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    // Web fonts change the width of the kinetic type once they load.
    document.fonts?.ready.then(onResize).catch(() => {});
    targets();
    wake();

    // --- Pointer tilt (fine pointers only), batched to one style write per frame ------------
    const fine = window.matchMedia("(pointer: fine)").matches;
    const tilts = fine ? [...root.querySelectorAll<HTMLElement>("[data-tilt]")] : [];
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let tiltFrame = 0;
    const applyTilt = () => {
      tiltFrame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      pending = null;
      const r = el.getBoundingClientRect();
      const mx = (x - r.left) / r.width, my = (y - r.top) / r.height;
      el.style.setProperty("--rx", ((my - 0.5) * -5).toFixed(2) + "deg");
      el.style.setProperty("--ry", ((mx - 0.5) * 6).toFixed(2) + "deg");
      el.style.setProperty("--mx", mx.toFixed(3));
      el.style.setProperty("--my", my.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      pending = { el: e.currentTarget as HTMLElement, x: e.clientX, y: e.clientY };
      if (!tiltFrame) tiltFrame = requestAnimationFrame(applyTilt);
    };
    const leave = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      pending = null;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    tilts.forEach((el) => {
      el.addEventListener("pointermove", move, { passive: true });
      el.addEventListener("pointerleave", leave);
    });

    return () => {
      io.disconnect();
      near.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      tilts.forEach((el) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    };
  }, []);
  return null;
}
