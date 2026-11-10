"use client";

import { useEffect } from "react";

/**
 * One controller, one animation loop, for every scroll-driven effect on the landing page:
 *
 *  - [data-reveal]   gets data-in="1" the first time it enters the viewport (CSS does the motion).
 *  - [data-parallax] gets --p, its progress through the viewport (-1 entering .. 0 centred .. 1
 *                    leaving), EASED toward the scroll position every frame — wheel notches and
 *                    trackpad bursts never show up as jumps.
 *  - [data-zone]     sections whose CSS loops (marquees, floodlights, pitch) are paused while the
 *                    section is fully off screen; they resume where they stopped. The marquees
 *                    themselves are pure CSS and never read the scroll position.
 *  - [data-tilt]     gets --rx/--ry/--mx/--my from the pointer, batched to one write per frame.
 *
 * Only transforms and opacity change; nothing triggers layout. The loop runs only while a
 * parallax element is on screen and still easing, and stops otherwise. With reduced
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

    // --- Off-screen sections: pause their CSS loops ------------------------------------------
    const zones = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) delete el.dataset.offscreen;
          else el.dataset.offscreen = "1";
        }
      },
      { rootMargin: "120px 0px 120px 0px" },
    );
    root.querySelectorAll<HTMLElement>("[data-zone]").forEach((el) => zones.observe(el));

    // --- Parallax: one loop, eased toward the scroll position -------------------------------
    type Layer = { el: HTMLElement; p: number; target: number; py: number };
    const layers = new Map<HTMLElement, Layer>();
    const visibleLayers = new Set<Layer>();
    root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) =>
      layers.set(el, { el, p: 0, target: 0, py: parseFloat(getComputedStyle(el).getPropertyValue("--py")) || 0 }),
    );

    const near = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const layer = layers.get(e.target as HTMLElement);
          if (!layer) continue;
          if (e.isIntersecting) visibleLayers.add(layer);
          else visibleLayers.delete(layer);
        }
        targets();
        wake();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    layers.forEach((_, el) => near.observe(el));

    let frame = 0;
    let last = 0;

    function targets() {
      const vh = window.innerHeight;
      for (const l of visibleLayers) {
        const r = l.el.getBoundingClientRect();
        // Measure the element's resting position: remove the offset the parallax itself applied.
        const centre = r.top + r.height / 2 - l.p * l.py;
        const p = (vh / 2 - centre) / (vh / 2 + r.height / 2);
        l.target = Math.max(-1, Math.min(1, p));
      }
    }

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
        else l.p = l.target;
        l.el.style.setProperty("--p", l.p.toFixed(4));
      }
      if (busy) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    function wake() {
      if (!frame && visibleLayers.size && !document.hidden) frame = requestAnimationFrame(tick);
    }

    const onScroll = () => {
      if (!visibleLayers.size) return;
      targets();
      wake();
    };
    const onResize = () => {
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
      zones.disconnect();
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
