"use client";

import { useEffect } from "react";

/**
 * One controller for every scroll-driven effect on the landing page, so no section runs its own
 * listeners:
 *  - [data-reveal]    gets data-in="1" the first time it enters the viewport (CSS does the motion).
 *  - [data-parallax]  gets --p: its progress through the viewport, -1 (below) .. 0 (centred) .. 1 (above).
 *  - [data-tilt]      gets --rx / --ry from the pointer while hovered (desktop pointers only).
 * Everything is transform/opacity only. With reduced motion, content is simply shown.
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

    // Parallax: only elements near the viewport are updated, once per frame at most.
    const layers = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    const visible = new Set<HTMLElement>();
    const near = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement))), {
      rootMargin: "25% 0px 25% 0px",
    });
    layers.forEach((el) => near.observe(el));
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of visible) {
        const r = el.getBoundingClientRect();
        const p = (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2);
        el.style.setProperty("--p", Math.max(-1, Math.min(1, p)).toFixed(4));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    // Pointer tilt for fine pointers.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const tilts = fine ? [...root.querySelectorAll<HTMLElement>("[data-tilt]")] : [];
    const move = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--rx", (((e.clientY - r.top) / r.height - 0.5) * -5).toFixed(2) + "deg");
      el.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 6).toFixed(2) + "deg");
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width).toFixed(3));
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height).toFixed(3));
    };
    const leave = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    tilts.forEach((el) => {
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
    });

    return () => {
      io.disconnect();
      near.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      tilts.forEach((el) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    };
  }, []);
  return null;
}
